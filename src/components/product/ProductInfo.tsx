'use client'

import Link from 'next/link'
import { Truck, Check, RefreshCw } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { Product } from '@/types'

interface ProductInfoProps {
  product: Product
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null

  function handleAddToCart() {
    addItem(product)
    openCart()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', color: '#F5F0E6' }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,230,0.6)' }}>
        <Link href='/shop' style={{ color: 'rgba(245,240,230,0.6)', textDecoration: 'none' }}>Shop</Link>
        {' / '}
        <Link href={'/shop?category=' + product.category} style={{ color: 'rgba(245,240,230,0.6)', textDecoration: 'none' }}>
          {product.category}
        </Link>
        {' / '}
        <span style={{ color: 'rgba(245,240,230,0.6)' }}>{product.name}</span>
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        {product.isNewDrop && (
          <span style={{ backgroundColor: '#1B2E1F', color: '#F5F0E6', fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.375rem 0.75rem', borderRadius: 0 }}>
            New Drop
          </span>
        )}
        {product.isBestSeller && (
          <span style={{ border: '1px solid #D4A853', color: '#D4A853', backgroundColor: 'transparent', fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.375rem 0.75rem', borderRadius: 0 }}>
            Best Seller
          </span>
        )}
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 300, color: '#F5F0E6', lineHeight: 1.05, marginTop: '1rem' }}>
        {product.name}
      </h1>

      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '16px', color: 'rgba(245,240,230,0.6)', marginTop: '0.5rem' }}>{product.tagline}</p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#D4A853' }}>PKR {product.price.toLocaleString()}</span>
        {product.comparePrice && (
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(245,240,230,0.4)', textDecoration: 'line-through' }}>PKR {product.comparePrice.toLocaleString()}</span>
        )}
        {discount && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#D4A853' }}>-{discount}%</span>}
      </div>

      <div style={{ borderTop: '1px solid rgba(245,240,230,0.1)', margin: '1.5rem 0' }} />

      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(245,240,230,0.7)', lineHeight: 1.75 }}>{product.description}</p>

      {product.tags.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          {product.tags.map((tag) => (
             <span key={tag} style={{ display: 'inline-block', border: '1px solid rgba(245,240,230,0.15)', color: 'rgba(245,240,230,0.6)', fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.375rem 0.75rem', marginRight: '0.5rem', marginTop: '0.5rem', borderRadius: 0 }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(245,240,230,0.1)', margin: '1.5rem 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {product.inStock ? (
          product.stockCount > (product.lowStockThreshold ?? 10) ? (
             <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B9E7A' }}>In Stock</span>
          ) : (
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A853' }}>Only {product.stockCount} left</span>
          )
        ) : (
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,230,0.4)' }}>Out of stock</span>
        )}
      </div>

      <button
        onClick={handleAddToCart}
        disabled={!product.inStock}
        style={{
          marginTop: '1.5rem', width: '100%', padding: '1.25rem', fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', borderRadius: 0, border: 0, transition: 'all 300ms ease', cursor: product.inStock ? 'pointer' : 'not-allowed', backgroundColor: product.inStock ? '#D4A853' : 'rgba(245,240,230,0.1)', color: product.inStock ? '#1B2E1F' : 'rgba(245,240,230,0.4)',
        }}
        onMouseEnter={(e) => {
          if (product.inStock) e.currentTarget.style.backgroundColor = '#E8C97A'
        }}
        onMouseLeave={(e) => {
          if (product.inStock) e.currentTarget.style.backgroundColor = '#D4A853'
        }}
      >
        {product.inStock ? 'Add to Cart' : 'Sold Out'}
      </button>

      <div style={{ backgroundColor: '#0F1A11', padding: '1.25rem', marginTop: '2rem', borderLeft: '3px solid #D4A853', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[
          { icon: Truck, text: 'Free shipping on orders over PKR 5,000' },
          { icon: Check, text: 'Cash on Delivery available nationwide' },
          { icon: RefreshCw, text: 'Easy 7-day returns' },
        ].map((line) => (
          <div key={line.text} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <line.icon size={14} strokeWidth={1.5} style={{ color: 'rgba(245,240,230,0.6)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(245,240,230,0.6)' }}>{line.text}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        a:hover {
          color: #D4A853 !important;
        }
      `}</style>
    </div>
  )
}
