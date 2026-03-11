'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Instagram, Twitter, Youtube, ArrowRight } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'
import { AnimatedSection } from '@/components/shared/AnimatedSection'

const SHOP_LINKS = [
  { label: 'All Products', href: '/shop' },
  { label: 'Self-Care', href: '/shop?category=self-care' },
  { label: 'Accessories', href: '/shop?category=accessories' },
  { label: 'New Drops', href: '/shop?filter=new' },
  { label: 'Gift Sets', href: '/shop?filter=gifts' },
]

const HELP_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Shipping Policy', href: '/shipping' },
  { label: 'Returns', href: '/returns' },
  { label: 'Contact', href: '/contact' },
]

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com/nuura.pk', icon: Instagram },
  { label: 'Twitter / X', href: 'https://twitter.com/nuurapk', icon: Twitter },
  { label: 'YouTube', href: 'https://youtube.com/@nuurapk', icon: Youtube },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const year = new Date().getFullYear()

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
    }
  }

  return (
    <footer className="bg-[--color-nuura-charcoal] text-[--color-nuura-cream]">
      <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16 pt-20 pb-12">

        {/* 4-column grid */}
        <AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-white/10">

            {/* Col 1 — Brand */}
            <div className="flex flex-col gap-5">
              <span className="font-accent text-3xl tracking-widest uppercase text-[--color-nuura-cream]">
                {SITE_CONFIG.name}
              </span>
              <p className="font-sans text-sm leading-relaxed text-[--color-nuura-cream]/60 max-w-xs">
                {SITE_CONFIG.description}
              </p>
              {/* Social Icons */}
              <div className="flex gap-4 mt-2">
                {SOCIALS.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="p-2 border border-white/15 hover:border-white/50 hover:text-white transition-colors duration-200 text-[--color-nuura-cream]/60"
                  >
                    <Icon size={14} strokeWidth={1.5} />
                  </a>
                ))}
              </div>
            </div>

            {/* Col 2 — Shop */}
            <div>
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[--color-nuura-cream]/40 mb-5">
                Shop
              </p>
              <ul className="flex flex-col gap-3">
                {SHOP_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="font-sans text-sm text-[--color-nuura-cream]/70 hover:text-[--color-nuura-cream] transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Help */}
            <div>
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[--color-nuura-cream]/40 mb-5">
                Help
              </p>
              <ul className="flex flex-col gap-3">
                {HELP_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="font-sans text-sm text-[--color-nuura-cream]/70 hover:text-[--color-nuura-cream] transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 — Newsletter */}
            <div>
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[--color-nuura-cream]/40 mb-5">
                Stay in the glow
              </p>
              <p className="font-sans text-sm text-[--color-nuura-cream]/60 leading-relaxed mb-5">
                New drops, rituals, and exclusive offers — straight to your inbox.
              </p>
              {subscribed ? (
                <p className="font-sans text-sm text-[--color-nuura-sage]">
                  ✓ You&apos;re on the list!
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 min-w-0 bg-white/5 border border-white/15 focus:border-white/40 outline-none px-4 py-3 font-sans text-sm text-[--color-nuura-cream] placeholder:text-[--color-nuura-cream]/30 transition-colors duration-200"
                  />
                  <button
                    type="submit"
                    className="px-4 py-3 bg-[--color-nuura-cream] text-[--color-nuura-charcoal] hover:bg-white transition-colors duration-200 flex items-center"
                    aria-label="Subscribe"
                  >
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-sans text-xs text-[--color-nuura-cream]/40">
            © {year} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <p className="font-sans text-xs text-[--color-nuura-cream]/40">
            Made with intention in Pakistan 🇵🇰
          </p>
          <div className="flex gap-6">
            {[['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="font-sans text-xs text-[--color-nuura-cream]/40 hover:text-[--color-nuura-cream]/80 transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
