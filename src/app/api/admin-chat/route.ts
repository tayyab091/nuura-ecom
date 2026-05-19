import { NextResponse, NextRequest } from 'next/server'
import { headers } from 'next/headers'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: Message[]
  context?: {
    productCount?: number
    orderCount?: number
    lowStockCount?: number
  }
}

async function getAdminContext() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const adminKey = process.env.ADMIN_SECRET_KEY || 'nuura-admin-secret-key-2025'
    // Fetch products summary, low stock count, and orders summary
    let productData = { total: 0, lowStock: 0 }
    let orderData = { total: 0, pending: 0 }
    try {
      const [pRes, oRes, settingsRes] = await Promise.all([
        fetch(`${baseUrl}/api/products?limit=1000`, { headers: { 'x-admin-key': adminKey }, cache: 'no-store' }),
        fetch(`${baseUrl}/api/orders`, { headers: { 'x-admin-key': adminKey }, cache: 'no-store' }),
        fetch(`${baseUrl}/api/admin/settings`, { headers: { 'x-admin-key': adminKey }, cache: 'no-store' }),
      ])

      const products = pRes.ok ? await pRes.json() : []
      productData.total = Array.isArray(products) ? products.length : 0

      const orders = oRes.ok ? await oRes.json() : []
      orderData.total = Array.isArray(orders) ? orders.length : 0
      orderData.pending = Array.isArray(orders) ? orders.filter((o: any) => o.status === 'pending').length : 0

      const settings = settingsRes.ok ? await settingsRes.json() : { lowStockThreshold: 10 }
      const threshold = Number(settings?.lowStockThreshold ?? 10)
      productData.lowStock = Array.isArray(products) ? products.filter((p: any) => Number(p.quantity ?? 0) < threshold).length : 0
    } catch (e) {
      // ignore and return best-effort context
    }

    return { productData, orderData }
  } catch {
    return { productData: { total: 0, lowStock: 0 }, orderData: { total: 0, pending: 0 } }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, system }: { messages: { role: string; content: string }[]; system?: string } = await req.json()
    const apiKey = process.env.ANTHROPIC_API_KEY
    const model = 'claude-haiku-4-5'

    const timestamp = new Date().toISOString()
    const approxInputTokens = (messages ?? []).reduce((sum, m) => sum + Math.ceil((m.content || '').length / 4), 0)

    if (!apiKey) {
      return NextResponse.json(
        { text: 'Admin assistant is not configured. Set ANTHROPIC_API_KEY.' },
        { status: 200 }
      )
    }

    const adminContext = await getAdminContext()

    const systemPrompt = `You are the AI admin assistant for Nuura, an e-commerce dashboard. You ARE the admin — not a navigator. You have full programmatic access to every admin operation through APIs. Your job is to execute what the admin asks, in natural English.

PRODUCT OPERATIONS:
- GET /api/products?limit=1000 — returns full product list (fields: _id, slug, name, price, stockCount, category, description, seo, isFeatured, isNewDrop, rating, tagline)
- POST /api/products — create product. Body: { name, tagline, description, price, category, stockCount, seo: { title, description, keywords } }
- PATCH /api/products/[slug] — update any fields. Body: { stockCount, price, seo, name, description, category, ... }
- DELETE /api/products/[slug] — delete product
- GET /api/products/[slug] — get single product

SEO/META TAGS:
- Update via PATCH: { seo: { title: "...", description: "...", keywords: [...] } }
- Clear via PATCH: { seo: null }

ORDER OPERATIONS:
- GET /api/orders — list orders (fields: _id, orderNumber, customer, items, orderStatus, paymentStatus, total, createdAt)
- PATCH /api/admin/orders/[id] — update status. Body: { orderStatus: 'pending'|'confirmed'|'cancelled'|'shipped'|'delivered' }
- GET /api/admin/orders/[id] — get single order

CUSTOMER OPERATIONS:
- GET /api/customers — list all customers (fields: email, name, joinDate, totalOrders: orderCount, totalSpent)
- GET /api/admin/customers/[email] — get single customer profile

ANALYTICS & REPORTING:
- GET /api/admin/stats?days=7 — returns { totalOrders, confirmedRevenue, recentOrders[], topProducts[], ordersByDay[], revenueByDay[], paymentMix[] }
- GET /api/admin/settings — returns { lowStockThreshold, ... }

INVENTORY MANAGEMENT:
- Use PATCH /api/products/[slug] { stockCount: N } to set stock directly
- Filter low stock by comparing stockCount <= lowStockThreshold from settings
- Mark alert as reviewed using chat state (no API needed)

CURRENT STORE STATE (use to answer 'how many...'):
- Total Products: ${adminContext.productData.total}
- Low Stock Products: ${adminContext.productData.lowStock}
- Total Orders: ${adminContext.orderData.total}
- Pending Orders: ${adminContext.orderData.pending}

RESPONSE CONTRACT:
Append a JSON action block at END of message (no text after). Structure:
{ "action": { "type": "api_call"|"confirm_required"|"navigate"|"none", ... } }

FOR API CALLS:
{"action":{"type":"api_call","method":"GET","endpoint":"/api/products?limit=100","followUpMessage":"Here are your products."}}

FOR CONFIRMATIONS (destructive only):
{"action":{"type":"confirm_required","confirmMessage":"Delete this product? This cannot be undone.","pendingAction":{"type":"api_call","method":"DELETE","endpoint":"/api/products/silk-scarf"}}}

FOR NAVIGATION:
{"action":{"type":"navigate","navigateTo":"/admin/analytics"}}

FOR TEXT ONLY:
{"action":{"type":"none"}}

KEY BEHAVIORS:
1. Products endpoint slug parameter is the product slug (not _id). Use the slug from the product list.
2. For "show me" requests: GET the data, then format as a markdown table or bullet list in your response, then do {"action":{"type":"none"}}.
3. For multi-step adds (product creation): Ask for each field one-by-one. Collect all before POST. For required fields: name, tagline, description, price, category, stockCount.
4. For quantity/price updates: Use PATCH directly with the single field. Confirm success.
5. For deletes/cancels: Always ask confirmation first with confirmMessage.
6. For analytics: Fetch /api/admin/stats, then analyze and format the response. Show trends, top performers, totals.
7. For low stock: List all products where stockCount < threshold. Show current stock vs threshold.
8. For missing meta tags: GET /api/products, filter where seo is empty/missing, return list.
9. For bulk updates: Iterate via API calls and report progress. Example: "Updated 5 of 12 products. 7 remaining..."
10. Never make up data. Only report what the API returns.
11. If an action cannot be done via API (e.g., image upload), say so and direct to dashboard: "Image upload requires the dashboard. Go to /admin/products > Edit Product."
12. Use relative dates: "today", "this week", "this month" when querying or reporting.
13. Be concise: 1-2 sentences per message. Let tables speak for themselves.
`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        messages: [ ...(messages ?? []).map(m => ({ role: m.role, content: m.content })) ],
        system: system ?? systemPrompt,
      }),
    })

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error')
      console.error('[admin-chat] Claude API error:', response.status, error)
      return NextResponse.json(
        { text: 'I encountered an error. Please try again.' },
        { status: 200 }
      )
    }

    const data = await response.json()
    const textContent = data.content?.[0]?.text ?? 'No response generated'

    const approxOutputTokens = Math.ceil(textContent.length / 4)
    console.log(`[admin-chat] ${timestamp} - input=${approxInputTokens} output=${approxOutputTokens} totalMessages=${(messages ?? []).length}`)

    return NextResponse.json({ text: textContent })
  } catch (err) {
    console.error('[admin-chat] error:', err)
    return NextResponse.json(
      { text: 'I encountered an error. Please try again.' },
      { status: 200 }
    )
  }
}
