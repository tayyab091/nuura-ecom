'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Product } from '@/types'
import FilterBar from '@/components/shop/FilterBar'
import ProductCard from '@/components/shop/ProductCard'

const FALLBACK_PRODUCTS: Product[] = [
  {
    _id: 'fallback-1',
    slug: 'rose-quartz-gua-sha',
    name: 'Rose Quartz Gua Sha',
    tagline: 'Sculpt. Depuff. Glow.',
    description: 'Authentic rose quartz gua sha for facial lifting and lymphatic drainage. Use daily with facial oil in upward strokes to reduce puffiness and define your jawline.',
    price: 2800,
    comparePrice: 3500,
    images: [
      'https://images.unsplash.com/photo-1592136957897-b2b6ca21e10d?w=800&q=85',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=85',
    ],
    category: 'self-care',
    tags: ['gua-sha', 'rose-quartz', 'facial', 'sculpt'],
    inStock: true,
    stockCount: 45,
    isFeatured: true,
    isNewDrop: true,
    isBestSeller: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    _id: 'fallback-2',
    slug: 'led-glow-mirror',
    name: 'LED Glow Mirror',
    tagline: 'Studio lighting, anywhere.',
    description: 'Compact LED vanity mirror with adjustable brightness and 10x magnification. USB rechargeable. Perfect for flawless makeup in any lighting.',
    price: 4500,
    comparePrice: 5500,
    images: [
      'https://images.unsplash.com/photo-1588514912908-b5df5f7b7c11?w=800&q=85',
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=85',
    ],
    category: 'self-care',
    tags: ['mirror', 'led', 'makeup', 'vanity'],
    inStock: true,
    stockCount: 23,
    isFeatured: true,
    isNewDrop: false,
    isBestSeller: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    _id: 'fallback-3',
    slug: 'mini-chain-crossbody',
    name: 'Mini Chain Crossbody',
    tagline: 'Small bag. Big statement.',
    description: 'Quilted mini crossbody with gold chain strap. Fits phone, cards, and lip gloss. From morning coffee to evening dinner.',
    price: 3200,
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=85',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=85',
    ],
    category: 'accessories',
    tags: ['bag', 'crossbody', 'chain', 'quilted'],
    inStock: true,
    stockCount: 18,
    isFeatured: true,
    isNewDrop: true,
    isBestSeller: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    _id: 'fallback-4',
    slug: 'jade-face-roller',
    name: 'Jade Face Roller',
    tagline: 'Roll away the stress.',
    description: 'Dual-ended jade roller for facial massage and serum absorption. Store in fridge for extra cooling. Reduces puffiness visibly.',
    price: 1800,
    comparePrice: 2200,
    images: [
      'https://images.unsplash.com/photo-1556228720-da8ead62f0f0?w=800&q=85',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=85',
    ],
    category: 'self-care',
    tags: ['jade', 'roller', 'facial', 'massage'],
    inStock: true,
    stockCount: 60,
    isFeatured: false,
    isNewDrop: false,
    isBestSeller: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    _id: 'fallback-5',
    slug: 'acrylic-clutch',
    name: 'Acrylic Box Clutch',
    tagline: 'Art you carry.',
    description: 'Clear acrylic clutch with gold hardware. A statement piece. Fits your evening essentials perfectly.',
    price: 2500,
    images: [
      'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=85',
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=85',
    ],
    category: 'accessories',
    tags: ['clutch', 'acrylic', 'transparent', 'evening'],
    inStock: true,
    stockCount: 12,
    isFeatured: false,
    isNewDrop: true,
    isBestSeller: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    _id: 'fallback-6',
    slug: 'facial-steamer',
    name: 'USB Facial Steamer',
    tagline: 'Open up. Breathe in. Glow.',
    description: 'Nano ionic facial steamer for deep pore cleansing. Use 2-3x weekly before serums. Doubles product absorption.',
    price: 3800,
    comparePrice: 4500,
    images: [
      'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=800&q=85',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=85',
    ],
    category: 'self-care',
    tags: ['steamer', 'facial', 'pores', 'hydration'],
    inStock: true,
    stockCount: 35,
    isFeatured: false,
    isNewDrop: false,
    isBestSeller: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
]

interface ShopClientProps {
  initialProducts: Product[]
}

export default function ShopClient({ initialProducts }: ShopClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')
  const [activeSort, setActiveSort] = useState('featured')

  // Fetch products from API on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Add timestamp to bypass cache
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/products?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        })
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()
        if (data.products && data.products.length > 0) {
          setProducts(data.products)
        } else {
          setProducts(FALLBACK_PRODUCTS)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts(FALLBACK_PRODUCTS)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [initialProducts])

  const filtered = useMemo(() => {
    const list = activeCategory
      ? products.filter((p) => p.category === activeCategory)
      : [...products]

    if (activeSort === 'price-asc') list.sort((a, b) => a.price - b.price)
    else if (activeSort === 'price-desc') list.sort((a, b) => b.price - a.price)
    else if (activeSort === 'newest') list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    else list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))

    return list
  }, [products, activeCategory, activeSort])

  return (
    <>
      <FilterBar
        activeCategory={activeCategory}
        activeSort={activeSort}
        onCategoryChange={setActiveCategory}
        onSortChange={setActiveSort}
      />

      <section style={{ backgroundColor: '#1B2E1F', minHeight: '100vh' }}>
        <div style={{ padding: '4rem clamp(1.5rem, 6vw, 5rem)' }}>
          {loading ? (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(245,240,230,0.6)', textAlign: 'center', padding: '6rem 0' }}>
              Loading products...
            </p>
          ) : filtered.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(245,240,230,0.6)', textAlign: 'center', padding: '6rem 0' }}>
              No products found.
            </p>
          ) : (
            <motion.div
              className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8 gap-y-12'
              initial='hidden'
              animate='visible'
              variants={{
                visible: { transition: { staggerChildren: 0.06 } },
                hidden: {},
              }}
            >
              {filtered.map((product) => (
                <motion.div
                  key={product.slug}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </>
  )
}
