'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductImagesProps {
  images: string[]
  name: string
}

export default function ProductImages({ images, name }: ProductImagesProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const placeholders = images.length > 0
    ? images
    : ['placeholder-1', 'placeholder-2', 'placeholder-3']

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-[#F5F0E6] rounded-brand overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 brand-gradient"
          />
        </AnimatePresence>

        {/* Prev/Next */}
        {placeholders.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((i) => (i - 1 + placeholders.length) % placeholders.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setActiveIndex((i) => (i + 1) % placeholders.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {placeholders.length > 1 && (
        <div className="flex gap-3 overflow-x-auto hide-scrollbar">
          {placeholders.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 w-20 aspect-square bg-[#F5F0E6] rounded-brand overflow-hidden transition-all duration-200 ${
                i === activeIndex
                  ? 'ring-2 ring-[#2C2C2C]'
                  : 'ring-1 ring-[#EDE0D4] opacity-60 hover:opacity-100'
              }`}
            >
              <div className="w-full h-full brand-gradient" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
