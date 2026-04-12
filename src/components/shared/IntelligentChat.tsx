'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send, ExternalLink } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import Link from 'next/link'

interface Product {
  _id: string
  slug: string
  name: string
  price: number
  comparePrice?: number
  tagline: string
  description: string
  images: string[]
  category: string
  tags: string[]
  inStock: boolean
  stockCount: number
  isFeatured: boolean
  isNewDrop: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'ai' | 'system'
  content: string
  products?: Product[]
  isTyping?: boolean
  showProducts?: boolean
}

interface ProductSearchResult {
  products: Product[]
  query: string
  filters: { minPrice?: number; maxPrice?: number; category?: string }
}

export default function IntelligentChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const cartStore = useCartStore()
  const conversationRef = useRef<ChatMessage[]>([])

  // ========== PRODUCT DATA LOADING ==========
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=100', {
          cache: 'no-store',
        })
        const data = await response.json()
        if (data.products) {
          setAllProducts(data.products)
        }
      } catch (error) {
        console.error('Failed to load products:', error)
      }
      setIsLoading(false)
    }

    loadProducts()
  }, [])

  // ========== WELCOME MESSAGE ==========
  useEffect(() => {
    if (isOpen && messages.length === 0 && !isLoading) {
      const welcome: ChatMessage = {
        id: 'welcome-' + Date.now(),
        role: 'ai',
        content: `Hello! 👋 I'm Noor, Nuura's AI shopping assistant. I can help you with:

🔍 **Search & Discovery** - Find products by name, price, or category
💎 **Smart Recommendations** - Get personalized suggestions
📖 **Skincare Advice** - Routines, tips, tricks for your skin type
📦 **Order Tracking** - Track your orders in real-time
🛒 **Cart Help** - Add/remove items, apply coupons
❓ **FAQs** - Shipping, returns, payments

What would you like help with?`,
      }
      setMessages([welcome])
      conversationRef.current = [welcome]
    }
  }, [isOpen, messages.length, isLoading])

  // ========== AUTO SCROLL ==========
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ========== PRODUCT SEARCH & FILTER ==========
  const searchProducts = useCallback(
    (query: string): ProductSearchResult => {
      const lower = query.toLowerCase()

      // Parse price filters
      let minPrice = 0
      let maxPrice = Infinity
      let categoryFilter = ''

      // Extract price range
      const underMatch = lower.match(/under\s+(?:pkr\s*)?(\d+)/)
      const overMatch = lower.match(/(?:over|above|minimum)\s+(?:pkr\s*)?(\d+)/)
      const betweenMatch = lower.match(/between\s+(?:pkr\s*)?(\d+)\s+(?:and|to)\s+(?:pkr\s*)?(\d+)/)

      if (underMatch) maxPrice = parseInt(underMatch[1])
      if (overMatch) minPrice = parseInt(overMatch[1])
      if (betweenMatch) {
        minPrice = parseInt(betweenMatch[1])
        maxPrice = parseInt(betweenMatch[2])
      }

      // Extract category
      if (lower.includes('self-care') || lower.includes('skincare') || lower.includes('beauty')) {
        categoryFilter = 'self-care'
      } else if (lower.includes('accessor') || lower.includes('bag') || lower.includes('clutch')) {
        categoryFilter = 'accessories'
      }

      // Search logic
      let results = allProducts.filter((p) => {
        const matchesText =
          p.name.toLowerCase().includes(lower) ||
          p.tagline.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower) ||
          p.tags.some((t) => lower.includes(t))

        const matchesPrice = p.price >= minPrice && p.price <= maxPrice
        const matchesCategory = !categoryFilter || p.category === categoryFilter

        return matchesText && matchesPrice && matchesCategory
      })

      // Special filters
      if (lower.includes('new') || lower.includes('latest')) {
        results = allProducts.filter((p) => p.isNewDrop)
      }
      if (lower.includes('best seller') || lower.includes('popular') || lower.includes('trending')) {
        results = allProducts.filter((p) => p.isFeatured || p.isNewDrop)
      }
      if (
        lower.trim() === 'products' ||
        lower.trim() === 'product' ||
        lower.trim() === 'all products' ||
        lower.trim() === 'all product' ||
        lower.includes('all product') ||
        lower.includes('everything') ||
        lower === 'show me products' ||
        lower === 'show products' ||
        lower === 'show all products' ||
        lower === 'catalog' ||
        lower === 'catalogue'
      ) {
        results = allProducts
      }

      return { products: results.slice(0, 10), query, filters: { minPrice, maxPrice, category: categoryFilter } }
    },
    [allProducts]
  )

  const hasProductIntent = useCallback((text: string) => {
    const lower = text.toLowerCase().trim()
    if (!lower) return false

    return (
      lower === 'products' ||
      lower === 'product' ||
      lower.includes('show') ||
      lower.includes('find') ||
      lower.includes('search') ||
      lower.includes('recommend') ||
      lower.includes('suggest') ||
      lower.includes('best seller') ||
      lower.includes('popular') ||
      lower.includes('trending') ||
      lower.includes('new') ||
      lower.includes('latest') ||
      lower.includes('under') ||
      lower.includes('over') ||
      lower.includes('between') ||
      lower.includes('pkr') ||
      lower.includes('price') ||
      lower.includes('category') ||
      lower.includes('skincare') ||
      lower.includes('self-care') ||
      lower.includes('accessories') ||
      allProducts.some(
        (p) =>
          lower.includes(p.slug) ||
          lower.includes(p.name.toLowerCase()) ||
          p.tags.some((t) => lower.includes(t))
      )
    )
  }, [allProducts])

  // ========== PRODUCT RECOMMENDATION ==========
  const getRelatedProducts = useCallback(
    (productSlug: string): Product[] => {
      const product = allProducts.find((p) => p.slug === productSlug)
      if (!product) return []

      // Find related products: same category, similar tags, or featured
      return allProducts
        .filter((p) => p.slug !== productSlug)
        .filter(
          (p) =>
            p.category === product.category ||
            p.tags.some((t) => product.tags.includes(t)) ||
            p.isFeatured
        )
        .slice(0, 3)
    },
    [allProducts]
  )

  // ========== INTELLIGENT CHAT PROCESSING ==========
  const processUserMessage = useCallback(
    async (userMessage: string): Promise<ChatMessage> => {
      const lower = userMessage.toLowerCase()

      // Attach product cards whenever we can detect product intent.
      // The textual reply should come from the AI, not hardcoded templates.
      let attachedProducts: Product[] | undefined
      if (hasProductIntent(userMessage)) {
        const results = searchProducts(userMessage)
        if (results.products.length > 0) {
          attachedProducts = results.products
        } else if (allProducts.length > 0 && (lower.trim() === 'products' || lower.trim() === 'product')) {
          attachedProducts = allProducts.slice(0, 10)
        }
      }

      const mentioned = allProducts.find(
        (p) =>
          lower.includes(p.slug) ||
          lower.includes(p.name.toLowerCase()) ||
          p.tags.some((t) => lower.includes(t))
      )
      if (mentioned) {
        const related = getRelatedProducts(mentioned.slug)
        attachedProducts = [mentioned, ...related]
      }

      const productsContext = (attachedProducts ?? [])
        .slice(0, 10)
        .map(
          (p) =>
            `- ${p.name} (slug: ${p.slug}, PKR ${p.price}, ${p.inStock ? `in stock: ${p.stockCount}` : 'out of stock'})`
        )
        .join('\n')

      try {
        const aiResponse = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...conversationRef.current.slice(-6).map((m) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content.substring(0, 300),
              })),
              {
                role: 'user',
                content:
                  productsContext.length > 0
                    ? `${userMessage}\n\n(For your reference, here are relevant Nuura products you can recommend with links like /product/[slug]:\n${productsContext})`
                    : userMessage,
              },
            ],
            useHuggingFace: true,
          }),
        })

        if (aiResponse.ok) {
          const data = await aiResponse.json()
          if (data.response && !data.loading) {
            return {
              id: Date.now().toString(),
              role: 'ai',
              content: data.response,
              products: attachedProducts,
            }
          }
        }
      } catch (error) {
        console.error('AI Chat error:', error)
      }

      // Minimal fallback if the AI provider is unavailable.
      return {
        id: Date.now().toString(),
        role: 'ai',
        content:
          "I'm having trouble reaching my AI right now — please try again in a moment. If you tell me your skin type + budget, I can recommend the best Nuura options.",
        products: attachedProducts,
      }
    },
    [allProducts, searchProducts, getRelatedProducts, hasProductIntent]
  )

  // ========== SEND MESSAGE ==========
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userText = inputValue.trim()
    setInputValue('')

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userText }
    setMessages((prev) => [...prev, userMsg])
    conversationRef.current = [...conversationRef.current, userMsg]

    const typingMsg: ChatMessage = {
      id: Date.now().toString() + '-typing',
      role: 'ai',
      content: 'Thinking... 💭',
      isTyping: true,
    }
    setMessages((prev) => [...prev, typingMsg])

    // Simulate slight delay for natural feel (HF inference takes time)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const response = await processUserMessage(userText)
    setMessages((prev) => prev.filter((m) => m.id !== typingMsg.id) .concat(response))
    conversationRef.current = [...conversationRef.current, response]
  }

  if (isLoading) {
    return null
  }

  return (
    <>
      <style>{`
        .nuura-chat-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .nuura-chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .nuura-chat-scroll::-webkit-scrollbar-thumb {
          background: #D4A853;
          border-radius: 3px;
        }
        .nuura-chat-scroll::-webkit-scrollbar-thumb:hover {
          background: #C49543;
        }
      `}</style>
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
      <AnimatePresence mode="sync">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: '4.5rem',
              right: 0,
              width: 'min(calc(100vw - 2rem), 420px)',
              height: '600px',
              background: '#FAFAF8',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1B2E1F 0%, #233A27 100%)',
                color: '#F5F0E6',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.8 }}>
                  Powered by AI
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginTop: '0.25rem' }}>Noor Assistant</div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: '#F5F0E6',
                  cursor: 'pointer',
                  opacity: 0.7,
                  transition: 'opacity 200ms',
                }}
                onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.opacity = '1')}
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.opacity = '0.7')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                backgroundColor: '#FAFAF8',
                scrollBehavior: 'smooth',
              }}
              className="nuura-chat-scroll"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  <div
                    style={{
                      background: msg.role === 'user' ? '#1B2E1F' : '#F0EBE3',
                      color: msg.role === 'user' ? '#F5F0E6' : '#1A1714',
                      padding: '0.875rem 1.125rem',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.isTyping ? '⏳ ' : ''}
                    {msg.content}
                  </div>
                  
                  {msg.products && msg.products.length > 0 && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {msg.products.map((product) => (
                        <Link key={product._id} href={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
                          <motion.div
                            whileHover={{ y: -2 }}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #E8E0D8',
                              borderRadius: '12px',
                              padding: '1rem',
                              cursor: 'pointer',
                              display: 'block',
                            }}
                          >
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '14px', color: '#1A1714', marginBottom: '0.25rem' }}>
                                  {product.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.5rem' }}>{product.tagline}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <span style={{ fontWeight: 'bold', color: '#1B2E1F', fontSize: '14px' }}>PKR {product.price}</span>
                                    {product.comparePrice && (
                                      <span style={{ textDecoration: 'line-through', marginLeft: '0.5rem', color: '#999', fontSize: '12px' }}>
                                        {product.comparePrice}
                                      </span>
                                    )}
                                  </div>
                                  <ExternalLink size={14} style={{ color: '#D4A853', flexShrink: 0 }} />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '1rem', borderTop: '1px solid #E8E0D8', background: '#FAFAF8' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything..."
                  style={{
                    flex: 1,
                    padding: '0.85rem 1rem',
                    borderRadius: '24px',
                    border: '1px solid #DDD8CF',
                    background: '#FFFFFF',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    outline: 'none',
                    color: '#1A1714',
                  }}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#1B2E1F',
                    color: '#F5F0E6',
                    border: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                    opacity: inputValue.trim() ? 1 : 0.5,
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={(e) => {
                    if (inputValue.trim()) {
                      (e.currentTarget as HTMLButtonElement).style.background = '#D4A853'
                      ;(e.currentTarget as HTMLButtonElement).style.color = '#1B2E1F'
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#1B2E1F'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#F5F0E6'
                  }}
                >
                  <Send size={16} strokeWidth={1.5} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1B2E1F 0%, #233A27 100%)',
          color: '#F5F0E6',
          border: '1px solid rgba(245,240,230,0.2)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </motion.button>
      </div>
    </>
  )
}
