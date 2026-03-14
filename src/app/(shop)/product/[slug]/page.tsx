import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductImages from '@/components/product/ProductImages'
import ProductInfo from '@/components/product/ProductInfo'
import { Product } from '@/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Inline mock data — guaranteed fallback even if DB and API both fail
const MOCK_PRODUCTS: Product[] = [
  {
    _id: '1', slug: 'rose-quartz-gua-sha',
    name: 'Rose Quartz Gua Sha', tagline: 'Sculpt. Depuff. Glow.',
    description: 'Authentic rose quartz gua sha stone for facial lifting and lymphatic drainage. Cool to the touch, smooth on the skin. Use daily to reduce puffiness and define your jawline.',
    price: 2800, comparePrice: 3500,
    images: ['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80'],
    category: 'self-care', tags: ['gua-sha', 'rose-quartz', 'facial'],
    inStock: true, stockCount: 45,
    isFeatured: true, isNewDrop: true, isBestSeller: false,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    _id: '2', slug: 'led-glow-mirror',
    name: 'LED Glow Mirror', tagline: 'Studio lighting, anywhere.',
    description: 'Compact LED vanity mirror with adjustable brightness and 10x magnification. USB rechargeable, perfect for flawless makeup on the go.',
    price: 4500, comparePrice: 5500,
    images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80'],
    category: 'self-care', tags: ['mirror', 'led', 'makeup'],
    inStock: true, stockCount: 23,
    isFeatured: true, isNewDrop: false, isBestSeller: true,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    _id: '3', slug: 'mini-chain-crossbody',
    name: 'Mini Chain Crossbody', tagline: 'Small bag. Big statement.',
    description: 'Quilted mini crossbody bag with gold chain strap. Fits your phone, cards, and lip gloss. Goes from brunch to dinner without missing a beat.',
    price: 3200,
    images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80'],
    category: 'accessories', tags: ['bag', 'crossbody', 'chain'],
    inStock: true, stockCount: 18,
    isFeatured: true, isNewDrop: true, isBestSeller: false,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    _id: '4', slug: 'jade-face-roller',
    name: 'Jade Face Roller', tagline: 'Roll away the stress.',
    description: 'Dual-ended jade roller for facial massage and serum absorption. The larger end works on cheeks and forehead; the smaller end targets under-eyes.',
    price: 1800, comparePrice: 2200,
    images: ['https://images.unsplash.com/photo-1591994843349-f415893b3a6b?w=600&q=80'],
    category: 'self-care', tags: ['jade', 'roller', 'facial'],
    inStock: true, stockCount: 60,
    isFeatured: false, isNewDrop: false, isBestSeller: true,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    _id: '5', slug: 'acrylic-clutch',
    name: 'Acrylic Box Clutch', tagline: 'Art you carry.',
    description: 'Clear acrylic clutch with gold hardware. A statement piece that turns heads. Spacious enough for your evening essentials.',
    price: 2500,
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80'],
    category: 'accessories', tags: ['clutch', 'acrylic', 'transparent'],
    inStock: true, stockCount: 12,
    isFeatured: false, isNewDrop: true, isBestSeller: false,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    _id: '6', slug: 'facial-steamer',
    name: 'USB Facial Steamer', tagline: 'Open up. Breathe in. Glow.',
    description: 'Nano ionic facial steamer for deep pore cleansing and intense hydration. Use before your skincare routine to maximise absorption. Portable USB-powered design.',
    price: 3800, comparePrice: 4500,
    images: ['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80'],
    category: 'self-care', tags: ['steamer', 'facial', 'pores'],
    inStock: true, stockCount: 35,
    isFeatured: false, isNewDrop: false, isBestSeller: false,
    createdAt: new Date(), updatedAt: new Date(),
  },
]

async function getProduct(slug: string): Promise<Product | null> {
  // First try: API route
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/products/${slug}`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      const product = data.product ?? data
      if (product && product.slug) return product as Product
    }
  } catch {
    // fall through to mock
  }

  // Second try: inline mock data (always works)
  const mock = MOCK_PRODUCTS.find((p) => p.slug === slug)
  return mock ?? null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Product — Nuura' }
  return {
    title: `${product.name} — Nuura`,
    description: product.tagline,
    openGraph: {
      title: product.name,
      description: product.tagline,
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAF8F4',
        paddingTop: '6rem',
        paddingBottom: '6rem',
      }}
    >
      <div style={{ padding: '0 clamp(1.5rem, 6vw, 5rem)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            gap: '3rem',
          }}
          className='md:grid-cols-[55%_45%] md:gap-16 items-start'
        >
          <ProductImages images={product.images} name={product.name} />
          <div style={{ position: 'sticky', top: '7rem' }}>
            <ProductInfo product={product} />
          </div>
        </div>
      </div>
    </main>
  )
}
