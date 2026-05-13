'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, ShoppingBag, Clock, Package } from 'lucide-react'
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

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function LineChart({ values }: { values: number[] }) {
  const w = 520
  const h = 140
  const padX = 10
  const padY = 16
  const safe = values.length ? values : [0]
  const min = Math.min(...safe)
  const max = Math.max(...safe)
  const span = max - min || 1

  const pts = safe.map((v, i) => {
    const x = padX + (i * (w - padX * 2)) / Math.max(1, safe.length - 1)
    const y = h - padY - ((v - min) * (h - padY * 2)) / span
    return { x, y }
  })

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  const baseY = h - padY
  const area = `${d} L ${pts[pts.length - 1].x.toFixed(2)} ${baseY.toFixed(2)} L ${pts[0].x.toFixed(2)} ${baseY.toFixed(2)} Z`
  const last = pts[pts.length - 1]

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full h-auto block" aria-hidden="true">
      <path d={`M ${padX} ${baseY} H ${w - padX}`} stroke="currentColor" strokeWidth="1" opacity="0.14" />
      <path d={area} fill="currentColor" opacity="0.10" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r={2.6} fill="currentColor" opacity="0.9" />
    </svg>
  )
}

function BarChart({ values }: { values: number[] }) {
  const w = 520
  const h = 140
  const padX = 10
  const padY = 16
  const safe = values.length ? values : [0]
  const max = Math.max(...safe) || 1
  const bw = (w - padX * 2) / safe.length
  const baseY = h - padY

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full h-auto block" aria-hidden="true">
      <path d={`M ${padX} ${baseY} H ${w - padX}`} stroke="currentColor" strokeWidth="1" opacity="0.14" />
      {safe.map((v, i) => {
        const bh = ((h - padY * 2) * v) / max
        const x = padX + i * bw + 1
        const y = h - padY - bh
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={Math.max(2, bw - 2)}
            height={Math.max(0, bh)}
            fill="currentColor"
            opacity={0.78}
            rx={1}
          />
        )
      })}
    </svg>
  )
}

function Donut({ segments }: { segments: Array<{ label: string; value: number; className: string }> }) {
  const total = segments.reduce((a, b) => a + (b.value ?? 0), 0) || 1
  const size = 128
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let acc = 0

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-n-border)" strokeWidth={stroke} fill="none" opacity={0.55} />
        {segments.map((s) => {
          const frac = (s.value ?? 0) / total
          const dash = c * frac
          const gap = c - dash
          const offset = c * (1 - acc)
          acc += frac
          return (
            <circle
              key={s.label}
              className={s.className}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="currentColor"
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="butt"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )
        })}
      </svg>

      <div className="flex flex-col gap-2">
        {segments.map((s) => {
          const pct = Math.round(((s.value ?? 0) * 100) / total)
          return (
            <div key={s.label} className="flex items-center gap-3">
              <span className={`size-2.5 rounded-full ${s.className}`} style={{ backgroundColor: 'currentColor' }} />
              <p className="font-sans text-xs text-n-ink uppercase tracking-wider">{s.label}</p>
              <p className="font-sans text-[11px] text-n-muted">{pct}%</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Sparkline({ values }: { values: number[] }) {
  const w = 220
  const h = 44
  const pad = 4
  const safe = values.length ? values : [0]
  const min = Math.min(...safe)
  const max = Math.max(...safe)
  const span = max - min || 1

  const pts = safe.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, safe.length - 1)
    const y = h - pad - ((v - min) * (h - pad * 2)) / span
    return { x, y }
  })

  const d = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  const baseY = h - pad
  const area =
    pts.length >= 2
      ? `${d} L ${pts[pts.length - 1].x.toFixed(2)} ${baseY.toFixed(2)} L ${pts[0].x.toFixed(2)} ${baseY.toFixed(2)} Z`
      : `M ${pts[0].x.toFixed(2)} ${baseY.toFixed(2)} L ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} L ${pts[0].x.toFixed(2)} ${baseY.toFixed(2)} Z`

  const last = pts[pts.length - 1]

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block" aria-hidden="true">
      <path d={`M ${pad} ${baseY} H ${w - pad}`} stroke="currentColor" strokeWidth="1" opacity="0.18" />
      <path d={area} fill="currentColor" opacity="0.10" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r={2.25} fill="currentColor" opacity="0.9" />
    </svg>
  )
}

function MiniBars({ values }: { values: number[] }) {
  const w = 220
  const h = 44
  const pad = 4
  const safe = values.length ? values : [0]
  const max = Math.max(...safe) || 1
  const bw = (w - pad * 2) / safe.length
  const baseY = h - pad
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block" aria-hidden="true">
      <path d={`M ${pad} ${baseY} H ${w - pad}`} stroke="currentColor" strokeWidth="1" opacity="0.18" />
      {safe.map((v, i) => {
        const bh = ((h - pad * 2) * v) / max
        const x = pad + i * bw + 1
        const y = h - pad - bh
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={Math.max(2, bw - 2)}
            height={bh}
            fill="currentColor"
            opacity={0.75}
            rx={1}
          />
        )
      })}
    </svg>
  )
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const STAT_CARDS = [
    { label: 'Total Orders', value: stats?.totalOrders ?? '—', icon: ShoppingBag, border: 'border-t-n-forest', iconClass: 'text-n-forest' },
    { label: 'Pending Verification', value: stats?.pendingVerification ?? '—', icon: Clock, border: 'border-t-n-gold', iconClass: 'text-n-gold' },
    { label: 'Revenue (PKR)', value: stats?.confirmedRevenue ? `${(stats.confirmedRevenue / 1000).toFixed(0)}K` : '—', icon: TrendingUp, border: 'border-t-emerald-600', iconClass: 'text-emerald-700' },
    { label: 'Total Products', value: stats?.totalProducts ?? '—', icon: Package, border: 'border-t-purple-600', iconClass: 'text-purple-700' },
  ]

  const ordersSeries = (stats?.ordersByDay ?? []).map((d) => d.orders)
  const revenueSeries = (stats?.revenueByDay ?? []).map((d) => d.revenue)
  const paymentMix = stats?.paymentMix ?? []
  const mixTotal = paymentMix.reduce((a, b) => a + (b.count ?? 0), 0) || 1
  const topProducts = stats?.topProducts ?? []
  const topMaxRevenue = Math.max(1, ...topProducts.map((p) => p.revenue ?? 0))

  const paymentSegments = paymentMix
    .filter((m) => (m.count ?? 0) > 0)
    .map((m) => {
      const method = String(m.method ?? 'other').toLowerCase()
      const cls =
        method === 'cod'
          ? 'text-n-forest'
          : method === 'jazzcash'
            ? 'text-red-600'
            : method === 'easypaisa'
              ? 'text-emerald-600'
              : method === 'nayapay'
                ? 'text-purple-600'
                : 'text-n-gold'
      return { label: method, value: Number(m.count ?? 0), className: cls }
    })

  return (
    <div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        <div className="bg-n-card border border-n-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-sans text-[11px] tracking-[0.12em] uppercase text-n-muted">
                Revenue (14 days)
              </p>
              <p className="[font-family:var(--font-display)] text-2xl font-light text-n-ink mt-2">
                {loading ? '—' : formatPKR(stats?.confirmedRevenue ?? 0)}
              </p>
            </div>
            <div className="text-n-forest">
              <Sparkline values={revenueSeries} />
            </div>
          </div>
          <p className="font-sans text-xs text-n-muted mt-4">
            Confirmed revenue (confirmed / shipped / delivered).
          </p>
        </div>

        <div className="bg-n-card border border-n-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-sans text-[11px] tracking-[0.12em] uppercase text-n-muted">
                Orders (14 days)
              </p>
              <p className="[font-family:var(--font-display)] text-2xl font-light text-n-ink mt-2">
                {loading ? '—' : (stats?.ordersByDay ?? []).reduce((a, b) => a + (b.orders ?? 0), 0)}
              </p>
            </div>
            <div className="text-n-gold">
              <MiniBars values={ordersSeries} />
            </div>
          </div>
          <p className="font-sans text-xs text-n-muted mt-4">
            Total orders created (includes pending).
          </p>
        </div>

        <div className="bg-n-card border border-n-border p-6">
          <p className="font-sans text-[11px] tracking-[0.12em] uppercase text-n-muted">
            Payment mix (30 days)
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {loading ? (
              <p className="font-sans text-sm text-n-muted">—</p>
            ) : !paymentMix.length ? (
              <p className="font-sans text-sm text-n-muted">No data yet</p>
            ) : (
              paymentMix.map((m) => {
                const pct = Math.round(((m.count ?? 0) * 100) / mixTotal)
                return (
                  <div key={m.method} className="flex items-center gap-3">
                    <div className="w-20">
                      <p className="font-sans text-xs text-n-ink uppercase tracking-wider">
                        {m.method}
                      </p>
                      <p className="font-sans text-[11px] text-n-muted mt-1">
                        {m.count} ({pct}%)
                      </p>
                    </div>
                    <div className="flex-1 h-2 bg-n-cream border border-n-border overflow-hidden">
                      <div
                        className="h-full bg-n-forest"
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-n-card border border-n-border mb-10">
        <div className="px-6 py-5 border-b border-n-border">
          <h2 className="[font-family:var(--font-display)] text-xl font-light text-n-ink">Analytics</h2>
          <p className="font-sans text-xs text-n-muted mt-1">Minimal charts for trend + mix.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-n-border">
            <p className="font-sans text-[11px] tracking-[0.12em] uppercase text-n-muted">Revenue trend (14 days)</p>
            <div className="mt-4 text-n-forest">
              <LineChart values={revenueSeries} />
            </div>
            <p className="font-sans text-xs text-n-muted mt-3">Shows confirmed revenue only.</p>
          </div>

          <div className="p-6 border-b lg:border-b-0 lg:border-r border-n-border">
            <p className="font-sans text-[11px] tracking-[0.12em] uppercase text-n-muted">Orders per day (14 days)</p>
            <div className="mt-4 text-n-gold">
              <BarChart values={ordersSeries.map((v) => clamp(v, 0, 999))} />
            </div>
            <p className="font-sans text-xs text-n-muted mt-3">Includes pending orders.</p>
          </div>

          <div className="p-6">
            <p className="font-sans text-[11px] tracking-[0.12em] uppercase text-n-muted">Payment mix (30 days)</p>
            <div className="mt-4">
              {loading ? (
                <p className="font-sans text-sm text-n-muted">—</p>
              ) : !paymentSegments.length ? (
                <p className="font-sans text-sm text-n-muted">No data yet</p>
              ) : (
                <Donut segments={paymentSegments} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-n-card border border-n-border mb-10">
        <div className="px-6 py-5 border-b border-n-border">
          <h2 className="[font-family:var(--font-display)] text-xl font-light text-n-ink">
            Top Products (30 days)
          </h2>
        </div>
        {loading ? (
          <div className="px-6 py-12 text-center font-sans text-sm text-n-muted">Loading...</div>
        ) : !topProducts.length ? (
          <div className="px-6 py-12 text-center font-sans text-sm text-n-muted">No sales yet</div>
        ) : (
          <div className="divide-y divide-n-border">
            {topProducts.map((p) => {
              const w = Math.round(((p.revenue ?? 0) * 100) / topMaxRevenue)
              return (
                <div key={p.name} className="px-6 py-4 flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm text-n-ink truncate">{p.name}</p>
                    <div className="mt-2 h-2 bg-n-cream border border-n-border overflow-hidden">
                      <div className="h-full bg-n-gold" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-xs text-n-muted">Units: {p.units}</p>
                    <p className="font-sans text-sm text-n-ink">{formatPKR(p.revenue)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
