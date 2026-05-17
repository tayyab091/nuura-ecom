'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Search, Star } from 'lucide-react'
import { formatPKR } from '@/lib/utils'

type CustomerRow = {
  email: string
  name: string
  phone?: string
  ordersCount: number
  totalSpent: number
  lastOrderAt: string
  isVip: boolean
  tags: string[]
  notes: string
}

type CustomerDetail = {
  customer: {
    email: string
    name: string
    phone: string
    isRegistered: boolean
    createdAt: string | null
    profile: { isVip: boolean; tags: string[]; notes: string }
    lastShippingAddress: {
      fullName: string
      phone: string
      street: string
      city: string
      province: string
      postalCode: string
    } | null
  }
  stats: { ordersCount: number; totalSpent: number; lastOrderAt: string | null }
  recentOrders: Array<{ _id: string; orderNumber: string; total: number; orderStatus: string; paymentStatus: string; createdAt: string }>
}

function CustomerModal({ email, onClose, onUpdated }: { email: string; onClose: () => void; onUpdated: () => void }) {
  const [data, setData] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [isVip, setIsVip] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/customers/${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        const p = d?.customer?.profile
        setNotes(p?.notes ?? '')
        setTags((p?.tags ?? []).join(', '))
        setIsVip(Boolean(p?.isVip))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [email])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, tags, isVip }),
      })
      if (res.ok) {
        onUpdated()
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'bg-n-white border border-n-border text-n-ink placeholder-n-muted/70 px-4 py-2.5 w-full focus:outline-none focus:border-n-forest font-sans text-sm transition-colors'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-3xl mx-4 mt-16 mb-20 bg-n-cream border border-n-border p-8 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-n-muted hover:text-n-ink transition-colors">
          <X size={18} strokeWidth={1.5} />
        </button>

        {loading ? (
          <div className="py-12 text-center font-sans text-sm text-n-muted">Loading...</div>
        ) : !data ? (
          <div className="py-12 text-center font-sans text-sm text-n-muted">Customer not found</div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <p className="font-sans text-[10px] tracking-widest uppercase text-n-muted">Customer</p>
                <h2 className="[font-family:var(--font-display)] text-3xl font-light text-n-ink mt-3">
                  {data.customer.name}
                </h2>
                <p className="font-sans text-sm text-n-muted mt-2">{data.customer.email}</p>
                {data.customer.phone && (
                  <p className="font-sans text-sm text-n-muted mt-1">{data.customer.phone}</p>
                )}
              </div>

              <div className="text-right">
                <p className="font-sans text-[10px] tracking-widest uppercase text-n-muted">Lifetime</p>
                <p className="font-sans text-sm text-n-ink mt-2">Orders: {data.stats.ordersCount}</p>
                <p className="font-sans text-sm text-n-ink">Spent: {formatPKR(data.stats.totalSpent ?? 0)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-n-card border border-n-border p-6">
                <p className="font-sans text-[10px] tracking-widest uppercase text-n-muted mb-4">Profile</p>

                <label className="flex items-center justify-between gap-3 border border-n-border bg-n-white px-4 py-3">
                  <div>
                    <p className="font-sans text-sm text-n-ink">VIP customer</p>
                    <p className="font-sans text-xs text-n-muted mt-1">Highlight and prioritize this customer.</p>
                  </div>
                  <input type="checkbox" checked={isVip} onChange={(e) => setIsVip(e.target.checked)} />
                </label>

                <div className="mt-4">
                  <p className="font-sans text-[10px] tracking-widest uppercase text-n-muted mb-2">Tags</p>
                  <input className={inputCls} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vip, repeat, influencer" />
                </div>

                <div className="mt-4">
                  <p className="font-sans text-[10px] tracking-widest uppercase text-n-muted mb-2">Notes</p>
                  <textarea className={inputCls} rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes (address issues, preferences, etc.)" />
                </div>

                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="mt-5 bg-n-forest text-n-cream px-4 py-2.5 font-sans text-xs tracking-widest uppercase hover:bg-n-gold hover:text-n-forest transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>

              <div className="bg-n-card border border-n-border p-6">
                <p className="font-sans text-[10px] tracking-widest uppercase text-n-muted mb-4">Recent Orders</p>
                {!data.recentOrders?.length ? (
                  <p className="font-sans text-sm text-n-muted">No orders yet</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {data.recentOrders.map((o) => (
                      <div key={o._id} className="flex items-center justify-between border border-n-border bg-n-white px-4 py-3">
                        <div>
                          <p className="font-mono text-xs text-n-ink">{o.orderNumber}</p>
                          <p className="font-sans text-[11px] text-n-muted mt-1">
                            {new Date(o.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-sans text-sm text-n-ink">{formatPKR(o.total)}</p>
                          <p className="font-sans text-[11px] text-n-muted mt-1">{o.orderStatus}</p>
                        </div>
                      </div>
                    ))}
                    <a
                      href="/admin/orders"
                      className="font-sans text-xs tracking-widest uppercase text-n-gold no-underline hover:text-n-forest transition-colors"
                    >
                      Open Orders →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminCustomersPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  useEffect(() => {
    const url = `/api/admin/customers?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.customers ?? [])
        setTotal(d.total ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [q, page])

  const header = useMemo(
    () => (
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="[font-family:var(--font-display)] text-3xl font-light text-n-ink">Customers</h1>
          <p className="font-sans text-sm text-n-muted mt-2">
            Search customers, view order history, and manage internal notes.
          </p>
        </div>
        <div className="w-full md:w-[360px]">
          <div className="flex items-center gap-2 bg-n-white border border-n-border px-4 py-3">
            <Search size={16} strokeWidth={1.7} className="text-n-muted" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="Search name / email / phone"
              className="w-full bg-transparent font-sans text-sm text-n-ink placeholder-n-muted/70 focus:outline-none"
            />
          </div>
        </div>
      </div>
    ),
    [q]
  )

  return (
    <div>
      {selected && (
        <CustomerModal
          email={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            // refresh list
            const url = `/api/admin/customers?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`
            fetch(url)
              .then((r) => r.json())
              .then((d) => {
                setRows(d.customers ?? [])
                setTotal(d.total ?? 0)
              })
              .catch(() => {})
          }}
        />
      )}

      <div className="mb-8 pb-6 border-b border-n-border">{header}</div>

      <div className="bg-n-card border border-n-border overflow-x-auto">
        {loading ? (
          <div className="px-6 py-12 text-center font-sans text-sm text-n-muted">Loading...</div>
        ) : !rows.length ? (
          <div className="px-6 py-12 text-center font-sans text-sm text-n-muted">No customers found</div>
        ) : (
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-n-forest">
                {['Customer', 'Phone', 'Orders', 'Spent', 'Last Order', 'VIP', 'Tags'].map((h) => (
                  <th key={h} className="font-sans text-[10px] tracking-widest uppercase text-n-cream px-6 py-4 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.email}
                  className="border-b border-n-border last:border-0 hover:bg-n-cream/30 transition-colors cursor-pointer"
                  onClick={() => setSelected(c.email)}
                >
                  <td className="px-6 py-4">
                    <p className="font-sans text-sm text-n-ink flex items-center gap-2">
                      {c.name}
                      {c.isVip && <Star size={14} strokeWidth={1.7} className="text-n-gold" />}
                    </p>
                    <p className="font-sans text-xs text-n-muted mt-1">{c.email}</p>
                  </td>
                  <td className="px-6 py-4 font-sans text-sm text-n-muted">{c.phone ?? '—'}</td>
                  <td className="px-6 py-4 font-sans text-sm text-n-ink">{c.ordersCount}</td>
                  <td className="px-6 py-4 font-sans text-sm text-n-ink">{formatPKR(c.totalSpent ?? 0)}</td>
                  <td className="px-6 py-4 font-sans text-xs text-n-muted">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('en-PK') : '—'}
                  </td>
                  <td className="px-6 py-4 font-sans text-xs text-n-muted">{c.isVip ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 font-sans text-xs text-n-muted">
                    {(c.tags ?? []).slice(0, 4).join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 justify-end">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={[
                'font-sans text-xs px-3 py-2 transition-colors',
                p === page
                  ? 'bg-n-forest text-n-cream'
                  : 'bg-n-white text-n-muted border border-n-border hover:text-n-ink',
              ].join(' ')}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
