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
- Products available: Night Cream (PKR 2200), Rose Quartz Gua Sha, LED Glow Mirror, Mini Chain Crossbody, Silk Pillowcase, Luxury Gift Set, Minimalist Clutch
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
1. Keep responses SHORT and friendly (2-4 sentences max)
2. Be conversational, like a knowledgeable friend
3. When you reference a Nuura product, include price in PKR and a link in the form "/product/<slug>"
4. Only recommend products that appear in the provided catalog context (if any)
5. Respond in the same language as the user (English or Urdu)
6. Never invent product names, prices, stock status, or policies
7. If you don't know something specific, admit it honestly

EXAMPLE RESPONSES:
User: "What's a good skincare routine?"
Response: "Start with a gentle cleanser, then moisturize! Our Night Cream (PKR 2200) is perfect for nighttime - it has hyaluronic acid for deep hydration. Use our Rose Quartz Gua Sha daily for better circulation. What's your skin type?"

User: "How long for shipping?"
Response: "Lahore/Karachi/Islamabad: 2-3 days | Other cities: 3-5 days | Free shipping on orders over PKR 5,000! We use TCS & Leopard Couriers. You'll get a tracking number once it ships. 📦"

User: "Can you teach me Python?"
Response: "I'm a beauty expert, not a coding pro! 😄 But I can definitely help with skincare, product recommendations, or anything Nuura-related. What would you like to know about beauty or our products?"

Now respond to the user's question as Noor!`

function formatCatalog(catalog: CatalogItem[] | undefined) {
  if (!catalog || catalog.length === 0) return ''

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

    // Format messages for Hugging Face
    const formattedMessages = [...messages].slice(-6)
    const conversationText = formattedMessages
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Noor'}: ${m.content}`)
      .join('\n\n')

    const catalogText = formatCatalog(Array.isArray(catalog) ? (catalog as CatalogItem[]) : undefined)

    const prompt = `${NUURA_SYSTEM_PROMPT}${catalogText}\n\nConversation:\n${conversationText}\n\nNoor:`

    console.log('Calling Hugging Face API...')

    // FLAN-T5 is a text2text model and tends to be more reliable on free HF Inference
    const response = await fetch(
      'https://api-inference.huggingface.co/models/google/flan-t5-large',
      {
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 160,
            do_sample: true,
            temperature: 0.7,
            top_p: 0.95,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('HF API error status:', response.status)
      console.error('HF API error body:', errorData)

      // Check if it's a loading/rate-limit error
      if (errorData.includes('currently loading')) {
        return NextResponse.json({
          response: "I'm waking up! Give me a second... 🌙 Please try again in a moment!",
          loading: true,
        })
      }

      if (response.status === 429) {
        return NextResponse.json({
          response: "I'm getting a lot of requests right now. Please try again in a moment 🌿",
          rateLimited: true,
        })
      }

      throw new Error(`HF API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    console.log('HF API response:', data)

    let generatedText = data[0]?.generated_text || ''

    // Clean up the response
    generatedText = generatedText
      .replace(prompt, '')
      .replace(/Noor:\s*/g, '')
      .split('User:')[0] // Stop at next user message
      .trim()

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
