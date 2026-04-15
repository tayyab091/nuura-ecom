import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Order from '@/models/Order'

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY
const MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

async function getNuuraContext(): Promise<string> {
  try {
    await connectDB()

    const products = await Product.find({ inStock: true })
      .select('name slug price comparePrice category tags isNewDrop isBestSeller')
      .lean()

    const productList = products.map((p: any) => {
      const disc = p.comparePrice
        ? ` (was PKR ${p.comparePrice.toLocaleString()})`
        : ''
      const badges = [
        p.isNewDrop ? 'New Drop' : '',
        p.isBestSeller ? 'Best Seller' : '',
      ].filter(Boolean).join(', ')
      return `- ${p.name}: PKR ${p.price.toLocaleString()}${disc} | ${p.category} | /product/${p.slug}${badges ? ` | ${badges}` : ''}`
    }).join('\n')

    return `LIVE PRODUCT CATALOG (from database):\n${productList}`
  } catch {
    return `PRODUCT CATALOG:
- Rose Quartz Gua Sha: PKR 2,800 (was 3,500) | self-care | /product/rose-quartz-gua-sha | New Drop
- LED Glow Mirror: PKR 4,500 (was 5,500) | self-care | /product/led-glow-mirror | Best Seller
- Mini Chain Crossbody: PKR 3,200 | accessories | /product/mini-chain-crossbody | New Drop
- Jade Face Roller: PKR 1,800 (was 2,200) | self-care | /product/jade-face-roller | Best Seller
- Acrylic Box Clutch: PKR 2,500 | accessories | /product/acrylic-clutch | New Drop
- USB Facial Steamer: PKR 3,800 (was 4,500) | self-care | /product/facial-steamer`
  }
}

async function getOrderStatus(orderNumber: string): Promise<string | null> {
  try {
    await connectDB()
    const order = await Order.findOne({ orderNumber }).lean() as any
    if (!order) return null
    return `Order ${order.orderNumber}: ${order.orderStatus} | PKR ${order.total?.toLocaleString()} | Payment: ${order.paymentMethod}`
  } catch {
    return null
  }
}

function buildSystemPrompt(catalog: string): string {
  return `You are Noor, the AI beauty assistant for Nuura — a premium Pakistani women's e-commerce brand.

BRAND: Nuura — "Glow in your own light"
WEBSITE: nuura-temp.vercel.app
CONTACT: Instagram @nuura.pk | WhatsApp available

${catalog}

SHIPPING:
- Lahore, Karachi, Islamabad: 2-3 business days
- Other cities: 3-5 business days
- Free shipping on orders over PKR 5,000
- Standard: PKR 150-300 by city (TCS & Leopard)

PAYMENT: Cash on Delivery (most popular) | JazzCash | EasyPaisa | NayaPay
RETURNS: 7-day hassle-free on unused items. Damaged? WhatsApp photo within 24h — full replacement.
DISCOUNT CODES: NUURA10 (10% off first order) | GLOW5 (PKR 500 off orders over PKR 5,000)
ORDER TRACKING: Customer shares order number format NR-XXXXXX-XXXX

RULES:
1. Keep responses SHORT — max 3-4 sentences
2. When recommending products always include the link: [Product Name](/product/slug)
3. Be warm, friendly, like a knowledgeable beauty friend
4. Respond in same language as user (Urdu or English)
5. Never make up products or prices not in the catalog
6. For skincare advice, recommend relevant Nuura products
7. If asked about order status, ask for their order number

SKINCARE KNOWLEDGE:
- Gua sha: use upward strokes with facial oil, best in morning, reduces puffiness
- Jade roller: store in fridge for puffiness, use after serum, small end for under-eye
- Facial steamer: use 2-3x weekly before serums, opens pores for better absorption
- LED mirror: adjustable brightness for precise makeup in any lighting`
}

export async function POST(request: Request) {
  try {
    const { messages, orderNumber } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    // Check for order lookup
    let orderInfo = ''
    if (orderNumber) {
      const status = await getOrderStatus(orderNumber)
      if (status) orderInfo = `\n\nORDER STATUS FOUND: ${status}`
    }

    // Get live product catalog from DB
    const catalog = await getNuuraContext()
    const systemPrompt = buildSystemPrompt(catalog) + orderInfo

    if (!OPENROUTER_KEY) {
      return NextResponse.json({
        response: "I'm Noor, your Nuura beauty assistant! I can help with products, skincare advice, shipping info, and more. What would you like to know? ✨",
        fallback: true,
      })
    }

    // Build messages for OpenRouter
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter((m: any) => m.content && m.role)
        .slice(-8)
        .map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: String(m.content).substring(0, 600),
        })),
    ]

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nuura-temp.vercel.app',
        'X-Title': 'Nuura Beauty Assistant',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        temperature: 0.7,
        messages: apiMessages,
        reasoning: { enabled: false },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenRouter error:', response.status, errText)
      return NextResponse.json({
        response: "I'm having a moment! Ask me about our products or WhatsApp @nuura.pk for instant help 🌿",
        fallback: true,
      })
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json({
        response: "Sorry, I couldn't process that. Try asking about our products or skincare tips! ✨",
        fallback: true,
      })
    }

    return NextResponse.json({
      response: aiResponse,
      fallback: false,
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({
      response: "Something went wrong. Please try again or WhatsApp us @nuura.pk 🌸",
      fallback: true,
    })
  }
}
