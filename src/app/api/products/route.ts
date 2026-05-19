import { NextResponse } from 'next/server'
import { connectDB, MongoUnavailableError } from '@/lib/mongodb'
import ProductModel from '@/models/Product'
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const featured = searchParams.get('featured')
  const newDrop = searchParams.get('newDrop')
  const sortParam = (searchParams.get('sort') ?? '').toLowerCase()
  const limitParam = parseInt(searchParams.get('limit') ?? '12', 10)
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 12

  try {
    const connectWaitMS = process.env.NODE_ENV === 'production' ? 2000 : 8000
    const queryMaxTimeMS = process.env.NODE_ENV === 'production' ? 2000 : 8000
    const queryTimeoutMS = process.env.NODE_ENV === 'production' ? 2500 : 12000
    await connectDB({ maxWaitMS: connectWaitMS })
    // Treat missing `inStock` as in-stock (older/manual inserts).
    let query = ProductModel.find({ inStock: { $ne: false } })
    if (category) query = query.where('category').equals(category)
    if (featured) query = query.where('isFeatured').equals(true)
    if (newDrop) query = query.where('isNewDrop').equals(true)

    const DESC = -1 as const
    const sort: Record<string, 1 | -1> =
      sortParam === 'newest'
        ? { createdAt: DESC }
        : sortParam === 'updated'
          ? { updatedAt: DESC }
          : { isBestSeller: DESC, isNewDrop: DESC, updatedAt: DESC }

    const products = await withTimeout(
      query
        .maxTimeMS(queryMaxTimeMS)
        .sort(sort)
        .limit(limit)
        .lean(),
      queryTimeoutMS
    )

    // If DB is reachable, return DB results even if empty (no silent mock fallback).
    return NextResponse.json(
      { products },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    )
  } catch {
    // DB not connected — return empty with error status (no mock data)
    return NextResponse.json({ products: [], error: 'Database unavailable' }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    })
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdminAuthed(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB({ maxWaitMS: 8000 })
    const body = await request.json()

    const normalizedSeo = normalizeSeo(body?.seo)
    const normalizedBody: Record<string, unknown> = { ...(body as Record<string, unknown>) }
    if ('seo' in normalizedBody) delete normalizedBody.seo
    if (normalizedSeo) normalizedBody.seo = normalizedSeo

    const { name, tagline, description, price, category, stockCount } = normalizedBody as {
      name?: string
      tagline?: string
      description?: string
      price?: number
      category?: string
      stockCount?: number
    }

    if (!name || !tagline || !description || price === undefined || !category) {
      return NextResponse.json(
        { error: 'name, tagline, description, price, and category are required' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

    const inStockValue =
      typeof normalizedBody.inStock === 'boolean'
        ? normalizedBody.inStock
        : (stockCount ?? 0) > 0

    const product = await ProductModel.create({
      ...normalizedBody,
      slug,
      stockCount: stockCount ?? 0,
      inStock: inStockValue,
    })

    // Return a plain object to avoid passing Mongoose documents to server-rendered components
    const plain = product && typeof (product as { toObject?: unknown })?.toObject === 'function'
      ? (product as { toObject: () => unknown }).toObject()
      : JSON.parse(JSON.stringify(product))
    return NextResponse.json({ product: plain }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    if (
      err instanceof Error &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === '11000'
    ) {
      return NextResponse.json({ error: 'A product with that name already exists' }, { status: 409 })
    }
    console.error('POST product error:', err)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

