'use client'

import { useCartStore } from '@/store/cartStore'

export function useCart() {
  const items = useCartStore((state) => state.items)
  const isOpen = useCartStore((state) => state.isOpen)
  const addItem = useCartStore((state) => state.addItem)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clearCart = useCartStore((state) => state.clearCart)
  const toggleCart = useCartStore((state) => state.toggleCart)
  const openCart = useCartStore((state) => state.openCart)
  const closeCart = useCartStore((state) => state.closeCart)
  const totalItems = useCartStore((state) => state.totalItems)
  const totalPrice = useCartStore((state) => state.totalPrice)

  return {
    items,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    totalItems: totalItems(),
    totalPrice: totalPrice(),
  }
}
