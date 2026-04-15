'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, X, Send, Sparkles,
  ShoppingBag, ChevronRight
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import type { Product } from '@/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CHAT_STORAGE_KEY = 'nuura-noor-chat-v1'

function cleanDisplayText(input: unknown): string {
  const t = String(input ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\r\n/g, '\n')
    .trim()
  return t
}

function looksCorruptedText(t: string): boolean {
  if (!t) return false
  if (t.length > 8000) return true
  if (/[\uFFFD]/.test(t)) return true
  if (/<\s*\/?\s*(?:html|head|body|template|script|style)\b/i.test(t)) return true
  if (/(?:\.{3,}|…{6,}|—{6,})/.test(t) && t.length > 400) return true
  return false
}

function isValidRole(role: unknown): role is Msg['role'] {
  return role === 'user' || role === 'bot'
}

function safeMsgFromStorage(m: unknown): Msg | null {
  if (!m || typeof m !== 'object') return null
  const anyM = m as Partial<Msg>
  if (!isValidRole(anyM.role)) return null
  const text = cleanDisplayText(anyM.text)
  if (!text) return null
  if (looksCorruptedText(text)) return null

  return {
    id: typeof anyM.id === 'string' ? anyM.id : `${anyM.role}_${Date.now()}`,
    role: anyM.role,
    text,
    type: anyM.type,
    replies: Array.isArray(anyM.replies) ? anyM.replies.map(String).slice(0, 12) : undefined,
    isAI: Boolean(anyM.isAI),
    // Intentionally do not hydrate heavy fields (products/order) from storage.
  }
}

const C = {
  forest: '#1B2E1F', cream: '#F5F0E6', gold: '#D4A853',
  goldLight: '#E8C97A', white: '#FAFAF8', offwhite: '#F0EBE3',
  ink: '#0F1A11', muted: '#6B7B6E', border: '#DDD8CF',
}

const STATUS_MAP: Record<string,{label:string;icon:string;color:string}> = {
  pending_verification: { label:'Awaiting Payment', icon:'⏳', color:'#B8860B' },
  confirmed: { label:'Order Confirmed', icon:'✅', color:'#166534' },
  processing: { label:'Being Prepared', icon:'🔄', color:'#1d4ed8' },
  shipped: { label:'Out for Delivery', icon:'🚚', color:'#7c3aed' },
  delivered: { label:'Delivered', icon:'🎉', color:'#065f46' },
  cancelled: { label:'Cancelled', icon:'❌', color:'#991b1b' },
}

type CartContextItem = { productId: string; slug: string; name: string; price: number; quantity: number }

type ApiAction =
  | { type: 'OPEN_CART' }
  | { type: 'GO_TO_CHECKOUT' }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_COUPON'; code: string }
  | { type: 'ADD_TO_CART'; product: Product }
  | { type: 'REMOVE_FROM_CART'; productId?: string; query?: string }

type ApiOrderTimelineStep = { key: string; label: string; done: boolean; current: boolean }
type ApiOrder = {
  orderNumber: string
  orderStatus: string
  paymentStatus: string
  paymentMethod: string
  total: number
  items: Array<{ name: string; quantity: number; price: number; image?: string }>
  createdAt: string
  timeline: ApiOrderTimelineStep[]
  etaText: string
}

type ApiResponse = {
  response: string
  products?: Product[]
  order?: ApiOrder
  action?: ApiAction
  suggestions?: string[]
  fallback?: boolean
  source?: 'db' | 'openrouter' | 'fallback'
}
interface Msg {
  id: string
  role: 'user' | 'bot'
  text: string
  type?: 'text' | 'products' | 'order' | 'replies'
  products?: Product[]
  order?: ApiOrder
  replies?: string[]
  isAI?: boolean
}

const QUICK_REPLIES = [
  { label:'🌿 All Products', msg:'show all products' },
  { label:'⭐ Best Sellers', msg:'show best sellers' },
  { label:'✨ New Arrivals', msg:'show new arrivals' },
  { label:'💅 Self-Care', msg:'show self-care products' },
  { label:'👜 Accessories', msg:'show accessories' },
  { label:'📦 Track Order', msg:'track my order' },
  { label:'🚚 Shipping Info', msg:'shipping info' },
  { label:'↩️ Returns', msg:'return policy' },
  { label:'💳 Payment', msg:'payment methods' },
  { label:'🛒 My Cart', msg:'view my cart' },
  { label:'🎁 Coupons', msg:'discount codes' },
  { label:'✨ Skincare Tips', msg:'morning skincare routine' },
]

export function NuuraChatbot() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [cartBump, setCartBump] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const [suggestions, setSuggestions] = useState<string[]>(QUICK_REPLIES.map(q => q.msg))
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const cartStore = useCartStore()

  // Restore chat history across route changes/reloads.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHAT_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        msgs?: unknown
        history?: unknown
        showReplies?: unknown
      }

      const restoredMsgs: Msg[] = Array.isArray(parsed.msgs)
        ? (parsed.msgs as unknown[])
            .map(safeMsgFromStorage)
            .filter(Boolean) as Msg[]
        : []

      const restoredHistory: Array<{ role: 'user' | 'assistant'; content: string }> = Array.isArray(parsed.history)
        ? (parsed.history as Array<{ role?: unknown; content?: unknown }>).flatMap((h) => {
            const role = h?.role
            const content = cleanDisplayText(h?.content)
            if ((role !== 'user' && role !== 'assistant') || !content || looksCorruptedText(content)) return []
            return [{ role: role as 'user' | 'assistant', content }]
          })
        : []

      if (restoredMsgs.length > 0) setMsgs(restoredMsgs)
      if (restoredHistory.length > 0) setConversationHistory(restoredHistory)
      if (typeof parsed.showReplies === 'boolean') setShowReplies(parsed.showReplies)

      // If storage payload looks bad (e.g. everything got filtered), reset it.
      if (Array.isArray(parsed.msgs) && restoredMsgs.length === 0) {
        sessionStorage.removeItem(CHAT_STORAGE_KEY)
      }
    } catch {
      try {
        sessionStorage.removeItem(CHAT_STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify({
          msgs: msgs.slice(-50),
          history: conversationHistory.slice(-30),
          showReplies,
        })
      )
    } catch {
      // ignore
    }
  }, [msgs, conversationHistory, showReplies])

  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{
        id: 'init',
        role: 'bot',
        text: "Hi! I'm Noor, your Nuura beauty assistant ✨\n\nI can search products, recommend based on your cart/views, track your order, and help with checkout. What would you like?",
        type: 'replies',
        replies: ['Show all products','Show best sellers','Track my order','View cart'],
        isAI: false,
      }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [msgs, loading])

  const addToCart = useCallback((product: Product) => {
    cartStore.addItem(product)
    cartStore.openCart()
    setCartBump(true)
    setTimeout(() => setCartBump(false), 600)
  }, [cartStore])

  function addBotMsg(partial: Partial<Msg>) {
    setMsgs(prev => [...prev, {
      id: `bot_${Date.now()}`,
      role: 'bot',
      text: '',
      ...partial,
    }])
  }

  const buildContext = useCallback((): { cart: CartContextItem[]; recentlyViewedSlugs: string[] } => {
    const cart: CartContextItem[] = cartStore.items.map((i) => ({
      productId: i.product._id,
      slug: i.product.slug,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
    }))

    let recentlyViewedSlugs: string[] = []
    try {
      const raw = localStorage.getItem('nuura-chat-recent')
      recentlyViewedSlugs = raw ? (JSON.parse(raw) as string[]).filter(Boolean) : []
    } catch {
      recentlyViewedSlugs = []
    }

    return { cart, recentlyViewedSlugs }
  }, [cartStore.items])

  const callChatApi = useCallback(async (userMessage: string, history: Array<{role:'user'|'assistant';content:string}>): Promise<ApiResponse | null> => {
    const payload = {
      messages: [
        ...history.slice(-8),
        { role: 'user' as const, content: userMessage },
      ],
      context: buildContext(),
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) return null
      return (await response.json()) as ApiResponse
    } catch {
      return null
    }
  }, [buildContext])

  const callSuggestions = useCallback(async (partial: string) => {
    const q = partial.trim()
    if (q.length < 2) return
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, suggestOnly: true }),
      })
      if (!res.ok) return
      const data = (await res.json()) as { suggestions?: string[] }
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const q = input.trim()
    if (q.length < 2) return
    const t = setTimeout(() => {
      callSuggestions(q)
    }, 250)
    return () => clearTimeout(t)
  }, [input, callSuggestions])

  const send = useCallback(async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setShowReplies(false)

    // Add user message
    const userMsg: Msg = { id:`user_${Date.now()}`, role:'user', text:msg }
    setMsgs(prev => [...prev, userMsg])
    setLoading(true)

    const newHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory,
      { role: 'user', content: msg },
    ]
    setConversationHistory(newHistory)

    try {
      await new Promise(r => setTimeout(r, 800 + Math.random()*500))

      const data = await callChatApi(msg, newHistory)
      if (!data?.response) {
        addBotMsg({
          text: "I'm not sure about that right now. Try asking about products, tracking an order, or your cart.",
          type: 'replies',
          replies: ['Show all products', 'Track my order', 'View cart'],
        })
        setLoading(false)
        return
      }

      const botMsg: Msg = {
        id: `bot_${Date.now()}`,
        role: 'bot',
        text: cleanDisplayText(data.response),
        type: data.products?.length ? 'products' : data.order ? 'order' : 'text',
        products: data.products,
        order: data.order,
        replies: data.suggestions?.slice(0, 8),
        isAI: data.source === 'openrouter',
      }

      if (looksCorruptedText(botMsg.text)) {
        addBotMsg({
          text: "Sorry — I got a garbled response. Please try again.",
          type: 'replies',
          replies: ['Show best sellers', 'Show new arrivals', 'Show all products'],
        })
        setLoading(false)
        return
      }

      setMsgs(prev => [...prev, botMsg])
      setConversationHistory(prev => [...prev, { role:'assistant', content:data.response }])

      const action = data.action
      if (action) {
        setTimeout(() => {
          switch (action.type) {
            case 'OPEN_CART':
              cartStore.openCart()
              return
            case 'GO_TO_CHECKOUT':
              cartStore.openCart()
              router.push('/checkout')
              return
            case 'CLEAR_CART':
              cartStore.clearCart()
              return
            case 'APPLY_COUPON':
              addBotMsg({
                text: `Coupon applied in chat: ${String(action.code).toUpperCase()} (use at checkout).`,
                type: 'replies',
                replies: ['Go to checkout', 'View cart'],
              })
              return
            case 'ADD_TO_CART':
              cartStore.addItem(action.product)
              cartStore.openCart()
              setCartBump(true)
              setTimeout(() => setCartBump(false), 600)
              return
            case 'REMOVE_FROM_CART': {
              const productId = action.productId
              const query = (action.query || '').toLowerCase()
              if (productId) {
                cartStore.removeItem(productId)
                return
              }
              if (query) {
                const item = cartStore.items.find(
                  (i) =>
                    i.product.name.toLowerCase().includes(query) ||
                    i.product.slug.toLowerCase().includes(query)
                )
                if (item) cartStore.removeItem(item.product._id)
              }
              return
            }
          }
        }, 500)
      }
    } catch {
      addBotMsg({
        text: "Something went wrong. Please try again or WhatsApp @nuura.pk 🌿",
        type: 'replies',
        replies: ['Try again','Show products'],
      })
    }

    setLoading(false)
  }, [input, loading, conversationHistory, callChatApi, cartStore, router])

  const cartTotal = cartStore.totalItems()

  const markRecentlyViewed = useCallback((slug: string) => {
    try {
      const raw = localStorage.getItem('nuura-chat-recent')
      const prev = raw ? (JSON.parse(raw) as string[]) : []
      const next = [slug, ...prev.filter(s => s !== slug)].slice(0, 10)
      localStorage.setItem('nuura-chat-recent', JSON.stringify(next))
    } catch {
      // ignore
    }
  }, [])

  const renderBotText = useCallback(
    (text: string) => {
      const nodes: Array<React.ReactNode> = []
      const re = /\[([^\]]+)\]\((\/product\/[a-z0-9-]+)\)/gi
      let lastIdx = 0

      for (const m of text.matchAll(re)) {
        const idx = m.index ?? 0
        const label = m[1] ?? ''
        const href = m[2] ?? ''

        if (idx > lastIdx) nodes.push(text.slice(lastIdx, idx))

        const slug = href.split('/').pop() || ''
        nodes.push(
          <Link
            key={`${href}-${idx}`}
            href={href}
            onClick={() => {
              if (slug) markRecentlyViewed(slug)
            }}
            style={{ color: C.forest, textDecoration: 'underline', fontWeight: 600 }}
          >
            {label}
          </Link>
        )

        lastIdx = idx + String(m[0]).length
      }

      if (lastIdx < text.length) nodes.push(text.slice(lastIdx))
      return nodes
    },
    [markRecentlyViewed]
  )

  // Product tile inside chat
  const ChatCard = ({ p }: { p: Product }) => {
    const disc = p.comparePrice ? Math.round((1 - p.price / p.comparePrice) * 100) : 0
    return (
      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:'8px', overflow:'hidden', marginBottom:'8px' }}>
        <div style={{ background:p.category==='self-care'?'#F0ECE8':'#ECF0F5', height:'88px', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          {p.images?.[0] ? (
            <img
              src={p.images[0]}
              alt={p.name}
              style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.95 }}
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <span style={{ fontFamily:'var(--font-display)', fontSize:'2rem', color:'rgba(27,46,31,0.1)' }}>✦</span>
          )}
          {p.isNewDrop && <span style={{ position:'absolute', top:'8px', left:'8px', background:C.forest, color:C.cream, fontSize:'9px', letterSpacing:'0.15em', textTransform:'uppercase' as const, padding:'3px 8px', borderRadius:'2px' }}>New</span>}
          {p.isBestSeller && <span style={{ position:'absolute', top:'8px', right:'8px', background:C.gold, color:C.forest, fontSize:'9px', letterSpacing:'0.15em', textTransform:'uppercase' as const, padding:'3px 8px', borderRadius:'2px' }}>⭐ Best</span>}
        </div>
        <div style={{ padding:'10px 12px' }}>
          <p style={{ fontFamily:'var(--font-display)', fontSize:'14px', color:C.ink, margin:'0 0 2px', lineHeight:1.2 }}>{p.name}</p>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'11px', color:C.muted, margin:'0 0 8px' }}>{p.tagline}</p>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px' }}>
            <span style={{ fontFamily:'var(--font-sans)', fontSize:'13px', color:C.forest, fontWeight:600 }}>PKR {p.price.toLocaleString()}</span>
            {p.comparePrice && <span style={{ fontSize:'11px', color:C.muted, textDecoration:'line-through' }}>PKR {p.comparePrice.toLocaleString()}</span>}
            {disc>0 && <span style={{ background:'rgba(27,46,31,0.08)', color:C.forest, fontSize:'10px', padding:'2px 5px', borderRadius:'3px' }}>-{disc}%</span>}
          </div>
          <div style={{ display:'flex', gap:'6px' }}>
            <Link
              href={`/product/${p.slug}`}
              style={{ flex:1, padding:'7px', border:`1px solid ${C.border}`, color:C.ink, fontFamily:'var(--font-sans)', fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase' as const, textDecoration:'none', textAlign:'center' as const, display:'block', transition:'all 200ms', borderRadius:'2px' }}
              onClick={() => markRecentlyViewed(p.slug)}
              onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor=C.forest}}
              onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor=C.border}}
            >
              View
            </Link>
            <button onClick={()=>addToCart(p)}
              style={{ flex:2, padding:'7px', background:C.forest, color:C.cream, border:'none', fontFamily:'var(--font-sans)', fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase' as const, cursor:'pointer', transition:'background 200ms', borderRadius:'2px' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=C.gold;(e.currentTarget as HTMLButtonElement).style.color=C.forest}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background=C.forest;(e.currentTarget as HTMLButtonElement).style.color=C.cream}}>
              Add to Cart +
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Order tracker
  const OrderTracker = ({ order }: { order: ApiOrder }) => {
    const s = STATUS_MAP[order.orderStatus] || { label:order.orderStatus, icon:'📦', color:C.muted }
    return (
      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'14px', marginTop:'8px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px', gap:'8px' }}>
          <div>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'10px', color:C.muted, margin:'0 0 2px', letterSpacing:'0.1em', textTransform:'uppercase' as const }}>#{order.orderNumber}</p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:'15px', color:C.ink, margin:0 }}>{order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</p>
          </div>
          <span style={{ padding:'4px 10px', background:`${s.color}18`, color:s.color, fontFamily:'var(--font-sans)', fontSize:'10px', borderRadius:'20px', whiteSpace:'nowrap' as const }}>
            {s.icon} {s.label}
          </span>
        </div>
        <div style={{ display:'flex', gap:'3px', alignItems:'center', marginBottom:'10px' }}>
          {order.timeline.map((step, i) => (
            <div key={step.key} style={{ display:'flex', alignItems:'center', flex:i<order.timeline.length-1?1:'none' }}>
              <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:step.done || step.current ? C.forest : C.border, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'10px', color:step.done || step.current ? C.cream : C.muted, transition:'background 300ms' }}>
                {step.done ? '✓' : step.current ? '●' : '○'}
              </div>
              {i<order.timeline.length-1 && <div style={{ flex:1, height:'2px', background:step.done ? C.forest : C.border, margin:'0 2px', transition:'background 300ms' }} />}
            </div>
          ))}
        </div>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:'12px', color:C.muted, margin:0 }}>📅 ETA: {order.etaText}</p>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <div
            style={{ position:'fixed', bottom:'5.5rem', left:0, right:0, padding:'0 1.5rem', zIndex:89, display:'flex', justifyContent:'flex-end' }}
          >
            <motion.div
              initial={{ opacity:0, y:20, scale:0.95 }}
              animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:20, scale:0.95 }}
              transition={{ duration:0.3, ease:[0.25,0.1,0.25,1] }}
              style={{ width:'100%', maxWidth:'400px', height:'calc(100vh - 8.5rem)', maxHeight:'600px', background:C.white, border:`1px solid ${C.border}`, boxShadow:'0 32px 80px rgba(11,26,15,0.2)', display:'flex', flexDirection:'column', overflow:'hidden', borderRadius:'12px' }}
            >
            {/* Header */}
            <div style={{ background:C.forest, padding:'1.25rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(212,168,83,0.15)', border:'1px solid rgba(212,168,83,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Sparkles size={17} color={C.gold} strokeWidth={1.5} />
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <p style={{ fontFamily:'var(--font-accent)', fontSize:'19px', letterSpacing:'0.15em', color:C.cream, margin:0, textTransform:'uppercase', lineHeight:1 }}>Noor</p>
                    <span style={{ background:'rgba(212,168,83,0.2)', color:C.gold, fontFamily:'var(--font-sans)', fontSize:'9px', letterSpacing:'0.15em', textTransform:'uppercase' as const, padding:'2px 7px', borderRadius:'10px' }}>AI</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'3px' }}>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#4CAF50', display:'block' }} />
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'11px', color:'rgba(212,168,83,0.75)', margin:0 }}>Beauty Assistant · Online</p>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                {cartTotal > 0 && (
                  <motion.div animate={cartBump?{ scale:[1,1.3,1] }:{ scale:1 }} transition={{ duration:0.3 }}
                    style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(212,168,83,0.15)', padding:'5px 10px', borderRadius:'20px', cursor:'pointer' }}
                    onClick={()=>send('view my cart')}>
                    <ShoppingBag size={13} color={C.gold} strokeWidth={1.5} />
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'12px', color:C.gold, fontWeight:600 }}>{cartTotal}</span>
                  </motion.div>
                )}
                <button onClick={()=>setOpen(false)} style={{ color:'rgba(245,240,230,0.4)', background:'transparent', border:0, cursor:'pointer', transition:'color 200ms' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.cream}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color='rgba(245,240,230,0.4)'}}>
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Quick replies bar */}
            {showReplies && msgs.length <= 1 && (
              <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}`, display:'flex', gap:'6px', overflowX:'auto', flexShrink:0 }} className="hide-scrollbar">
                {QUICK_REPLIES.map((qr,i) => (
                  <button key={i} onClick={()=>send(qr.msg)}
                    style={{ padding:'6px 12px', border:`1px solid ${C.border}`, background:'transparent', fontFamily:'var(--font-sans)', fontSize:'11px', color:C.muted, cursor:'pointer', borderRadius:'20px', transition:'all 200ms', whiteSpace:'nowrap' as const, flexShrink:0 }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=C.gold;(e.currentTarget as HTMLButtonElement).style.color=C.forest}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=C.border;(e.currentTarget as HTMLButtonElement).style.color=C.muted}}>
                    {qr.label}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div
              style={{ flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem', overscrollBehavior:'contain', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}
              data-lenis-prevent
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {msgs.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}>
                  <div style={{ display:'flex', justifyContent:msg.role==='user'?'flex-end':'flex-start', alignItems:'flex-end', gap:'8px' }}>
                    {msg.role==='bot' && (
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:C.forest, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Sparkles size={12} color={C.gold} strokeWidth={1.5} />
                      </div>
                    )}
                    {msg.text && (
                      <div style={{ maxWidth:'80%', padding:'10px 14px', background:msg.role==='user'?C.forest:C.offwhite, color:msg.role==='user'?C.cream:C.ink, fontFamily:'var(--font-sans)', fontSize:'13px', lineHeight:1.65, borderRadius:msg.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px', whiteSpace:'pre-wrap' as const }}>
                        {msg.role === 'bot' ? renderBotText(msg.text) : msg.text}
                        {msg.isAI && <span style={{ display:'block', marginTop:'6px', fontSize:'10px', color:msg.role==='user'?'rgba(245,240,230,0.5)':C.muted, letterSpacing:'0.1em' }}>✦ AI Response</span>}
                      </div>
                    )}
                  </div>

                  {msg.type==='products' && msg.products && (
                    <div style={{ marginLeft:'36px', marginTop:'8px' }}>
                      {msg.products.map(p => <ChatCard key={p._id || p.slug} p={p} />)}
                    </div>
                  )}

                  {msg.type==='order' && msg.order && (
                    <div style={{ marginLeft:'36px', marginTop:'4px' }}>
                      <OrderTracker order={msg.order} />
                    </div>
                  )}

                  {msg.replies && msg.role==='bot' && (
                    <div style={{ marginLeft:'36px', marginTop:'8px', display:'flex', flexWrap:'wrap' as const, gap:'6px' }}>
                      {msg.replies.map((r,ri) => (
                        <button key={ri} onClick={()=>send(r)}
                          style={{ padding:'6px 14px', border:`1px solid ${C.border}`, background:'transparent', fontFamily:'var(--font-sans)', fontSize:'12px', color:C.ink, cursor:'pointer', borderRadius:'20px', transition:'all 200ms', display:'flex', alignItems:'center', gap:'4px' }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=C.gold;(e.currentTarget as HTMLButtonElement).style.color=C.forest;(e.currentTarget as HTMLButtonElement).style.background='rgba(212,168,83,0.05)'}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=C.border;(e.currentTarget as HTMLButtonElement).style.color=C.ink;(e.currentTarget as HTMLButtonElement).style.background='transparent'}}>
                          {r} <ChevronRight size={11} strokeWidth={1.5} />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', alignItems:'flex-end', gap:'8px' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:C.forest, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Sparkles size={12} color={C.gold} strokeWidth={1.5} />
                  </div>
                  <div style={{ padding:'12px 16px', background:C.offwhite, borderRadius:'18px 18px 18px 4px', display:'flex', gap:'4px', alignItems:'center' }}>
                    {[0,1,2].map(j => (
                      <motion.div key={j} animate={{ y:[0,-5,0] }} transition={{ duration:0.6, delay:j*0.15, repeat:Infinity }}
                        style={{ width:'5px', height:'5px', borderRadius:'50%', background:C.muted }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding:'0.875rem 1.25rem', borderTop:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:'10px', flexShrink:0 }}>
              {input.trim().length >= 2 && suggestions.length > 0 && (
                <div style={{ display:'flex', gap:'6px', overflowX:'auto' }} className="hide-scrollbar">
                  {suggestions.slice(0, 6).map((s, i) => (
                    <button
                      key={`${s}-${i}`}
                      onClick={() => send(s)}
                      style={{
                        padding:'6px 12px',
                        border:`1px solid ${C.border}`,
                        background:'transparent',
                        fontFamily:'var(--font-sans)',
                        fontSize:'11px',
                        color:C.muted,
                        cursor:'pointer',
                        borderRadius:'20px',
                        transition:'all 200ms',
                        whiteSpace:'nowrap',
                        flexShrink:0,
                      }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=C.gold;(e.currentTarget as HTMLButtonElement).style.color=C.forest}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=C.border;(e.currentTarget as HTMLButtonElement).style.color=C.muted}}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter')send()}}
                  placeholder="Search products, track order, ask anything..."
                  style={{ flex:1, border:`1px solid ${C.border}`, padding:'10px 16px', fontFamily:'var(--font-sans)', fontSize:'13px', color:C.ink, background:'transparent', outline:'none', borderRadius:'24px', transition:'border-color 200ms' }}
                  onFocus={e=>{e.currentTarget.style.borderColor=C.gold}}
                  onBlur={e=>{e.currentTarget.style.borderColor=C.border}}
                />
                <button onClick={()=>send()}
                  style={{ width:'42px', height:'42px', borderRadius:'50%', background:input.trim()?C.forest:C.border, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:input.trim()?'pointer':'default', flexShrink:0, transition:'all 200ms' }}
                  onMouseEnter={e=>{if(input.trim())(e.currentTarget as HTMLButtonElement).style.background=C.gold}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background=input.trim()?C.forest:C.border}}>
                  <Send size={16} color={input.trim()?C.cream:C.white} strokeWidth={1.5} />
                </button>
              </div>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toggle */}
      <motion.button onClick={()=>setOpen(v=>!v)} whileHover={{ scale:1.08 }} whileTap={{ scale:0.95 }} data-cursor="hover"
        style={{ position:'fixed', bottom:'1.5rem', right:'1.5rem', width:'58px', height:'58px', borderRadius:'50%', background:C.forest, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:90, boxShadow:'0 8px 32px rgba(11,26,15,0.3)' }}>
        <AnimatePresence>
          {cartTotal>0 && !open && (
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
              style={{ position:'absolute', top:'-4px', right:'-4px', width:'20px', height:'20px', borderRadius:'50%', background:C.gold, color:C.forest, fontFamily:'var(--font-sans)', fontSize:'11px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {cartTotal}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate:-90,opacity:0 }} animate={{ rotate:0,opacity:1 }} exit={{ rotate:90,opacity:0 }} transition={{ duration:0.2 }}><X size={22} color={C.gold} strokeWidth={1.5} /></motion.div>
            : <motion.div key="chat" initial={{ rotate:90,opacity:0 }} animate={{ rotate:0,opacity:1 }} exit={{ rotate:-90,opacity:0 }} transition={{ duration:0.2 }}><MessageCircle size={22} color={C.gold} strokeWidth={1.5} /></motion.div>
          }
        </AnimatePresence>
      </motion.button>
    </>
  )
}
