import { NextResponse } from 'next/server'
import { connectDB, MongoUnavailableError } from '@/lib/mongodb'
import Product from '@/models/Product'
import { MOCK_PRODUCTS as MOCK_DATA } from '@/lib/mockData'
import { isAdminAuthed } from '@/lib/adminAuth'

function withTimeout<T>(promise: Promise<T>, timeoutMS: number): Promise<T> {
  if (!Number.isFinite(timeoutMS) || timeoutMS <= 0) return promise
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout')), timeoutMS)
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

function normalizeKeywords(input: unknown): string[] | undefined {
  if (Array.isArray(input)) {
    const cleaned = input
      .map((v) => String(v))
      .map((v) => v.trim())
      .filter(Boolean)
    return cleaned.length ? cleaned : undefined
  }
  if (typeof input === 'string') {
    const cleaned = input
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
    return cleaned.length ? cleaned : undefined
  }
  return undefined
}

function normalizeSeo(input: unknown) {
  if (!input || typeof input !== 'object') return undefined
  const seo = input as Record<string, unknown>
  const normalized: Record<string, unknown> = { ...seo }

  for (const key of ['title', 'description', 'ogTitle', 'ogDescription', 'ogImage', 'canonicalUrl'] as const) {
    const value = normalized[key]
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) normalized[key] = trimmed
      else delete normalized[key]
    } else if (value === null || value === undefined) {
      delete normalized[key]
    }
  }

  const keywords = normalizeKeywords(seo.keywords)
  if (keywords) normalized.keywords = keywords
  else delete normalized.keywords

  if (seo.noIndex === true || seo.noIndex === false) normalized.noIndex = seo.noIndex
  else delete normalized.noIndex

  if (seo.noFollow === true || seo.noFollow === false) normalized.noFollow = seo.noFollow
  else delete normalized.noFollow

  const hasAny = Object.keys(normalized).length > 0
  return hasAny ? normalized : undefined
}

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug).trim().toLowerCase()

  try {
    const connectWaitMS = process.env.NODE_ENV === 'production' ? 2000 : 8000
    const queryMaxTimeMS = process.env.NODE_ENV === 'production' ? 2000 : 8000
    const queryTimeoutMS = process.env.NODE_ENV === 'production' ? 2500 : 12000
    await connectDB({ maxWaitMS: connectWaitMS })
    const product = await withTimeout(
      Product.findOne({ slug }).maxTimeMS(queryMaxTimeMS).lean(),
      queryTimeoutMS
    )
    if (product) {
      return NextResponse.json({ product }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      })
    }
    throw new Error('not found in db')
  } catch {
    // Try mock data
    const product = MOCK_DATA.find((p) => p.slug === slug)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json({ product }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    })
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { slug } = await params
  try {
    if (!isAdminAuthed(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB({ maxWaitMS: 8000 })
    const body = await request.json()

    // Allow clearing SEO by sending `seo: null`
    const wantsUnsetSeo = body && typeof body === 'object' && 'seo' in body && body.seo === null
    const normalizedSeo = wantsUnsetSeo ? undefined : normalizeSeo(body?.seo)
    if (!wantsUnsetSeo && body && typeof body === 'object' && 'seo' in body) {
      if (normalizedSeo) body.seo = normalizedSeo
      else delete body.seo
    }

    const update: Record<string, unknown> = { $set: body }
    if (wantsUnsetSeo) {
      ;(update.$set as Record<string, unknown>).seo = undefined
      delete (update.$set as Record<string, unknown>).seo
      ;(update as Record<string, unknown>).$unset = { seo: 1 }
    }

    const product = await Product.findOneAndUpdate({ slug }, update, { new: true }).lean()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json({ product })
  } catch (err) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('PATCH product error:', err)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { slug } = await params
  try {
    if (!isAdminAuthed(_request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB({ maxWaitMS: 8000 })
    const product = await Product.findOneAndDelete({ slug })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('DELETE product error:', err)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

