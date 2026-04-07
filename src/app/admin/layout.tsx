'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Package, Users, Settings, ExternalLink, LogOut } from 'lucide-react'

const LINKS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: ShoppingBag, label: 'Orders', href: '/admin/orders' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: Users, label: 'Customers', href: '/admin/customers' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLogin = pathname === '/admin/login'

  if (isLogin) return <>{children}</>

  const logout = () => {
    document.cookie = 'nuura-admin-token=; path=/; max-age=0'
    router.push('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F0E6', fontFamily: 'var(--font-sans)' }}>
      {/* Sidebar */}
      <aside style={{ width: '240px', flexShrink: 0, background: '#1B2E1F', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0 }}>
        {/* Logo */}
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(245,240,230,0.08)' }}>
          <p style={{ fontFamily: 'var(--font-accent)', fontSize: '20px', letterSpacing: '0.4em', color: '#F5F0E6', margin: 0, textTransform: 'uppercase' }}>NUURA</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A853', margin: '4px 0 0' }}>Admin Portal</p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {LINKS.map(({ icon: Icon, label, href }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', textDecoration: 'none', borderRadius: '6px', background: active ? 'rgba(212,168,83,0.12)' : 'transparent', color: active ? '#D4A853' : 'rgba(245,240,230,0.55)', fontSize: '13px', letterSpacing: '0.01em', transition: 'all 150ms', fontFamily: 'var(--font-sans)' }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(245,240,230,0.06)'; (e.currentTarget as HTMLAnchorElement).style.color = '#F5F0E6' } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(245,240,230,0.55)' } }}>
                <Icon size={16} strokeWidth={1.5} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(245,240,230,0.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link href="/" target="_blank"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', textDecoration: 'none', color: 'rgba(245,240,230,0.35)', fontSize: '12px', borderRadius: '6px', transition: 'all 150ms' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F5F0E6' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(245,240,230,0.35)' }}>
            <ExternalLink size={14} strokeWidth={1.5} />
            View Store
          </Link>
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'transparent', border: 'none', color: 'rgba(245,240,230,0.35)', fontSize: '12px', cursor: 'pointer', borderRadius: '6px', transition: 'all 150ms', fontFamily: 'var(--font-sans)', textAlign: 'left', width: '100%' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F5F0E6'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(196,97,74,0.1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(245,240,230,0.35)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
            <LogOut size={14} strokeWidth={1.5} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: '240px', minHeight: '100vh', background: '#FAFAF8' }}>
        {children}
      </main>
    </div>
  )
}
