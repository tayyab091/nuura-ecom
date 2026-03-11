'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Product } from '@/types'
import { useCart } from '@/hooks/useCart'
import { scaleIn } from '@/lib/animations'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  return (
    <motion.div
      variants={scaleIn}
      className="group"
      data-cursor="hover"
    >
      <Link href={`/product/${product.slug}`}>
        {/* Image */}
        <div className="relative aspect-[3/4] bg-[#F5F0E6] mb-4 overflow-hidden rounded-brand">
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {product.isNewDrop && (
              <span className="bg-[#2C2C2C] text-white font-sans text-[9px] tracking-widest uppercase px-2 py-1">
                New
              </span>
            )}
            {product.isBestSeller && (
              <span className="bg-[#F8D7DA] text-[#2C2C2C] font-sans text-[9px] tracking-widest uppercase px-2 py-1">
                Bestseller
              </span>
            )}
            {discount && (
              <span className="bg-[#B2BDB5] text-white font-sans text-[9px] tracking-widest uppercase px-2 py-1">
                -{discount}%
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center">
              <span className="font-sans text-xs tracking-widest uppercase text-[#8A7F7A]">
                Sold Out
              </span>
            </div>
          )}

          {/* Image placeholder */}
          <div className="absolute inset-0 brand-gradient group-hover:scale-105 transition-transform duration-700" />
        </div>
      </Link>

      {/* Info */}
      <div className="space-y-1">
        <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#8A7F7A]">
          {product.category}
        </p>
        <h3 className="font-display text-lg text-[#2C2C2C] leading-tight">
          {product.name}
        </h3>
        <p className="font-sans text-sm text-[#8A7F7A]">{product.tagline}</p>
        <div className="flex items-center gap-3 pt-1">
          <span className="font-sans text-sm font-medium text-[#2C2C2C]">
            Rs. {product.price.toLocaleString()}
          </span>
          {product.comparePrice && (
            <span className="font-sans text-xs text-[#8A7F7A] line-through">
              Rs. {product.comparePrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Quick Add */}
        {product.inStock && (
          <button
            onClick={() => addItem(product)}
            className="w-full mt-3 py-3 border border-[#2C2C2C] font-sans text-xs tracking-widest uppercase text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white transition-colors duration-300 opacity-0 group-hover:opacity-100"
          >
            Quick Add
          </button>
        )}
      </div>
    </motion.div>
  )
}
