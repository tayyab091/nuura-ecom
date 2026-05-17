'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Clock,
  Mail,
  Package,
  PieChart,
  RefreshCcw,
  Send,
  ShoppingBag,
  TrendingUp,
  X,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts'
import { formatPKR } from '@/lib/utils'

interface RecentOrder {
  orderNumber: string
  customer?: { name?: string; email?: string }
  total?: number
  paymentMethod?: string
  orderStatus?: string
  createdAt: string
}

interface Stats {
  totalOrders: number
  pendingVerification: number
  confirmedRevenue: number
  totalProducts: number
  recentOrders: RecentOrder[]
  ordersByDay?: Array<{ date: string; orders: number }>
  revenueByDay?: Array<{ date: string; revenue: number }>
  paymentMix?: Array<{ method: string; count: number; revenue: number }>
  topProducts?: Array<{ name: string; units: number; revenue: number }>
}

interface InventoryProduct {
  _id: string
  slug: string
  name: string
  stockCount: number
  lowStockThreshold?: number
}

interface StoreSettings {
  lowStockThreshold: number
  supportEmail?: string
}

interface ProductAnalytics {
  product?: { name: string; slug: string; stockCount: number; lowStockThreshold?: number }
  totalUnits: number
  totalRevenue: number
  series: Array<{ date: string; units: number; revenue: number }>
}

const STATUS_BADGE: Record<string, string> = {
  pending_verification: 'bg-n-gold/15 text-amber-800',
  confirmed: 'bg-n-forest/10 text-n-forest',
  processing: 'bg-blue-500/10 text-blue-700',
  shipped: 'bg-purple-500/10 text-purple-700',
  delivered: 'bg-emerald-500/10 text-emerald-700',
  cancelled: 'bg-red-500/10 text-red-700',
  pending: 'bg-n-gold/10 text-amber-800',
}

const PAY_BADGE: Record<string, string> = {
  cod: 'bg-n-forest/10 text-n-forest',
  jazzcash: 'bg-red-500/10 text-red-700',
  easypaisa: 'bg-emerald-500/10 text-emerald-700',
  nayapay: 'bg-purple-500/10 text-purple-700',
}

const CHART_COLORS = ['#1B2E1F', '#D4A853', '#7E9A7A', '#C8553D', '#7C5C2E']

type ToastState = {
  message: string
  tone: 'success' | 'error'
}

function formatChartDate(date: string) {
  return new Intl.DateTimeFormat('en-PK', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

function ModalShell({
  title,
  subtitle,
  children,
  onClose,
  widthClass = 'max-w-4xl',
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  onClose: () => void
  widthClass?: string
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[8px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClass} max-h-[90vh] overflow-hidden rounded-[28px] border border-n-border bg-n-card shadow-[0_32px_120px_rgba(0,0,0,0.28)]`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-n-border px-6 py-5 bg-gradient-to-b from-n-cream/80 to-transparent">
          <div>
            <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">{subtitle}</p>
            <h3 className="[font-family:var(--font-display)] text-2xl font-light text-n-ink mt-2">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center size-10 rounded-full border border-n-border bg-n-white text-n-muted hover:text-n-ink hover:border-n-forest/20 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} strokeWidth={1.7} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value?: number; name?: string; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-n-border bg-n-card/95 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.12)] backdrop-blur-sm">
      <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">{label}</p>
      <div className="mt-2 flex flex-col gap-1">
        {payload.map((entry) => (
          <p key={entry.name} className="font-sans text-xs text-n-ink">
            <span className="inline-block size-2 rounded-full mr-2 align-middle" style={{ backgroundColor: entry.color ?? '#1B2E1F' }} />
            {entry.name}: {Number(entry.value ?? 0).toLocaleString('en-PK')}
          </p>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; title: string; description: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-n-border bg-n-cream/40 px-6 py-8 text-center">
      <div className="max-w-sm">
        <span className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-n-forest/10 text-n-forest">
          <Icon size={22} strokeWidth={1.8} />
        </span>
        <p className="font-sans text-sm uppercase tracking-[0.16em] text-n-ink">{title}</p>
        <p className="font-sans text-sm text-n-muted mt-2">{description}</p>
      </div>
    </div>
  )
}

function SupplierModal({
  product,
  supportEmail,
  threshold,
  onClose,
}: {
  product: InventoryProduct
  supportEmail: string
  threshold: number
  onClose: () => void
}) {
  const [supplierName, setSupplierName] = useState('Supplier team')
  const [subject, setSubject] = useState(`Low Stock Alert: ${product.name}`)
  const [message, setMessage] = useState(
    `Hello Supplier team,\n\n${product.name} is currently at ${product.stockCount} units, which is below the threshold of ${threshold} units. Please confirm restock availability and expected lead time.\n\nThanks,\nNuura Admin`
  )

  function sendEmail() {
    const email = supportEmail || 'support@nuura.pk'
    const body = message.replace('Supplier team', supplierName || 'Supplier team')
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <ModalShell title={`Contact Supplier • ${product.name}`} subtitle="Low stock outreach" onClose={onClose} widthClass="max-w-3xl">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Supplier name</span>
            <input
              className="bg-n-white border border-n-border text-n-ink px-4 py-3 rounded-xl focus:outline-none focus:border-n-forest font-sans text-sm"
              value={supplierName}
              onChange={(event) => setSupplierName(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Subject</span>
            <input
              className="bg-n-white border border-n-border text-n-ink px-4 py-3 rounded-xl focus:outline-none focus:border-n-forest font-sans text-sm"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Message</span>
          <textarea
            className="bg-n-white border border-n-border text-n-ink px-4 py-3 rounded-xl focus:outline-none focus:border-n-forest font-sans text-sm min-h-[180px] resize-y"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-n-border bg-n-white font-sans text-xs tracking-widest uppercase text-n-ink hover:bg-n-cream transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={sendEmail}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-n-forest font-sans text-xs tracking-widest uppercase text-n-cream hover:bg-n-gold hover:text-n-forest transition-colors"
          >
            <Mail size={14} strokeWidth={1.8} />
            Send Email
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

function ReorderModal({
  product,
  onClose,
  onConfirm,
}: {
  product: InventoryProduct
  onClose: () => void
  onConfirm: (quantity: number, deliveryDate: string) => Promise<void>
}) {
  const [quantity, setQuantity] = useState('10')
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().slice(0, 10)
  })
  const [saving, setSaving] = useState(false)

  async function submit() {
    const nextQuantity = Number(quantity)
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) return
    setSaving(true)
    try {
      await onConfirm(nextQuantity, deliveryDate)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={`Reorder Stock • ${product.name}`} subtitle="Inventory replenishment" onClose={onClose} widthClass="max-w-2xl">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-n-border bg-n-cream/50 p-4">
            <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Product name</p>
            <p className="font-sans text-sm text-n-ink mt-2">{product.name}</p>
          </div>
          <div className="rounded-2xl border border-n-border bg-n-cream/50 p-4">
            <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Current stock</p>
            <p className="font-sans text-sm text-n-ink mt-2">{product.stockCount} units</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Reorder quantity</span>
            <input
              type="number"
              min="1"
              className="bg-n-white border border-n-border text-n-ink px-4 py-3 rounded-xl focus:outline-none focus:border-n-forest font-sans text-sm"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Estimated delivery date</span>
            <input
              type="date"
              className="bg-n-white border border-n-border text-n-ink px-4 py-3 rounded-xl focus:outline-none focus:border-n-forest font-sans text-sm"
              value={deliveryDate}
              onChange={(event) => setDeliveryDate(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-n-border bg-n-white font-sans text-xs tracking-widest uppercase text-n-ink hover:bg-n-cream transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-n-forest font-sans text-xs tracking-widest uppercase text-n-cream hover:bg-n-gold hover:text-n-forest transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCcw size={14} strokeWidth={1.8} />
            {saving ? 'Updating...' : 'Confirm Reorder'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

function ProductAnalyticsModal({
  product,
  analytics,
  loading,
  onClose,
}: {
  product: InventoryProduct
  analytics: ProductAnalytics | null
  loading: boolean
  onClose: () => void
}) {
  const threshold = product.lowStockThreshold ?? 10
  const series = analytics?.series ?? []
  const chartData = series.map((entry) => ({
    ...entry,
    label: formatChartDate(entry.date),
  }))
  const weekSlice = chartData.slice(-7)
  const unitsThisWeek = weekSlice.reduce((sum, entry) => sum + (entry.units ?? 0), 0)
  const revenueThisWeek = weekSlice.reduce((sum, entry) => sum + (entry.revenue ?? 0), 0)
  const barData = [
    { name: 'Current stock', value: product.stockCount },
    { name: 'Threshold', value: threshold },
  ]

  return (
    <ModalShell title={`Product Analytics • ${product.name}`} subtitle="Low-stock analytics" onClose={onClose} widthClass="max-w-5xl">
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3 rounded-3xl border border-n-border bg-n-cream/50 p-6 animate-pulse">
            <div className="h-5 w-40 rounded bg-n-border/40" />
            <div className="mt-4 h-64 rounded-2xl bg-n-border/30" />
          </div>
          <div className="rounded-3xl border border-n-border bg-n-cream/50 p-6 animate-pulse h-32" />
          <div className="rounded-3xl border border-n-border bg-n-cream/50 p-6 animate-pulse h-32" />
          <div className="rounded-3xl border border-n-border bg-n-cream/50 p-6 animate-pulse h-32" />
        </div>
      ) : !analytics ? (
        <EmptyState
          icon={BarChart3}
          title="Analytics unavailable"
          description="We could not load trend data for this product right now. Try again in a moment."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-n-border bg-n-cream/50 p-5">
              <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Units sold this week</p>
              <p className="[font-family:var(--font-display)] text-3xl font-light text-n-ink mt-3">{unitsThisWeek}</p>
            </div>
            <div className="rounded-3xl border border-n-border bg-n-cream/50 p-5">
              <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Revenue this week</p>
              <p className="[font-family:var(--font-display)] text-3xl font-light text-n-ink mt-3">{formatPKR(revenueThisWeek)}</p>
            </div>
            <div className="rounded-3xl border border-n-border bg-n-cream/50 p-5">
              <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Stock vs threshold</p>
              <p className="[font-family:var(--font-display)] text-3xl font-light text-n-ink mt-3">{product.stockCount} / {threshold}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-n-border bg-n-card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Sales trend</p>
                  <p className="font-sans text-sm text-n-ink mt-1">Last 30 days</p>
                </div>
                <TrendingUp size={18} strokeWidth={1.7} className="text-n-forest" />
              </div>

              <div className="h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsAreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`product-sales-fill-${product.slug}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1B2E1F" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#1B2E1F" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 8" stroke="#DDD8CF" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#6B7B6E', fontSize: 11 }} axisLine={{ stroke: '#DDD8CF' }} tickLine={false} minTickGap={18} />
                    <YAxis tick={{ fill: '#6B7B6E', fontSize: 11 }} axisLine={{ stroke: '#DDD8CF' }} tickLine={false} width={44} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="units"
                      name="Units sold"
                      stroke="#1B2E1F"
                      strokeWidth={2}
                      fill={`url(#product-sales-fill-${product.slug})`}
                      isAnimationActive
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-n-border bg-n-card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Stock position</p>
                  <p className="font-sans text-sm text-n-ink mt-1">Current stock vs threshold</p>
                </div>
                <Bell size={18} strokeWidth={1.7} className="text-n-gold" />
              </div>

              <div className="h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={barData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="4 8" stroke="#DDD8CF" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6B7B6E', fontSize: 11 }} axisLine={{ stroke: '#DDD8CF' }} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#6B7B6E', fontSize: 11 }} axisLine={{ stroke: '#DDD8CF' }} tickLine={false} width={110} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine x={threshold} stroke="#D4A853" strokeDasharray="4 4" />
                    <Bar dataKey="value" name="Units" fill="#1B2E1F" radius={[0, 12, 12, 0]} isAnimationActive>
                      {barData.map((entry, index) => (
                        <Cell key={entry.name} fill={index === 0 ? '#1B2E1F' : '#D4A853'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

export default function AdminDashboard() {
  const { session } = useAuth()
  const [stats, setStats] = useState<Stats|null>(null)
  const [loading, setLoading] = useState(true)
  const [chartRange, setChartRange] = useState<'7'|'30'|'all'>('7')
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null)
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, number>>({})
  const [selectedAnalyticsSlug, setSelectedAnalyticsSlug] = useState<string | null>(null)
  const [analyticsBySlug, setAnalyticsBySlug] = useState<Record<string, ProductAnalytics>>({})
  const [analyticsLoadingSlug, setAnalyticsLoadingSlug] = useState<string | null>(null)
  const [supplierProduct, setSupplierProduct] = useState<InventoryProduct | null>(null)
  const [reorderProduct, setReorderProduct] = useState<InventoryProduct | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    fetch(`/api/admin/stats?days=${chartRange}`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [chartRange, session?.user?.email])

  useEffect(() => {
    try {
      const key = `nuura-reviewed-low-stock:${session?.user?.email ?? 'anon'}`
      const raw = window.localStorage.getItem(key)
      if (raw) setDismissedAlerts(JSON.parse(raw))
    } catch {
      setDismissedAlerts({})
    }
  }, [session?.user?.email])

  const loadInventory = useCallback(async () => {
    setInventoryLoading(true)
    try {
      const [settingsRes, productsRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/products?limit=100'),
      ])

      const settingsData = await settingsRes.json().catch(() => null)
      const productsData = await productsRes.json().catch(() => null)

      setStoreSettings({
        lowStockThreshold: Number(settingsData?.settings?.lowStockThreshold ?? 10),
        supportEmail: settingsData?.settings?.supportEmail ?? '',
      })
      const nextProducts = Array.isArray(productsData?.products) ? productsData.products : []
      setInventoryProducts(nextProducts)
      // Clean reviewed entries when product was restocked above threshold
      try {
        setDismissedAlerts((cur) => {
          const copy = { ...cur }
          const lowThreshold = Number(settingsData?.settings?.lowStockThreshold ?? 10)
          for (const p of nextProducts) {
            const threshold = Number(p.lowStockThreshold ?? lowThreshold)
            if ((p.stockCount ?? 0) > threshold && copy[p.slug]) {
              delete copy[p.slug]
            }
          }
          return copy
        })
      } catch {}
    } catch {
      setStoreSettings((current) => current ?? { lowStockThreshold: 10, supportEmail: '' })
      setInventoryProducts([])
    } finally {
      setInventoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadInventory()
    const timer = window.setInterval(() => {
      void loadInventory()
    }, 30000)
    return () => window.clearInterval(timer)
  }, [loadInventory])

  useEffect(() => {
    try {
      const key = `nuura-reviewed-low-stock:${session?.user?.email ?? 'anon'}`
      window.localStorage.setItem(key, JSON.stringify(dismissedAlerts))
    } catch {
      // ignore storage failures
    }
  }, [dismissedAlerts, session?.user?.email])

  const lowStockAlerts = useMemo(() => {
    return inventoryProducts.filter((product) => {
      if (!product?.slug) return false
      const threshold = product.lowStockThreshold ?? storeSettings?.lowStockThreshold ?? 10
      const reviewedAt = dismissedAlerts[product.slug]
      if (typeof reviewedAt === 'number' && !(product.stockCount < reviewedAt)) return false
      return product.stockCount <= threshold
    })
  }, [dismissedAlerts, inventoryProducts, storeSettings?.lowStockThreshold])

  async function loadProductAnalytics(product: InventoryProduct) {
    setAnalyticsLoadingSlug(product.slug)
    try {
      const res = await fetch(`/api/admin/products/${product.slug}/analytics`)
      const data = await res.json().catch(() => null)
      if (!res.ok) return
      setAnalyticsBySlug((current) => ({ ...current, [product.slug]: data }))
    } finally {
      setAnalyticsLoadingSlug(null)
    }
  }

  function openAnalytics(product: InventoryProduct) {
    setSelectedAnalyticsSlug(product.slug)
    if (!analyticsBySlug[product.slug]) {
      void loadProductAnalytics(product)
    }
  }

  function openSupplierModal(product: InventoryProduct) {
    setSupplierProduct(product)
  }

  function openReorderModal(product: InventoryProduct) {
    setReorderProduct(product)
  }

  async function confirmReorder(product: InventoryProduct, quantity: number, deliveryDate: string) {
    const nextStock = product.stockCount + quantity

    const res = await fetch(`/api/products/${product.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stockCount: nextStock,
        inStock: true,
      }),
    })

    if (!res.ok) {
      setToast({ message: `Failed to update ${product.name}.`, tone: 'error' })
      return
    }

    setInventoryProducts((current) =>
      current.map((item) =>
        item.slug === product.slug
          ? { ...item, stockCount: nextStock, inStock: true }
          : item
      )
    )

    setAnalyticsBySlug((current) => {
      const existing = current[product.slug]
      if (!existing) return current
      return {
        ...current,
        [product.slug]: {
          ...existing,
          product: existing.product
            ? { ...existing.product, stockCount: nextStock }
            : existing.product,
        },
      }
    })

    setToast({
      message: `Reorder confirmed for ${product.name}. Delivery target ${deliveryDate}.`,
      tone: 'success',
    })
    window.setTimeout(() => setToast(null), 3200)
    await loadInventory()
  }

  function markReviewed(product: InventoryProduct) {
    setDismissedAlerts((current) => ({ ...current, [product.slug]: product.stockCount }))
    if (selectedAnalyticsSlug === product.slug) {
      setSelectedAnalyticsSlug(null)
    }
  }

  const STAT_CARDS = [
    { label: 'Total Orders', value: stats?.totalOrders ?? '—', icon: ShoppingBag, border: 'border-t-n-forest', iconClass: 'text-n-forest' },
    { label: 'Pending Verification', value: stats?.pendingVerification ?? '—', icon: Clock, border: 'border-t-n-gold', iconClass: 'text-n-gold' },
    { label: 'Revenue (PKR)', value: stats?.confirmedRevenue ? `${(stats.confirmedRevenue / 1000).toFixed(0)}K` : '—', icon: TrendingUp, border: 'border-t-emerald-600', iconClass: 'text-emerald-700' },
    { label: 'Total Products', value: stats?.totalProducts ?? '—', icon: Package, border: 'border-t-purple-600', iconClass: 'text-purple-700' },
  ]

  const revenueChartData = (stats?.revenueByDay ?? []).map((entry) => ({
    ...entry,
    label: formatChartDate(entry.date),
  }))
  const orderChartData = (stats?.ordersByDay ?? []).map((entry) => ({
    ...entry,
    label: formatChartDate(entry.date),
  }))
  const topProducts = stats?.topProducts ?? []
  const topProductsChartData = topProducts.map((entry) => ({
    name: entry.name,
    revenue: entry.revenue ?? 0,
    units: entry.units ?? 0,
  }))
  const totalAlerts = lowStockAlerts.length
  const inventoryBreakdown = useMemo(() => {
    const lowThreshold = storeSettings?.lowStockThreshold ?? 10
    const outOfStock = inventoryProducts.filter((product) => (product.stockCount ?? 0) <= 0).length
    const lowStock = inventoryProducts.filter((product) => {
      const threshold = product.lowStockThreshold ?? lowThreshold
      const stockCount = product.stockCount ?? 0
      return stockCount > 0 && stockCount <= threshold
    }).length
    const healthy = Math.max(0, inventoryProducts.length - lowStock - outOfStock)

    return [
      { name: 'Healthy', value: healthy },
      { name: 'Low stock', value: lowStock },
      { name: 'Out of stock', value: outOfStock },
    ].filter((segment) => segment.value > 0)
  }, [inventoryProducts, storeSettings?.lowStockThreshold])

  return (
    <div>
      {supplierProduct && (
        <SupplierModal
          key={supplierProduct.slug}
          product={supplierProduct}
          supportEmail={storeSettings?.supportEmail ?? ''}
          threshold={supplierProduct.lowStockThreshold ?? storeSettings?.lowStockThreshold ?? 10}
          onClose={() => setSupplierProduct(null)}
        />
      )}

      {reorderProduct && (
        <ReorderModal
          key={reorderProduct.slug}
          product={reorderProduct}
          onClose={() => setReorderProduct(null)}
          onConfirm={(quantity, deliveryDate) => confirmReorder(reorderProduct, quantity, deliveryDate)}
        />
      )}

      {selectedAnalyticsSlug && inventoryProducts.find((item) => item.slug === selectedAnalyticsSlug) && (
        <ProductAnalyticsModal
          product={inventoryProducts.find((item) => item.slug === selectedAnalyticsSlug) as InventoryProduct}
          analytics={analyticsBySlug[selectedAnalyticsSlug] ?? null}
          loading={analyticsLoadingSlug === selectedAnalyticsSlug}
          onClose={() => setSelectedAnalyticsSlug(null)}
        />
      )}

      {toast && (
        <div className="fixed right-4 top-4 z-[60] max-w-sm rounded-2xl border border-n-border bg-n-card px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 inline-flex size-8 items-center justify-center rounded-full ${toast.tone === 'success' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700'}`}>
              {toast.tone === 'success' ? <Send size={15} strokeWidth={1.8} /> : <AlertTriangle size={15} strokeWidth={1.8} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">{toast.tone === 'success' ? 'Success' : 'Error'}</p>
              <p className="font-sans text-sm text-n-ink mt-1">{toast.message}</p>
            </div>
            <button type="button" onClick={() => setToast(null)} className="text-n-muted hover:text-n-ink">
              <X size={14} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      )}

      <div className="mb-10 pb-6 border-b border-n-border">
        <h1 className="[font-family:var(--font-display)] text-3xl sm:text-4xl font-light text-n-ink">
          Dashboard
        </h1>
        <p className="font-sans text-sm text-n-muted mt-2">
          {new Date().toLocaleDateString('en-PK', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div id="low-stock-alerts" className="bg-n-card border border-n-border mb-10 overflow-hidden scroll-mt-8">
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-n-border">
          <div>
            <h2 className="[font-family:var(--font-display)] text-xl font-light text-n-ink">
              Low Stock Alerts
            </h2>
            <p className="font-sans text-xs text-n-muted mt-1">
              Threshold {storeSettings?.lowStockThreshold ?? 10} units. Refreshed every 30 seconds.
            </p>
          </div>
          <span className="inline-flex items-center justify-center min-w-9 h-9 px-3 rounded-full bg-n-gold/15 text-n-forest font-sans text-xs tracking-widest uppercase">
            {totalAlerts}
          </span>
        </div>

        {inventoryLoading ? (
          <div className="px-6 py-12 text-center font-sans text-sm text-n-muted">Loading inventory alerts...</div>
        ) : !lowStockAlerts.length ? (
          <div className="px-6 py-12 text-center font-sans text-sm text-n-muted">
            No low-stock products right now.
          </div>
        ) : (
          <div className="divide-y divide-n-border">
            {lowStockAlerts.map((product) => {
              const threshold = product.lowStockThreshold ?? storeSettings?.lowStockThreshold ?? 10
              return (
                <div key={product._id} className="px-6 py-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-sans text-sm text-n-ink">{product.name}</p>
                        <span className="font-sans text-[10px] tracking-[0.14em] uppercase text-amber-700 bg-amber-500/10 border border-amber-500/15 px-2 py-1 rounded-full">
                          {product.stockCount} / {threshold}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-n-muted mt-2">
                        This product is below the restock threshold and needs attention.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/products?edit=${product.slug}`}
                        className="inline-flex items-center justify-center px-3 py-2 border border-n-border bg-n-white font-sans text-[10px] tracking-widest uppercase text-n-ink hover:bg-n-cream transition-colors no-underline"
                      >
                        Open Product
                      </Link>
                      <button
                        type="button"
                        onClick={() => openSupplierModal(product)}
                        className="px-3 py-2 border border-n-border bg-n-white font-sans text-[10px] tracking-widest uppercase text-n-ink hover:bg-n-cream transition-colors"
                      >
                        Contact Supplier
                      </button>
                      <button
                        type="button"
                        onClick={() => openReorderModal(product)}
                        className="px-3 py-2 border border-n-border bg-n-white font-sans text-[10px] tracking-widest uppercase text-n-ink hover:bg-n-cream transition-colors"
                      >
                        Reorder Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => markReviewed(product)}
                        className="px-3 py-2 border border-n-border bg-n-white font-sans text-[10px] tracking-widest uppercase text-n-ink hover:bg-n-cream transition-colors"
                      >
                        Mark as Reviewed
                      </button>
                      <button
                        type="button"
                        onClick={() => openAnalytics(product)}
                        className="px-3 py-2 border border-n-border bg-n-forest text-n-cream font-sans text-[10px] tracking-widest uppercase hover:bg-n-gold hover:text-n-forest transition-colors"
                      >
                        View Product Analytics
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {STAT_CARDS.map((card, i) => (
          <div
            key={i}
            className={`bg-n-card border border-n-border p-6 border-t-4 ${card.border}`}
          >
            <div className="flex justify-between items-start mb-4">
              <p className="font-sans text-[11px] tracking-[0.12em] uppercase text-n-muted">
                {card.label}
              </p>
              <card.icon size={18} strokeWidth={1.5} className={card.iconClass} />
            </div>
            <p className="[font-family:var(--font-display)] text-[2.2rem] leading-none font-light text-n-ink">
              {loading ? '—' : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-10">
        <div className="bg-n-card border border-n-border p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-sans text-[11px] tracking-[0.12em] uppercase text-n-muted">Revenue trend</p>
              <p className="font-sans text-xs text-n-muted mt-1">Confirmed revenue across the selected range.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-full border border-n-border bg-n-white p-1">
                <button type="button" onClick={() => setChartRange('7')} className={`px-3 py-1 rounded-full text-xs ${chartRange==='7' ? 'bg-n-forest text-n-cream' : 'text-nuura-muted'}`}>Last 7</button>
                <button type="button" onClick={() => setChartRange('30')} className={`px-3 py-1 rounded-full text-xs ${chartRange==='30' ? 'bg-n-forest text-n-cream' : 'text-nuura-muted'}`}>Last 30</button>
                <button type="button" onClick={() => setChartRange('all')} className={`px-3 py-1 rounded-full text-xs ${chartRange==='all' ? 'bg-n-forest text-n-cream' : 'text-nuura-muted'}`}>All time</button>
              </div>
              <TrendingUp size={18} strokeWidth={1.5} className="text-n-forest" />
            </div>
          </div>
          <div className="mt-5 h-[320px]">
            {loading || !revenueChartData.length ? (
              <EmptyState
                icon={TrendingUp}
                title="No revenue data yet"
                description="Revenue will appear here once confirmed orders start coming in."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B2E1F" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#1B2E1F" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 8" stroke="#DDD8CF" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#6B7B6E', fontSize: 11 }} axisLine={{ stroke: '#DDD8CF' }} tickLine={false} minTickGap={18} />
                  <YAxis tick={{ fill: '#6B7B6E', fontSize: 11 }} axisLine={{ stroke: '#DDD8CF' }} tickLine={false} width={44} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1B2E1F" strokeWidth={2.2} fill="url(#revenueGradient)" isAnimationActive />
                </RechartsAreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-n-card border border-n-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-sans text-[11px] tracking-[0.12em] uppercase text-n-muted">Orders trend</p>
              <p className="font-sans text-xs text-n-muted mt-1">Orders created each day, including pending ones.</p>
            </div>
            <BarChart3 size={18} strokeWidth={1.5} className="text-n-gold" />
          </div>
          <div className="mt-5 h-[280px]">
            {loading || !orderChartData.length ? (
              <EmptyState
                icon={BarChart3}
                title="No order data yet"
                description="Orders will appear here once the store starts receiving traffic."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={orderChartData}>
                  <CartesianGrid strokeDasharray="4 8" stroke="#DDD8CF" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#6B7B6E', fontSize: 11 }} axisLine={{ stroke: '#DDD8CF' }} tickLine={false} minTickGap={18} />
                  <YAxis tick={{ fill: '#6B7B6E', fontSize: 11 }} axisLine={{ stroke: '#DDD8CF' }} tickLine={false} width={34} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="orders" name="Orders" fill="#D4A853" radius={[10, 10, 0, 0]} isAnimationActive />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-n-card border border-n-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-sans text-[11px] tracking-[0.12em] uppercase text-n-muted">Inventory breakdown</p>
              <p className="font-sans text-xs text-n-muted mt-1">Healthy, low-stock, and out-of-stock counts.</p>
            </div>
            <PieChart size={18} strokeWidth={1.5} className="text-n-forest" />
          </div>
          <div className="mt-5 h-[280px]">
            {loading || !inventoryBreakdown.length ? (
              <EmptyState
                icon={PieChart}
                title="No inventory data yet"
                description="Add products to see inventory health at a glance."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={inventoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={96}
                    paddingAngle={4}
                    isAnimationActive
                  >
                    {inventoryBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-n-card border border-n-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-sans text-[11px] tracking-[0.12em] uppercase text-n-muted">Top products</p>
              <p className="font-sans text-xs text-n-muted mt-1">Best-selling products over the last 30 days.</p>
            </div>
            <Package size={18} strokeWidth={1.5} className="text-n-forest" />
          </div>
          <div className="mt-5 h-[280px]">
            {loading || !topProductsChartData.length ? (
              <EmptyState
                icon={Package}
                title="No sales yet"
                description="Once orders are confirmed, the strongest sellers will show up here."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={topProductsChartData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="4 8" stroke="#DDD8CF" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6B7B6E', fontSize: 11 }} axisLine={{ stroke: '#DDD8CF' }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#6B7B6E', fontSize: 11 }} axisLine={{ stroke: '#DDD8CF' }} tickLine={false} width={120} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#1B2E1F" radius={[0, 10, 10, 0]} isAnimationActive>
                    {topProductsChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-n-card border border-n-border">
        <div className="flex items-center justify-between px-6 py-5 border-b border-n-border">
          <h2 className="[font-family:var(--font-display)] text-xl font-light text-n-ink">
            Recent Orders
          </h2>
          <a
            href="/admin/orders"
            className="font-sans text-xs tracking-widest uppercase text-n-gold no-underline hover:text-n-forest transition-colors"
          >
            View All →
          </a>
        </div>

        {loading ? (
          <div className="px-6 py-14 text-center font-sans text-sm text-n-muted">
            Loading...
          </div>
        ) : !stats?.recentOrders?.length ? (
          <div className="px-6 py-14 text-center font-sans text-sm text-n-muted">
            No orders yet. Share your store link to start selling!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead>
                <tr className="bg-n-forest">
                  {['Order #', 'Customer', 'Total', 'Payment', 'Status', 'Date'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-4 font-sans text-[10px] tracking-[0.15em] uppercase text-n-cream/70 text-left font-normal whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order: RecentOrder, i: number) => {
                  const statusKey = order.orderStatus ?? ''
                  const paymentKey = order.paymentMethod ?? ''
                  const sc = STATUS_BADGE[statusKey] ?? 'bg-n-border text-n-muted'
                  const pc = PAY_BADGE[paymentKey] ?? 'bg-n-border text-n-muted'
                  return (
                    <tr
                      key={i}
                      className="border-b border-n-border last:border-0 hover:bg-n-cream/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-n-ink whitespace-nowrap">
                        #{order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-sans text-sm text-n-ink">
                          {order.customer?.name}
                        </p>
                        <p className="font-sans text-xs text-n-muted">
                          {order.customer?.email}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-sans text-sm text-n-ink whitespace-nowrap">
                        PKR {order.total?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md font-sans text-[10px] tracking-wider uppercase whitespace-nowrap ${pc}`}
                        >
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md font-sans text-[10px] tracking-wider uppercase whitespace-nowrap ${sc}`}
                        >
                          {String(order.orderStatus ?? '').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-sans text-xs text-n-muted whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-PK')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
