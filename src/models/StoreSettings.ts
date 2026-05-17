import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IStoreSettings extends Document {
  key: 'default'
  storeName: string
  supportEmail: string
  supportPhone: string
  whatsappNumber: string
  storeAddressLine1: string
  storeCity: string
  storeProvince: string
  instagramUrl: string
  tiktokUrl: string
  lowStockThreshold: number
  currency: 'PKR'
  shippingFlatFee: number
  freeShippingThreshold: number
  paymentCodEnabled: boolean
  paymentJazzcashEnabled: boolean
  paymentEasypaisaEnabled: boolean
  paymentNayapayEnabled: boolean
  orderAutoConfirmCod: boolean
  createdAt: Date
  updatedAt: Date
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    storeName: { type: String, default: 'Nuura' },
    supportEmail: { type: String, default: '' },
    supportPhone: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    storeAddressLine1: { type: String, default: '' },
    storeCity: { type: String, default: '' },
    storeProvince: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
    tiktokUrl: { type: String, default: '' },
    lowStockThreshold: { type: Number, default: 10 },
    currency: { type: String, default: 'PKR' },
    shippingFlatFee: { type: Number, default: 0 },
    freeShippingThreshold: { type: Number, default: 0 },
    paymentCodEnabled: { type: Boolean, default: true },
    paymentJazzcashEnabled: { type: Boolean, default: false },
    paymentEasypaisaEnabled: { type: Boolean, default: false },
    paymentNayapayEnabled: { type: Boolean, default: false },
    orderAutoConfirmCod: { type: Boolean, default: true },
  },
  { timestamps: true }
)

StoreSettingsSchema.index({ key: 1 })

const StoreSettings: Model<IStoreSettings> =
  mongoose.models.StoreSettings ??
  mongoose.model<IStoreSettings>('StoreSettings', StoreSettingsSchema)

export default StoreSettings
