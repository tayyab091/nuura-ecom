"use client"

import { useEffect, useState, useRef } from 'react'
import { X, MessageCircle, Send } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

type Msg = { id: string; role: 'user'|'assistant'|'system'; text: string }

export default function AdminChatWidget() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [used, setUsed] = useState(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedUsed = Number(window.sessionStorage.getItem('nuura-admin-chat-used') || '0')
    if (Number.isFinite(storedUsed) && storedUsed >= 0) {
      setUsed(storedUsed)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem('nuura-admin-chat-used', String(used))
  }, [used])

  useEffect(() => {
    if (!open) return
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 80)
  }, [open, messages])

  if (!pathname?.startsWith('/admin')) return null

  function clearChat() {
    setMessages([])
    setUsed(0)
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('nuura-admin-chat-used')
    }
  }

  async function send() {
    if (!input.trim() || loading) return
    if (used >= 20) return
    const userMsg: Msg = { id: String(Date.now()), role: 'user', text: input.trim() }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    setUsed((u) => u + 1)

    try {
      const res = await fetch('/api/admin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.text })) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Chat failed')
      const text = data?.text ?? 'Sorry, I could not process that.'
      const assistant: Msg = { id: String(Date.now()+1), role: 'assistant', text }
      setMessages((m) => [...m, assistant])

      // Try to parse JSON action
      try {
        const parsed = JSON.parse(text)
        if (parsed?.action === 'navigate' && parsed?.path) {
          setOpen(false)
          router.push(parsed.path)
        }
      } catch {}
    } catch (err) {
      setMessages((m) => [...m, { id: String(Date.now()+2), role: 'assistant', text: "Sorry, I couldn't process that. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ position:'fixed', right:18, bottom:18, zIndex:80 }}>
        <div style={{ position:'relative' }}>
          <button onClick={() => setOpen((s) => !s)} aria-label="Open admin chat" style={{ width:56, height:56, borderRadius:999, background:'#1B2E1F', color:'#F5F0E6', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(0,0,0,0.16)' }}>
            <MessageCircle size={22} />
          </button>
          <div style={{ position:'absolute', right:-6, top:-6, background:'#F5F0E6', color:'#1B2E1F', borderRadius:999, padding:'2px 6px', fontSize:11 }}>{used}/20</div>
        </div>

        {open && (
          <div style={{ width:360, height:520, borderRadius:12, overflow:'hidden', marginTop:12, background:'#FFFFFF', boxShadow:'0 18px 60px rgba(0,0,0,0.14)', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:12, borderBottom:'1px solid #EEE', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <strong>Admin Assistant</strong>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <button onClick={clearChat} style={{ fontSize:12, color:'#666' }}>Clear chat</button>
                <button onClick={() => setOpen(false)} aria-label="Close" style={{ background:'transparent', border:0 }}><X size={16} /></button>
              </div>
            </div>

            <div ref={scrollRef} style={{ padding:12, flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
              {messages.map((m) => (
                <div key={m.id} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth:'84%' }}>
                  <div style={{ background: m.role === 'user' ? '#1B2E1F' : '#F2F2F2', color: m.role === 'user' ? '#F5F0E6' : '#1B2E1F', padding:'8px 12px', borderRadius:12 }}>{m.text}</div>
                </div>
              ))}
              {loading && <div style={{ color:'#666' }}>• • •</div>}
            </div>

            <div style={{ padding:12, borderTop:'1px solid #EEE', display:'flex', gap:8 }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} disabled={used>=20} placeholder={used>=20? 'Session limit reached. Please refresh to start a new session.':'Ask the admin assistant...'} style={{ flex:1, padding:'10px 12px', borderRadius:8, border:'1px solid #EAEAEA' }} onKeyDown={(e) => { if (e.key === 'Enter') void send() }} />
              <button onClick={() => void send()} disabled={loading || used>=20} style={{ width:44, height:44, borderRadius:8, background:'#1B2E1F', color:'#F5F0E6', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
