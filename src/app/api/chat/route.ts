import { NextResponse } from 'next/server'

const NUURA_CONTEXT = `You are Noor, the AI beauty assistant for Nuura — a premium Pakistani women's e-commerce brand.

BRAND: Nuura — "Glow in your own light"
WEBSITE: nuura-temp.vercel.app
INSTAGRAM: @nuura.pk

You help customers find products, answer questions about skincare, shipping, payments, and more. Be friendly and concise.

RULES:
- Keep responses SHORT (2-4 sentences max)
- Be warm, friendly, like a knowledgeable friend
- Respond in the same language as the user (Urdu or English)
- For product links, say "You can view it at /product/[slug]"
- Never make up prices or products`

const FALLBACK_RESPONSES: Record<string, string> = {
  default: "I'd love to help! Ask me about our products, skincare tips, shipping, or payments ✨",
  error: "I'm having a moment! Please try again or WhatsApp us @nuura.pk for instant help 🌿",
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()
    const apiKey = process.env.GEMINI_API_KEY

    // If no API key or using placeholder values, return helpful fallback
    if (!apiKey || apiKey === 'your_gemini_key_here' || apiKey.includes('placeholder')) {
      return NextResponse.json({
        response: FALLBACK_RESPONSES.default,
        fallback: true,
      })
    }

    // Call Gemini API
    const geminiMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: NUURA_CONTEXT }] },
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Gemini API error: ${response.status}`, errorData)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!text) {
      console.warn('Gemini returned empty response')
      return NextResponse.json({ response: FALLBACK_RESPONSES.default, fallback: true })
    }

    return NextResponse.json({ response: text, fallback: false })
  } catch (error) {
    console.error('Chat API error:', error)
    // Return fallback response on any error
    return NextResponse.json({ response: FALLBACK_RESPONSES.error, fallback: true })
  }
}
