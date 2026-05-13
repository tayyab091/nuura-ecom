import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICustomerProfile extends Document {
  email: string
  notes?: string
  tags: string[]
  isVip: boolean
  createdAt: Date
  updatedAt: Date
}

const CustomerProfileSchema = new Schema<ICustomerProfile>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    notes: { type: String },
    tags: { type: [String], default: [] },
    isVip: { type: Boolean, default: false },
  },
  { timestamps: true }
)

CustomerProfileSchema.index({ email: 1 })

const CustomerProfile: Model<ICustomerProfile> =
  mongoose.models.CustomerProfile ??
  mongoose.model<ICustomerProfile>('CustomerProfile', CustomerProfileSchema)

export default CustomerProfile
