'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { NAV_LINKS, SITE_CONFIG } from '@/lib/constants'
import { useCart } from '@/hooks/useCart'
import { MagneticButton } from '@/components/shared/MagneticButton'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { totalItems, openCart } = useCart()

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className={`fixed top-0 w-full z-50 px-8 py-6 flex items-center justify-between transition-all duration-500 ${
          isScrolled
            ? 'bg-[#FDFCFB]/90 backdrop-blur-md border-b border-[#EDE0D4]/40'
            : 'bg-transparent'
        }`}
      >
        {/* Logo */}
        <MagneticButton href="/">
          <span className="font-accent text-2xl tracking-widest text-[#2C2C2C]">
            {SITE_CONFIG.name}
          </span>
        </MagneticButton>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-sans text-sm tracking-wide text-[#2C2C2C] hover:text-[#8A7F7A] transition-colors duration-200"
                data-cursor="hover"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={openCart}
            className="relative p-2 text-[#2C2C2C] hover:text-[#8A7F7A] transition-colors"
            data-cursor="hover"
            aria-label="Open cart"
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#2C2C2C] text-white text-[10px] flex items-center justify-center rounded-full font-sans">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-[#2C2C2C]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#FDFCFB] flex flex-col items-center justify-center gap-8"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-display text-4xl text-[#2C2C2C] hover:text-[#8A7F7A] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
