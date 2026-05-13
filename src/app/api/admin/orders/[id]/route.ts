import { NextResponse } from 'next/server'
import { connectDB, MongoUnavailableError } from '@/lib/mongodb'
import Order from '@/models/Order'
import { isAdminAuthed } from '@/lib/adminAuth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    await connectDB({ maxWaitMS: 8000 })
    const order = await Order.findById(id).lean()
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json({ order })
  } catch (err) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('GET order error:', err)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    await connectDB({ maxWaitMS: 8000 })
    const body = await request.json()
    const { orderStatus, paymentStatus } = body as {
      orderStatus?: string
      paymentStatus?: string
    }

    const update: Record<string, string> = {}
    if (orderStatus) update.orderStatus = orderStatus
    if (paymentStatus) update.paymentStatus = paymentStatus

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const order = await Order.findByIdAndUpdate(id, { $set: update }, { new: true }).lean()
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, order })
  } catch (err) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('PATCH order error:', err)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
