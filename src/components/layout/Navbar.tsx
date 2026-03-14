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

const MOBILE_NAV_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/shop?category=self-care', label: 'Self-Care' },
  { href: '/shop?category=accessories', label: 'Accessories' },
  { href: '/shop?filter=new', label: 'New Drops' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const totalItems = useCartStore((s) => s.totalItems())
  const openCart = useCartStore((s) => s.openCart)

  useMotionValueEvent(scrollY, 'change', (v) => setIsScrolled(v > 60))

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 50,
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(1.5rem, 6vw, 5rem)',
          backgroundColor: isScrolled ? 'rgba(250,248,244,0.92)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(12px)' : 'none',
          borderBottom: isScrolled ? '1px solid #E8E0D8' : '1px solid transparent',
          transition: 'background-color 300ms ease, border-color 300ms ease, backdrop-filter 300ms ease',
        }}
      >
        {/* Logo */}
        <Link href='/' data-cursor='hover' style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--font-accent)',
            fontSize: '18px',
            letterSpacing: '0.45em',
            color: '#1A1714',
            textTransform: 'uppercase',
          }}>
            NUURA
          </span>
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2.5rem',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
          className='hidden md:flex'
        >
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href ||
              (link.href === '/shop' && pathname === '/shop' && !link.href.includes('?')) ||
              (link.href.includes('?') && pathname + window?.location?.search === link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                data-cursor='hover'
                style={{
                  position: 'relative',
                  paddingBottom: '4px',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: active ? '#C4614A' : '#8C8078',
                  transition: 'color 200ms ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = '#1A1714'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = '#8C8078'
                }}
              >
                {link.label}
                {active && (
                  <span style={{
                    position: 'absolute',
                    left: 0, right: 0, bottom: 0,
                    height: '1px',
                    backgroundColor: '#C4614A',
                  }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            style={{
              padding: '0.5rem', color: '#1A1714',
              background: 'transparent', border: 0,
              transition: 'color 200ms ease',
            }}
            data-cursor='hover'
            aria-label='Search'
            onMouseEnter={(e) => { e.currentTarget.style.color = '#8C8078' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#1A1714' }}
          >
            <Search size={18} strokeWidth={1} />
          </button>

          <button
            onClick={openCart}
            style={{
              position: 'relative',
              padding: '0.5rem', color: '#1A1714',
              background: 'transparent', border: 0,
              transition: 'color 200ms ease',
            }}
            data-cursor='hover'
            aria-label='Cart'
            onMouseEnter={(e) => { e.currentTarget.style.color = '#8C8078' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#1A1714' }}
          >
            <ShoppingBag size={18} strokeWidth={1} />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key='badge'
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    position: 'absolute',
                    top: '-2px', right: '-2px',
                    width: '18px', height: '18px',
                    borderRadius: '9999px',
                    backgroundColor: '#C4614A',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontFamily: 'var(--font-sans)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Hamburger mobile only */}
          <button
            className='md:hidden'
            onClick={() => setMenuOpen(true)}
            aria-label='Open menu'
            style={{
              padding: '0.5rem', color: '#1A1714',
              background: 'transparent', border: 0,
            }}
          >
            <Menu size={20} strokeWidth={1} />
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] as const }}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 60,
              backgroundColor: '#FAF8F4',
              display: 'flex',
              flexDirection: 'column',
              padding: '2rem clamp(1.5rem, 6vw, 5rem)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <span style={{
                fontFamily: 'var(--font-accent)',
                fontSize: '18px',
                letterSpacing: '0.45em',
                color: '#1A1714',
                textTransform: 'uppercase',
              }}>
                NUURA
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label='Close menu'
                data-cursor='hover'
                style={{
                  padding: '0.5rem', color: '#1A1714',
                  background: 'transparent', border: 0,
                }}
              >
                <X size={24} strokeWidth={1} />
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
              {MOBILE_NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{
                    delay: 0.1 + i * 0.08,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1] as const,
                  }}
                  style={{
                    borderTop: '1px solid #E8E0D8',
                    padding: '1.25rem 0',
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    data-cursor='hover'
                    style={{
                      display: 'block',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                      lineHeight: 1,
                      color: '#1A1714',
                      transition: 'color 200ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#C4614A' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#1A1714' }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ borderTop: '1px solid #E8E0D8', paddingTop: '2rem', marginTop: 'auto' }}
              >
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '10px',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: '#8C8078',
                }}>
                  Glow in your own light
                </p>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
