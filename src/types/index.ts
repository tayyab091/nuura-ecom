export interface Product {
  _id: string
  slug: string
  name: string
  tagline: string
  description: string
  price: number
  comparePrice?: number
  images: string[]
  category: 'self-care' | 'accessories'
  tags: string[]
  inStock: boolean
  stockCount: number
  isFeatured: boolean
  isNewDrop: boolean
  isBestSeller: boolean
  weight?: number
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Cart {
  items: CartItem[]
  updatedAt: Date
}

export interface Address {
  fullName: string
  phone: string
  street: string
  city: string
  province: string
  postalCode: string
}

export type PaymentMethod = 'cod' | 'stripe' | 'jazzcash' | 'easypaisa' | 'nayapay'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  _id: string
  orderNumber: string
  customer: {
    name: string
    email: string
    phone: string
  }
  items: CartItem[]
  shippingAddress: Address
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  subtotal: number
  shippingFee: number
  total: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  _id: string
  name: string
  email: string
  phone?: string
  addresses: Address[]
  createdAt: Date
}

export interface Category {
  _id: string
  name: string
  slug: string
  description: string
  image: string
}
