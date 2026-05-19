import { NextResponse } from 'next/server'
import { connectDB, MongoUnavailableError } from '@/lib/mongodb'
import Order from '@/models/Order'
import CustomerProfile from '@/models/CustomerProfile'
import { isAdminAuthed } from '@/lib/adminAuth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()

  try {
    if (!isAdminAuthed(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB({ maxWaitMS: 8000 })

    const match = q
      ? {
          $or: [
            { 'customer.email': { $regex: q, $options: 'i' } },
            { 'customer.name': { $regex: q, $options: 'i' } },
          ],
        }
      : {}

    const basePipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$customer.email',
          email: { $first: '$customer.email' },
          name: { $first: '$customer.name' },
          phone: { $first: '$customer.phone' },
          lastOrderAt: { $first: '$createdAt' },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          joinDate: { $last: '$createdAt' },
        },
      },
    ] as const

    const customers = await Order.aggregate([
      ...basePipeline,
      { $sort: { lastOrderAt: -1 } },
      { $limit: 100 },
    ])

    const emails = customers.map((c: { email: string }) => String(c.email).toLowerCase())
    const profiles = emails.length
      ? await CustomerProfile.find({ email: { $in: emails } }).lean()
      : []

    const profileByEmail = new Map(
      profiles.map((p) => [String(p.email).toLowerCase(), p])
    )

    const enriched = customers.map((c) => {
      const entry = c as Record<string, unknown>
      const p = profileByEmail.get(String(entry.email).toLowerCase())
      return {
        email: String(entry.email),
        name: String(entry.name),
        phone: String(entry.phone ?? ''),
        joinDate: entry.joinDate,
        orderCount: Number(entry.orderCount ?? 0),
        totalSpent: Number(entry.totalSpent ?? 0),
        lastOrderAt: entry.lastOrderAt,
        isVip: Boolean(p?.isVip),
        tags: Array.isArray(p?.tags) ? p.tags : [],
      }
    })

    return NextResponse.json(enriched)
  } catch (err) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('Customers list error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
