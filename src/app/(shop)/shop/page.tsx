import { Suspense } from 'react'
import type { Product } from '@/types'
import ShopClient from '@/components/shop/ShopClient'
import { MOCK_PRODUCTS } from '@/lib/mockData'
import { connectDB } from '@/lib/mongodb'
import ProductModel from '@/models/Product'

export const metadata = {
  title: 'Shop — Nuura',
  description: 'Browse all Nuura self-care gadgets and aesthetic accessories.',
}

export const dynamic = 'force-dynamic'

function withTimeout<T>(promise: Promise<T>, timeoutMS: number): Promise<T> {
  if (!Number.isFinite(timeoutMS) || timeoutMS <= 0) return promise
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout')), timeoutMS)
    promise
      .then((value) => {
        clearTimeout(timeout)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(timeout)
        reject(err)
      })
  })
}

export default async function ShopPage() {
  const loadProducts = async () => {
    try {
      const products = await withTimeout(
        (async () => {
          await connectDB({ maxWaitMS: 2000 })
          return await ProductModel.find({ inStock: { $ne: false } })
            .maxTimeMS(2000)
            .sort({ isBestSeller: -1, isNewDrop: -1, updatedAt: -1 })
            .limit(60)
            .lean()
        })(),
        2500
      )
      if (Array.isArray(products) && products.length > 0) {
        const mapped = products.map((p) => {
          const rec = p as unknown as Record<string, unknown>
          return {
            ...rec,
            _id: String(rec._id ?? rec.id ?? ''),
            images: Array.isArray(rec.images) ? (rec.images as unknown[]).map(String) : [],
            tags: Array.isArray(rec.tags) ? (rec.tags as unknown[]).map(String) : [],
            price: Number(rec.price ?? 0),
            comparePrice: rec.comparePrice ?? null,
            inStock: Boolean(rec.inStock ?? true),
            stockCount: Number(rec.stockCount ?? 0),
          } as unknown as Product
        })
        return mapped
      }
      return MOCK_PRODUCTS as Product[]
    } catch {
      return MOCK_PRODUCTS as Product[]
    }
  }

  const initialProducts = await loadProducts()

  return (
    <div style={{ minHeight: '100vh', background: '#1B2E1F' }}>
      {/* Animated page header */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(circle at top center, #233A27 0%, #1B2E1F 60%)',
        paddingTop: 'clamp(6rem,12vw,9rem)',
        paddingBottom: 'clamp(2rem,4vw,3rem)',
        paddingLeft: 'clamp(1.5rem,6vw,5rem)',
        paddingRight: 'clamp(1.5rem,6vw,5rem)',
        borderBottom: '1px solid rgba(245,240,230,0.1)',
      }}>
        {/* Ghost S */}
        <div style={{
          position: 'absolute', right: '-0.04em', top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(200px,28vw,420px)',
          fontWeight: 300, lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: '1px rgba(245,240,230,0.08)',
          userSelect: 'none', pointerEvents: 'none', zIndex: 0,
        }}>S</div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <span style={{ display: 'block', width: '24px', height: '1px', background: '#D4A853' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,240,230,0.6)' }}>
              The Edit
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 300,
            fontSize: 'clamp(3rem,8vw,7rem)', color: '#F5F0E6',
            margin: '0', letterSpacing: '-0.03em', lineHeight: 0.9,
          }}>
            All Products
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(245,240,230,0.6)', marginTop: '1rem' }}>
            ({Array.isArray(initialProducts) ? initialProducts.length : 0} pieces)
          </p>
        </div>
      </div>

      {/* Client component for filters + grid */}
      <Suspense fallback={
        <div style={{ padding: 'clamp(1.5rem,6vw,5rem)', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(245,240,230,0.6)' }}>
          Loading products...
        </div>
      }>
        <ShopClient initialProducts={initialProducts as Product[]} />
      </Suspense>
    </div>
  )
}
