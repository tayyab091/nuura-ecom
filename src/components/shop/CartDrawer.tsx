'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { MagneticButton } from '@/components/shared/MagneticButton'

const ease = [0.76, 0, 0.24, 1] as const

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const totalPrice = useCartStore((s) => s.totalPrice())
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease }}
            className="fixed top-0 right-0 bottom-0 z-[80] w-full max-w-[420px] bg-[--color-nuura-warm-white] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-[--color-nuura-nude]/40">
              <h2 className="font-display text-2xl text-[--color-nuura-charcoal]">
                Your Cart
              </h2>
              <button
                onClick={closeCart}
                className="p-2 text-[--color-nuura-charcoal] hover:opacity-60 transition-opacity"
                aria-label="Close cart"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                  <ShoppingBag
                    size={40}
                    strokeWidth={1}
                    className="text-[--color-nuura-nude]"
                  />
                  <h3 className="font-display text-xl text-[--color-nuura-charcoal]">
                    Your cart is empty
                  </h3>
                  <p className="font-sans text-sm text-[--color-nuura-muted]">
                    Add something beautiful.
                  </p>
                  <div className="mt-2">
                    <MagneticButton href="/shop" onClick={closeCart}>
                      <span className="inline-block px-8 py-3 bg-[--color-nuura-charcoal] text-white font-sans text-xs tracking-widest uppercase">
                        Shop Now
                      </span>
                    </MagneticButton>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-[--color-nuura-nude]/20">
                  {items.map((item) => (
                    <div
                      key={item.product._id}
                      className="flex gap-4 py-5"
                    >
                      {/* Image placeholder */}
                      <div className="w-20 h-20 flex-shrink-0 rounded-sm bg-[--color-nuura-nude]" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-base text-[--color-nuura-charcoal] leading-tight">
                          {item.product.name}
                        </p>
                        <p className="font-sans text-xs text-[--color-nuura-muted] mt-0.5">
                          {item.product.tagline}
                        </p>
                        <p className="font-sans text-sm text-[--color-nuura-charcoal] mt-1">
                          PKR {item.product.price.toLocaleString()}
                        </p>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        <button
                          onClick={() => removeItem(item.product._id)}
                          className="text-[--color-nuura-muted] hover:text-[--color-nuura-charcoal] transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.product._id, item.quantity - 1)
                            }
                            className="p-1 text-[--color-nuura-muted] hover:text-[--color-nuura-charcoal] transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} strokeWidth={1.5} />
                          </button>
                          <span className="font-sans text-sm text-[--color-nuura-charcoal] w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product._id, item.quantity + 1)
                            }
                            className="p-1 text-[--color-nuura-muted] hover:text-[--color-nuura-charcoal] transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-8 py-6 border-t border-[--color-nuura-nude]/40">
                {/* Subtotal */}
                <div className="flex items-baseline justify-between">
                  <span className="font-sans text-xs tracking-wider uppercase text-[--color-nuura-muted]">
                    Subtotal
                  </span>
                  <span className="font-display text-xl text-[--color-nuura-charcoal]">
                    PKR {totalPrice.toLocaleString()}
                  </span>
                </div>

                {/* Shipping note */}
                <p className="font-sans text-[10px] text-[--color-nuura-muted] mt-2">
                  Free shipping on orders over PKR 5,000
                </p>

                {/* Checkout */}
                <button className="mt-6 w-full bg-[--color-nuura-charcoal] text-white font-sans text-xs tracking-widest uppercase py-4 hover:bg-[--color-nuura-muted] transition-colors duration-200">
                  Proceed to Checkout
                </button>

                {/* Continue shopping */}
                <div className="mt-3 text-center">
                  <button
                    onClick={closeCart}
                    className="font-sans text-xs text-[--color-nuura-muted] underline underline-offset-2 cursor-pointer hover:text-[--color-nuura-charcoal] transition-colors duration-200"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
