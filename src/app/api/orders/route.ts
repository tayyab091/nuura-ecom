import { NextRequest, NextResponse } from 'next/server'
import { connectDB, MongoUnavailableError } from '@/lib/mongodb'
import Order from '@/models/Order'
import { generateOrderNumber } from '@/lib/utils'
import { sendOrderConfirmationEmail } from '@/lib/email'
import StoreSettings from '@/models/StoreSettings'
import { isAdminAuthed } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { customer, items, shippingAddress, paymentMethod, subtotal, shippingFee, total, notes } = body

    // Validate required fields
    if (!customer?.name || !customer?.email || !customer?.phone) {
      return NextResponse.json({ error: 'Customer details are required' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Order must have at least one item' }, { status: 400 })
    }
    if (!shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.province) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 })
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 })
    }

    await connectDB({ maxWaitMS: 8000 })

    const settings = await StoreSettings.findOne({ key: 'default' }).lean().catch(() => null)
    const enabled = {
      cod: settings?.paymentCodEnabled ?? true,
      jazzcash: settings?.paymentJazzcashEnabled ?? true,
      easypaisa: settings?.paymentEasypaisaEnabled ?? true,
      nayapay: settings?.paymentNayapayEnabled ?? true,
    } as const

    if (!enabled[paymentMethod as keyof typeof enabled]) {
      return NextResponse.json({ error: 'Selected payment method is not available' }, { status: 400 })
    }

    const orderNumber = generateOrderNumber()

    // Determine statuses based on payment method + store rules
    const isCOD = paymentMethod === 'cod'
    const autoConfirmCod = settings?.orderAutoConfirmCod ?? true
    const paymentStatus = isCOD ? 'pending' : 'pending_verification'
    const orderStatus = isCOD ? (autoConfirmCod ? 'confirmed' : 'pending') : 'pending'

    // Map cart items to order item shape
    const orderItems = items.map((item: { product: { _id: string; name: string; price: number; images?: string[] }; quantity: number }) => ({
      productId: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.images?.[0] ?? '',
    }))

    const order = await Order.create({
      orderNumber,
      customer,
      items: orderItems,
      shippingAddress: {
        fullName: customer.name,
        phone: customer.phone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        province: shippingAddress.province,
        postalCode: shippingAddress.postalCode ?? '',
      },
      paymentMethod,
      paymentStatus,
      orderStatus,
      subtotal,
      shippingFee,
      total,
      notes: notes ?? '',
    })

    // Send confirmation email (non-blocking)
    sendOrderConfirmationEmail({
      orderNumber,
      customerName: customer.name,
      customerEmail: customer.email,
      items: items.map((i: { product: { name: string; price: number }; quantity: number }) => ({
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
      })),
      total,
      paymentMethod,
      shippingAddress,
    }).catch(() => {/* email failure should not break order */})

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: order._id.toString(),
      paymentMethod,
    })
  } catch (error) {
    if (error instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('Order creation failed:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Admin-only listing (defense-in-depth).
    if (!isAdminAuthed(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB({ maxWaitMS: 8000 })
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(50).lean()
    return NextResponse.json({ orders })
  } catch (error) {
    if (error instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
