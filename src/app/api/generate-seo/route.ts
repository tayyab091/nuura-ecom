import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, description, category, tags, price } = await req.json()

    if (!name || !description) {
      return NextResponse.json({ error: 'name and description are required' }, { status: 400 })
    }

    const prompt = `You are an SEO expert for a Pakistani luxury e-commerce brand called Nuura that sells self-care and accessories products.

Generate complete SEO metadata for the following product. Return ONLY a valid JSON object with no markdown, no code blocks, no explanation. Just the raw JSON.

Product details:
- Name: ${name}
- Description: ${description}
- Category: ${category}
- Tags: ${Array.isArray(tags) ? tags.join(', ') : tags || 'none'}
- Price: PKR ${price || 'not specified'}

Return this exact JSON structure:
{
  "seoTitle": "...",
  "seoDescription": "...",
  "seoKeywords": "keyword1, keyword2, keyword3, keyword4, keyword5",
  "ogTitle": "...",
  "ogDescription": "..."
}

Rules:
- seoTitle: 50-60 characters, include product name and brand Nuura
- seoDescription: 150-160 characters, compelling, include key benefits
- seoKeywords: 5-8 relevant keywords comma separated, include Pakistani market terms where relevant
- ogTitle: same as seoTitle or slight variation
- ogDescription: 100-150 characters, engaging for social sharing
- All text in English
- Do not include PKR or price in meta tags`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://nuura-temp.vercel.app',
        'X-Title': 'Nuura Admin SEO Generator',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('OpenRouter error:', err)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 })
    }

    // Strip any markdown code blocks if model adds them anyway
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse AI response:', cleaned)
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('generate-seo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
