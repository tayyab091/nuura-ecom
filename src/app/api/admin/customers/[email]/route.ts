import { NextResponse } from 'next/server'
import { connectDB, MongoUnavailableError } from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import CustomerProfile from '@/models/CustomerProfile'
import { isAdminAuthed } from '@/lib/adminAuth'

interface RouteParams {
  params: Promise<{ email: string }>
}

function normalizeTags(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 12)
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12)
  }
  return []
}

export async function GET(_request: Request, { params }: RouteParams) {
  if (!isAdminAuthed(_request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { email: raw } = await params
  const email = decodeURIComponent(raw).trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  try {
    await connectDB({ maxWaitMS: 8000 })

    const [profile, user, recentOrders, agg] = await Promise.all([
      CustomerProfile.findOne({ email }).lean(),
      User.findOne({ email }).lean(),
      Order.find({ 'customer.email': email })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Order.aggregate([
        { $match: { 'customer.email': email } },
        {
          $group: {
            _id: '$customer.email',
            ordersCount: { $sum: 1 },
            totalSpent: { $sum: '$total' },
            lastOrderAt: { $max: '$createdAt' },
          },
        },
      ]),
    ])

    const stats = agg[0] ?? { ordersCount: 0, totalSpent: 0, lastOrderAt: null }
    const mostRecent = recentOrders[0]

    const customer = {
      email,
      name: mostRecent?.customer?.name ?? user?.name ?? '—',
      phone: mostRecent?.customer?.phone ?? user?.phone ?? '',
      isRegistered: Boolean(user),
      createdAt: user?.createdAt ?? null,
      profile: {
        isVip: Boolean(profile?.isVip),
        tags: Array.isArray(profile?.tags) ? profile?.tags : [],
        notes: profile?.notes ?? '',
      },
      lastShippingAddress: mostRecent?.shippingAddress ?? null,
    }

    return NextResponse.json({ customer, stats, recentOrders })
  } catch (err) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('Customer detail error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { email: raw } = await params
  const email = decodeURIComponent(raw).trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  try {
    await connectDB({ maxWaitMS: 8000 })
    const body = (await request.json()) as {
      notes?: unknown
      tags?: unknown
      isVip?: unknown
    }

    const update: Record<string, unknown> = {}
    if (typeof body.notes === 'string') update.notes = body.notes.slice(0, 2000)
    if (body.tags !== undefined) update.tags = normalizeTags(body.tags)
    if (typeof body.isVip === 'boolean') update.isVip = body.isVip

    const doc = await CustomerProfile.findOneAndUpdate(
      { email },
      { $set: { email, ...update } },
      { upsert: true, new: true }
    ).lean()

    return NextResponse.json({ success: true, profile: doc })
  } catch (err) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('Customer profile update error:', err)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}
