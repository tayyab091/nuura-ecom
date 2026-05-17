import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MOCK_PRODUCTS } from '@/lib/mockData'
import Product from '@/models/Product'
import Order from '@/models/Order'

type Action =
  | { type: 'OPEN_CART' }
  | { type: 'GO_TO_CHECKOUT' }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_COUPON'; code: string }
  | { type: 'ADD_TO_CART'; product: any }
  | { type: 'ADD_TO_CART'; product: unknown }
  | { type: 'REMOVE_FROM_CART'; productId?: string; query?: string }

type ApiPayload = {
  response: string
  suggestions?: string[]
  action?: Action
}

const SMART_SUGGESTIONS = [
  'Show best sellers',
  'Self-care under 3000',
  'Accessories under 3500',
  'Track my order',
  'Open cart',
  'Go to checkout',
  'Shipping info',
]

function jsonResponse(payload: ApiPayload, init?: ResponseInit) {
  return NextResponse.json(payload, init)
}

function normalize(s: string) {
  return (s || '').toLowerCase().trim()
}

function safeNumber(n: unknown) {
  const num = typeof n === 'number' ? n : parseFloat(String(n))
  return Number.isFinite(num) ? num : 0
}

function toClientProduct(p: unknown) {
  const obj = (p ?? {}) as Record<string, unknown>
  // Ensure the returned shape is compatible with the client cart store.
  return {
    _id: String(obj._id ?? obj.id ?? ''),
    slug: String(obj.slug ?? ''),
    name: String(obj.name ?? ''),
    tagline: String(obj.tagline ?? ''),
    description: String(obj.description ?? ''),
    price: safeNumber(obj.price),
    comparePrice: obj.comparePrice as unknown as number | null,
    images: Array.isArray(obj.images) ? (obj.images as unknown[]).map(String) : [],
    category: String(obj.category ?? 'self-care'),
    tags: Array.isArray(obj.tags) ? (obj.tags as unknown[]).map(String) : [],
    inStock: Boolean(obj.inStock ?? true),
    stockCount: safeNumber(obj.stockCount ?? 0),
    isFeatured: Boolean(obj.isFeatured ?? false),
    isNewDrop: Boolean(obj.isNewDrop ?? false),
    isBestSeller: Boolean(obj.isBestSeller ?? false),
    createdAt: String(obj.createdAt ?? new Date().toISOString()),
    updatedAt: String(obj.updatedAt ?? new Date().toISOString()),
  }
}

function extractOrderNumber(lowerMsg: string) {
  const match = lowerMsg.match(/nr-\d{6}-\d{4}/i)
  return match?.[0]?.toUpperCase() ?? null
}

function extractPriceRange(lowerMsg: string): { min: number; max: number } | null {
  const between = lowerMsg.match(/between\s+(?:pkr\s*|rs\.?\s*|\$\s*)?(\d+)\s+and\s+(?:pkr\s*|rs\.?\s*|\$\s*)?(\d+)/i)
  if (between) {
    const a = parseInt(between[1])
    const b = parseInt(between[2])
    return { min: Math.min(a, b), max: Math.max(a, b) }
  }
  const under = lowerMsg.match(/under\s+(?:pkr\s*|rs\.?\s*|\$\s*)?(\d+)/i)
  if (under) return { min: 0, max: parseInt(under[1]) }
  const over = lowerMsg.match(/(?:over|above|more than)\s+(?:pkr\s*|rs\.?\s*|\$\s*)?(\d+)/i)
  if (over) return { min: parseInt(over[1]), max: Number.MAX_SAFE_INTEGER }
  return null
}

function extractCategory(lowerMsg: string): 'self-care' | 'accessories' | null {
  if (lowerMsg.includes('self-care') || lowerMsg.includes('skincare') || lowerMsg.includes('beauty') || lowerMsg.includes('gua sha') || lowerMsg.includes('roller') || lowerMsg.includes('steamer') || lowerMsg.includes('mirror')) {
    return 'self-care'
  }
  if (lowerMsg.includes('accessories') || lowerMsg.includes('bag') || lowerMsg.includes('clutch') || lowerMsg.includes('purse') || lowerMsg.includes('crossbody')) {
    return 'accessories'
  }
  return null
}

function extractKeywords(lowerMsg: string) {
  const cleaned = lowerMsg
    // remove brand/rating clauses so they don't act like keywords
    .replace(/\bbrand\s+[a-z0-9-]+\b/gi, ' ')
    .replace(/\brating\s+\d+(?:\.\d+)?\b/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*stars?\b/gi, ' ')

  return cleaned
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(k => k.length >= 3)
    .filter(k => !/^\d+$/.test(k))
    .filter(k => ![
      'show', 'find', 'search', 'looking', 'recommend', 'suggest', 'best', 'popular', 'trending',
      'under', 'over', 'above', 'between', 'and', 'pkr', 'rs', 'price', 'category', 'rating', 'brand',
      'add', 'remove', 'cart', 'checkout', 'order', 'track', 'status',
      'product', 'products',
      // category words (handled separately)
      'self', 'care', 'self-care', 'skincare', 'beauty',
      'accessory', 'accessories', 'bag', 'clutch', 'purse', 'crossbody'
    ].includes(k))
}

function buildSuggestions(lowerMsg: string) {
  const base = [...SMART_SUGGESTIONS]
  const kw = extractKeywords(lowerMsg)
  if (kw.length === 0) return base

  const matchedNames = MOCK_PRODUCTS
    .filter(p => {
      const hay = `${p.name} ${p.slug} ${(p.tags || []).join(' ')}`.toLowerCase()
      return kw.some(k => hay.includes(k))
    })
    .slice(0, 4)
    .map(p => `Add ${p.name}`)

  return [...matchedNames, ...base].slice(0, 8)
}

async function tryConnectDB(timeoutMs = 4000): Promise<boolean> {
  try {
    await Promise.race([
      connectDB(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB_CONNECT_TIMEOUT')), timeoutMs)),
    ])
    return true
  } catch (error) {
    console.warn('custom-chat: DB unavailable, using fallback', error)
    return false
  }
}

function fallbackSearchProducts(lowerMsg: string) {
  const priceRange = extractPriceRange(lowerMsg)
  const categoryFilter = extractCategory(lowerMsg)
  const keywords = extractKeywords(lowerMsg)

  const minPrice = priceRange?.min ?? 0
  const maxPrice = priceRange?.max ?? Number.MAX_SAFE_INTEGER

  const products = MOCK_PRODUCTS.filter(p => {
    if (!p.inStock) return false
    if (p.price < minPrice) return false
    if (p.price > maxPrice) return false
    if (categoryFilter && p.category !== categoryFilter) return false

    if (keywords.length === 0) return true
    return keywords.some(k =>
      p.name.toLowerCase().includes(k) ||
      p.slug.toLowerCase().includes(k) ||
      p.tags?.some(t => t.toLowerCase().includes(k))
    )
  })

  return products.slice(0, 4)
}

function fallbackFindProductForAdd(lowerMsg: string) {
  const kw = lowerMsg
    .replace(/add|to|cart|please|a|an|the/gi, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()

  if (!kw) return null

  const words = kw.split(/\s+/).filter(Boolean)
  const candidate = MOCK_PRODUCTS.find(p => {
    const hay = `${p.name} ${p.slug} ${(p.tags || []).join(' ')}`.toLowerCase()
    return words.every(w => hay.includes(w))
  })

  return candidate || null
}

function isRecommendationIntent(lowerMsg: string) {
  return (
    lowerMsg.includes('recommend') ||
    lowerMsg.includes('suggest') ||
    lowerMsg.includes('trending') ||
    lowerMsg.includes('popular') ||
    lowerMsg.includes('best') ||
    lowerMsg.includes('similar to') ||
    lowerMsg.includes('something like')
  )
}

function isSearchIntent(lowerMsg: string) {
  return (
    lowerMsg.includes('show') ||
    lowerMsg.includes('find') ||
    lowerMsg.includes('search') ||
    lowerMsg.includes('looking for') ||
    lowerMsg.includes('products') ||
    Boolean(extractPriceRange(lowerMsg)) ||
    Boolean(extractCategory(lowerMsg))
  )
}

function isAddIntent(lowerMsg: string) {
  return lowerMsg.startsWith('add ') || lowerMsg.includes(' add ') || lowerMsg.includes('add to cart')
}

function isRemoveIntent(lowerMsg: string) {
  return lowerMsg.startsWith('remove ') || lowerMsg.includes(' remove ') || lowerMsg.includes('delete') || lowerMsg.includes('take out')
}

function extractCouponCode(lowerMsg: string) {
  const match = lowerMsg.match(/\b([a-z0-9]{4,15})\b/i)
  if (!match) return null
  const raw = match[1].toUpperCase()
  if (['COUPON', 'DISCOUNT', 'PROMO', 'CODE', 'APPLY'].includes(raw)) return null
  return raw
}

function formatProductList(products: any[]) {
  return products.map(p => `- ${p.name} (PKR ${p.price})`).join('\n')
}

function findMentionedProduct(lowerMsg: string) {
  // Use mock products as a stable lookup source even when DB is down.
  const direct = MOCK_PRODUCTS.find(p => lowerMsg.includes(p.slug.toLowerCase()))
  if (direct) return direct

  // Tag phrase match (e.g., 'gua sha' should match tag 'gua-sha')
  const byTag = MOCK_PRODUCTS.find(p =>
    (p.tags || []).some(tag => {
      const t = String(tag).toLowerCase()
      const asSpace = t.replace(/-/g, ' ')
      return lowerMsg.includes(t) || lowerMsg.includes(asSpace)
    })
  )
  if (byTag) return byTag

  // Try matching on distinctive words from product names.
  const words = lowerMsg
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3)

  return (
    MOCK_PRODUCTS.find(p => {
      const name = p.name.toLowerCase()
      return words.some(w => name.includes(w))
    }) ?? null
  )
}

function formatOrderTimeline(status: string) {
  const steps: Array<{ key: string; label: string }> = [
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ]
  const currentIndex = Math.max(0, steps.findIndex(s => s.key === status))
  return steps
    .map((s, idx) => {
      if (idx < currentIndex) return `[x] ${s.label}`
      if (idx === currentIndex) return `[>] ${s.label} (current)`
      return `[ ] ${s.label}`
    })
    .join('\n')
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { message?: string; suggestOnly?: boolean }
    const message = body.message || ''
    const lowerMsg = normalize(message)

    // Autocomplete / smart suggestions only
    if (body.suggestOnly) {
      return jsonResponse({ response: '', suggestions: buildSuggestions(lowerMsg) })
    }

    const suggestions = buildSuggestions(lowerMsg)

    // Greetings
    if (/^(hi|hello|hey|salam|assalam)/i.test(lowerMsg)) {
      return jsonResponse({
        response:
          "Hi! I'm Nuura's shopping assistant. I can help you find products, recommend items, track orders, and manage your cart. What would you like to do?",
        suggestions,
      })
    }

    // 5. FAQ Automation
    if (lowerMsg.includes('shipping') || lowerMsg.includes('delivery')) {
      return jsonResponse({
        response:
          'Shipping: Standard delivery is usually 3-5 business days (varies by city). Free shipping applies on qualifying orders. Want me to show products under a budget?',
        suggestions,
      })
    }
    if (lowerMsg.includes('return') || lowerMsg.includes('refund')) {
      return jsonResponse({
        response:
          'Returns: 7-day return policy. Items must be unused and in original packaging. If something arrives damaged, contact support quickly with photos.',
        suggestions,
      })
    }
    if (lowerMsg.includes('payment') || lowerMsg.includes('cod')) {
      return jsonResponse({
        response:
          'Payments: Cash on Delivery (COD) is available. We also support digital payments (e.g., JazzCash/EasyPaisa) depending on checkout configuration.',
        suggestions,
      })
    }

    // 3. Order Tracking + Timeline
    const orderNumber = extractOrderNumber(lowerMsg)
    if (orderNumber || lowerMsg.includes('track') || lowerMsg.includes('where is my order') || lowerMsg.includes('order status')) {
      if (!orderNumber) {
        return jsonResponse({
          response: 'Please share your order number in this format: NR-XXXXXX-XXXX',
          suggestions,
        })
      }

      const dbOk = await tryConnectDB()
      if (!dbOk) {
        return jsonResponse({
          response: `I can't reach the order database right now. Please try again shortly.\n\nOrder: ${orderNumber}`,
          suggestions,
        })
      }

      const order = await Order.findOne({ orderNumber }).lean()
      if (!order) {
        return jsonResponse({
          response: `I couldn't find an order with number ${orderNumber}. Please double-check and try again.`,
          suggestions,
        })
      }

      const ord = order as unknown as Record<string, unknown>
      const timeline = formatOrderTimeline(String(ord.orderStatus))
      return jsonResponse({
        response:
          `Tracking for ${orderNumber}\n\n${timeline}\n\nTotal: PKR ${ord.total} | Payment: ${ord.paymentStatus}`,
        suggestions,
      })
    }

    // 4. Cart & Checkout Assistance + Coupons
    if (lowerMsg.includes('open cart') || lowerMsg.match(/open.*cart/i) || lowerMsg === 'cart') {
      return jsonResponse({ response: 'Opening your cart.', suggestions, action: { type: 'OPEN_CART' } })
    }

    if (lowerMsg.includes('checkout') || lowerMsg.includes('go to checkout') || lowerMsg.includes('proceed')) {
      return jsonResponse({
        response: 'Taking you to checkout.',
        suggestions,
        action: { type: 'GO_TO_CHECKOUT' },
      })
    }

    if (lowerMsg.includes('clear cart') || lowerMsg.includes('empty cart')) {
      return jsonResponse({
        response: 'Clearing your cart.',
        suggestions,
        action: { type: 'CLEAR_CART' },
      })
    }

    if (lowerMsg.includes('coupon') || lowerMsg.includes('discount') || lowerMsg.includes('promo') || lowerMsg.includes('apply code')) {
      const code = extractCouponCode(lowerMsg) || 'GLOW10'
      return jsonResponse({
        response: `Coupon code: ${code}. Applying it now (if supported at checkout).`,
        suggestions,
        action: { type: 'APPLY_COUPON', code },
      })
    }

    // Cart removal via chat
    if (isRemoveIntent(lowerMsg)) {
      const query = lowerMsg
        .replace(/remove|delete|take out|from|my|the|cart/gi, ' ')
        .replace(/[^a-z0-9\s-]/g, ' ')
        .trim()

      if (!query) {
        return jsonResponse({ response: 'Tell me what to remove (e.g., "remove jade roller").', suggestions })
      }

      return jsonResponse({
        response: `Removing "${query}" from your cart.`,
        suggestions,
        action: { type: 'REMOVE_FROM_CART', query },
      })
    }

    // Cart add via chat
    if (isAddIntent(lowerMsg)) {
      const kw = lowerMsg
        .replace(/add|to|my|the|cart/gi, ' ')
        .replace(/[^a-z0-9\s-]/g, ' ')
        .trim()

      if (kw.length < 3) {
        return jsonResponse({ response: 'Tell me what to add (e.g., "add gua sha").', suggestions })
      }

      const dbOk = await tryConnectDB()
      if (dbOk) {
        const products = await Product.find({ name: { $regex: kw, $options: 'i' }, inStock: true }).limit(3).lean()
        if (products.length > 0) {
          const p = toClientProduct(products[0])
          return jsonResponse({
            response: `Adding ${p.name} to your cart.`,
            suggestions,
            action: { type: 'ADD_TO_CART', product: p },
          })
        }
      }

      const fallbackProduct = fallbackFindProductForAdd(lowerMsg)
      if (fallbackProduct) {
        const p = toClientProduct(fallbackProduct)
        return jsonResponse({
          response: `Adding ${p.name} to your cart.`,
          suggestions,
          action: { type: 'ADD_TO_CART', product: p },
        })
      }

      return jsonResponse({
        response: `I couldn't find a matching product for "${kw}". Try another name or ask me to "show products under 3000".`,
        suggestions,
      })
    }

    // 2. Product Recommendation Engine
    // Recommendations
    if (isRecommendationIntent(lowerMsg)) {
      const categoryFilter = extractCategory(lowerMsg)
      const mentioned = findMentionedProduct(lowerMsg)

      // Rule-based: "Customers also bought" style related items
      if (mentioned) {
        const related = MOCK_PRODUCTS
          .filter(p => p.inStock)
          .filter(p => p.category === mentioned.category)
          .filter(p => p.slug !== mentioned.slug)
          .slice(0, 3)
          .map(toClientProduct)

        if (related.length > 0) {
          return jsonResponse({
            response:
              `Customers also bought (related to ${mentioned.name}):\n\n${formatProductList(related)}\n\nSay "Add <product name>" to add one to your cart.`,
            suggestions,
          })
        }
      }

      const dbOk = await tryConnectDB()
      if (dbOk) {
        const query: any = { inStock: true }
        if (categoryFilter) query.category = categoryFilter
        const products = await Product.find(query).sort({ isBestSeller: -1, isFeatured: -1, createdAt: -1 }).limit(3).lean()
        if (products.length > 0) {
          const list = formatProductList(products.map(toClientProduct))
          return jsonResponse({
            response: `Recommendations:\n\n${list}\n\nSay "Add <product name>" to add one to your cart.`,
            suggestions,
          })
        }
      }

      const fallback = MOCK_PRODUCTS
        .filter(p => p.inStock)
        .filter(p => (categoryFilter ? p.category === categoryFilter : true))
        .sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller))
        .slice(0, 3)
        .map(toClientProduct)

      return jsonResponse({
        response: `Recommendations:\n\n${formatProductList(fallback)}\n\nSay "Add <product name>" to add one to your cart.`,
        suggestions,
      })
    }

    // Product discovery & search
    if (isSearchIntent(lowerMsg)) {
      const priceRange = extractPriceRange(lowerMsg)
      const categoryFilter = extractCategory(lowerMsg)
      const minPrice = priceRange?.min ?? 0
      const maxPrice = priceRange?.max ?? Number.MAX_SAFE_INTEGER

      const requestedBrand = lowerMsg.includes('brand')
      const requestedRating = lowerMsg.includes('rating') || lowerMsg.includes('stars')
      const filterNote = (requestedBrand || requestedRating)
        ? '\n\nNote: Brand/rating filters are limited in this demo catalog, so results are based on price/category/keywords.'
        : ''

      const dbOk = await tryConnectDB()
      if (dbOk) {
        const query: any = { inStock: true, price: { $gte: minPrice, $lte: maxPrice } }
        if (categoryFilter) query.category = categoryFilter

        const products = await Product.find(query).limit(4).lean()
        if (products.length > 0) {
          const list = formatProductList(products.map(toClientProduct))
          return jsonResponse({
            response:
              `Search results${categoryFilter ? ` (${categoryFilter})` : ''}${priceRange ? ` (PKR ${minPrice} - ${maxPrice === Number.MAX_SAFE_INTEGER ? '∞' : maxPrice})` : ''}:\n\n${list}${filterNote}`,
            suggestions,
          })
        }
      }

      const fallback = fallbackSearchProducts(lowerMsg).map(toClientProduct)
      if (fallback.length > 0) {
        return jsonResponse({
          response:
            `Search results${categoryFilter ? ` (${categoryFilter})` : ''}${priceRange ? ` (PKR ${minPrice} - ${maxPrice === Number.MAX_SAFE_INTEGER ? '∞' : maxPrice})` : ''}:\n\n${formatProductList(fallback)}${filterNote}`,
          suggestions,
        })
      }

      return jsonResponse({
        response:
          'No matching products found. Try a different category (self-care/accessories) or a different budget (e.g., "under 3500").' + filterNote,
        suggestions,
      })
    }

    // Default Fallback
    return jsonResponse({
      response:
        "I can help with product search, recommendations, order tracking, and cart/checkout actions. What do you want to do?",
      suggestions,
    })

  } catch (error) {
    console.error("Custom Chat API Error:", error)
    // Never hard-fail the chat endpoint: return a safe fallback message.
    return jsonResponse(
      {
        response: "I'm having trouble right now. Please try again in a moment.",
        suggestions: SMART_SUGGESTIONS,
      },
      { status: 200 }
    )
  }
}
