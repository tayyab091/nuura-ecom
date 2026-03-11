'use client'

import { useState } from 'react'
import FilterBar from '@/components/shop/FilterBar'
import ProductGrid from '@/components/shop/ProductGrid'
import { Product } from '@/types'
import { AnimatedText } from '@/components/shared/AnimatedText'

// Placeholder product data – will be replaced with API data
const MOCK_PRODUCTS: Product[] = [
  {
    _id: '1',
    slug: 'rose-quartz-roller',
    name: 'Rose Quartz Roller',
    tagline: 'Lymphatic drainage meets ritual',
    description: 'Handcrafted from genuine rose quartz. Cool to the touch, gentle on the skin. Reduces puffiness and promotes circulation with every roll.',
    price: 2800,
    comparePrice: 3500,
    images: [],
    category: 'self-care',
    tags: ['skincare', 'roller', 'rose quartz'],
    inStock: true,
    stockCount: 24,
    isFeatured: true,
    isNewDrop: false,
    isBestSeller: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    slug: 'gua-sha-set',
    name: 'Gua Sha Set',
    tagline: 'Ancient beauty, modern ritual',
    description: 'Premium jade gua sha tool for facial sculpting and tension relief. Includes usage guide.',
    price: 1950,
    images: [],
    category: 'self-care',
    tags: ['gua sha', 'jade', 'facial'],
    inStock: true,
    stockCount: 18,
    isFeatured: true,
    isNewDrop: true,
    isBestSeller: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '3',
    slug: 'silk-scrunchie-bundle',
    name: 'Silk Scrunchie Bundle',
    tagline: 'Zero crease, zero compromise',
    description: 'Set of 5 mulberry silk scrunchies in warm neutral tones. Gentle on hair, stunning on your wrist.',
    price: 1200,
    images: [],
    category: 'accessories',
    tags: ['scrunchie', 'silk', 'hair'],
    inStock: true,
    stockCount: 50,
    isFeatured: false,
    isNewDrop: false,
    isBestSeller: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '4',
    slug: 'facial-ice-globes',
    name: 'Facial Ice Globes',
    tagline: 'Chill your way to clarity',
    description: 'Stainless steel ice globes for de-puffing and tightening. Fill with water and freeze.',
    price: 3200,
    images: [],
    category: 'self-care',
    tags: ['ice globes', 'de-puff'],
    inStock: true,
    stockCount: 12,
    isFeatured: false,
    isNewDrop: true,
    isBestSeller: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const filtered = MOCK_PRODUCTS.filter((p) => {
    if (activeCategory && p.category !== activeCategory) return false
    if (activeFilter === 'new' && !p.isNewDrop) return false
    if (activeFilter === 'bestseller' && !p.isBestSeller) return false
    if (activeFilter === 'sale' && !p.comparePrice) return false
    return true
  })

  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-32 pb-24 px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-[#8A7F7A] mb-4">
            All Products
          </p>
          <AnimatedText
            text="The Nuura Edit"
            tag="h1"
            className="font-display text-5xl text-[#2C2C2C]"
          />
        </div>

        {/* Filters */}
        <FilterBar
          activeCategory={activeCategory}
          activeFilter={activeFilter}
          onCategoryChange={setActiveCategory}
          onFilterChange={setActiveFilter}
        />

        {/* Products */}
        <ProductGrid products={filtered} />
      </div>
    </div>
  )
}
