import crypto from 'crypto'

export type CustomerTokenPayload = {
  sub: string
  email: string
  iat: number
  exp: number
}

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function b64urlJson(obj: unknown) {
  return b64url(JSON.stringify(obj))
}

function fromB64url(input: string) {
  const pad = input.length % 4
  const normalized = (input + (pad ? '='.repeat(4 - pad) : '')).replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(normalized, 'base64').toString('utf8')
}

function getSecret() {
  return process.env.USER_AUTH_SECRET ?? 'nuura-user-secret-key-2026'
}

export function signCustomerToken(payload: Omit<CustomerTokenPayload, 'iat' | 'exp'>, maxAgeSeconds: number) {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + Math.max(60, maxAgeSeconds)

  const header = { alg: 'HS256', typ: 'JWT' }
  const fullPayload: CustomerTokenPayload = { ...payload, iat, exp }

  const head = b64urlJson(header)
  const body = b64urlJson(fullPayload)
  const data = `${head}.${body}`

  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest()
  const token = `${data}.${b64url(sig)}`

  return { token, payload: fullPayload }
}

export function verifyCustomerToken(token: string): CustomerTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [head, body, sig] = parts
  const data = `${head}.${body}`
  const expected = b64url(crypto.createHmac('sha256', getSecret()).update(data).digest())

  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return null
  if (!crypto.timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(fromB64url(body)) as CustomerTokenPayload
    const now = Math.floor(Date.now() / 1000)
    if (!payload?.sub || !payload?.email) return null
    if (typeof payload.exp !== 'number' || payload.exp < now) return null
    return payload
  } catch {
    return null
  }
}
