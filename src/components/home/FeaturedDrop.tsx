'use client'

import { AnimatedSection } from '@/components/shared/AnimatedSection'
import { AnimatedText } from '@/components/shared/AnimatedText'
import { MagneticButton } from '@/components/shared/MagneticButton'

const FEATURED_PRODUCTS = [
  {
    id: '1',
    name: 'Rose Quartz Roller',
    tagline: 'Lymphatic drainage meets ritual',
    price: 2800,
    category: 'self-care',
    badge: 'Bestseller',
  },
  {
    id: '2',
    name: 'Gua Sha Set',
    tagline: 'Ancient beauty, modern ritual',
    price: 1950,
    category: 'self-care',
    badge: 'New Drop',
  },
  {
    id: '3',
    name: 'Silk Scrunchie Bundle',
    tagline: 'Zero crease, zero compromise',
    price: 1200,
    category: 'accessories',
    badge: null,
  },
]

export default function FeaturedDrop() {
  return (
    <section className="py-24 px-8 bg-[#FDFCFB]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-16">
          <div>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-[#8A7F7A] mb-3">
              Latest Drop
            </p>
            <AnimatedText
              text="Curated for you"
              tag="h2"
              className="font-display text-4xl md:text-5xl text-[#2C2C2C]"
            />
          </div>
          <MagneticButton href="/shop">
            <span className="hidden md:block font-sans text-sm tracking-wide text-[#8A7F7A] hover:text-[#2C2C2C] transition-colors border-b border-[#8A7F7A]">
              View all
            </span>
          </MagneticButton>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURED_PRODUCTS.map((product, i) => (
            <AnimatedSection key={product.id} delay={i * 0.1}>
              <div className="group cursor-pointer" data-cursor="hover">
                {/* Product Image Placeholder */}
                <div className="relative aspect-[3/4] bg-[#F5F0E6] mb-5 overflow-hidden rounded-brand">
                  {product.badge && (
                    <span className="absolute top-4 left-4 z-10 bg-[#2C2C2C] text-white font-sans text-[10px] tracking-widest uppercase px-3 py-1">
                      {product.badge}
                    </span>
                  )}
                  {/* Placeholder gradient */}
                  <div className="absolute inset-0 brand-gradient group-hover:scale-105 transition-transform duration-700" />
                </div>

                {/* Product Info */}
                <div>
                  <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#8A7F7A] mb-1">
                    {product.category}
                  </p>
                  <h3 className="font-display text-xl text-[#2C2C2C] mb-1">
                    {product.name}
                  </h3>
                  <p className="font-sans text-sm text-[#8A7F7A] mb-3">
                    {product.tagline}
                  </p>
                  <p className="font-sans text-sm font-medium text-[#2C2C2C]">
                    Rs. {product.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
