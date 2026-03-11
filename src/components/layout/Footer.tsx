import Link from 'next/link'
import { SITE_CONFIG, NAV_LINKS } from '@/lib/constants'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#F5F0E6] py-16">
      <div className="max-w-6xl mx-auto px-8">
        {/* Logo & Tagline */}
        <div className="text-center mb-12">
          <span className="font-accent text-3xl tracking-widest text-[#2C2C2C] block mb-3">
            {SITE_CONFIG.name}
          </span>
          <p className="font-sans text-sm tracking-widest uppercase text-[#8A7F7A]">
            {SITE_CONFIG.tagline}
          </p>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-wrap justify-center gap-8 mb-12">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-sans text-sm text-[#8A7F7A] hover:text-[#2C2C2C] transition-colors duration-200 tracking-wide"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="h-px bg-[#EDE0D4] mb-8" />

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans text-[#8A7F7A]">
          <p>© {year} {SITE_CONFIG.name}. All rights reserved.</p>
          <p>{SITE_CONFIG.handle}</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#2C2C2C] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#2C2C2C] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
