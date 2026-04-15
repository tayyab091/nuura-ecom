'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, X, Send, Sparkles,
  ShoppingBag, Search, Package, ChevronRight,
  Star
} from 'lucide-react'

const C = {
  forest: '#1B2E1F', cream: '#F5F0E6', gold: '#D4A853',
  goldLight: '#E8C97A', white: '#FAFAF8', offwhite: '#F0EBE3',
  ink: '#0F1A11', muted: '#6B7B6E', border: '#DDD8CF',
}

const PRODUCTS = [
  { id:'1', slug:'rose-quartz-gua-sha', name:'Rose Quartz Gua Sha', tagline:'Sculpt. Depuff. Glow.', price:2800, comparePrice:3500, category:'self-care', tags:['gua sha','facial','sculpt','depuff','massage'], isNew:true, isBest:false },
  { id:'2', slug:'led-glow-mirror', name:'LED Glow Mirror', tagline:'Studio lighting, anywhere.', price:4500, comparePrice:5500, category:'self-care', tags:['mirror','led','makeup','vanity','light'], isNew:false, isBest:true },
  { id:'3', slug:'mini-chain-crossbody', name:'Mini Chain Crossbody', tagline:'Small bag. Big statement.', price:3200, comparePrice:null, category:'accessories', tags:['bag','crossbody','chain','purse','handbag'], isNew:true, isBest:false },
  { id:'4', slug:'jade-face-roller', name:'Jade Face Roller', tagline:'Roll away the stress.', price:1800, comparePrice:2200, category:'self-care', tags:['jade','roller','facial','massage','puffiness','eye'], isNew:false, isBest:true },
  { id:'5', slug:'acrylic-clutch', name:'Acrylic Box Clutch', tagline:'Art you carry.', price:2500, comparePrice:null, category:'accessories', tags:['clutch','acrylic','bag','evening','clear'], isNew:true, isBest:false },
  { id:'6', slug:'facial-steamer', name:'USB Facial Steamer', tagline:'Open up. Breathe in. Glow.', price:3800, comparePrice:4500, category:'self-care', tags:['steamer','facial','pores','steam','cleanse'], isNew:false, isBest:false },
]

const MOCK_ORDERS: Record<string, { status:string; items:string[]; eta:string }> = {
  'NR-260101-1234': { status:'shipped', items:['Rose Quartz Gua Sha'], eta:'Tomorrow by 8pm' },
  'NR-260102-5678': { status:'confirmed', items:['LED Glow Mirror'], eta:'2-3 business days' },
  'NR-260103-9012': { status:'delivered', items:['Mini Chain Crossbody'], eta:'Delivered' },
}

const STATUS_MAP: Record<string,{label:string;icon:string;color:string}> = {
  pending_verification: { label:'Awaiting Payment', icon:'⏳', color:'#B8860B' },
  confirmed: { label:'Order Confirmed', icon:'✅', color:'#166534' },
  processing: { label:'Being Prepared', icon:'🔄', color:'#1d4ed8' },
  shipped: { label:'Out for Delivery', icon:'🚚', color:'#7c3aed' },
  delivered: { label:'Delivered', icon:'🎉', color:'#065f46' },
  cancelled: { label:'Cancelled', icon:'❌', color:'#991b1b' },
}

interface CartItem { product: typeof PRODUCTS[0]; qty: number }
interface Msg {
  id: string
  role: 'user' | 'bot'
  text: string
  type?: 'text' | 'products' | 'order' | 'replies'
  products?: typeof PRODUCTS
  order?: { number:string; status:string; items:string[]; eta:string }
  replies?: string[]
  isAI?: boolean
}

function extractPrice(t: string): { min:number; max:number } | null {
  const u = t.match(/under\s+(?:pkr\s*)?(\d+)/i)
  const a = t.match(/(?:above|over)\s+(?:pkr\s*)?(\d+)/i)
  const b = t.match(/between\s+(?:pkr\s*)?(\d+)\s+and\s+(?:pkr\s*)?(\d+)/i)
  if (b) return { min:parseInt(b[1]), max:parseInt(b[2]) }
  if (u) return { min:0, max:parseInt(u[1]) }
  if (a) return { min:parseInt(a[1]), max:99999 }
  return null
}

function searchProducts(query: string): typeof PRODUCTS {
  const q = query.toLowerCase()
  const price = extractPrice(q)
  const isSelfCare = /self.care|skincare|skin care|beauty|gua sha|roller|steamer|mirror/.test(q)
  const isAccessory = /accessor|bag|purse|clutch|handbag/.test(q)
  const isBest = /best|popular|trending|top/.test(q)
  const isNew = /new|latest|arrival|just in/.test(q)
  const isAll = /all|everything|show me|browse/.test(q)

  let results = PRODUCTS.filter(p => {
    const textMatch = p.name.toLowerCase().includes(q) ||
      p.tags.some(t => q.includes(t)) ||
      q.includes(p.name.toLowerCase().split(' ')[0].toLowerCase())
    const priceMatch = !price || (p.price >= price.min && p.price <= price.max)
    const catMatch = isSelfCare ? p.category === 'self-care' :
      isAccessory ? p.category === 'accessories' : true
    return (textMatch || isAll) && priceMatch && catMatch
  })

  if (isBest) results = PRODUCTS.filter(p => p.isBest)
  if (isNew) results = PRODUCTS.filter(p => p.isNew)
  if (isAll && !price) results = PRODUCTS

  return results.length ? results :
    PRODUCTS.filter(p =>
      p.tags.some(t => q.includes(t.split(' ')[0]))
    )
}

function getHardcodedResponse(input: string, cart: CartItem[]): Msg | null {
  const q = input.toLowerCase().trim()
  const id = `bot_${Date.now()}`

  // Greetings
  if (/^(hi|hello|hey|salam|assalam|yo)/.test(q)) {
    return { id, role:'bot', text:"Hi! I'm Noor, your Nuura beauty assistant ✨\n\nI can search products, track orders, manage your cart, and answer anything beauty-related.", type:'replies', replies:['Show all products','Best sellers','Track my order','Skincare advice'] }
  }

  // Order tracking
  const orderMatch = input.match(/NR-\d{6}-\d{4}/i)
  if (orderMatch) {
    const num = orderMatch[0].toUpperCase()
    const order = MOCK_ORDERS[num]
    if (order) {
      const s = STATUS_MAP[order.status] || { label:order.status, icon:'📦', color:C.muted }
      return { id, role:'bot', text:`Found your order! ${s.icon}`, type:'order', order:{ number:num, ...order } }
    }
    return { id, role:'bot', text:"I couldn't find that order number. Please check the format: NR-XXXXXX-XXXX\n\nTry a demo: NR-260101-1234", type:'replies', replies:['NR-260101-1234','NR-260102-5678','Contact support'] }
  }

  if (/track|where is|my order|order status/.test(q)) {
    return { id, role:'bot', text:"Please share your order number to track it! 📦\n\nFormat: NR-XXXXXX-XXXX\nFind it in your confirmation WhatsApp or email.", type:'replies', replies:['NR-260101-1234 (demo)','NR-260102-5678 (demo)'] }
  }

  // Cart operations
  if (/view cart|my cart|what.s in cart|show cart/.test(q)) {
    if (!cart.length) return { id, role:'bot', text:"Your cart is empty! Let me help you find something beautiful 🌿", type:'replies', replies:['Show all products','Best sellers','Under PKR 2,000'] }
    const total = cart.reduce((s,i) => s + i.product.price*i.qty, 0)
    const list = cart.map(i => `• ${i.product.name} ×${i.qty} — PKR ${(i.product.price*i.qty).toLocaleString()}`).join('\n')
    return { id, role:'bot', text:`Your cart (${cart.length} item${cart.length>1?'s':''}):\n\n${list}\n\nTotal: PKR ${total.toLocaleString()}\n${total>=5000?'✅ Free shipping!':'PKR '+(5000-total).toLocaleString()+' more for free shipping'}`, type:'replies', replies:['Proceed to checkout','Clear cart','Continue shopping'] }
  }

  if (/clear cart|empty cart|remove all/.test(q)) {
    return { id, role:'bot', text:"__CLEAR_CART__", type:'text' }
  }

  if (/checkout|proceed/.test(q)) {
    if (!cart.length) return { id, role:'bot', text:"Cart is empty! Add products first 🛍️", type:'replies', replies:['Show all products'] }
    return { id, role:'bot', text:`Ready! ${cart.length} item(s) totaling PKR ${cart.reduce((s,i)=>s+i.product.price*i.qty,0).toLocaleString()}\n\nClick below to complete your order with COD, JazzCash, or EasyPaisa.`, type:'replies', replies:['Go to checkout →'] }
  }

  // Coupon
  if (/coupon|discount|promo|code/.test(q)) {
    return { id, role:'bot', text:"🎁 Active discount codes:\n\n• **NUURA10** — 10% off your first order\n• **GLOW5** — PKR 500 off orders over PKR 5,000\n\nApply at checkout!", type:'replies', replies:['Show products','Go to checkout'] }
  }

  // FAQ
  if (/ship|deliver|how long|when will/.test(q)) {
    return { id, role:'bot', text:"📦 Delivery:\n\n• Lahore/Karachi/Islamabad: 2-3 days\n• Other cities: 3-5 days\n• Free shipping over PKR 5,000\n• PKR 150-300 standard\n• TCS & Leopard Couriers", type:'replies', replies:['Track order','Payment methods','Return policy'] }
  }

  if (/payment|pay|cod|jazzcash|easypaisa/.test(q)) {
    return { id, role:'bot', text:"💳 Payment Options:\n\n• 💵 Cash on Delivery (nationwide)\n• 📱 JazzCash\n• 📱 EasyPaisa\n• 📱 NayaPay\n\nFor digital payments: transfer and WhatsApp screenshot.", type:'replies', replies:['Place order','Shipping info'] }
  }

  if (/return|refund|exchange/.test(q)) {
    return { id, role:'bot', text:"↩️ Returns:\n\n• 7-day hassle-free returns\n• Unused items in original packaging\n• Damaged? WhatsApp photo within 24h\n• Full refund or replacement", type:'replies', replies:['Contact support'] }
  }

  // Skincare advice
  if (/routine|skincare|skin care|advice|how to/.test(q)) {
    return { id, role:'bot', text:"🌿 Morning Ritual:\n\n1. Cleanser\n2. Toner\n3. Serum\n4. Facial Oil + Gua Sha 🔑\n5. Moisturizer\n6. SPF ☀️\n\nSteamer 2-3x/week before serums doubles absorption!", type:'replies', replies:['Show self-care products','Gua sha tips','For puffiness'] }
  }

  if (/puffy|puffiness|swollen/.test(q)) {
    const products = PRODUCTS.filter(p => p.slug === 'jade-face-roller')
    return { id, role:'bot', text:"For puffiness: Cold jade roller first thing in the morning! Sweep outward toward ears. 10 minutes = visible difference 🌿", type:'products', products }
  }

  if (/dark circle|under eye/.test(q)) {
    const products = PRODUCTS.filter(p => p.slug === 'jade-face-roller')
    return { id, role:'bot', text:"For dark circles: small end of jade roller under eyes with gentle upward strokes. Keep it cold. 2-3 weeks of consistent use makes a real difference!", type:'products', products }
  }

  if (/acne|pimple|breakout/.test(q)) {
    const products = PRODUCTS.filter(p => p.slug === 'facial-steamer')
    return { id, role:'bot', text:"For acne: facial steamer deep cleanses pores. Skip gua sha on active breakouts — wait for skin to calm first.", type:'products', products }
  }

  // Product search
  const searchTriggers = /show|find|search|looking for|need|want|recommend|suggest|what do you have|products|self-care|accessor|bag|skincare|gua sha|jade|mirror|steamer|roller|clutch|under|best|new|all/
  if (searchTriggers.test(q) || extractPrice(q)) {
    const results = searchProducts(q)
    if (results.length) {
      const price = extractPrice(q)
      const intro = price
        ? `Found ${results.length} product${results.length>1?'s':''} ${price.max<99999?'under PKR '+price.max.toLocaleString():'over PKR '+price.min.toLocaleString()}:`
        : `Found ${results.length} product${results.length>1?'s':''} for you ✨`
      return { id, role:'bot', text:intro, type:'products', products:results }
    }
  }

  // Thanks/bye
  if (/thanks|thank you|shukriya|bye|goodbye/.test(q)) {
    return { id, role:'bot', text:"You're welcome! Glow on ✨\n\nFollow @nuura.pk for new drops!", type:'replies', replies:['Browse products','Track order'] }
  }

  return null
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
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartBump, setCartBump] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const [conversationHistory, setConversationHistory] = useState<Array<{role:string;content:string}>>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{
        id: 'init',
        role: 'bot',
        text: "Hi! I'm Noor, your Nuura beauty assistant ✨\n\nI'm powered by AI and can help you find products, track orders, answer skincare questions, and more! What would you like?",
        type: 'replies',
        replies: ['Show all products','Best sellers','Track my order','Skincare advice'],
        isAI: false,
      }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [msgs, loading])

  const addToCart = useCallback((product: typeof PRODUCTS[0]) => {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id)
      return ex
        ? prev.map(i => i.product.id === product.id ? { ...i, qty:i.qty+1 } : i)
        : [...prev, { product, qty:1 }]
    })
    setCartBump(true)
    setTimeout(() => setCartBump(false), 600)
    addBotMsg({
      text: `Added ${product.name} to cart! 🛍️\nPKR ${product.price.toLocaleString()}`,
      type: 'replies',
      replies: ['View cart','Checkout','Continue shopping'],
    })
  }, [])

  function addBotMsg(partial: Partial<Msg>) {
    setMsgs(prev => [...prev, {
      id: `bot_${Date.now()}`,
      role: 'bot',
      text: '',
      ...partial,
    }])
  }

  const callAI = useCallback(async (userMessage: string, history: Array<{role:string;content:string}>): Promise<string | null> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...history.slice(-6),
            { role:'user', content:userMessage }
          ],
        }),
      })
      if (!response.ok) return null
      const data = await response.json()
      return data.response ?? null
    } catch {
      return null
    }
  }, [])

  const send = useCallback(async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setShowReplies(false)

    // Add user message
    const userMsg: Msg = { id:`user_${Date.now()}`, role:'user', text:msg }
    setMsgs(prev => [...prev, userMsg])
    setLoading(true)

    // Update history
    const newHistory = [...conversationHistory, { role:'user', content:msg }]
    setConversationHistory(newHistory)

    try {
      // 1. Check for cart clear action
      if (msg.toLowerCase().includes('clear cart') || msg.toLowerCase().includes('empty cart')) {
        setCart([])
        addBotMsg({ text:"Cart cleared! Fresh start 🌿", type:'replies', replies:['Show all products','Best sellers'] })
        setLoading(false)
        return
      }

      // 2. Check for checkout navigation
      if (msg === 'Go to checkout →') {
        window.location.href = '/checkout'
        setLoading(false)
        return
      }

      // 3. Try hardcoded responses first (instant, no API needed)
      const hardcoded = getHardcodedResponse(msg, cart)
      if (hardcoded) {
        await new Promise(r => setTimeout(r, 500 + Math.random()*600))
        setMsgs(prev => [...prev, hardcoded])
        const botHistory = { role:'assistant', content:hardcoded.text }
        setConversationHistory(prev => [...prev, botHistory])
        setLoading(false)
        return
      }

      // 4. Fall back to AI for anything not hardcoded
      await new Promise(r => setTimeout(r, 800 + Math.random()*500))
      const aiResponse = await callAI(msg, newHistory.slice(-8))

      if (aiResponse) {
        const botMsg: Msg = {
          id: `bot_${Date.now()}`,
          role: 'bot',
          text: aiResponse,
          type: 'text',
          isAI: true,
          replies: ['Ask another question','Show products','Track order'],
        }
        setMsgs(prev => [...prev, botMsg])
        setConversationHistory(prev => [...prev, { role:'assistant', content:aiResponse }])
      } else {
        addBotMsg({
          text: "I'm not sure about that, but I'd love to help! Try asking about products, skincare, shipping, or returns 🌸",
          type: 'replies',
          replies: ['Show all products','Shipping info','Return policy'],
        })
      }
    } catch {
      addBotMsg({
        text: "Something went wrong. Please try again or WhatsApp @nuura.pk 🌿",
        type: 'replies',
        replies: ['Try again','Show products'],
      })
    }

    setLoading(false)
  }, [input, loading, cart, conversationHistory, callAI])

  const cartTotal = cart.reduce((s,i) => s+i.qty, 0)

  // Product card inside chat
  const ChatCard = ({ p }: { p: typeof PRODUCTS[0] }) => {
    const disc = p.comparePrice ? Math.round((1-p.price/p.comparePrice)*100) : 0
    return (
      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:'8px', overflow:'hidden', marginBottom:'8px' }}>
        <div style={{ background:p.category==='self-care'?'#F0ECE8':'#ECF0F5', height:'80px', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:'2rem', color:'rgba(27,46,31,0.1)' }}>✦</span>
          {p.isNew && <span style={{ position:'absolute', top:'8px', left:'8px', background:C.forest, color:C.cream, fontSize:'9px', letterSpacing:'0.15em', textTransform:'uppercase' as const, padding:'3px 8px', borderRadius:'2px' }}>New</span>}
          {p.isBest && <span style={{ position:'absolute', top:'8px', right:'8px', background:C.gold, color:C.forest, fontSize:'9px', letterSpacing:'0.15em', textTransform:'uppercase' as const, padding:'3px 8px', borderRadius:'2px' }}>⭐ Best</span>}
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
            <a href={`/product/${p.slug}`}
              style={{ flex:1, padding:'7px', border:`1px solid ${C.border}`, color:C.ink, fontFamily:'var(--font-sans)', fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase' as const, textDecoration:'none', textAlign:'center' as const, display:'block', transition:'all 200ms', borderRadius:'2px' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor=C.forest}}
              onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor=C.border}}>
              View
            </a>
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
  const OrderTracker = ({ order }: { order: NonNullable<Msg['order']> }) => {
    const steps = ['confirmed','processing','shipped','delivered']
    const curr = steps.indexOf(order.status)
    const s = STATUS_MAP[order.status] || { label:order.status, icon:'📦', color:C.muted }
    return (
      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'14px', marginTop:'8px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px', gap:'8px' }}>
          <div>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'10px', color:C.muted, margin:'0 0 2px', letterSpacing:'0.1em', textTransform:'uppercase' as const }}>#{order.number}</p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:'15px', color:C.ink, margin:0 }}>{order.items.join(', ')}</p>
          </div>
          <span style={{ padding:'4px 10px', background:`${s.color}18`, color:s.color, fontFamily:'var(--font-sans)', fontSize:'10px', borderRadius:'20px', whiteSpace:'nowrap' as const }}>
            {s.icon} {s.label}
          </span>
        </div>
        <div style={{ display:'flex', gap:'3px', alignItems:'center', marginBottom:'10px' }}>
          {steps.map((step,i) => (
            <div key={step} style={{ display:'flex', alignItems:'center', flex:i<steps.length-1?1:'none' }}>
              <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:i<=curr?C.forest:C.border, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'10px', color:i<=curr?C.cream:C.muted, transition:'background 300ms' }}>
                {i<curr?'✓':i===curr?'●':'○'}
              </div>
              {i<steps.length-1 && <div style={{ flex:1, height:'2px', background:i<curr?C.forest:C.border, margin:'0 2px', transition:'background 300ms' }} />}
            </div>
          ))}
        </div>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:'12px', color:C.muted, margin:0 }}>📅 ETA: {order.eta}</p>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:20, scale:0.95 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:20, scale:0.95 }}
            transition={{ duration:0.3, ease:[0.25,0.1,0.25,1] }}
            style={{ position:'fixed', bottom:'5.5rem', right:'1.5rem', width:'min(400px, calc(100vw - 3rem))', height:'600px', background:C.white, border:`1px solid ${C.border}`, boxShadow:'0 32px 80px rgba(11,26,15,0.2)', zIndex:89, display:'flex', flexDirection:'column', overflow:'hidden', borderRadius:'12px' }}
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
            <div style={{ flex:1, overflowY:'auto', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
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
                        {msg.text}
                        {msg.isAI && <span style={{ display:'block', marginTop:'6px', fontSize:'10px', color:msg.role==='user'?'rgba(245,240,230,0.5)':C.muted, letterSpacing:'0.1em' }}>✦ AI Response</span>}
                      </div>
                    )}
                  </div>

                  {msg.type==='products' && msg.products && (
                    <div style={{ marginLeft:'36px', marginTop:'8px' }}>
                      {msg.products.map(p => <ChatCard key={p.id} p={p} />)}
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
            <div style={{ padding:'0.875rem 1.25rem', borderTop:`1px solid ${C.border}`, display:'flex', gap:'10px', alignItems:'center', flexShrink:0 }}>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send()}}
                placeholder="Search products, track order, ask anything..."
                style={{ flex:1, border:`1px solid ${C.border}`, padding:'10px 16px', fontFamily:'var(--font-sans)', fontSize:'13px', color:C.ink, background:'transparent', outline:'none', borderRadius:'24px', transition:'border-color 200ms' }}
                onFocus={e=>{e.currentTarget.style.borderColor=C.gold}}
                onBlur={e=>{e.currentTarget.style.borderColor=C.border}} />
              <button onClick={()=>send()}
                style={{ width:'42px', height:'42px', borderRadius:'50%', background:input.trim()?C.forest:C.border, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:input.trim()?'pointer':'default', flexShrink:0, transition:'all 200ms' }}
                onMouseEnter={e=>{if(input.trim())(e.currentTarget as HTMLButtonElement).style.background=C.gold}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background=input.trim()?C.forest:C.border}}>
                <Send size={16} color={input.trim()?C.cream:C.white} strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
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
