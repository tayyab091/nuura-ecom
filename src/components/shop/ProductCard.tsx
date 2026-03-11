'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { Product } from '@/types'

interface ProductCardProps {
  product: {
    _id: string
    name: string
    tagline: string
    price: number
    comparePrice?: number | null
    category: string
    isNewDrop: boolean
    isBestSeller: boolean
    images: string[]
    slug: string
  }
  index?: number
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  'self-care': 'linear-gradient(135deg, #F8D7DA, #EDE0D4)',
  accessories: 'linear-gradient(135deg, #EDE0D4, #F5F0E6)',
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(
          ((product.comparePrice - product.price) / product.comparePrice) * 100
        )
      : null

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    /* build a minimal Product-compatible object for the cart */
    const cartProduct: Product = {
      _id: product._id,
      slug: product.slug,
      name: product.name,
      tagline: product.tagline,
      description: '',
      price: product.price,
      comparePrice: product.comparePrice ?? undefined,
      images: product.images,
      category: product.category as Product['category'],
      tags: [],
      inStock: true,
      stockCount: 99,
      isFeatured: false,
      isNewDrop: product.isNewDrop,
      isBestSeller: product.isBestSeller,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    addItem(cartProduct)
  }

  return (
    <div className="group" data-cursor="hover">
      <Link href={`/product/${product.slug}`} className="block">
        {/* ── Image area ──────────────────────────── */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {/* Background */}
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div
              className="absolute inset-0 transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
              style={{
                background:
                  CATEGORY_GRADIENTS[product.category] ??
                  CATEGORY_GRADIENTS['self-care'],
              }}
            />
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            {product.isNewDrop && (
              <span className="bg-[--color-nuura-charcoal] text-white font-sans text-[9px] tracking-widest uppercase px-3 py-1.5">
                New Drop
              </span>
            )}
            {product.isBestSeller && (
              <span className="bg-[--color-nuura-blush] text-[--color-nuura-charcoal] font-sans text-[9px] tracking-widest uppercase px-3 py-1.5">
                Best Seller
              </span>
            )}
          </div>

          {/* Quick Add button */}
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-4 left-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-[--color-nuura-charcoal] font-sans text-[10px] tracking-widest uppercase py-3 text-center w-full translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out"
          >
            Quick Add
          </button>
        </div>

        {/* ── Info area ───────────────────────────── */}
        <div className="pt-4 pb-2">
          <h3 className="font-display text-lg text-[--color-nuura-charcoal] leading-tight">
            {product.name}
          </h3>
          <p className="font-sans text-xs text-[--color-nuura-muted] mt-1">
            {product.tagline}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-sans text-sm text-[--color-nuura-charcoal]">
              PKR {product.price.toLocaleString()}
            </span>
            {product.comparePrice && (
              <span className="font-sans text-xs text-[--color-nuura-muted] line-through">
                PKR {product.comparePrice.toLocaleString()}
              </span>
            )}
            {discount && (
              <span className="font-sans text-[9px] text-[--color-nuura-sage]">
                -{discount}%
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}

