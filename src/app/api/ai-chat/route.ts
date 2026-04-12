import { NextResponse } from 'next/server'

type CatalogItem = {
  slug: string
  name: string
  price: number
  comparePrice?: number
  tagline?: string
  category?: string
  inStock?: boolean
}

const NUURA_SYSTEM_PROMPT = `You are Noor, Nuura's intelligent AI beauty assistant for a Pakistani e-commerce brand.

IMPORTANT CONTEXT:
- Brand: Nuura ("Glow in your own light")
- Products: Only use products explicitly provided in the NUURA CATALOG context (names/prices/slugs/stock).
- Location: Pakistan
- Languages: English & Urdu
- Website: nuura-temp.vercel.app
- WhatsApp: @nuura.pk

YOUR ROLE:
You are knowledgeable, friendly, warm, and helpful. You help with:
- Product recommendations (suggest Nuura products when relevant)
- Skincare advice & routines
- Beauty tips
- Order tracking, shipping, returns
- Payment options (COD, JazzCash, EasyPaisa)
- General questions

RULES:
1. Keep responses SHORT and friendly (2-5 sentences max)
2. Be conversational, like a knowledgeable friend
3. Do NOT paste or summarize the catalog as a list. Never dump multiple product entries.
4. If you recommend products, recommend AT MOST ONE Nuura product unless the user explicitly asks for multiple options.
5. When you reference a Nuura product, include price in PKR and a link in the form "/product/<slug>"
6. Only recommend products that appear in the provided catalog context
7. Respond in the same language as the user (English or Urdu)
8. Never invent product names, prices, stock status, or policies
9. If you don't know something specific, admit it honestly
10. If the NUURA CATALOG is not provided or is empty, do NOT name any Nuura products or prices — ask the user to browse /shop or tell you what they want.

EXAMPLE RESPONSES:
User: "What's a good skincare routine?"
Response: "Start with a gentle cleanser, then moisturize! If you want one easy add-on, our Night Cream (PKR 2200) is great for nighttime hydration: /product/night-cream. What’s your skin type (oily/dry/combination)?"

User: "How long for shipping?"
Response: "Lahore/Karachi/Islamabad: 2-3 days | Other cities: 3-5 days | Free shipping on orders over PKR 5,000! We use TCS & Leopard Couriers. You'll get a tracking number once it ships. 📦"

User: "Can you teach me Python?"
Response: "I'm a beauty expert, not a coding pro! 😄 But I can definitely help with skincare, product recommendations, or anything Nuura-related. What would you like to know about beauty or our products?"

Now respond to the user's question as Noor!`

function formatCatalog(catalog: CatalogItem[] | undefined) {
  if (!catalog || catalog.length === 0) {
    return `\n\nNUURA CATALOG: (not provided)`
  }

  const lines = catalog.slice(0, 10).map((p) => {
    const stock = typeof p.inStock === 'boolean' ? (p.inStock ? 'in stock' : 'out of stock') : 'stock unknown'
    const compare = p.comparePrice ? ` (was PKR ${p.comparePrice})` : ''
    const tagline = p.tagline ? ` — ${p.tagline}` : ''
    return `- ${p.name} — PKR ${p.price}${compare} — slug: ${p.slug} — ${stock}${tagline}`
  })

  return `\n\nNUURA CATALOG (use EXACT names/prices/slugs below; do not invent):\n${lines.join('\n')}`
}

export async function POST(request: Request) {
  try {
    const { messages, useHuggingFace = true, catalog } = await request.json()
    const hfToken = process.env.HUGGINGFACE_TOKEN

    console.log('AI Chat request received. HF Token exists:', !!hfToken)

    if (!hfToken || !useHuggingFace) {
      console.error('No HF token or useHuggingFace is false')
      return NextResponse.json({
        response: "I'm having a technical moment! Please try again or WhatsApp us @nuura.pk 🌿",
        error: 'No HF token available',
      })
    }

    const formattedMessages = Array.isArray(messages) ? [...messages].slice(-8) : []
    const catalogText = formatCatalog(Array.isArray(catalog) ? (catalog as CatalogItem[]) : undefined)

    // Hugging Face Inference Router provides an OpenAI-compatible chat endpoint.
    // Docs: https://huggingface.co/docs/inference-providers/index
    const primaryModel = process.env.HF_CHAT_MODEL || process.env.HUGGINGFACE_CHAT_MODEL
    const candidateModels = [
      primaryModel,
      'deepseek-ai/DeepSeek-R1:fastest',
      'Qwen/Qwen2.5-7B-Instruct:fastest',
      'microsoft/Phi-3.5-mini-instruct:fastest',
    ].filter(Boolean) as string[]

    const chatMessages = [
      {
        role: 'system',
        content: `${NUURA_SYSTEM_PROMPT}${catalogText}`,
      },
      ...formattedMessages.map((m: any) => ({
        role: m?.role === 'assistant' ? 'assistant' : 'user',
        content: String(m?.content ?? ''),
      })),
    ]

    console.log('Calling Hugging Face Router (chat completions)...')

    let generatedText = ''
    let lastError: string | undefined

    for (const model of candidateModels) {
      try {
        const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
          headers: {
            Authorization: `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            model,
            messages: chatMessages,
            stream: false,
            max_tokens: 220,
            temperature: 0.7,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          lastError = `HF Router error: ${response.status} - ${errorText}`

          // These are not model-specific; return immediately.
          if (response.status === 429) {
            return NextResponse.json({
              response: "I'm getting a lot of requests right now. Please try again in a moment 🌿",
              rateLimited: true,
            })
          }

          if (response.status === 503 || errorText.toLowerCase().includes('loading')) {
            return NextResponse.json({
              response: "I'm waking up! Give me a second... 🌙 Please try again in a moment!",
              loading: true,
            })
          }

          // Try the next model.
          continue
        }

        const data = await response.json()

        // OpenAI-compatible response: { choices: [{ message: { content: "..." } }] }
        const content = data?.choices?.[0]?.message?.content
        if (typeof content === 'string') {
          generatedText = content.trim()
        } else {
          generatedText = ''
        }

        // Some models/providers may return a 200 with an error payload.
        if (!generatedText && data?.error) {
          lastError = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
          continue
        }

        if (generatedText) break
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e)
      }
    }

    if (!generatedText && lastError) {
      console.error('HF Router final error:', lastError)
    }

    const catalogProvided = Array.isArray(catalog) && (catalog as CatalogItem[]).length > 0

    // Guardrail: if we have no catalog, do not allow any product/price/link claims.
    if (!catalogProvided && generatedText) {
      const keep = generatedText
        .split(/(?<=[.!?۔])\s+/)
        .filter((s) => {
          const t = s.trim()
          if (!t) return false
          if (/\bPKR\b/i.test(t)) return false
          if (t.includes('/product/')) return false
          return true
        })
        .join(' ')
        .trim()

      generatedText = keep
    }

    if (!generatedText || generatedText.length < 5) {
      generatedText = "Could you tell me a bit more (your skin type + what you're targeting)? I’ll recommend the best Nuura option."
    }

    // Limit to max 2-3 sentences
    const sentences = generatedText.split(/[.!?]+/).filter((s: string) => s.trim())
    if (sentences.length > 3) {
      generatedText = sentences.slice(0, 3).join('. ') + '.'
    }

    console.log('Final response:', generatedText)

    return NextResponse.json({
      response: generatedText,
      success: true,
    })
  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json({
      response:
        "I’m having trouble connecting to the AI right now. Please try again in a moment — or tell me what you’re looking for (acne, glow, dryness, dark circles) and I’ll guide you. 🌿",
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
