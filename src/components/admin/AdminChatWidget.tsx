'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, X, Send, Trash2, Bot, User, Loader2 } from 'lucide-react'

const MAX_MESSAGES = 20
const SESSION_KEY = 'nuura_admin_chat'
const COUNTER_KEY = 'nuura_admin_chat_count'

const SYSTEM_PROMPT = `You are the AI admin assistant for Nuura, a luxury e-commerce brand from Pakistan selling self-care and accessories products. You have full access to admin operations.

When you need to perform an action, append a JSON block at the very end of your message using this exact format (nothing after the JSON):

For API calls: {"action":{"type":"api_call","method":"GET","endpoint":"/api/products","body":null,"followUpMessage":"Here are your products:"}}
For navigation: {"action":{"type":"navigate","navigateTo":"/admin/orders"}}
For confirmations: {"action":{"type":"confirm_required","confirmMessage":"Are you sure?","pendingAction":{"type":"api_call","method":"DELETE","endpoint":"/api/products/SLUG","body":null}}}
For text only: {"action":{"type":"none"}}

Available API endpoints:
- GET /api/products?limit=100 — list all products (fields: _id, slug, name, price, stockCount, lowStockThreshold, category, seo, isFeatured, isNewDrop, isBestSeller, inStock)
- POST /api/products — create product (body: name, tagline, description, price, category, stockCount, images[], tags[], seo{title,description,keywords[],ogTitle,ogDescription})
- PATCH /api/products/[slug] — update product by slug (any fields)
- DELETE /api/products/[slug] — delete product by slug
- GET /api/orders — list orders (?status=pending|confirmed|shipped|delivered|cancelled, ?days=7)
- PATCH /api/orders/[id] — update order (body: {status: confirmed|cancelled|shipped|delivered})
- GET /api/customers — list customers
- GET /api/admin/stats?days=7 — analytics (revenue, orderCount, topProducts)

Rules:
- Always be concise. Format lists as markdown tables.
- For low stock: filter products where stockCount <= lowStockThreshold
- For missing SEO: filter products where seo.title is empty or missing
- Never make up data. Only report what APIs return.
- Always confirm before deleting.
- When updating SEO fields use the seo object: {title, description, keywords, ogTitle, ogDescription}
- If you cannot do something via API say exactly where in the dashboard to go.
- For "show products" always use GET /api/products and format as a table with name, price, stock, category columns.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  isLoading?: boolean
  confirmAction?: ParsedAction
  apiResult?: string
}

interface ParsedAction {
  type: 'api_call' | 'navigate' | 'confirm_required' | 'none'
  method?: string
  endpoint?: string
  body?: Record<string, unknown> | null
  navigateTo?: string
  confirmMessage?: string
  pendingAction?: ParsedAction
  followUpMessage?: string
}

function extractAction(text: string): { cleanText: string; action: ParsedAction | null } {
  const match = text.match(/\{"action":\{[\s\S]*?\}\}$/)
  if (!match) return { cleanText: text, action: null }
  try {
    const parsed = JSON.parse(match[0])
    return {
      cleanText: text.slice(0, text.lastIndexOf(match[0])).trim(),
      action: parsed.action as ParsedAction,
    }
  } catch {
    return { cleanText: text, action: null }
  }
}

function formatApiResult(data: unknown): string {
  if (!data) return 'No data returned.'
  if (typeof data === 'string') return data

  // Products list
  if (typeof data === 'object' && data !== null && 'products' in data) {
    const products = (data as { products: Record<string, unknown>[] }).products
    if (!products?.length) return 'No products found.'
    const rows = products
      .slice(0, 20)
      .map(
        (p) =>
          `| ${p.name} | PKR ${p.price} | ${p.stockCount} | ${p.category} |`
      )
    return `| Name | Price | Stock | Category |\n|------|-------|-------|----------|\n${rows.join('\n')}\n\n_Showing ${Math.min(products.length, 20)} of ${products.length} products_`
  }

  // Orders list
  if (typeof data === 'object' && data !== null && 'orders' in data) {
    const orders = (data as { orders: Record<string, unknown>[] }).orders
    if (!orders?.length) return 'No orders found.'
    const rows = orders
      .slice(0, 10)
      .map(
        (o) =>
          `| ${String(o._id).slice(-6)} | ${o.customerName ?? o.email ?? 'N/A'} | PKR ${o.total ?? o.totalAmount ?? 0} | ${o.status} |`
      )
    return `| ID | Customer | Total | Status |\n|----|----------|-------|--------|\n${rows.join('\n')}`
  }

  // Customers list
  if (typeof data === 'object' && data !== null && 'customers' in data) {
    const customers = (data as { customers: Record<string, unknown>[] }).customers
    if (!customers?.length) return 'No customers found.'
    const rows = customers
      .slice(0, 10)
      .map((c) => `| ${c.name ?? c.firstName ?? 'N/A'} | ${c.email} | ${c.orderCount ?? 0} orders |`)
    return `| Name | Email | Orders |\n|------|-------|--------|\n${rows.join('\n')}`
  }

  return JSON.stringify(data, null, 2)
}

export default function AdminChatWidget() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      const count = sessionStorage.getItem(COUNTER_KEY)
      if (saved) setMessages(JSON.parse(saved))
      if (count) setMsgCount(Number(count))
    } catch {
      // ignore
    }
  }, [])

  // Persist to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages))
    } catch {
      // ignore
    }
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const executeApiCall = useCallback(async (action: ParsedAction): Promise<string> => {
    try {
      const res = await fetch(action.endpoint!, {
        method: action.method ?? 'GET',
        headers: action.body ? { 'Content-Type': 'application/json' } : undefined,
        body: action.body ? JSON.stringify(action.body) : undefined,
      })
      const data = await res.json()
      if (!res.ok) return `Error: ${data.error ?? 'Request failed'}`
      return formatApiResult(data)
    } catch {
      return 'Network error — could not complete the request.'
    }
  }, [])

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || loading || msgCount >= MAX_MESSAGES) return

    const newCount = msgCount + 1
    setMsgCount(newCount)
    sessionStorage.setItem(COUNTER_KEY, String(newCount))

    const userMsg: ChatMessage = { role: 'user', content: userText }
    const loadingMsg: ChatMessage = { role: 'assistant', content: '', isLoading: true }

    setMessages((prev) => [...prev, userMsg, loadingMsg])
    setInput('')
    setLoading(true)

    try {
      // Build conversation history for the API (exclude loading/confirm UI messages)
      const history = [...messages, userMsg]
        .filter((m) => !m.isLoading)
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/admin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          system: SYSTEM_PROMPT,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages((prev) =>
          prev.slice(0, -1).concat({
            role: 'assistant',
            content: "I couldn't process that request. Please try again.",
          })
        )
        return
      }

      const rawContent: string =
        data.content?.[0]?.text ??
        data.message ??
        data.response ??
        data.text ??
        ''

      const { cleanText, action } = extractAction(rawContent)

      if (action?.type === 'navigate' && action.navigateTo) {
        setMessages((prev) =>
          prev.slice(0, -1).concat({
            role: 'assistant',
            content: cleanText || `Taking you to ${action.navigateTo}...`,
          })
        )
        setTimeout(() => router.push(action.navigateTo!), 500)
        return
      }

      if (action?.type === 'confirm_required') {
        setMessages((prev) =>
          prev.slice(0, -1).concat({
            role: 'assistant',
            content: cleanText || action.confirmMessage || 'Are you sure?',
            confirmAction: action,
          })
        )
        return
      }

      if (action?.type === 'api_call' && action.endpoint) {
        setMessages((prev) =>
          prev.slice(0, -1).concat({
            role: 'assistant',
            content: cleanText || 'Fetching data...',
            isLoading: true,
          })
        )
        const result = await executeApiCall(action)
        setMessages((prev) =>
          prev.slice(0, -1).concat({
            role: 'assistant',
            content: `${cleanText ? cleanText + '\n\n' : ''}${action.followUpMessage ? action.followUpMessage + '\n\n' : ''}${result}`,
          })
        )
        return
      }

      setMessages((prev) =>
        prev.slice(0, -1).concat({
          role: 'assistant',
          content: cleanText || rawContent || 'Done.',
        })
      )
    } catch {
      setMessages((prev) =>
        prev.slice(0, -1).concat({
          role: 'assistant',
          content: "Something went wrong. Please try again.",
        })
      )
    } finally {
      setLoading(false)
    }
  }, [messages, loading, msgCount, executeApiCall, router])

  async function handleConfirm(msg: ChatMessage, confirmed: boolean) {
    if (!confirmed) {
      setMessages((prev) =>
        prev.map((m) =>
          m === msg ? { ...m, confirmAction: undefined, content: m.content + '\n\n_Action cancelled._' } : m
        )
      )
      return
    }
    const action = msg.confirmAction?.pendingAction
    if (!action) return
    setMessages((prev) =>
      prev.map((m) =>
        m === msg ? { ...m, confirmAction: undefined, isLoading: true } : m
      )
    )
    const result = await executeApiCall(action)
    setMessages((prev) =>
      prev.map((m) =>
        m === msg ? { ...m, isLoading: false, content: m.content + '\n\n' + result } : m
      )
    )
  }

  function clearChat() {
    setMessages([])
    setMsgCount(0)
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(COUNTER_KEY)
  }

  function renderContent(content: string) {
    // Simple markdown table renderer
    const lines = content.split('\n')
    const elements: React.ReactNode[] = []
    let tableLines: string[] = []

    const flushTable = (key: string) => {
      if (!tableLines.length) return
      const rows = tableLines.filter((l) => !l.match(/^\|[-| ]+\|$/))
      elements.push(
        <div key={key} className="overflow-x-auto my-2">
          <table className="text-xs w-full border-collapse">
            {rows.map((row, ri) => {
              const cells = row.split('|').filter((_, i, a) => i > 0 && i < a.length - 1)
              return (
                <tr key={ri} className={ri === 0 ? 'bg-white/10' : ''}>
                  {cells.map((cell, ci) => (
                    <td key={ci} className="border border-white/20 px-2 py-1 whitespace-nowrap">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              )
            })}
          </table>
        </div>
      )
      tableLines = []
    }

    lines.forEach((line, i) => {
      if (line.startsWith('|')) {
        tableLines.push(line)
      } else {
        if (tableLines.length) flushTable(`table-${i}`)
        if (line.trim()) {
          elements.push(
            <p key={i} className="mb-1 leading-relaxed">
              {line.replace(/^_(.+)_$/, '$1')}
            </p>
          )
        }
      }
    })
    if (tableLines.length) flushTable('table-end')

    return elements
  }

  const limitReached = msgCount >= MAX_MESSAGES

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-n-forest text-n-cream rounded-full shadow-lg flex items-center justify-center hover:bg-n-gold hover:text-n-forest transition-all duration-200 hover:scale-110"
        title="Admin Assistant"
      >
        {open ? <X size={20} strokeWidth={1.5} /> : <MessageCircle size={20} strokeWidth={1.5} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-[#1a1f1c] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-n-forest/20">
            <div className="flex items-center gap-2">
              <Bot size={16} strokeWidth={1.5} className="text-n-gold" />
              <span className="font-sans text-xs tracking-widest uppercase text-white">
                Admin Assistant
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-sans text-[10px] ${limitReached ? 'text-red-400' : 'text-white/50'}`}>
                {msgCount}/{MAX_MESSAGES}
              </span>
              <button
                onClick={clearChat}
                className="text-white/40 hover:text-white/80 transition-colors"
                title="Clear chat"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot size={32} strokeWidth={1} className="text-white/20 mx-auto mb-3" />
                <p className="font-sans text-xs text-white/40">
                  Ask me anything about your store.
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    'Show me all products',
                    'Which products are low on stock?',
                    'Show me pending orders',
                    'What is my revenue this week?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendMessage(suggestion)}
                      className="block w-full text-left font-sans text-[10px] text-white/50 hover:text-white/80 border border-white/10 hover:border-white/30 px-3 py-2 rounded-lg transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
                    msg.role === 'user' ? 'bg-n-forest' : 'bg-n-gold/20'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User size={12} strokeWidth={1.5} className="text-white" />
                  ) : (
                    <Bot size={12} strokeWidth={1.5} className="text-n-gold" />
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 font-sans text-xs ${
                    msg.role === 'user'
                      ? 'bg-n-forest text-white rounded-tr-sm'
                      : 'bg-white/5 text-white/90 rounded-tl-sm'
                  }`}
                >
                  {msg.isLoading ? (
                    <div className="flex gap-1 items-center py-1">
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  ) : (
                    <>
                      {renderContent(msg.content)}
                      {msg.confirmAction && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleConfirm(msg, true)}
                            className="bg-red-500/80 hover:bg-red-500 text-white px-3 py-1 rounded font-sans text-[10px] tracking-wider uppercase transition-colors"
                          >
                            Yes, do it
                          </button>
                          <button
                            onClick={() => handleConfirm(msg, false)}
                            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded font-sans text-[10px] tracking-wider uppercase transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10">
            {limitReached ? (
              <p className="font-sans text-[10px] text-red-400 text-center py-2">
                Session limit reached. Refresh to start a new session.
              </p>
            ) : (
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                  placeholder="Ask anything about your store..."
                  disabled={loading}
                  className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs font-sans px-3 py-2 rounded-lg focus:outline-none focus:border-n-gold/50 disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 bg-n-forest hover:bg-n-gold text-white hover:text-n-forest rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {loading ? (
                    <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                  ) : (
                    <Send size={14} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
