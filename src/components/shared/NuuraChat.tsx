'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'ai' | 'system'
  content: string
  isTyping?: boolean
  isColdStart?: boolean
}

export default function NuuraChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Fetch products on mount
  useEffect(() => {
    let mounted = true
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?limit=50')
        if (res.ok) {
          const data = await res.json()
          if (mounted) {
            setProducts(data.products || [])
            if (data.products?.length === 0) {
              setMessages([{
                id: 'sys-empty',
                role: 'system',
                content: 'New drop coming soon! Follow us on Instagram to be the first to know 🌙'
              }])
            } else {
              setMessages([{
                id: 'sys-welcome',
                role: 'ai',
                content: 'Hello! I am Nuura\'s beauty advisor. How can I help you find your glow today? ✨'
              }])
            }
          }
        } else {
          throw new Error('Failed to load')
        }
      } catch (err) {
        if (mounted) {
          setMessages([{
            id: 'sys-fail',
            role: 'system',
            content: 'Showing general advice — live catalog unavailable'
          }])
        }
      } finally {
        if (mounted) setIsLoadingProducts(false)
      }
    }
    fetchProducts()

    return () => { mounted = false }
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputValue.trim()) return

    const userText = inputValue.trim()
    setInputValue('')

    const lower = userText.toLowerCase()
    // Off-topic basic heuristic
    const isBeautyRelated = /skin|face|hair|beauty|glow|product|price|cost|buy|order|cream|serum|nuura|self[-\s]?care|makeup/.test(lower)
    const isGreeting = /hi|hello|hey|salam|assalam/.test(lower)
    
    // Order tracking/complaints check
    const isOrderQuery = /track|where is my order|complaint|return|refund|shipping time|delayed/.test(lower)

    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userText }
    setMessages(prev => [...prev, newUserMsg])

    if (isOrderQuery) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(), role: 'ai', 
          content: 'For order help, please DM us on Instagram or check your order confirmation. We will sort it out for you!'
        }])
      }, 500)
      return
    }

    if (!isBeautyRelated && !isGreeting && lower.length > 15) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(), role: 'ai', 
          content: 'I am Nuura\'s beauty advisor — I can only help with skincare, self-care, and our products. Anything glow-related I can help with? ✨'
        }])
      }, 500)
      return
    }

    const typingId = Date.now().toString() + '-typing'
    setMessages(prev => [...prev, { id: typingId, role: 'ai', content: '', isTyping: true, isColdStart: true }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, products }),
      })

      setMessages(prev => prev.filter(m => m.id !== typingId))

      if (!res.ok) {
        throw new Error('HF Error')
      }

      const data = await res.json()

      if (data.error || !data.response) {
        throw new Error('Empty or error response')
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: data.response }])

    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'system', 
        content: 'Our advisor is resting right now 🌙 Visit nuura-temp.vercel.app/shop or DM us on Instagram!'
      }])
    }
  }

  const QUICK_REPLIES = ["What's new?", "Best for glowing skin?", "Delivery options"]

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', bottom: '4.5rem', right: 0,
              width: 'min(calc(100vw - 2rem), 380px)',
              height: '520px',
              backgroundColor: '#FAFAF8',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              backgroundColor: '#0F1A11', color: '#F5F0E6', padding: '1.25rem 1.5rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.2em', margin: 0, textTransform: 'uppercase' }}>NUURA AI</h3>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#D4A853', margin: 0, lineHeight: 1, paddingTop: '0.25rem' }}>نور</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 0, color: 'rgba(245,240,230,0.7)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#FAFAF8' }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : msg.role === 'system' ? 'center' : 'flex-start',
                  maxWidth: '85%',
                  whiteSpace: 'pre-line',
                }}>
                  {msg.role === 'system' ? (
                    <div style={{
                      backgroundColor: 'rgba(212,168,83,0.1)', color: '#1B2E1F', border: '1px solid rgba(212,168,83,0.2)',
                      padding: '0.75rem 1rem', borderRadius: '12px', fontFamily: 'var(--font-sans)', fontSize: '12px', textAlign: 'center'
                    }}>
                      {msg.content}
                    </div>
                  ) : msg.isTyping ? (
                    <div style={{
                      backgroundColor: '#F5F0E6', color: '#6B7B6E',
                      padding: '0.75rem 1.25rem', borderRadius: '18px 18px 18px 4px',
                      fontFamily: 'var(--font-sans)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                      {msg.isColdStart ? 'Waking up our glow advisor... ✨' : 'Thinking...'}
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: msg.role === 'user' ? '#0F1A11' : '#F5F0E6',
                      color: msg.role === 'user' ? '#FAFAF8' : '#1A1714',
                      padding: '0.75rem 1.25rem',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      fontFamily: 'var(--font-sans)', fontSize: '13.5px', lineHeight: 1.5,
                      border: msg.role === 'ai' ? '1px solid rgba(27,46,31,0.05)' : 'none'
                    }}>
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '1rem', borderTop: '1px solid #E8E0D8', backgroundColor: '#FAFAF8' }}>
              {messages.length >= 1 && messages[messages.length - 1].role === 'ai' && (
                <div className="no-scrollbar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                  {QUICK_REPLIES.map(qr => (
                    <button key={qr} onClick={() => { setInputValue(qr); setTimeout(() => handleSend({ preventDefault: () => {} } as unknown as React.FormEvent), 0); }}
                      style={{
                        whiteSpace: 'nowrap', padding: '0.4rem 0.8rem', borderRadius: '20px',
                        border: '1px solid #D4A853', backgroundColor: 'transparent',
                        color: '#1B2E1F', fontFamily: 'var(--font-sans)', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(212,168,83,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}
              
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about our products..."
                  disabled={isLoadingProducts}
                  style={{
                    flex: 1, padding: '0.85rem 1rem', borderRadius: '24px',
                    border: '1px solid #E8E0D8', backgroundColor: '#FFFFFF',
                    fontFamily: 'var(--font-sans)', fontSize: '13px', outline: 'none',
                    color: '#1A1714'
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoadingProducts || !inputValue.trim()}
                  style={{
                    width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: '#1B2E1F', color: '#F5F0E6',
                    border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: inputValue.trim() ? 'pointer' : 'not-allowed', opacity: inputValue.trim() ? 1 : 0.4,
                    transition: 'opacity 0.2s'
                  }}
                >
                  <Send size={16} strokeWidth={1.5} style={{ marginLeft: '-2px', marginTop: '2px' }} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px', height: '60px', borderRadius: '50%',
          backgroundColor: '#0F1A11', color: '#FAFAF8',
          border: '1px solid #1B2E1F',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? <X size={24} strokeWidth={1.5} /> : <Sparkles size={24} strokeWidth={1.5} color="#FFFFFF" />}
      </button>
      
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}} />
    </div>
  )
}
