import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IOrder extends Document {
  orderNumber: string
  customer: { name: string; email: string; phone: string }
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
    image: string
  }>
  shippingAddress: {
    fullName: string
    phone: string
    street: string
    city: string
    province: string
    postalCode: string
  }
  paymentMethod: 'cod' | 'stripe' | 'jazzcash' | 'easypaisa' | 'nayapay'
  paymentStatus: 'pending' | 'pending_verification' | 'paid' | 'failed' | 'refunded'
  orderStatus:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
  subtotal: number
  shippingFee: number
  total: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      province: { type: String, required: true },
      postalCode: { type: String },
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'stripe', 'jazzcash', 'easypaisa', 'nayapay'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'pending_verification', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    notes: { type: String },
  },
  { timestamps: true }
)

OrderSchema.index({ orderNumber: 1 })
OrderSchema.index({ 'customer.email': 1 })
OrderSchema.index({ orderStatus: 1 })

const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>('Order', OrderSchema)

export default Order
