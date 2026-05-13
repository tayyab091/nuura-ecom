import mongoose from 'mongoose'
import { resolveSrv, resolveTxt } from 'dns/promises'

const MONGODB_URI = process.env.MONGODB_URI as string
const MONGODB_URI_DIRECT = process.env.MONGODB_URI_DIRECT as string | undefined
const MONGODB_URI_FALLBACK = process.env.MONGODB_URI_FALLBACK as string | undefined

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null }
global.mongooseCache = cached

export class MongoUnavailableError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'MongoUnavailableError'
    this.cause = cause
  }
}

async function fetchDnsJson(name: string, type: 'SRV' | 'TXT', timeoutMS: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMS)
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`
    const res = await fetch(url, {
      headers: { accept: 'application/dns-json' },
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new MongoUnavailableError(`DoH ${type} lookup failed with status ${res.status}`)
    }

    const json = (await res.json()) as {
      Status?: number
      Answer?: Array<{ name: string; type: number; TTL: number; data: string }>
    }

    if (json?.Status !== 0) {
      throw new MongoUnavailableError(`DoH ${type} lookup returned non-zero status ${json?.Status}`)
    }

    return json.Answer ?? []
  } catch (err) {
    if (err instanceof MongoUnavailableError) throw err
    throw new MongoUnavailableError(`DoH ${type} lookup failed`, err)
  } finally {
    clearTimeout(timeout)
  }
}

function parseMongoTxtParams(txtAnswers: Array<{ data: string }>): URLSearchParams {
  // TXT answers come back quoted; sometimes split into multiple quoted chunks.
  // Example: "authSource=admin&replicaSet=atlas-xxx-shard-0"
  const joined = txtAnswers
    .map((a) => a.data)
    .join(' ')
    .replace(/"/g, '')
    .trim()

  return new URLSearchParams(joined)
}

async function deriveDirectMongoUriFromSrvUri(srvUri: string): Promise<string | null> {
  if (!srvUri.startsWith('mongodb+srv://')) return null
  if (process.env.NODE_ENV === 'production') return null

  const DOH_TIMEOUT_MS = 2000
  let parsed: URL
  try {
    parsed = new URL(srvUri)
  } catch (err) {
    throw new MongoUnavailableError('Invalid MongoDB URI', err)
  }

  const hostname = parsed.hostname
  const dbName = parsed.pathname?.replace(/^\//, '') || ''
  if (!hostname) return null

  const srvName = `_mongodb._tcp.${hostname}`
  const [srvAnswers, txtAnswers] = await Promise.all([
    fetchDnsJson(srvName, 'SRV', DOH_TIMEOUT_MS),
    fetchDnsJson(hostname, 'TXT', DOH_TIMEOUT_MS),
  ])

  const hosts = srvAnswers
    .map((a) => a.data)
    .map((data) => {
      // priority weight port target
      const parts = data.trim().split(/\s+/)
      const port = parts[2]
      const target = (parts[3] || '').replace(/\.$/, '')
      if (!target || !port) return null
      return `${target}:${port}`
    })
    .filter(Boolean) as string[]

  if (hosts.length === 0) return null

  const mergedParams = new URLSearchParams(parsed.searchParams)
  const txtParams = parseMongoTxtParams(txtAnswers)
  for (const [k, v] of txtParams.entries()) {
    if (!mergedParams.has(k)) mergedParams.set(k, v)
  }

  // Ensure TLS for Atlas-style clusters when using direct seed list.
  if (!mergedParams.has('tls') && !mergedParams.has('ssl')) mergedParams.set('tls', 'true')

  // Preserve appName if present.
  const query = mergedParams.toString()
  const auth = parsed.username
    ? `${encodeURIComponent(parsed.username)}${parsed.password ? `:${encodeURIComponent(parsed.password)}` : ''}@`
    : ''

  const path = dbName ? `/${encodeURIComponent(dbName)}` : ''
  return `mongodb://${auth}${hosts.join(',')}${path}${query ? `?${query}` : ''}`
}

function withTimeout<T>(promise: Promise<T>, timeoutMS: number, message: string): Promise<T> {
  if (!Number.isFinite(timeoutMS) || timeoutMS <= 0) return promise
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new MongoUnavailableError(message)), timeoutMS)
    promise
      .then((value) => {
        clearTimeout(timeout)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(timeout)
        reject(err)
      })
  })
}

async function preflightMongoSrvDns(uri: string) {
  if (!uri.startsWith('mongodb+srv://')) return

  let hostname = ''
  try {
    hostname = new URL(uri).hostname
  } catch (err) {
    throw new MongoUnavailableError('Invalid MongoDB URI', err)
  }

  if (!hostname) {
    throw new MongoUnavailableError('Invalid MongoDB URI (missing hostname)')
  }

  // If SRV/TXT DNS is blocked on a network, the driver can stall before timeouts.
  // Preflight DNS with a short timeout so we fail fast and let the app fall back.
  const DNS_TIMEOUT_MS = 1500
  try {
    await withTimeout(resolveSrv(`_mongodb._tcp.${hostname}`), DNS_TIMEOUT_MS, 'MongoDB SRV DNS lookup timed out')
    await withTimeout(resolveTxt(hostname), DNS_TIMEOUT_MS, 'MongoDB TXT DNS lookup timed out')
  } catch (err) {
    if (err instanceof MongoUnavailableError) throw err
    throw new MongoUnavailableError('MongoDB SRV/TXT DNS lookup failed', err)
  }
}

export async function connectDB(connectOptions?: { maxWaitMS?: number }): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined')
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    const mongooseOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 7000,
      connectTimeoutMS: 7000,
      socketTimeoutMS: 20000,
    }

    cached.promise = (async () => {
      let derivedDirect: string | null = null
      try {
        if (!MONGODB_URI_DIRECT) {
          derivedDirect = await deriveDirectMongoUriFromSrvUri(MONGODB_URI)
        }
      } catch {
        // If DoH is blocked/unavailable, we'll just proceed with the normal URI attempts.
        derivedDirect = null
      }

      const isSrv = MONGODB_URI.startsWith('mongodb+srv://')
      const tryUris = (
        isSrv
          ? [MONGODB_URI_DIRECT, derivedDirect, MONGODB_URI, MONGODB_URI_FALLBACK]
          : [MONGODB_URI, MONGODB_URI_DIRECT, derivedDirect, MONGODB_URI_FALLBACK]
      ).filter(Boolean) as string[]

      let lastError: unknown = null
      for (const uri of tryUris) {
        try {
          await preflightMongoSrvDns(uri)
          return await mongoose.connect(uri, mongooseOptions)
        } catch (err) {
          lastError = err
        }
      }
      throw new MongoUnavailableError('Failed to connect to MongoDB', lastError)
    })()
      .then((conn) => {
        cached.conn = conn
        return conn
      })
      .catch((err) => {
        cached.promise = null
        if (err instanceof MongoUnavailableError) throw err
        throw new MongoUnavailableError('Failed to connect to MongoDB', err)
      })
  }

  const maxWaitMS = connectOptions?.maxWaitMS
  const conn = await withTimeout(
    cached.promise,
    typeof maxWaitMS === 'number' ? maxWaitMS : 0,
    'MongoDB connection timed out'
  )
  return conn
}
