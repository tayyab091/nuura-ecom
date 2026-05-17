import { NextResponse } from 'next/server'

type Incoming = { messages: Array<{ role: string; content: string }> }

export async function POST(req: Request) {
  try {
    const body: Incoming = await req.json()
    const apiKey = process.env.CLAUDE_API_KEY
    const model = 'claude-haiku-4-5'

    // Basic server-side rate/logging — log timestamp and approximate token usage
    const timestamp = new Date().toISOString()
    const approxTokens = body.messages.map(m => Math.ceil(m.content.length / 4)).reduce((a,b) => a+b, 0)
    console.log(`[admin-chat] ${timestamp} - messages=${body.messages.length} approxTokens=${approxTokens}`)

    if (!apiKey) {
      // No key configured — return a safe fallback response
      return NextResponse.json({ text: 'Admin assistant is not configured on this instance.' }, { status: 200 })
    }

    // Forward to Anthropic (basic example). Caller must set CLAUDE_API_KEY in env.
    const systemPrompt = `You are an admin assistant for the Nuura e-commerce dashboard. You help the admin manage products, view orders, check analytics, and navigate the dashboard. Be concise. When asked to navigate, respond with a JSON action like {"action": "navigate", "path": "/admin/orders"}. When asked for data summaries, use the provided store data. Never discuss topics unrelated to the admin dashboard.`

    const payload = {
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...body.messages.map(m => ({ role: m.role, content: m.content }))],
      max_tokens: 500,
    }

    const res = await fetch('https://api.anthropic.com/v1/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => 'failed')
      console.error('[admin-chat] upstream error', res.status, text)
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
    }

    const data = await res.json().catch(() => null)
    const reply = data?.completion ?? data?.output ?? JSON.stringify(data)

    console.log(`[admin-chat] response tokens approx=${Math.ceil((String(reply).length)/4)}`)

    return NextResponse.json({ text: String(reply) })
  } catch (err) {
    console.error('admin-chat failed', err)
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}
