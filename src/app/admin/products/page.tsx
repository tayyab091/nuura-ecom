'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { X, Plus, Edit2 } from 'lucide-react'
import { formatPKR } from '@/lib/utils'

interface Product {
  _id: string
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
  category: string
  tags: string[]
  inStock: boolean
  stockCount: number
  isFeatured: boolean
  isNewDrop: boolean
  isBestSeller: boolean
}

const BLANK_FORM = {
  name: '',
  tagline: '',
  description: '',
  price: '',
  comparePrice: '',
  category: 'self-care',
  stockCount: '',
  tags: '',
  images: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  canonicalUrl: '',
  noIndex: false,
  noFollow: false,
  isFeatured: false,
  isNewDrop: false,
  isBestSeller: false,
  inStock: true,
}

type FormState = typeof BLANK_FORM

type SeoPayload = {
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

type ProductPayload = {
  name: string
  tagline: string
  description: string
  price: number
  comparePrice?: number
  category: string
  stockCount: number
  tags: string[]
  images: string[]
  seo?: SeoPayload | null
  isFeatured: boolean
  isNewDrop: boolean
  isBestSeller: boolean
  inStock: boolean
}

function ProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null
  onClose: () => void
  onSaved: () => void
}) {
  const editing = product !== null
  const [form, setForm] = useState<FormState>(
    editing
      ? {
          name: product.name,
          tagline: product.tagline,
          description: product.description,
          price: String(product.price),
          comparePrice: product.comparePrice ? String(product.comparePrice) : '',
          category: product.category,
          stockCount: String(product.stockCount),
          tags: product.tags.join(', '),
          images: product.images.join('\n'),
          seoTitle: product.seo?.title ?? '',
          seoDescription: product.seo?.description ?? '',
          seoKeywords: (product.seo?.keywords ?? []).join(', '),
          ogTitle: product.seo?.ogTitle ?? '',
          ogDescription: product.seo?.ogDescription ?? '',
          ogImage: product.seo?.ogImage ?? '',
          canonicalUrl: product.seo?.canonicalUrl ?? '',
          noIndex: product.seo?.noIndex ?? false,
          noFollow: product.seo?.noFollow ?? false,
          isFeatured: product.isFeatured,
          isNewDrop: product.isNewDrop,
          isBestSeller: product.isBestSeller,
          inStock: product.inStock,
        }
      : BLANK_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function field(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body: ProductPayload = {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        category: form.category,
        stockCount: Number(form.stockCount),
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        images: form.images
          .split('\n')
          .map((u) => u.trim())
          .filter(Boolean),
        seo: {
          title: form.seoTitle.trim() || undefined,
          description: form.seoDescription.trim() || undefined,
          keywords: form.seoKeywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
          ogTitle: form.ogTitle.trim() || undefined,
          ogDescription: form.ogDescription.trim() || undefined,
          ogImage: form.ogImage.trim() || undefined,
          canonicalUrl: form.canonicalUrl.trim() || undefined,
          noIndex: form.noIndex,
          noFollow: form.noFollow,
        },
        isFeatured: form.isFeatured,
        isNewDrop: form.isNewDrop,
        isBestSeller: form.isBestSeller,
        inStock: form.inStock,
      }

      if (body.seo && !body.seo.keywords?.length) delete body.seo.keywords
      const hasKeywords = !!body.seo?.keywords?.length
      if (
        body.seo &&
        !hasKeywords &&
        !body.seo.title &&
        !body.seo.description &&
        !body.seo.ogTitle &&
        !body.seo.ogDescription &&
        !body.seo.ogImage &&
        !body.seo.canonicalUrl &&
        !body.seo.noIndex &&
        !body.seo.noFollow
      ) {
        delete body.seo
      }

      if (editing && product?.seo && !body.seo) {
        body.seo = null
      }

      const url = editing ? `/api/products/${product.slug}` : '/api/products'
      const method = editing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to save product')
        return
      }
      onSaved()
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'bg-n-white border border-n-border text-n-ink placeholder-n-muted/70 px-4 py-2.5 w-full focus:outline-none focus:border-n-forest font-sans text-sm transition-colors'

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl mx-4 mt-16 mb-20 bg-n-cream border border-n-border p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-n-muted hover:text-n-ink transition-colors"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <p className="font-sans text-base text-n-ink mb-6">
          {editing ? 'Edit Product' : 'Add Product'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              className={inputCls}
              placeholder="Product name *"
              value={form.name}
              onChange={(e) => field('name', e.target.value)}
              required
            />
            <input
              className={inputCls}
              placeholder="Tagline *"
              value={form.tagline}
              onChange={(e) => field('tagline', e.target.value)}
              required
            />
          </div>

          <textarea
            className={inputCls + ' resize-none'}
            placeholder="Description *"
            rows={3}
            value={form.description}
            onChange={(e) => field('description', e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              className={inputCls}
              placeholder="Price (PKR) *"
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => field('price', e.target.value)}
              required
            />
            <input
              className={inputCls}
              placeholder="Compare Price"
              type="number"
              min="0"
              value={form.comparePrice}
              onChange={(e) => field('comparePrice', e.target.value)}
            />
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => field('category', e.target.value)}
            >
              <option value="self-care">Self-Care</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              className={inputCls}
              placeholder="Stock Count *"
              type="number"
              min="0"
              value={form.stockCount}
              onChange={(e) => field('stockCount', e.target.value)}
              required
            />
            <input
              className={inputCls}
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => field('tags', e.target.value)}
            />
          </div>

          <div>
            <textarea
              className={inputCls + ' resize-none'}
              placeholder="Image URLs (one per line)"
              rows={3}
              value={form.images}
              onChange={(e) => field('images', e.target.value)}
            />
          </div>

          <div className="pt-3 mt-2 border-t border-n-border">
            <p className="font-sans text-[10px] tracking-widest uppercase text-n-muted mb-3">
              SEO / Meta
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                className={inputCls}
                placeholder="Meta Title"
                value={form.seoTitle}
                onChange={(e) => field('seoTitle', e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="Canonical URL"
                value={form.canonicalUrl}
                onChange={(e) => field('canonicalUrl', e.target.value)}
              />
            </div>

            <textarea
              className={inputCls + ' resize-none mt-4'}
              placeholder="Meta Description"
              rows={3}
              value={form.seoDescription}
              onChange={(e) => field('seoDescription', e.target.value)}
            />

            <input
              className={inputCls + ' mt-4'}
              placeholder="Meta Keywords (comma separated)"
              value={form.seoKeywords}
              onChange={(e) => field('seoKeywords', e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <input
                className={inputCls}
                placeholder="OG Title"
                value={form.ogTitle}
                onChange={(e) => field('ogTitle', e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="OG Image URL"
                value={form.ogImage}
                onChange={(e) => field('ogImage', e.target.value)}
              />
            </div>

            <textarea
              className={inputCls + ' resize-none mt-4'}
              placeholder="OG Description"
              rows={3}
              value={form.ogDescription}
              onChange={(e) => field('ogDescription', e.target.value)}
            />

            <div className="flex flex-wrap gap-6 mt-4">
              {(
                [
                  { key: 'noIndex', label: 'No Index' },
                  { key: 'noFollow', label: 'No Follow' },
                ] as { key: keyof FormState; label: string }[]
              ).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key] as boolean}
                    onChange={(e) => field(key, e.target.checked)}
                    className="accent-n-forest w-4 h-4"
                  />
                  <span className="font-sans text-xs text-n-muted">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(
              [
                { key: 'isFeatured', label: 'Featured' },
                { key: 'isNewDrop', label: 'New Drop' },
                { key: 'isBestSeller', label: 'Best Seller' },
                { key: 'inStock', label: 'In Stock' },
              ] as { key: keyof FormState; label: string }[]
            ).map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form[key] as boolean}
                  onChange={(e) => field(key, e.target.checked)}
                  className="accent-n-forest w-4 h-4"
                />
                <span className="font-sans text-xs text-n-muted">{label}</span>
              </label>
            ))}
          </div>

          {error && <p className="text-red-600 font-sans text-xs">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-n-forest text-n-cream w-full py-3 font-sans text-xs tracking-widest uppercase hover:bg-n-gold hover:text-n-forest transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Product'}
          </button>
        </form>
      </div>
    </div>
  )
}

function StockBadge({ count }: { count: number }) {
  if (count === 0) return <span className="text-red-600 font-sans text-xs">Out of Stock</span>
  if (count <= 10)
    return (
      <span className="text-amber-600 font-sans text-xs">
        Low: {count}
      </span>
    )
  return <span className="text-green-700 font-sans text-xs">{count} in stock</span>
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | Product | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products?limit=100')
      const data = await res.json()
      setProducts(data.products ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  function handleSaved() {
    setModal(null)
    fetchProducts()
  }

  return (
    <div>
      {modal !== null && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="mb-8 pb-6 border-b border-n-border flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="[font-family:var(--font-display)] text-3xl font-light text-n-ink">Products</h1>
          <p className="font-sans text-sm text-n-muted mt-2">Create and manage products in your catalog.</p>
        </div>
        <button
          onClick={() => setModal('add')}
          data-cursor="hover"
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-n-forest text-n-cream px-6 py-3 font-sans text-xs tracking-widest uppercase hover:bg-n-gold hover:text-n-forest transition-colors"
        >
          <Plus size={14} strokeWidth={2} />
          Add Product
        </button>
      </div>

      <div>
        <div className="bg-n-card border border-n-border overflow-x-auto">
          {loading ? (
            <div className="px-6 py-12 text-center font-sans text-sm text-n-muted">
              Loading...
            </div>
          ) : !products.length ? (
            <div className="px-6 py-12 text-center font-sans text-sm text-n-muted">
              No products
            </div>
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-n-forest">
                  {['Image', 'Product', 'Category', 'Price', 'Stock', 'Badges', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="font-sans text-[10px] tracking-widest uppercase text-n-cream px-6 py-4 text-left"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="border-b border-n-border last:border-0 hover:bg-n-cream/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {product.images[0] ? (
                        <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-n-cream">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-n-cream to-n-offwhite" />
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-sans text-sm text-n-ink">{product.name}</p>
                      <p className="font-sans text-xs text-n-muted">{product.tagline}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-sans text-[10px] tracking-wider uppercase bg-n-cream text-n-muted px-2 py-1 rounded-full border border-n-border">
                        {product.category}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-sans text-sm text-n-ink">{formatPKR(product.price)}</p>
                      {product.comparePrice && (
                        <p className="font-sans text-xs text-n-muted line-through">
                          {formatPKR(product.comparePrice)}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <StockBadge count={product.stockCount} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {product.isFeatured && (
                          <span className="font-sans text-[9px] tracking-wider uppercase bg-[#D4A853]/20 text-[#7A5A17] px-2 py-1 rounded-full">
                            Featured
                          </span>
                        )}
                        {product.isNewDrop && (
                          <span className="font-sans text-[9px] tracking-wider uppercase bg-[#1B2E1F]/15 text-[#1B2E1F] px-2 py-1 rounded-full">
                            New Drop
                          </span>
                        )}
                        {product.isBestSeller && (
                          <span className="font-sans text-[9px] tracking-wider uppercase bg-blue-500/20 text-blue-700 px-2 py-1 rounded-full">
                            Best Seller
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => setModal(product)}
                        className="text-n-muted hover:text-n-ink transition-colors"
                        title="Edit product"
                      >
                        <Edit2 size={14} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
