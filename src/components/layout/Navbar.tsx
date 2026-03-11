'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from 'framer-motion'
import { ShoppingBag, Search, X, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { NAV_LINKS, SITE_CONFIG } from '@/lib/constants'
import { useCartStore } from '@/store/cartStore'
import { MagneticButton } from '@/components/shared/MagneticButton'

const ease = [0.76, 0, 0.24, 1] as const

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const totalItems = useCartStore((s) => s.totalItems())
  const openCart = useCartStore((s) => s.openCart)

  useMotionValueEvent(scrollY, 'change', (v) => setIsScrolled(v > 80))

  /* ── entrance stagger ───────────────────────────────── */
  const navContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  }
  const navItem = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease } },
  }

  return (
    <>
      {/* ── Main bar ─────────────────────────────────────── */}
      <motion.header
        variants={navContainer}
        initial="hidden"
        animate="visible"
        className={[
          'fixed top-0 left-0 right-0 z-50',
          'flex items-center justify-between',
          'h-18 px-8 md:px-12 lg:px-16',
          'transition-all duration-400',
          isScrolled
            ? 'bg-white/80 backdrop-blur-md border-b border-[--color-nuura-nude]/30 shadow-sm'
            : 'bg-transparent',
        ].join(' ')}
      >
        {/* Logo */}
        <motion.div variants={navItem}>
          <MagneticButton href="/">
            <span
              className="font-accent text-2xl tracking-widest uppercase text-[--color-nuura-charcoal]"
              data-cursor="hover"
            >
              {SITE_CONFIG.name}
            </span>
          </MagneticButton>
        </motion.div>

        {/* Desktop nav links — centered */}
        <motion.nav
          variants={navItem}
          className="hidden md:flex items-center gap-8"
        >
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '?')
            return (
              <Link
                key={link.href}
                href={link.href}
                data-cursor="hover"
                className="relative group font-sans text-sm tracking-wider uppercase text-[--color-nuura-charcoal] transition-opacity duration-200 hover:opacity-60"
              >
                {link.label}
                {/* slide-in underline */}
                <span
                  className={[
                    'absolute -bottom-0.5 left-0 h-px bg-[--color-nuura-charcoal]',
                    'transition-all duration-300',
                    active ? 'w-full' : 'w-0 group-hover:w-full',
                  ].join(' ')}
                />
              </Link>
            )
          })}
        </motion.nav>

        {/* Right actions */}
        <motion.div variants={navItem} className="flex items-center gap-3">
          {/* Search */}
          <button
            className="p-2 text-[--color-nuura-charcoal] hover:opacity-60 transition-opacity"
            data-cursor="hover"
            aria-label="Search"
          >
            <Search size={18} strokeWidth={1.5} />
          </button>

          {/* Cart */}
          <button
            onClick={openCart}
            className="relative p-2 text-[--color-nuura-charcoal] hover:opacity-60 transition-opacity"
            data-cursor="hover"
            aria-label="Cart"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-[--color-nuura-charcoal] text-white text-[10px] font-sans flex items-center justify-center rounded-full"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-2 text-[--color-nuura-charcoal]"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </motion.div>
      </motion.header>

      {/* ── Full-screen mobile menu ───────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease }}
            className="fixed inset-0 z-[60] bg-[--color-nuura-warm-white] flex flex-col px-8 py-8"
          >
            {/* Close button */}
            <div className="flex justify-end mb-12">
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 text-[--color-nuura-charcoal]"
                aria-label="Close menu"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex flex-col gap-6 flex-1">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="font-display text-5xl text-[--color-nuura-charcoal] hover:text-[--color-nuura-muted] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Footer text */}
            <p className="font-sans text-xs tracking-widest uppercase text-[--color-nuura-muted]">
              {SITE_CONFIG.name} — {SITE_CONFIG.tagline}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
