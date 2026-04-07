'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'

const C = { forest:'#1B2E1F', cream:'#F5F0E6', gold:'#D4A853', white:'#FAFAF8', offwhite:'#F0EBE3', ink:'#0F1A11', muted:'#6B7B6E', border:'#DDD8CF' }

interface Msg { role:'user'|'bot'; text:string }

const KB: Array<{ patterns: string[]; response: string }> = [
  { patterns:['hello','hi','hey','salam','السلام'], response:"Hello! I'm Noor, your Nuura beauty assistant ✨ How can I help you glow today?" },
  { patterns:['gua sha','guasha'], response:"Our Rose Quartz Gua Sha (PKR 2,800, was 3,500) is magic for sculpting and depuffing. Use upward strokes with a facial oil every morning. Your jawline will thank you! 💫" },
  { patterns:['jade roller','jade roll','face roller'], response:"The Jade Face Roller (PKR 1,800) is perfect for puffiness and lymphatic drainage. Store it in the fridge for an ice-cold morning depuff. Chef's kiss 🌿" },
  { patterns:['steamer','facial steamer','steam'], response:"Our USB Facial Steamer (PKR 3,800) opens pores for deep cleansing. Use it 2-3x a week before serums — absorption increases dramatically. It's a game changer for Pakistani humidity seasons!" },
  { patterns:['mirror','led mirror','glow mirror'], response:"The LED Glow Mirror (PKR 4,500) gives you studio lighting anywhere. 10x magnification, adjustable brightness, USB rechargeable. Perfect for flawless makeup even in low light rooms." },
  { patterns:['crossbody','chain bag','chain crossbody'], response:"The Mini Chain Crossbody (PKR 3,200) is our most requested item! Quilted design, gold chain strap, fits phone + cards + lip gloss. Goes from morning chai to evening dinner seamlessly 👜" },
  { patterns:['clutch','acrylic','box clutch'], response:"The Acrylic Box Clutch (PKR 2,500) is literally wearable art. Clear acrylic + gold hardware = instant outfit elevation. Instagram will love it 📸" },
  { patterns:['price','how much','kitna'], response:"Our products range from PKR 1,800 to PKR 4,500 — all with significant discounts from original prices. Free shipping on orders over PKR 5,000! Everything is worth every rupee 🌟" },
  { patterns:['delivery','shipping','deliver','ship'], response:"We deliver nationwide! Lahore, Karachi, Islamabad: 2-3 business days. Other cities: 3-5 days. Free shipping over PKR 5,000, otherwise PKR 150-300 depending on your city 📦" },
  { patterns:['cod','cash','cash on delivery'], response:"Yes! Cash on Delivery is available nationwide 🇵🇰 Pay when your order arrives — zero upfront risk. Most popular payment method at Nuura!" },
  { patterns:['jazzcash','easypaisa','nayapay','payment'], response:"We accept Cash on Delivery, JazzCash, EasyPaisa, and NayaPay. For digital payments — transfer at checkout and WhatsApp us your screenshot. Confirmed within 1-2 hours!" },
  { patterns:['return','refund','exchange'], response:"7-day hassle-free returns on unused items in original packaging. Damaged item? WhatsApp us with a photo within 24 hours — we replace immediately at no cost 💚" },
  { patterns:['routine','skin care','skincare','routine'], response:"Great skin routine for Pakistani climate: Cleanser → Toner → Serum → Facial Oil (gua sha here!) → Moisturizer → SPF. Our steamer before serums doubles their effectiveness ✨" },
  { patterns:['puffiness','puffy','swelling'], response:"For puffiness: cold jade roller first thing in the morning is absolute magic! Store it in fridge overnight. Sweep outward toward ears to drain lymphatics. 10 minutes = visible difference 🌿" },
  { patterns:['dark circles','dark circle','under eye'], response:"For dark circles: use the small end of the jade roller under eyes with gentle upward strokes. Keep it cold. Consistent use over 2-3 weeks makes a real difference!" },
  { patterns:['acne','pimple','breakout'], response:"For acne-prone skin: facial steamer deep cleanses pores brilliantly. Skip gua sha on active breakouts — wait until skin calms, then introduce the jade roller gently. Consistency is key!" },
  { patterns:['glowing','glow','glass skin'], response:"Glass skin routine: facial steamer (opens pores) → niacinamide serum → facial oil → gua sha to seal it in. Do this 3x weekly and you'll literally glow ✨" },
  { patterns:['gift','present','eid'], response:"Nuura products make beautiful gifts! We do gift packaging — mention it in order notes. Perfect for birthdays, Eid, or just because. Unboxing experience is premium 🎁" },
  { patterns:['instagram','tiktok','social'], response:"Follow us @nuura.pk on Instagram and TikTok! We post GRWM routines, skincare tutorials, and new drop announcements. First to know = first to shop before sellout!" },
  { patterns:['new','latest','new arrival'], response:"Current new drops: Rose Quartz Gua Sha, Mini Chain Crossbody, and Acrylic Box Clutch are all freshly added! All marked with 'New' on the website. Limited quantities!" },
  { patterns:['stock','available','sold out'], response:"Our products are in stock right now but quantities are limited per drop! Once sold out, next restock could be weeks away. Order while you can 🌟" },
  { patterns:['whatsapp','contact','reach'], response:"Reach us on WhatsApp or Instagram @nuura.pk. We respond within 2 hours, 10am–8pm daily. For payment screenshots, WhatsApp is fastest!" },
  { patterns:['thanks','thank you','shukriya'], response:"You're so welcome! Is there anything else I can help with? Go glow! ✨" },
  { patterns:['bye','goodbye','khuda hafiz'], response:"Goodbye! Come back soon and glow on! 🌿✨ Follow @nuura.pk for new drops!" },
]

function getReply(input: string): string {
  const lower = input.toLowerCase()
  for (const entry of KB) {
    if (entry.patterns.some(p => lower.includes(p))) return entry.response
  }
  if (lower.includes('?')) return "Great question! For specific help, WhatsApp us @nuura.pk — we respond within 2 hours. Or ask me about: products, skincare tips, shipping, payments, or returns! 🌸"
  return "I'd love to help! Try asking me about our products, skincare routines, shipping info, or payment options. Or type 'hello' to start fresh ✨"
}

const SUGGESTIONS = ['What products do you have?', 'How does COD work?', 'Skincare routine tips?', 'Delivery time?']

export function NuuraChatbot() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{ role:'bot', text:"Hi! I'm Noor, your Nuura beauty assistant ✨ Ask me about skincare tips, our products, shipping, or anything beauty-related! What can I help you with?" }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs, typing])

  const send = (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || typing) return
    setInput('')
    setShowSuggestions(false)
    setMsgs(p => [...p, { role:'user', text:msg }])
    setTyping(true)
    const delay = 700 + Math.random() * 800
    setTimeout(() => {
      setMsgs(p => [...p, { role:'bot', text:getReply(msg) }])
      setTyping(false)
    }, delay)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:20, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:20, scale:0.95 }}
            transition={{ duration:0.3, ease:[0.25,0.1,0.25,1] }}
            style={{ position:'fixed', bottom:'5.5rem', right:'1.5rem', width:'min(390px, calc(100vw - 3rem))', height:'560px', background:C.white, border:`1px solid ${C.border}`, boxShadow:'0 32px 80px rgba(11,26,15,0.18)', zIndex:89, display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Header */}
            <div style={{ background:C.forest, padding:'1.25rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(212,168,83,0.15)', border:`1px solid rgba(212,168,83,0.3)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Sparkles size={16} color={C.gold} strokeWidth={1.5} />
                </div>
                <div>
                  <p style={{ fontFamily:'var(--font-accent)', fontSize:'18px', letterSpacing:'0.15em', color:C.cream, margin:0, textTransform:'uppercase', lineHeight:1 }}>Noor</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'3px' }}>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#4CAF50', display:'block' }} />
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'11px', color:C.gold, margin:0 }}>Beauty Assistant · Online</p>
                  </div>
                </div>
              </div>
              <button onClick={()=>setOpen(false)} style={{ color:'rgba(245,240,230,0.4)', background:'transparent', border:0, cursor:'pointer', transition:'color 200ms', padding:'4px' }}
                onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.color=C.cream }}
                onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.color='rgba(245,240,230,0.4)' }}>
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              {msgs.map((m,i) => (
                <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}
                  style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', alignItems:'flex-end', gap:'8px' }}>
                  {m.role==='bot' && (
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:C.forest, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Sparkles size={12} color={C.gold} strokeWidth={1.5} />
                    </div>
                  )}
                  <div style={{ maxWidth:'80%', padding:'10px 14px', background:m.role==='user'?C.forest:C.offwhite, color:m.role==='user'?C.cream:C.ink, fontFamily:'var(--font-sans)', fontSize:'13px', lineHeight:1.65, borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px' }}>
                    {m.text}
                  </div>
                </motion.div>
              ))}

              {/* Suggestions */}
              {showSuggestions && msgs.length <= 1 && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
                  style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'0.5rem' }}>
                  {SUGGESTIONS.map((s,i) => (
                    <button key={i} onClick={()=>send(s)}
                      style={{ padding:'8px 14px', border:`1px solid ${C.border}`, background:'transparent', fontFamily:'var(--font-sans)', fontSize:'12px', color:C.muted, cursor:'pointer', borderRadius:'20px', transition:'all 200ms' }}
                      onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor=C.gold; (e.currentTarget as HTMLButtonElement).style.color=C.forest }}
                      onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor=C.border; (e.currentTarget as HTMLButtonElement).style.color=C.muted }}>
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Typing */}
              {typing && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', alignItems:'flex-end', gap:'8px' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:C.forest, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Sparkles size={12} color={C.gold} strokeWidth={1.5} />
                  </div>
                  <div style={{ padding:'12px 16px', background:C.offwhite, borderRadius:'18px 18px 18px 4px', display:'flex', gap:'4px', alignItems:'center' }}>
                    {[0,1,2].map(i => (
                      <motion.div key={i} animate={{ y:[0,-5,0] }} transition={{ duration:0.6, delay:i*0.15, repeat:Infinity }}
                        style={{ width:'5px', height:'5px', borderRadius:'50%', background:C.muted }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding:'1rem 1.25rem', borderTop:`1px solid ${C.border}`, display:'flex', gap:'10px', alignItems:'center', flexShrink:0 }}>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter')send() }}
                placeholder="Ask me anything about beauty..."
                style={{ flex:1, border:`1px solid ${C.border}`, padding:'10px 16px', fontFamily:'var(--font-sans)', fontSize:'13px', color:C.ink, background:'transparent', outline:'none', borderRadius:'24px', transition:'border-color 200ms' }}
                onFocus={e=>{ e.currentTarget.style.borderColor=C.gold }}
                onBlur={e=>{ e.currentTarget.style.borderColor=C.border }} />
              <button onClick={()=>send()}
                style={{ width:'42px', height:'42px', borderRadius:'50%', background:C.forest, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'background 200ms' }}
                onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.background=C.gold }}
                onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.background=C.forest }}>
                <Send size={16} color={C.cream} strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle */}
      <motion.button onClick={()=>setOpen(v=>!v)} whileHover={{ scale:1.08 }} whileTap={{ scale:0.95 }} data-cursor="hover"
        style={{ position:'fixed', bottom:'1.5rem', right:'1.5rem', width:'58px', height:'58px', borderRadius:'50%', background:C.forest, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:90, boxShadow:'0 8px 32px rgba(11,26,15,0.3)' }}>
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
