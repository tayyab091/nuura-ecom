import { NextResponse } from 'next/server'
import { connectDB, MongoUnavailableError } from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { isAdminAuthed } from '@/lib/adminAuth'

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return startOfDay(d)
}

function isoDate(d: Date) {
  // Match the aggregation timezone used above (Asia/Karachi)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function fillDays<T extends Record<string, unknown>>(
  start: Date,
  days: number,
  rows: Array<T>,
  key: 'orders' | 'revenue'
) {
  const map = new Map<string, number>()
  for (const r of rows) {
    const obj = r as Record<string, unknown>
    const date = obj.date
    const v = Number(obj[key] ?? 0)
    if (typeof date === 'string') map.set(date, Number.isFinite(v) ? v : 0)
  }

  const out: Array<{ date: string } & Record<typeof key, number>> = []
  const cur = startOfDay(start)
  // Use midday to avoid edge cases when formatting across timezones.
  cur.setHours(12, 0, 0, 0)
  for (let i = 0; i < days; i++) {
    const date = isoDate(cur)
    out.push({ date, [key]: map.get(date) ?? 0 } as { date: string } & Record<typeof key, number>)
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

export async function GET(request: Request) {
  try {
    if (!isAdminAuthed(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB({ maxWaitMS: 8000 })

    const salesStatus = ['confirmed', 'shipped', 'delivered']
    const url = new URL(request.url)
    const daysParam = (url.searchParams.get('days') || '14').toLowerCase()
    let windowDays = 14
    if (daysParam === '7') windowDays = 7
    else if (daysParam === '30') windowDays = 30
    else if (daysParam === 'all') windowDays = 365
    const revenueStart = daysAgo(windowDays - 1)
    const mixStart = daysAgo(29)

    const [
      totalOrders,
      pendingVerification,
      revenueAgg,
      totalProducts,
      recentOrders,
      ordersByDay,
      revenueByDay,
      paymentMix,
      topProducts,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'pending_verification' }),
      Order.aggregate([
        {
          $match: {
            orderStatus: { $in: ['confirmed', 'shipped', 'delivered'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Product.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(10).lean(),

      // Orders per day (all statuses)
      Order.aggregate([
        { $match: { createdAt: { $gte: revenueStart } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'Asia/Karachi',
              },
            },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', orders: 1 } },
      ]),

      // Confirmed revenue per day
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: revenueStart },
            orderStatus: { $in: salesStatus },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'Asia/Karachi',
              },
            },
            revenue: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', revenue: 1 } },
      ]),

      // Payment method mix (last 30 days)
      Order.aggregate([
        { $match: { createdAt: { $gte: mixStart } } },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
        { $sort: { count: -1 } },
        { $project: { _id: 0, method: '$_id', count: 1, revenue: 1 } },
      ]),

      // Top products (last 30 days)
      Order.aggregate([
        { $match: { createdAt: { $gte: mixStart } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            units: { $sum: '$items.quantity' },
            revenue: {
              $sum: { $multiply: ['$items.price', '$items.quantity'] },
            },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, name: '$_id', units: 1, revenue: 1 } },
      ]),
    ])

    const confirmedRevenue = revenueAgg[0]?.total ?? 0

    const filledOrdersByDay = fillDays(revenueStart, 14, ordersByDay, 'orders')
    const filledRevenueByDay = fillDays(revenueStart, 14, revenueByDay, 'revenue')

    return NextResponse.json({
      totalOrders,
      pendingVerification,
      confirmedRevenue,
      totalProducts,
      recentOrders,
      ordersByDay: filledOrdersByDay,
      revenueByDay: filledRevenueByDay,
      paymentMix,
      topProducts,
    })
  } catch (err) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('Stats error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
