import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import ProductModel from '@/models/Product'
import { MOCK_PRODUCTS as MOCK_DATA } from '@/lib/mockData'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const featured = searchParams.get('featured')
  const newDrop = searchParams.get('newDrop')
  const limitParam = parseInt(searchParams.get('limit') ?? '12', 10)
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 12

  try {
    await connectDB()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = ProductModel.find()
    if (category) query = query.where('category').equals(category)
    if (featured) query = query.where('isFeatured').equals(true)
    if (newDrop) query = query.where('isNewDrop').equals(true)
    const products = await query.limit(limit).lean()
    return NextResponse.json({ products })
  } catch {
    // DB not connected — return mock data
    let filtered = MOCK_DATA as typeof MOCK_DATA
    if (category) filtered = filtered.filter((p) => p.category === category)
    if (featured) filtered = filtered.filter((p) => p.isFeatured)
    if (newDrop) filtered = filtered.filter((p) => p.isNewDrop)
    return NextResponse.json({ products: filtered.slice(0, limit) })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()

    const { name, tagline, description, price, category, stockCount } = body as {
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

    const product = await ProductModel.create({
      ...body,
      slug,
      stockCount: stockCount ?? 0,
      inStock: body.inStock ?? (stockCount ?? 0) > 0,
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (err: unknown) {
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

