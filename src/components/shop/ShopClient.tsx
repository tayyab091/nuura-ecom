'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Product } from '@/types'
import FilterBar from '@/components/shop/FilterBar'
import ProductCard from '@/components/shop/ProductCard'

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
          setProducts(initialProducts)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts(initialProducts)
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
