'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { ShoppingBag, Search, X, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'

const NAV_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/shop?category=self-care', label: 'Self-Care' },
  { href: '/shop?category=accessories', label: 'Accessories' },
  { href: '/shop?filter=new', label: 'Drops' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const totalItems = useCartStore(s => s.totalItems())
  const openCart = useCartStore(s => s.openCart)

  useMotionValueEvent(scrollY, 'change', v => setScrolled(v > 60))
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const isForest = pathname === '/'
  const textColor = isForest && !scrolled ? '#F5F0E6' : '#0F1A11'
  const bg = scrolled ? 'rgba(250,250,248,0.95)' : 'transparent'
  const blur = scrolled ? 'blur(16px)' : 'none'
  const border = scrolled ? '1px solid #DDD8CF' : '1px solid transparent'

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(1.5rem,6vw,5rem)', backgroundColor: bg, backdropFilter: blur, borderBottom: border, transition: 'all 350ms ease' }}
      >
        <Link href="/" data-cursor="hover" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-accent)', fontSize: '20px', letterSpacing: '0.45em', color: textColor, textTransform: 'uppercase', transition: 'color 350ms' }}>NUURA</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} className="hidden md:flex">
          {NAV_LINKS.map(link => {
            const active = pathname === link.href
            return (
              <Link key={link.href} href={link.href} data-cursor="hover"
                style={{ position: 'relative', paddingBottom: '4px', textDecoration: 'none', fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: active ? '#D4A853' : textColor, transition: 'color 300ms', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#D4A853' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = textColor }}
              >
                {link.label}
                {active && <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '1px', backgroundColor: '#D4A853' }} />}
              </Link>
            )
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {[
            <button key="search" style={{ padding: '0.5rem', color: textColor, background: 'transparent', border: 0, transition: 'color 300ms' }} data-cursor="hover" aria-label="Search" onMouseEnter={e => { e.currentTarget.style.color = '#D4A853' }} onMouseLeave={e => { e.currentTarget.style.color = textColor }}><Search size={18} strokeWidth={1} /></button>,
            <button key="cart" onClick={openCart} style={{ position: 'relative', padding: '0.5rem', color: textColor, background: 'transparent', border: 0, transition: 'color 300ms' }} data-cursor="hover" aria-label="Cart" onMouseEnter={e => { e.currentTarget.style.color = '#D4A853' }} onMouseLeave={e => { e.currentTarget.style.color = textColor }}>
              <ShoppingBag size={18} strokeWidth={1} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    style={{ position: 'absolute', top: '-2px', right: '-2px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#D4A853', color: '#1B2E1F', fontSize: '10px', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>,
          ]}
          <button className="md:hidden" onClick={() => setMenuOpen(true)} style={{ padding: '0.5rem', color: textColor, background: 'transparent', border: 0 }}><Menu size={20} strokeWidth={1} /></button>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '100%' }} transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#1B2E1F', display: 'flex', flexDirection: 'column', padding: '2rem clamp(1.5rem,6vw,5rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
              <span style={{ fontFamily: 'var(--font-accent)', fontSize: '20px', letterSpacing: '0.45em', color: '#F5F0E6', textTransform: 'uppercase' }}>NUURA</span>
              <button onClick={() => setMenuOpen(false)} style={{ color: '#F5F0E6', background: 'transparent', border: 0 }} data-cursor="hover"><X size={24} strokeWidth={1} /></button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: '0' }}>
              {NAV_LINKS.map((link, i) => (
                <motion.div key={link.href} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{ borderBottom: '1px solid rgba(245,240,230,0.1)', padding: '1.25rem 0' }}>
                  <Link href={link.href} onClick={() => setMenuOpen(false)} data-cursor="hover"
                    style={{ display: 'block', textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem,8vw,4.5rem)', color: '#F5F0E6', lineHeight: 1, transition: 'color 200ms' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#D4A853' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#F5F0E6' }}>
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,230,0.3)' }}>Glow in your own light</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
