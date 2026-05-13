'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Package, Users, Settings, LogOut } from 'lucide-react'

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

  async function signOut() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } finally {
      router.replace('/admin/login')
      router.refresh()
    }
  }

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
            <div className="flex items-center justify-between gap-3">
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
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-n-gold" />
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

          <div className="px-4 pb-6 pt-3 border-t border-n-border">
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
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-2 font-sans text-xs tracking-widest uppercase text-n-muted hover:text-n-ink"
              >
                <LogOut size={14} strokeWidth={1.8} />
                Sign out
              </button>
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

          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
