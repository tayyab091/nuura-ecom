'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Check } from 'lucide-react'
import { Product } from '@/types'
import { useCart } from '@/hooks/useCart'
import { MagneticButton } from '@/components/shared/MagneticButton'

interface AddToCartProps {
  product: Product
}

export default function AddToCart({ product }: AddToCartProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product)
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (!product.inStock) {
    return (
      <div className="w-full py-5 bg-[#EDE0D4] text-center font-sans text-sm tracking-widest uppercase text-[#8A7F7A]">
        Sold Out
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="font-sans text-xs tracking-wide uppercase text-[#8A7F7A]">Qty</span>
        <div className="flex items-center border border-[#EDE0D4]">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 flex items-center justify-center text-[#2C2C2C] hover:bg-[#F5F0E6] transition-colors font-sans"
          >
            −
          </button>
          <span className="w-12 text-center font-sans text-sm text-[#2C2C2C]">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
            className="w-10 h-10 flex items-center justify-center text-[#2C2C2C] hover:bg-[#F5F0E6] transition-colors font-sans"
          >
            +
          </button>
        </div>
        <span className="font-sans text-xs text-[#8A7F7A]">
          {product.stockCount} in stock
        </span>
      </div>

      {/* Add to Cart Button */}
      <MagneticButton onClick={handleAddToCart} className="w-full">
        <motion.button
          className="w-full py-5 flex items-center justify-center gap-3 font-sans text-sm tracking-widest uppercase transition-colors duration-300"
          style={{
            backgroundColor: added ? '#B2BDB5' : '#2C2C2C',
            color: 'white',
          }}
          whileTap={{ scale: 0.98 }}
        >
          {added ? (
            <>
              <Check size={16} />
              Added to Bag
            </>
          ) : (
            <>
              <ShoppingBag size={16} />
              Add to Bag
            </>
          )}
        </motion.button>
      </MagneticButton>

      {/* COD Badge */}
      <p className="text-center font-sans text-xs text-[#8A7F7A] tracking-wide">
        ✓ Cash on Delivery available across Pakistan
      </p>
    </div>
  )
}
