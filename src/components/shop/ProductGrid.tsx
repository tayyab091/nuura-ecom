'use client'

import { motion } from 'framer-motion'
import ProductCard from './ProductCard'
import { Product } from '@/types'
import { staggerContainer } from '@/lib/animations'

interface ProductGridProps {
  products: Product[]
  loading?: boolean
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8 gap-y-12">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] bg-[#EDE0D4] rounded-brand mb-4" />
            <div className="h-3 bg-[#EDE0D4] rounded w-1/3 mb-2" />
            <div className="h-4 bg-[#EDE0D4] rounded w-3/4 mb-2" />
            <div className="h-3 bg-[#EDE0D4] rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-2xl text-[#2C2C2C] mb-3">No products found</p>
        <p className="font-sans text-sm text-[#8A7F7A]">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8 gap-y-12"
    >
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </motion.div>
  )
}
