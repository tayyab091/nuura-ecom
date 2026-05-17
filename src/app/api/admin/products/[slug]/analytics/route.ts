import { NextResponse } from 'next/server'
import { connectDB, MongoUnavailableError } from '@/lib/mongodb'
import Product from '@/models/Product'
import Order from '@/models/Order'
import { isAdminAuthed } from '@/lib/adminAuth'

interface RouteParams {
  params: Promise<{ slug: string }>
}

function startOfDay(date: Date) {
  const current = new Date(date)
  current.setHours(0, 0, 0, 0)
  return current
}

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return startOfDay(date)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export async function GET(request: Request, { params }: RouteParams) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug).trim().toLowerCase()

  try {
    await connectDB({ maxWaitMS: 8000 })
    const product = await Product.findOne({ slug }).lean()
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const cutoff = daysAgo(29)
    const series = await Order.aggregate([
      { $match: { createdAt: { $gte: cutoff } } },
      { $unwind: '$items' },
      { $match: { 'items.productId': String(product._id) } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'Asia/Karachi',
            },
          },
          units: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', units: 1, revenue: 1 } },
    ])

    const map = new Map<string, { date: string; units: number; revenue: number }>()
    for (const row of series as Array<{ date: string; units: number; revenue: number }>) {
      map.set(row.date, row)
    }

    const filledSeries: Array<{ date: string; units: number; revenue: number }> = []
    const cursor = startOfDay(cutoff)
    cursor.setHours(12, 0, 0, 0)
    for (let index = 0; index < 30; index++) {
      const date = formatDate(cursor)
      filledSeries.push(map.get(date) ?? { date, units: 0, revenue: 0 })
      cursor.setDate(cursor.getDate() + 1)
    }

    const totalUnits = filledSeries.reduce((sum, row) => sum + row.units, 0)
    const totalRevenue = filledSeries.reduce((sum, row) => sum + row.revenue, 0)

    return NextResponse.json({
      product: {
        name: product.name,
        slug: product.slug,
        stockCount: product.stockCount,
        lowStockThreshold: product.lowStockThreshold ?? 10,
      },
      totalUnits,
      totalRevenue,
      series: filledSeries,
    })
  } catch (err) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('Product analytics error:', err)
    return NextResponse.json({ error: 'Failed to fetch product analytics' }, { status: 500 })
  }
}