'use client'

import { Product } from '@/types'
import { AnimatedText } from '@/components/shared/AnimatedText'
import { AnimatedSection } from '@/components/shared/AnimatedSection'

interface ProductInfoProps {
  product: Product
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  return (
    <div className="space-y-6">
      {/* Category */}
      <AnimatedSection>
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#8A7F7A]">
          {product.category}
        </p>
      </AnimatedSection>

      {/* Name */}
      <AnimatedText
        text={product.name}
        tag="h1"
        className="font-display text-3xl md:text-4xl text-[#2C2C2C] leading-tight"
      />

      {/* Tagline */}
      <AnimatedSection delay={0.1}>
        <p className="font-accent text-lg text-[#8A7F7A] italic">{product.tagline}</p>
      </AnimatedSection>

      {/* Price */}
      <AnimatedSection delay={0.15}>
        <div className="flex items-center gap-3">
          <span className="font-sans text-2xl font-medium text-[#2C2C2C]">
            Rs. {product.price.toLocaleString()}
          </span>
          {product.comparePrice && (
            <>
              <span className="font-sans text-base text-[#8A7F7A] line-through">
                Rs. {product.comparePrice.toLocaleString()}
              </span>
              <span className="bg-[#F8D7DA] text-[#2C2C2C] font-sans text-xs px-2 py-1">
                Save {discount}%
              </span>
            </>
          )}
        </div>
      </AnimatedSection>

      {/* Description */}
      <AnimatedSection delay={0.2}>
        <div className="border-t border-[#EDE0D4] pt-6">
          <p className="font-sans text-sm text-[#8A7F7A] leading-relaxed">
            {product.description}
          </p>
        </div>
      </AnimatedSection>

      {/* Tags */}
      {product.tags.length > 0 && (
        <AnimatedSection delay={0.25}>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-[#F5F0E6] font-sans text-xs text-[#8A7F7A] rounded-brand"
              >
                {tag}
              </span>
            ))}
          </div>
        </AnimatedSection>
      )}
    </div>
  )
}
