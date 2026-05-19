'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, ShoppingBag, Package, Users, Settings, LogOut, Bell, AlertTriangle, Send, X, ExternalLink } from 'lucide-react'
import AdminChatWidget from './AdminChatWidget'
import { useAuth } from '@/components/auth/AuthProvider'

type NavItem = {
  href: string
  label: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', Icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', Icon: Package },
  { href: '/admin/customers', label: 'Customers', Icon: Users },
  { href: '/admin/settings', label: 'Settings', Icon: Settings },
]

function isActivePath(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(href + '/')
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const { setSession, closeAuthModal, session, resetAuthForm } = useAuth()
  const [lowStockCount, setLowStockCount] = useState(0)
  const [threshold, setThreshold] = useState(10)
  const [bellOpen, setBellOpen] = useState(false)
  const [bellItems, setBellItems] = useState<any[]>([])
  const [supplierProduct, setSupplierProduct] = useState<any | null>(null)
  const [reorderProduct, setReorderProduct] = useState<any | null>(null)
  const [shellToast, setShellToast] = useState<{ message: string; tone: 'success'|'error' } | null>(null)

  useEffect(() => {
    let active = true

    async function loadLowStockState() {
      try {
        const [settingsRes, productsRes] = await Promise.all([
          fetch('/api/admin/settings', { cache: 'no-store' }),
          fetch('/api/products?limit=100', { cache: 'no-store' }),
        ])

        const settingsData = await settingsRes.json().catch(() => null)
        const productsData = await productsRes.json().catch(() => null)
        const lowStockThreshold = Number(settingsData?.settings?.lowStockThreshold ?? 10)
        const products = Array.isArray(productsData?.products) ? productsData.products : []

        const count = products.filter((product: { stockCount?: number; lowStockThreshold?: number }) => {
          const itemThreshold = Number(product.lowStockThreshold ?? lowStockThreshold)
          return Number(product.stockCount ?? 0) <= itemThreshold
        }).length

        if (!active) return
        setThreshold(lowStockThreshold)
        setLowStockCount(count)
      } catch {
        if (!active) return
        setLowStockCount(0)
      }
    }

    void loadLowStockState()
    const timer = window.setInterval(() => {
      void loadLowStockState()
    }, 30000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!bellOpen) return
    let active = true
    const reviewedKey = `nuura-reviewed-low-stock:${session?.user?.email ?? 'anon'}`

    async function loadBellItems() {
      try {
        const [settingsRes, productsRes] = await Promise.all([
          fetch('/api/admin/settings', { cache: 'no-store' }),
          fetch('/api/products?limit=100', { cache: 'no-store' }),
        ])
        const settingsData = await settingsRes.json().catch(() => null)
        const productsData = await productsRes.json().catch(() => null)
        const lowStockThreshold = Number(settingsData?.settings?.lowStockThreshold ?? 10)
        const products = Array.isArray(productsData?.products) ? productsData.products : []
        const rawReviewed = window.localStorage.getItem(reviewedKey)
        const reviewedObj: Record<string, number> = rawReviewed ? JSON.parse(rawReviewed) : {}

        const items = products
          .map((p: unknown) => p as Record<string, unknown>)
          .filter((prod: Record<string, unknown>) => {
            if (!prod?.slug) return false
            const threshold = (prod.lowStockThreshold as number | undefined) ?? lowStockThreshold
            const reviewedAt = reviewedObj[String(prod.slug)]
            if (typeof reviewedAt === 'number' && !((prod.stockCount as number) < reviewedAt)) return false
            return (prod.stockCount as number) <= threshold
          })
          .map((prod: Record<string, unknown>) => ({
            _id: prod._id,
            slug: String(prod.slug),
            name: String(prod.name),
            stockCount: Number(prod.stockCount ?? 0),
            lowStockThreshold: Number(prod.lowStockThreshold ?? lowStockThreshold),
          }))

        if (!active) return
        setBellItems(items)
        setLowStockCount(items.length)
      } catch {
        if (!active) return
        setBellItems([])
        setLowStockCount(0)
      }
    }

    void loadBellItems()

    return () => {
      active = false
    }
  }, [bellOpen, session?.user?.email])

  async function signOut() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } finally {
      setSession(null)
      // reset auth modal fields so login appears blank after logout
      try { resetAuthForm() } catch {}
      closeAuthModal()
      router.replace('/')
      router.refresh()
    }
  }

  const hasAlerts = lowStockCount > 0
  const alertLabel = `${lowStockCount} low-stock product${lowStockCount === 1 ? '' : 's'}`

  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return <>{children}</>
  }

  const linkBase =
    'flex items-center gap-3 px-3 py-2.5 no-underline font-sans text-sm transition-colors border'

  return (
    <div className="min-h-screen bg-n-offwhite">
      <div className="md:grid md:grid-cols-[260px_1fr]">
        <aside className="hidden md:flex md:flex-col bg-n-card border-r border-n-border min-h-screen sticky top-0">
          <div className="px-6 py-6 border-b border-n-border">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href="/admin" className="no-underline">
                  <div className="leading-none">
                    <p className="[font-family:var(--font-accent)] text-[20px] tracking-[0.45em] text-n-ink">
                      NUURA
                    </p>
                    <p className="font-sans text-[11px] tracking-[0.16em] uppercase text-n-muted mt-2">
                      Admin Panel
                    </p>
                  </div>
                </Link>
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-n-border bg-n-cream px-3 py-2 font-sans text-[10px] tracking-[0.18em] uppercase text-n-ink no-underline hover:bg-n-forest hover:text-n-cream hover:border-n-forest transition-colors"
                >
                  <ExternalLink size={14} strokeWidth={1.5} />
                  Go To Shop
                </Link>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative">
                  <button type="button" onClick={() => setBellOpen((s) => !s)} aria-label="Inventory alerts" className="relative">
                    <Bell size={18} strokeWidth={1.7} className={hasAlerts ? 'text-red-600 nuura-bell-ring' : 'text-n-muted'} />
                    {hasAlerts && (
                      <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-red-500 nuura-pulse" />
                    )}
                  </button>

                  {bellOpen && (
                    <div className="absolute right-0 mt-2 w-[360px] z-50 rounded-2xl border border-n-border bg-n-card shadow-[0_18px_60px_rgba(0,0,0,0.12)]">
                      <div className="px-4 py-3 border-b border-n-border flex items-center justify-between">
                        <div>
                          <p className="font-sans text-xs text-n-muted">Low stock alerts</p>
                          <p className="text-sm text-n-ink">{alertLabel}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => { window.localStorage.setItem(`nuura-reviewed-low-stock:${session?.user?.email ?? 'anon'}`, JSON.stringify({})); setBellItems([]); setLowStockCount(0); }} className="text-xs text-n-muted">Reset all</button>
                          <button type="button" onClick={() => setBellOpen(false)} className="text-xs text-n-muted">Close</button>
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {!bellItems.length ? (
                          <div className="p-4 text-center text-sm text-n-muted">All products are well stocked ✓</div>
                        ) : (
                          <div className="divide-y divide-n-border">
                            {bellItems.map((item) => (
                              <div key={item._id} className="px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-sans text-sm text-n-ink">{item.name}</p>
                                    <p className="font-sans text-xs text-n-muted mt-1">{item.stockCount} units — threshold {item.lowStockThreshold}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <div className="flex gap-2">
                                      <button type="button" onClick={() => setSupplierProduct(item)} className="px-2 py-1 text-xs border rounded">Contact Supplier</button>
                                      <button type="button" onClick={() => setReorderProduct(item)} className="px-2 py-1 text-xs border rounded">Reorder Stock</button>
                                    </div>
                                    <div className="flex gap-2">
                                      <button type="button" onClick={() => {
                                        try {
                                          const key = `nuura-reviewed-low-stock:${session?.user?.email ?? 'anon'}`
                                          const raw = window.localStorage.getItem(key)
                                          const obj = raw ? JSON.parse(raw) : {}
                                          obj[item.slug] = item.stockCount
                                          window.localStorage.setItem(key, JSON.stringify(obj))
                                          setBellItems((cur) => cur.filter((c) => c.slug !== item.slug))
                                          setLowStockCount((n) => Math.max(0, n - 1))
                                        } catch {}
                                      }} className="px-2 py-1 text-xs border rounded">Mark as Reviewed</button>
                                      <button type="button" onClick={() => { setBellOpen(false); router.push(`/admin?analytics=${item.slug}`) }} className="px-2 py-1 text-xs bg-n-forest text-n-cream rounded">View Analytics</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-right border-t border-n-border">
                        <button type="button" onClick={() => { setBellOpen(false); router.push('/admin#low-stock-alerts') }} className="px-3 py-2 text-xs bg-n-forest text-n-cream rounded-lg">Open Inventory</button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-transparent hover:bg-n-cream/60 hover:border-n-border transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut size={16} strokeWidth={1.8} className="text-n-muted" />
                </button>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-5 flex flex-col gap-2">
            {NAV.map(({ href, label, Icon }) => {
              const active = isActivePath(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    linkBase +
                    ' ' +
                    (active
                      ? 'bg-n-cream border-n-border text-n-ink'
                      : 'bg-transparent border-transparent text-n-muted hover:text-n-ink hover:bg-n-cream/60 hover:border-n-border')
                  }
                >
                  <Icon size={16} strokeWidth={1.7} className={active ? 'text-n-forest' : 'text-n-muted'} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          {hasAlerts && (
            <div className="mx-4 mb-4 rounded-2xl border border-red-500/15 bg-red-500/8 px-4 py-4 text-sm text-red-900">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-8 items-center justify-center rounded-full bg-red-500/12 text-red-600">
                  <AlertTriangle size={16} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-red-700/80">
                    Inventory watch
                  </p>
                  <p className="font-sans text-xs text-red-900 mt-1">
                    {alertLabel} need attention. Threshold {threshold} units.
                  </p>
                  <Link
                    href="/admin#low-stock-alerts"
                    className="mt-2 inline-flex text-[10px] tracking-[0.16em] uppercase text-red-700 no-underline hover:text-red-900"
                  >
                    Review low stock
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="px-4 pb-6 pt-3 border-t border-n-border">
            <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 font-sans text-sm text-n-muted hover:text-n-ink bg-transparent border border-transparent hover:bg-n-cream/60 hover:border-n-border no-underline">
              <ExternalLink size={14} strokeWidth={1.5} className="text-n-muted" />
              <span>View Shop</span>
            </Link>

            <button
              type="button"
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 font-sans text-sm text-n-muted hover:text-n-ink bg-transparent border border-transparent hover:bg-n-cream/60 hover:border-n-border transition-colors"
            >
              <LogOut size={16} strokeWidth={1.7} className="text-n-muted" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        <main className="min-h-screen">
          {/* Mobile top bar */}
          <div className="md:hidden bg-n-card border-b border-n-border px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/admin" className="no-underline">
                <p className="[font-family:var(--font-accent)] text-[16px] tracking-[0.45em] text-n-ink leading-none">
                  NUURA
                </p>
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-n-border bg-n-cream px-3 py-2 font-sans text-[9px] tracking-[0.16em] uppercase text-n-ink no-underline hover:bg-n-forest hover:text-n-cream transition-colors"
                >
                  <ExternalLink size={13} strokeWidth={1.5} />
                  Shop
                </Link>
                <div className="relative">
                  <Bell size={16} strokeWidth={1.7} className={hasAlerts ? 'text-red-600' : 'text-n-muted'} />
                  {hasAlerts && (
                    <span className="absolute -right-1 -top-1 size-2 rounded-full bg-red-500 nuura-pulse" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center gap-2 font-sans text-xs tracking-widest uppercase text-n-muted hover:text-n-ink"
                >
                  <LogOut size={14} strokeWidth={1.8} />
                  Sign out
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {NAV.map(({ href, label }) => {
                const active = isActivePath(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={
                      'whitespace-nowrap px-3 py-1.5 border font-sans text-xs tracking-widest uppercase no-underline transition-colors ' +
                      (active
                        ? 'bg-n-cream border-n-border text-n-ink'
                        : 'bg-transparent border-n-border/0 text-n-muted hover:bg-n-cream/60 hover:border-n-border')
                    }
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>

          {hasAlerts && (
            <div className="md:hidden mx-4 mt-4 rounded-2xl border border-red-500/15 bg-red-500/8 px-4 py-3 text-sm text-red-900">
              <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-red-700/80">Inventory watch</p>
              <p className="font-sans text-xs text-red-900 mt-1">{alertLabel} need attention. Threshold {threshold} units.</p>
            </div>
          )}

          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
            {children}
            <AdminChatWidget />
          </div>
        </main>
      {supplierProduct && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[8px] flex items-center justify-center p-4" onClick={() => setSupplierProduct(null)}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[28px] border border-n-border bg-n-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-n-border px-6 py-5 bg-gradient-to-b from-n-cream/80 to-transparent">
              <div>
                <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Low stock outreach</p>
                <h3 className="[font-family:var(--font-display)] text-2xl font-light text-n-ink mt-2">Contact Supplier • {supplierProduct.name}</h3>
              </div>
              <button type="button" onClick={() => setSupplierProduct(null)} className="inline-flex items-center justify-center size-10 rounded-full border border-n-border bg-n-white text-n-muted">Close</button>
            </div>
            <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Supplier name</span>
                    <input className="bg-n-white border border-n-border text-n-ink px-4 py-3 rounded-xl" defaultValue="Supplier team" id="__supplier_name" />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Subject</span>
                    <input className="bg-n-white border border-n-border text-n-ink px-4 py-3 rounded-xl" defaultValue={`Low Stock Alert: ${supplierProduct.name}`} id="__supplier_subject" />
                  </label>
                </div>

                <label className="flex flex-col gap-2">
                  <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Message</span>
                  <textarea id="__supplier_message" className="bg-n-white border border-n-border text-n-ink px-4 py-3 rounded-xl min-h-[180px]">{`Hello Supplier team,\n\n${supplierProduct.name} is currently at ${supplierProduct.stockCount} units, which is below the threshold of ${supplierProduct.lowStockThreshold}. Please confirm restock availability and expected lead time.\n\nThanks,\nNuura Admin`}</textarea>
                </label>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setSupplierProduct(null)} className="px-4 py-3 rounded-xl border border-n-border bg-n-white">Cancel</button>
                  <button type="button" onClick={() => {
                    try {
                      const name = (document.getElementById('__supplier_name') as HTMLInputElement).value || 'Supplier team'
                      const subject = (document.getElementById('__supplier_subject') as HTMLInputElement).value || `Low Stock Alert: ${supplierProduct.name}`
                      const body = (document.getElementById('__supplier_message') as HTMLTextAreaElement).value || ''
                      window.location.href = `mailto:${encodeURIComponent('support@nuura.pk')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace('Supplier team', name))}`
                    } catch { }
                    setSupplierProduct(null)
                  }} className="px-4 py-3 rounded-xl bg-n-forest text-n-cream">Send Email</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reorderProduct && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[8px] flex items-center justify-center p-4" onClick={() => setReorderProduct(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[28px] border border-n-border bg-n-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-n-border px-6 py-5 bg-gradient-to-b from-n-cream/80 to-transparent">
              <div>
                <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Inventory replenishment</p>
                <h3 className="[font-family:var(--font-display)] text-2xl font-light text-n-ink mt-2">Reorder Stock • {reorderProduct.name}</h3>
              </div>
              <button type="button" onClick={() => setReorderProduct(null)} className="inline-flex items-center justify-center size-10 rounded-full border border-n-border bg-n-white text-n-muted">Close</button>
            </div>
            <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-n-border bg-n-cream/50 p-4">
                    <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Product name</p>
                    <p className="font-sans text-sm text-n-ink mt-2">{reorderProduct.name}</p>
                  </div>
                  <div className="rounded-2xl border border-n-border bg-n-cream/50 p-4">
                    <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Current stock</p>
                    <p className="font-sans text-sm text-n-ink mt-2">{reorderProduct.stockCount} units</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Reorder quantity</span>
                    <input id="__reorder_qty" type="number" min="1" defaultValue="10" className="bg-n-white border border-n-border text-n-ink px-4 py-3 rounded-xl" />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">Estimated delivery date</span>
                    <input id="__reorder_date" type="date" defaultValue={(new Date(Date.now()+7*24*3600*1000)).toISOString().slice(0,10)} className="bg-n-white border border-n-border text-n-ink px-4 py-3 rounded-xl" />
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setReorderProduct(null)} className="px-4 py-3 rounded-xl border border-n-border bg-n-white">Cancel</button>
                  <button type="button" onClick={async () => {
                    try {
                      const qty = Number((document.getElementById('__reorder_qty') as HTMLInputElement).value || '0')
                      const date = (document.getElementById('__reorder_date') as HTMLInputElement).value || ''
                      if (!qty || qty <= 0) return
                      const next = (reorderProduct.stockCount || 0) + qty
                      const res = await fetch(`/api/products/${reorderProduct.slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stockCount: next, inStock: true }) })
                      if (res.ok) {
                        setShellToast({ message: `Reorder confirmed for ${reorderProduct.name}. Delivery target ${date}.`, tone: 'success' })
                        setBellItems((cur) => cur.filter((c) => c.slug !== reorderProduct.slug))
                        setLowStockCount((n) => Math.max(0, n - 1))
                        setTimeout(() => setShellToast(null), 3200)
                      } else {
                        setShellToast({ message: `Failed to reorder ${reorderProduct.name}.`, tone: 'error' })
                        setTimeout(() => setShellToast(null), 3200)
                      }
                    } catch {
                      setShellToast({ message: `Failed to reorder ${reorderProduct.name}.`, tone: 'error' })
                      setTimeout(() => setShellToast(null), 3200)
                    } finally {
                      setReorderProduct(null)
                      await fetch('/api/products?limit=100')
                    }
                  }} className="px-4 py-3 rounded-xl bg-n-forest text-n-cream">Confirm Reorder</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {shellToast && (
        <div className="fixed right-4 top-4 z-[60] max-w-sm rounded-2xl border border-n-border bg-n-card px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 inline-flex size-8 items-center justify-center rounded-full ${shellToast.tone === 'success' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700'}`}>
              {shellToast.tone === 'success' ? <Send size={15} strokeWidth={1.8} /> : <AlertTriangle size={15} strokeWidth={1.8} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-n-muted">{shellToast.tone === 'success' ? 'Success' : 'Error'}</p>
              <p className="font-sans text-sm text-n-ink mt-1">{shellToast.message}</p>
            </div>
            <button type="button" onClick={() => setShellToast(null)} className="text-n-muted hover:text-n-ink">
              <X size={14} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
