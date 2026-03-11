import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { CartItem, Product } from '@/types'

interface CartState {
  items: CartItem[]
  isOpen: boolean
  totalItems: () => number
  totalPrice: () => number
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    immer((set, get) => ({
      items: [],
      isOpen: false,

      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      totalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        )
      },

      addItem: (product: Product) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.product._id === product._id
          )
          if (existing) {
            existing.quantity += 1
          } else {
            state.items.push({ product, quantity: 1 })
          }
        })
      },

      removeItem: (productId: string) => {
        set((state) => {
          state.items = state.items.filter(
            (item) => item.product._id !== productId
          )
        })
      },

      updateQuantity: (productId: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            state.items = state.items.filter(
              (item) => item.product._id !== productId
            )
          } else {
            const item = state.items.find(
              (item) => item.product._id === productId
            )
            if (item) item.quantity = quantity
          }
        })
      },

      clearCart: () => {
        set((state) => {
          state.items = []
        })
      },

      toggleCart: () => {
        set((state) => {
          state.isOpen = !state.isOpen
        })
      },

      openCart: () => {
        set((state) => {
          state.isOpen = true
        })
      },

      closeCart: () => {
        set((state) => {
          state.isOpen = false
        })
      },
    })),
    {
      name: 'nuura-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
