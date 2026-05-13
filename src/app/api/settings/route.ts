import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import StoreSettings from '@/models/StoreSettings'

export async function GET() {
  try {
    await connectDB({ maxWaitMS: 2000 })
    const settings = await StoreSettings.findOne({ key: 'default' }).lean()
    if (!settings) {
      const created = await StoreSettings.create({ key: 'default' })
      return NextResponse.json({
        settings: {
          storeName: created.storeName,
          currency: created.currency,
          shippingFlatFee: created.shippingFlatFee,
          freeShippingThreshold: created.freeShippingThreshold,
          whatsappNumber: created.whatsappNumber,
          instagramUrl: created.instagramUrl,
          tiktokUrl: created.tiktokUrl,
          paymentCodEnabled: created.paymentCodEnabled,
          paymentJazzcashEnabled: created.paymentJazzcashEnabled,
          paymentEasypaisaEnabled: created.paymentEasypaisaEnabled,
          paymentNayapayEnabled: created.paymentNayapayEnabled,
        },
      })
    }

    return NextResponse.json({
      settings: {
        storeName: settings.storeName,
        currency: settings.currency,
        shippingFlatFee: settings.shippingFlatFee,
        freeShippingThreshold: settings.freeShippingThreshold,
        whatsappNumber: settings.whatsappNumber,
        instagramUrl: settings.instagramUrl,
        tiktokUrl: settings.tiktokUrl,
        paymentCodEnabled: settings.paymentCodEnabled,
        paymentJazzcashEnabled: settings.paymentJazzcashEnabled,
        paymentEasypaisaEnabled: settings.paymentEasypaisaEnabled,
        paymentNayapayEnabled: settings.paymentNayapayEnabled,
      },
    })
  } catch {
    // Keep storefront resilient; fall back to client constants if DB missing.
    return NextResponse.json({ settings: null })
  }
}
