import { NextResponse } from 'next/server'
import { connectDB, MongoUnavailableError } from '@/lib/mongodb'
import StoreSettings from '@/models/StoreSettings'
import { isAdminAuthed } from '@/lib/adminAuth'

type SettingsPayload = {
  storeName?: unknown
  supportEmail?: unknown
  supportPhone?: unknown
  whatsappNumber?: unknown
  storeAddressLine1?: unknown
  storeCity?: unknown
  storeProvince?: unknown
  instagramUrl?: unknown
  tiktokUrl?: unknown
  lowStockThreshold?: unknown
  shippingFlatFee?: unknown
  freeShippingThreshold?: unknown
  paymentCodEnabled?: unknown
  paymentJazzcashEnabled?: unknown
  paymentEasypaisaEnabled?: unknown
  paymentNayapayEnabled?: unknown
  orderAutoConfirmCod?: unknown
}

function toMoney(input: unknown) {
  const n = typeof input === 'number' ? input : Number(input)
  if (!Number.isFinite(n) || n < 0) return undefined
  return Math.round(n)
}

function toSmallInt(input: unknown) {
  const n = typeof input === 'number' ? input : Number(input)
  if (!Number.isFinite(n) || n < 0) return undefined
  return Math.min(999, Math.floor(n))
}

export async function GET(request: Request) {
  try {
    if (!isAdminAuthed(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB({ maxWaitMS: 8000 })
    const existing = await StoreSettings.findOne({ key: 'default' }).lean()
    if (existing) return NextResponse.json({ settings: existing })

    const created = await StoreSettings.create({ key: 'default' })
    return NextResponse.json({ settings: created.toObject() })
  } catch (err) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('Settings GET error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isAdminAuthed(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB({ maxWaitMS: 8000 })
    const body = (await request.json()) as SettingsPayload

    const update: Record<string, unknown> = {}
    if (typeof body.storeName === 'string') update.storeName = body.storeName.trim().slice(0, 80)
    if (typeof body.supportEmail === 'string') update.supportEmail = body.supportEmail.trim().slice(0, 120)
    if (typeof body.supportPhone === 'string') update.supportPhone = body.supportPhone.trim().slice(0, 40)

    if (typeof body.whatsappNumber === 'string') update.whatsappNumber = body.whatsappNumber.trim().slice(0, 24)
    if (typeof body.storeAddressLine1 === 'string') update.storeAddressLine1 = body.storeAddressLine1.trim().slice(0, 120)
    if (typeof body.storeCity === 'string') update.storeCity = body.storeCity.trim().slice(0, 60)
    if (typeof body.storeProvince === 'string') update.storeProvince = body.storeProvince.trim().slice(0, 60)
    if (typeof body.instagramUrl === 'string') update.instagramUrl = body.instagramUrl.trim().slice(0, 200)
    if (typeof body.tiktokUrl === 'string') update.tiktokUrl = body.tiktokUrl.trim().slice(0, 200)

    const lowStock = toSmallInt(body.lowStockThreshold)
    if (lowStock !== undefined) update.lowStockThreshold = lowStock

    const shipFee = toMoney(body.shippingFlatFee)
    if (shipFee !== undefined) update.shippingFlatFee = shipFee
    const freeThr = toMoney(body.freeShippingThreshold)
    if (freeThr !== undefined) update.freeShippingThreshold = freeThr

    for (const key of [
      'paymentCodEnabled',
      'paymentJazzcashEnabled',
      'paymentEasypaisaEnabled',
      'paymentNayapayEnabled',
      'orderAutoConfirmCod',
    ] as const) {
      const v = body[key]
      if (typeof v === 'boolean') update[key] = v
    }

    const doc = await StoreSettings.findOneAndUpdate(
      { key: 'default' },
      { $set: { key: 'default', ...update } },
      { upsert: true, new: true }
    ).lean()

    return NextResponse.json({ success: true, settings: doc })
  } catch (err) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('Settings PATCH error:', err)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
