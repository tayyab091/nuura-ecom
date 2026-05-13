import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IProduct extends Document {
  slug: string
  name: string
  tagline: string
  description: string
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
    canonicalUrl?: string
    noIndex?: boolean
    noFollow?: boolean
  }
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

const ProductSchema = new Schema<IProduct>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
      keywords: [{ type: String, trim: true }],
      ogTitle: { type: String, trim: true },
      ogDescription: { type: String, trim: true },
      ogImage: { type: String, trim: true },
      canonicalUrl: { type: String, trim: true },
      noIndex: { type: Boolean, default: false },
      noFollow: { type: Boolean, default: false },
    },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    images: [{ type: String }],
    category: { type: String, enum: ['self-care', 'accessories'], required: true },
    tags: [{ type: String }],
    inStock: { type: Boolean, default: true },
    stockCount: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false },
    isNewDrop: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    weight: { type: Number },
  },
  { timestamps: true }
)

ProductSchema.index({ category: 1 })
ProductSchema.index({ isFeatured: 1 })
ProductSchema.index({ isNewDrop: 1 })

const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>('Product', ProductSchema)

export default Product
