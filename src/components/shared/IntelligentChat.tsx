'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
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
        content: `Hello! 👋 I'm Noor, Nuura's AI shopping assistant. I can help you with:\n\n🔍 **Search & Discovery** - Find products by name, price, or category\n💎 **Smart Recommendations** - Get suggestions based on what you like\n📦 **Order Tracking** - Track your orders in real-time\n🛒 **Cart Help** - Add/remove items, apply coupons\n❓ **FAQs** - Shipping, returns, payments\n\nWhat would you like help with?`,
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
        lower.includes('all product') ||
        lower.includes('everything') ||
        lower === 'show me products'
      ) {
        results = allProducts
      }

      return { products: results.slice(0, 10), query, filters: { minPrice, maxPrice, category: categoryFilter } }
    },
    [allProducts]
  )

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

      // ===== PRODUCT SEARCH =====
      if (
        lower.includes('show') ||
        lower.includes('find') ||
        lower.includes('search') ||
        lower.includes('product') ||
        lower.includes('under') ||
        lower.includes('over') ||
        lower.includes('category') ||
        lower.includes('price')
      ) {
        const results = searchProducts(userMessage)
        if (results.products.length > 0) {
          const productList = results.products
            .map((p) => `• **${p.name}** - PKR ${p.price} ${p.comparePrice ? `(was ${p.comparePrice})` : ''}\n  ${p.tagline}\n  [View →](/product/${p.slug})`)
            .join('\n\n')

          return {
            id: Date.now().toString(),
            role: 'ai',
            content: `Found ${results.products.length} product${results.products.length > 1 ? 's' : ''} matching your search:\n\n${productList}\n\n💬 Click any link to view details or ask me for recommendations!`,
            products: results.products,
          }
        }
        return {
          id: Date.now().toString(),
          role: 'ai',
          content: `Sorry, no products match that search. Try:\n• "Show self-care under 3000"\n• "Skincare products"\n• "All products"\n• "Best sellers"`,
        }
      }

      // ===== PRODUCT INQUIRY =====
      const mentioned = allProducts.find(
        (p) => lower.includes(p.slug) || lower.includes(p.name.toLowerCase()) || p.tags.some((t) => lower.includes(t))
      )
      if (mentioned) {
        const related = getRelatedProducts(mentioned.slug)
        const discount = mentioned.comparePrice
          ? Math.round(((mentioned.comparePrice - mentioned.price) / mentioned.comparePrice) * 100)
          : 0

        let response = `**${mentioned.name}** ✨\n\n${mentioned.tagline}\n\n**Price:** PKR ${mentioned.price}`
        if (mentioned.comparePrice) response += ` (was PKR ${mentioned.comparePrice}) - Save ${discount}%`
        response += `\n\n**Description:** ${mentioned.description}\n\n**Status:** ${mentioned.inStock ? '✅ In Stock' : '❌ Out of Stock'} (${mentioned.stockCount} available)`

        if (!lower.includes('related') && !lower.includes('similar')) {
          response += `\n\n[→ View Full Product Details](/product/${mentioned.slug})`
        }

        if (related.length > 0) {
          response += `\n\n**Customers also liked:**\n${related.map((p) => `• ${p.name}`).join('\n')}`
        }

        return {
          id: Date.now().toString(),
          role: 'ai',
          content: response,
          products: [mentioned, ...related],
        }
      }

      // ===== ORDER TRACKING =====
      if (lower.includes('track') || lower.includes('order') || lower.includes('where')) {
        return {
          id: Date.now().toString(),
          role: 'ai',
          content: `To track your order, please provide your **Order Number** (e.g., NR-260101-1234). You can find it in your confirmation email or WhatsApp message from Nuura. 📦\n\nNeed help with anything else?`,
        }
      }

      // ===== CART MANAGEMENT =====
      if (lower.includes('add') || lower.includes('cart')) {
        const product = allProducts.find(
          (p) => lower.includes(p.slug) || lower.includes(p.name.toLowerCase()) || p.tags.some((t) => lower.includes(t))
        )
        if (product) {
          return {
            id: Date.now().toString(),
            role: 'ai',
            content: `I found **${product.name}** (PKR ${product.price}).\n\n👉 [Add to Cart →](/product/${product.slug})\n\nWould you like to proceed to checkout?`,
            products: [product],
          }
        }
        return {
          id: Date.now().toString(),
          role: 'ai',
          content: `Which product would you like to add? Try saying:\n• "Add night cream"\n• "Add gua sha to cart"\n• "Show me products under 2000"`,
        }
      }

      // ===== FAQ RESPONSES =====
      if (lower.includes('shipping') || lower.includes('delivery') || lower.includes('how long')) {
        return {
          id: Date.now().toString(),
          role: 'ai',
          content: `📦 **Shipping Info:**\n• **Lahore/Karachi/Islamabad:** 2-3 days\n• **Other cities:** 3-5 days\n• **Free shipping** on orders over PKR 5,000\n• **Standard cost:** PKR 150-300\n\nWe use TCS & Leopard Couriers. Track your order once it ships! 🚚`,
        }
      }

      if (lower.includes('return') || lower.includes('refund') || lower.includes('exchange')) {
        return {
          id: Date.now().toString(),
          role: 'ai',
          content: `↩️ **Return Policy:**\n• **7-day hassle-free returns** on unused items\n• Must be in original packaging\n• **Damaged items?** WhatsApp us photos within 24 hours\n• We'll replace for free or refund in 3-5 business days\n\nWe prioritize customer satisfaction! 💚`,
        }
      }

      if (lower.includes('payment') || lower.includes('pay') || lower.includes('cod')) {
        return {
          id: Date.now().toString(),
          role: 'ai',
          content: `💳 **Payment Methods:**\n• **Cash on Delivery (COD)** - Most popular!\n• **JazzCash** - Transfer amount, WhatsApp screenshot\n• **EasyPaisa** - Same process\n• **NayaPay** - Digital payment option\n\nOrders confirmed within 1-2 hours of payment verification. Need help? WhatsApp @nuura.pk`,
        }
      }

      if (lower.includes('coupon') || lower.includes('discount') || lower.includes('promo')) {
        return {
          id: Date.now().toString(),
          role: 'ai',
          content: `🎁 **Active Discount Codes:**\n• **NUURA10** - 10% off first order\n• **GLOW5** - PKR 500 off orders over PKR 5,000\n• **Free shipping** on orders over PKR 5,000\n\nApply codes at checkout! ✨`,
        }
      }

      // ===== GENERAL CONVERSATION & ADVICE =====
      // Route general conversational queries to Gemini for intelligent responses
      if (
        lower.includes('routine') ||
        lower.includes('tip') ||
        lower.includes('advice') ||
        lower.includes('skin') ||
        lower.includes('face') ||
        lower.includes('how') ||
        lower.includes('what') ||
        lower.includes('why') ||
        lower.includes('help') ||
        lower.includes('recommend') ||
        lower.includes('best') ||
        lower.length < 15 // Short messages like "hello", "hi", "hey"
      ) {
        // These will be handled by Gemini API below
        // Just fall through to Gemini call
      } else {
        // If message doesn't match any patterns and is short/generic, try Gemini
      }

      // ===== USE GEMINI FOR UNMATCHED QUERIES =====
      try {
        const geminiResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...conversationRef.current.slice(-6).map((m) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content.substring(0, 500), // Limit context size
              })),
              { role: 'user', content: userMessage },
            ],
          }),
        })

        if (geminiResponse.ok) {
          const data = await geminiResponse.json()
          if (data.response) {
            return {
              id: Date.now().toString(),
              role: 'ai',
              content: data.response,
            }
          }
        } else {
          console.error('Gemini API returned non-ok status:', geminiResponse.status)
        }
      } catch (error) {
        console.error('Gemini API call failed:', error)
      }

      // ===== DEFAULT FALLBACK =====
      return {
        id: Date.now().toString(),
        role: 'ai',
        content: `I'm here to help! Try asking:\n\n🔍 "Show skincare under 3000"\n💎 "Best sellers"\n📦 "Track my order"\n❓ "Shipping info"\n🎁 "Discount codes"\n\nWhat would you like?`,
      }
    },
    [allProducts, searchProducts, getRelatedProducts]
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
      content: 'Thinking...',
      isTyping: true,
    }
    setMessages((prev) => [...prev, typingMsg])

    // Simulate slight delay for natural feel
    await new Promise((resolve) => setTimeout(resolve, 500))

    const response = await processUserMessage(userText)
    setMessages((prev) => prev.filter((m) => m.id !== typingMsg.id) .concat(response))
    conversationRef.current = [...conversationRef.current, response]
  }

  if (isLoading) {
    return null
  }

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
      <AnimatePresence>
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
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
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
  )
}
