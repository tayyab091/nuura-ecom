import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI!

const ProductSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  tagline: String,
  description: String,
  price: Number,
  comparePrice: Number,
  images: [String],
  category: String,
  tags: [String],
  inStock: { type: Boolean, default: true },
  stockCount: Number,
  isFeatured: Boolean,
  isNewDrop: Boolean,
  isBestSeller: Boolean,
}, { timestamps: true })

const Product = mongoose.models.Product ||
  mongoose.model('Product', ProductSchema)

const PRODUCTS = [
  {
    slug: 'rose-quartz-gua-sha',
    name: 'Rose Quartz Gua Sha',
    tagline: 'Sculpt. Depuff. Glow.',
    description: 'Authentic rose quartz gua sha for facial lifting and lymphatic drainage. Use daily with facial oil in upward strokes to reduce puffiness and define your jawline.',
    price: 2800, comparePrice: 3500,
    images: [
      'https://images.unsplash.com/photo-1592136957897-b2b6ca21e10d?w=800&q=85',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=85',
    ],
    category: 'self-care',
    tags: ['gua-sha', 'rose-quartz', 'facial', 'sculpt'],
    inStock: true, stockCount: 45,
    isFeatured: true, isNewDrop: true, isBestSeller: false,
  },
  {
    slug: 'led-glow-mirror',
    name: 'LED Glow Mirror',
    tagline: 'Studio lighting, anywhere.',
    description: 'Compact LED vanity mirror with adjustable brightness and 10x magnification. USB rechargeable. Perfect for flawless makeup in any lighting.',
    price: 4500, comparePrice: 5500,
    images: [
      'https://images.unsplash.com/photo-1588514912908-b5df5f7b7c11?w=800&q=85',
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=85',
    ],
    category: 'self-care',
    tags: ['mirror', 'led', 'makeup', 'vanity'],
    inStock: true, stockCount: 23,
    isFeatured: true, isNewDrop: false, isBestSeller: true,
  },
  {
    slug: 'mini-chain-crossbody',
    name: 'Mini Chain Crossbody',
    tagline: 'Small bag. Big statement.',
    description: 'Quilted mini crossbody with gold chain strap. Fits phone, cards, and lip gloss. From morning coffee to evening dinner.',
    price: 3200, comparePrice: null,
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=85',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=85',
    ],
    category: 'accessories',
    tags: ['bag', 'crossbody', 'chain', 'quilted'],
    inStock: true, stockCount: 18,
    isFeatured: true, isNewDrop: true, isBestSeller: false,
  },
  {
    slug: 'jade-face-roller',
    name: 'Jade Face Roller',
    tagline: 'Roll away the stress.',
    description: 'Dual-ended jade roller for facial massage and serum absorption. Store in fridge for extra cooling. Reduces puffiness visibly.',
    price: 1800, comparePrice: 2200,
    images: [
      'https://images.unsplash.com/photo-1556228720-da8ead62f0f0?w=800&q=85',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=85',
    ],
    category: 'self-care',
    tags: ['jade', 'roller', 'facial', 'massage'],
    inStock: true, stockCount: 60,
    isFeatured: false, isNewDrop: false, isBestSeller: true,
  },
  {
    slug: 'acrylic-clutch',
    name: 'Acrylic Box Clutch',
    tagline: 'Art you carry.',
    description: 'Clear acrylic clutch with gold hardware. A statement piece. Fits your evening essentials perfectly.',
    price: 2500, comparePrice: null,
    images: [
      'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=85',
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=85',
    ],
    category: 'accessories',
    tags: ['clutch', 'acrylic', 'transparent', 'evening'],
    inStock: true, stockCount: 12,
    isFeatured: false, isNewDrop: true, isBestSeller: false,
  },
  {
    slug: 'facial-steamer',
    name: 'USB Facial Steamer',
    tagline: 'Open up. Breathe in. Glow.',
    description: 'Nano ionic facial steamer for deep pore cleansing. Use 2-3x weekly before serums. Doubles product absorption.',
    price: 3800, comparePrice: 4500,
    images: [
      'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=800&q=85',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=85',
    ],
    category: 'self-care',
    tags: ['steamer', 'facial', 'pores', 'hydration'],
    inStock: true, stockCount: 35,
    isFeatured: false, isNewDrop: false, isBestSeller: false,
  },
]

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')
  await Product.deleteMany({})
  console.log('Cleared existing products')
  for (const p of PRODUCTS) {
    await Product.create(p)
    console.log('✓', p.name)
  }
  console.log('Seeding complete')
  await mongoose.disconnect()
}

seed().catch(console.error)
