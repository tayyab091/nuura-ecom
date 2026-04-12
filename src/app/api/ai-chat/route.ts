import { NextResponse } from 'next/server'

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
3. For product links: mention "/product/[slug]"
4. If asked about a product, include price in PKR
5. Suggest Nuura products naturally when they fit the conversation
6. For questions outside beauty/skincare, still be helpful but gently redirect
7. Respond in the same language as the user (English or Urdu)
8. Never make up product names or prices
9. If you don't know something specific, admit it honestly

EXAMPLE RESPONSES:
User: "What's a good skincare routine?"
Response: "Start with a gentle cleanser, then moisturize! Our Night Cream (PKR 2200) is perfect for nighttime - it has hyaluronic acid for deep hydration. Use our Rose Quartz Gua Sha daily for better circulation. What's your skin type?"

User: "How long for shipping?"
Response: "Lahore/Karachi/Islamabad: 2-3 days | Other cities: 3-5 days | Free shipping on orders over PKR 5,000! We use TCS & Leopard Couriers. You'll get a tracking number once it ships. 📦"

User: "Can you teach me Python?"
Response: "I'm a beauty expert, not a coding pro! 😄 But I can definitely help with skincare, product recommendations, or anything Nuura-related. What would you like to know about beauty or our products?"

Now respond to the user's question as Noor!`

export async function POST(request: Request) {
  try {
    const { messages, useHuggingFace = true } = await request.json()
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

    const prompt = `${NUURA_SYSTEM_PROMPT}\n\nConversation:\n${conversationText}\n\nNoor:`

    console.log('Calling Hugging Face API...')

    // Prefer a smaller model for reliability on the free inference API.
    const modelUrl = 'https://api-inference.huggingface.co/models/google/flan-t5-base'

    const response = await fetch(modelUrl, {
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 180,
          do_sample: false,
        },
        options: {
          wait_for_model: true,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('HF API error status:', response.status)
      console.error('HF API error body:', errorData)

      // Check if it's a loading error
      if (errorData.includes('currently loading')) {
        return NextResponse.json({
          response: "I'm waking up! Give me a second... 🌙 Please try again in a moment!",
          loading: true,
        })
      }

      // Graceful degradation for rate limits / transient errors.
      if (response.status === 429 || response.status >= 500) {
        return NextResponse.json({
          response:
            "I'm a bit busy right now — can you try again in a moment? If you tell me your skin type + budget, I’ll recommend the best Nuura options.",
          success: false,
          error: `HF transient error (${response.status})`,
        })
      }

      return NextResponse.json({
        response:
          "I couldn't generate a response right now. Try rephrasing your question (for example: 'recommend products under 3000 for acne').",
        success: false,
        error: `HF error (${response.status})`,
      })
    }

    const data = await response.json()
    console.log('HF API response:', data)

    let generatedText = data?.[0]?.generated_text || ''

    // Clean up the response
    generatedText = generatedText
      .replace(prompt, '')
      .replace(/Noor:\s*/g, '')
      .split('User:')[0] // Stop at next user message
      .trim()

    if (!generatedText || generatedText.length < 5) {
      generatedText = "I'm thinking... 🤔 Could you say more about what you need?"
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
        "I'm having a technical moment — please try again in a bit. If you tell me what you're shopping for, I can still help narrow down products.",
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
