import { notFound } from 'next/navigation'
import ProductImages from '@/components/product/ProductImages'
import ProductInfo from '@/components/product/ProductInfo'
import AddToCart from '@/components/product/AddToCart'
import { Product } from '@/types'

// Placeholder — replace with DB fetch
const MOCK_PRODUCTS: Record<string, Product> = {
  'rose-quartz-roller': {
    _id: '1',
    slug: 'rose-quartz-roller',
    name: 'Rose Quartz Roller',
    tagline: 'Lymphatic drainage meets ritual',
    description:
      'Handcrafted from genuine rose quartz. Cool to the touch, gentle on the skin. Use daily to reduce puffiness, promote circulation, and elevate your skincare ritual.',
    price: 2800,
    comparePrice: 3500,
    images: [],
    category: 'self-care',
    tags: ['skincare', 'roller', 'rose quartz', 'glow'],
    inStock: true,
    stockCount: 24,
    isFeatured: true,
    isNewDrop: false,
    isBestSeller: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = MOCK_PRODUCTS[slug]

  if (!product) notFound()

  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-32 pb-24">
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Images */}
          <ProductImages images={product.images} name={product.name} />

          {/* Info + Cart */}
          <div className="space-y-8">
            <ProductInfo product={product} />
            <AddToCart product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}
