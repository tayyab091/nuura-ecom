'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

const C = {
  bg: '#FAF8F4', bgAlt: '#F2EDE4', ink: '#1A1714',
  rose: '#C4614A', roseMid: '#D4796A', roseLight: '#F0C4BB',
  muted: '#8C8078', border: '#E8E0D8', white: '#FFFFFF',
}

const PRODUCTS = [
  { id: '1', name: 'Rose Quartz Gua Sha', tagline: 'Sculpt. Depuff. Glow.',
    price: 'PKR 2,800', comparePrice: 'PKR 3,500', category: 'Self-Care',
    slug: 'rose-quartz-gua-sha', isNew: true, bg: '#F0E8E4',
    img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80' },
  { id: '2', name: 'LED Glow Mirror', tagline: 'Studio lighting, anywhere.',
    price: 'PKR 4,500', comparePrice: 'PKR 5,500', category: 'Self-Care',
    slug: 'led-glow-mirror', isNew: false, bg: '#E8EDF0',
    img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80' },
  { id: '3', name: 'Mini Chain Crossbody', tagline: 'Small bag. Big statement.',
    price: 'PKR 3,200', comparePrice: null, category: 'Accessories',
    slug: 'mini-chain-crossbody', isNew: true, bg: '#EDE8E4',
    img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80' },
  { id: '4', name: 'Jade Face Roller', tagline: 'Roll away the stress.',
    price: 'PKR 1,800', comparePrice: 'PKR 2,200', category: 'Self-Care',
    slug: 'jade-face-roller', isNew: false, bg: '#E4EDE8',
    img: 'https://images.unsplash.com/photo-1591994843349-f415893b3a6b?w=600&q=80' },
  { id: '5', name: 'Acrylic Box Clutch', tagline: 'Art you carry.',
    price: 'PKR 2,500', comparePrice: null, category: 'Accessories',
    slug: 'acrylic-clutch', isNew: true, bg: '#EDE4ED',
    img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80' },
]

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

function Label({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ display: 'block', width: '24px', height: '1px', background: light ? C.roseLight : C.rose }} />
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.35em', textTransform: 'uppercase' as const, color: light ? 'rgba(255,255,255,0.5)' : C.muted }}>
        {children}
      </span>
    </div>
  )
}

function Hero() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', v => setScrolled(v > 80))
  const words = [
    { text: 'Your', italic: false, rose: false },
    { text: 'glow,', italic: true, rose: false },
    { text: 'your', italic: false, rose: false },
    { text: 'ritual.', italic: true, rose: true },
  ]
  return (
    <section style={{ position: 'relative', minHeight: '100svh', background: C.bg, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', right: '-0.04em', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-display)', fontSize: 'clamp(280px,38vw,580px)', fontWeight: 300, lineHeight: 1, color: 'transparent', WebkitTextStroke: `1px ${C.border}`, userSelect: 'none', pointerEvents: 'none', zIndex: 0 }}>N</div>
      <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(5rem,10vw,8rem) clamp(1.5rem,6vw,5rem) clamp(4rem,6vw,5rem)', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} style={{ marginBottom: '2rem' }}>
          <Label>New Collection — 2025</Label>
        </motion.div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, lineHeight: 0.9, letterSpacing: '-0.03em', fontSize: 'clamp(3.8rem,10.5vw,9.5rem)', margin: '0 0 clamp(2rem,4vw,3.5rem)', color: C.ink }}>
          {words.map((word, i) => (
            <div key={i} style={{ overflow: 'hidden', display: 'block' }}>
              <motion.span initial={{ y: '110%' }} animate={{ y: '0%' }} transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1], delay: 0.2 + i * 0.1 }} style={{ display: 'block', fontStyle: word.italic ? 'italic' : 'normal', color: word.rose ? C.rose : C.ink }}>
                {word.text}
              </motion.span>
            </div>
          ))}
        </h1>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.85 }} style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '2.5rem', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1.5rem' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(13px,1.5vw,15px)', lineHeight: 1.7, color: C.muted, maxWidth: '300px', margin: 0 }}>
              Curated self-care and aesthetic accessories for the woman who moves with intention.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' as const }}>
              <Link href="/shop" data-cursor="hover" style={{ display: 'inline-block', padding: '14px 36px', background: C.ink, color: C.bg, fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase' as const, textDecoration: 'none', transition: 'background 300ms', whiteSpace: 'nowrap' as const }}
                onMouseEnter={e => (e.currentTarget.style.background = C.rose)}
                onMouseLeave={e => (e.currentTarget.style.background = C.ink)}>
                Shop Now
              </Link>
              <Link href="/shop?filter=new" data-cursor="hover" style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.muted, textDecoration: 'none', borderBottom: `1px solid ${C.border}`, paddingBottom: '2px', transition: 'color 250ms, border-color 250ms', whiteSpace: 'nowrap' as const }}
                onMouseEnter={e => { e.currentTarget.style.color = C.rose; e.currentTarget.style.borderColor = C.rose }}
                onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border }}>
                New Drops →
              </Link>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0', borderTop: `1px solid ${C.border}`, paddingTop: '1.5rem' }}>
            {[{ n: '06', l: 'Curated SKUs' }, { n: '1,500+', l: 'Starting PKR' }, { n: 'COD', l: 'Nationwide' }].map((s, i) => (
              <div key={i} style={{ paddingRight: i < 2 ? '2rem' : '0', paddingLeft: i > 0 ? '2rem' : '0', borderRight: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem,2.2vw,1.8rem)', color: C.ink, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase' as const, color: C.muted, marginTop: '6px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <motion.div animate={{ opacity: scrolled ? 0 : 1 }} style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '8px', pointerEvents: 'none', zIndex: 2 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.4em', textTransform: 'uppercase' as const, color: C.muted }}>Scroll</span>
        <motion.div animate={{ scaleY: [1, 1.8, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} style={{ width: '1px', height: '36px', background: C.rose, transformOrigin: 'top' }} />
      </motion.div>
    </section>
  )
}

function Marquee({ bg = C.ink, color = C.bg, duration = 50, reverse = false }: { bg?: string; color?: string; duration?: number; reverse?: boolean }) {
  const text = 'Self-Care  ✦  Glow Up  ✦  Curated Drops  ✦  Aesthetic  ✦  New Arrivals  ✦  Limited Edition  ✦  Nuura  ✦  نور  ✦  '
  const repeated = text.repeat(8)
  return (
    <div style={{ background: bg, overflow: 'hidden', padding: '13px 0' }}>
      <motion.div animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }} transition={{ duration, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex', whiteSpace: 'nowrap' as const }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase' as const, color }}>{repeated}</span>
      </motion.div>
    </div>
  )
}

function ProductCard({ product, index }: { product: typeof PRODUCTS[0]; index: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link href={`/product/${product.slug}`} data-cursor="hover" style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
      <motion.div onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)} animate={{ y: hovered ? -8 : 0 }} transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}>
        <div style={{ position: 'relative', aspectRatio: '3/4', background: product.bg, overflow: 'hidden', marginBottom: '1.2rem' }}>
          <Image src={product.img} alt={product.name} fill sizes="(max-width: 768px) 72vw, 22vw" style={{ objectFit: 'cover', transition: 'transform 700ms ease', transform: hovered ? 'scale(1.06)' : 'scale(1)' }} />
          <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(250,248,244,0.9)', backdropFilter: 'blur(4px)', padding: '4px 10px', fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: C.muted }}>{product.category}</div>
          {product.isNew && <div style={{ position: 'absolute', top: '12px', right: '12px', background: C.rose, padding: '4px 10px', fontFamily: 'var(--font-sans)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: C.white }}>New</div>}
          <div style={{ position: 'absolute', bottom: '12px', right: '14px', fontFamily: 'var(--font-display)', fontSize: '2.8rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1, fontWeight: 300, userSelect: 'none' as const }}>0{index + 1}</div>
        </div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400, color: C.ink, margin: '0 0 3px', letterSpacing: '-0.01em' }}>{product.name}</p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: C.muted, margin: '0 0 8px' }}>{product.tagline}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: C.rose }}>{product.price}</span>
          {product.comparePrice && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: C.muted, textDecoration: 'line-through' }}>{product.comparePrice}</span>}
        </div>
      </motion.div>
    </Link>
  )
}

function DesktopProducts() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-58%'])
  return (
    <div ref={containerRef} style={{ height: '500vh', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: C.bg, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'clamp(1.5rem,3vw,2.5rem) clamp(1.5rem,6vw,5rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
          <div>
            <Label>Featured Drop</Label>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,3.5vw,3rem)', fontWeight: 300, color: C.ink, margin: '0.5rem 0 0', letterSpacing: '-0.02em' }}>This season&apos;s obsessions.</h2>
          </div>
          <Link href="/shop" data-cursor="hover" style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.rose, textDecoration: 'none', borderBottom: `1px solid ${C.rose}`, paddingBottom: '2px' }}>View All →</Link>
        </div>
        <motion.div style={{ x, display: 'flex', gap: '2rem', paddingLeft: 'clamp(1.5rem,6vw,5rem)', paddingRight: '30vw', paddingTop: '7rem' }}>
          {PRODUCTS.map((p, i) => (
            <div key={p.id} style={{ width: 'clamp(220px,20vw,290px)', flexShrink: 0 }}>
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </motion.div>
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: C.muted }}>Scroll to explore</span>
          <div style={{ width: '80px', height: '1px', background: C.border, position: 'relative', overflow: 'hidden' }}>
            <motion.div style={{ position: 'absolute', inset: 0, background: C.rose, scaleX: scrollYProgress, transformOrigin: 'left' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileProducts() {
  const [active, setActive] = useState(0)
  const startX = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = startX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) setActive(prev => Math.min(prev + 1, PRODUCTS.length - 1))
      else setActive(prev => Math.max(prev - 1, 0))
    }
  }
  return (
    <div style={{ background: C.bg, padding: '3rem 0 2rem' }}>
      <div style={{ padding: '0 1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Label>Featured Drop</Label>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, color: C.ink, margin: '0.5rem 0 0', letterSpacing: '-0.02em' }}>This season&apos;s<br />obsessions.</h2>
        </div>
        <Link href="/shop" style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: C.rose, textDecoration: 'none', borderBottom: `1px solid ${C.rose}`, paddingBottom: '2px' }}>All →</Link>
      </div>
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ overflow: 'hidden', paddingLeft: '1.5rem' }}>
        <motion.div animate={{ x: `calc(-${active * 78}vw)` }} transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }} style={{ display: 'flex', gap: '1rem' }}>
          {PRODUCTS.map((p, i) => (
            <div key={p.id} style={{ width: '72vw', flexShrink: 0 }}>
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </motion.div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '1.5rem' }}>
        {PRODUCTS.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ width: i === active ? '24px' : '6px', height: '6px', borderRadius: '3px', background: i === active ? C.rose : C.border, border: 'none', padding: 0, cursor: 'pointer', transition: 'all 300ms ease' }} />
        ))}
      </div>
    </div>
  )
}

function Products() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileProducts /> : <DesktopProducts />
}

function BrandStory() {
  const { ref, inView } = useInView(0.2)
  return (
    <section style={{ background: C.bgAlt, padding: 'clamp(4rem,8vw,7rem) clamp(1.5rem,6vw,5rem)' }}>
      <div ref={ref} style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(1,1fr)', gap: '3rem' }} className="md:grid-cols-2 md:gap-20 items-center">
        <div>
          <Label>Our Philosophy</Label>
          <div style={{ overflow: 'hidden', marginTop: '1.5rem' }}>
            <motion.h2 initial={{ y: '102%' }} animate={inView ? { y: '0%' } : {}} transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }} style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,4.5vw,3.8rem)', fontWeight: 300, lineHeight: 1.05, color: C.ink, margin: 0, letterSpacing: '-0.025em' }}>
              We don&apos;t sell<br />products.<br /><em style={{ color: C.rose }}>We curate rituals.</em>
            </motion.h2>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(13px,1.5vw,15px)', lineHeight: 1.8, color: C.muted, marginBottom: '1.25rem' }}>Nuura was born from a simple truth — Pakistani women deserve beauty that reflects their sophistication. Not fast fashion. Not cluttered marketplaces.</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(13px,1.5vw,15px)', lineHeight: 1.8, color: C.muted, marginBottom: '2.5rem' }}>Every product we carry is tested, curated, and chosen because it earns its place in your ritual.</p>
          <div style={{ fontFamily: 'var(--font-accent)', fontSize: 'clamp(3.5rem,6vw,5.5rem)', color: C.roseLight, lineHeight: 1, marginBottom: '2rem' }}>نور</div>
          <Link href="/shop" data-cursor="hover" style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.rose, textDecoration: 'none', borderBottom: `1px solid ${C.rose}`, paddingBottom: '3px', display: 'inline-block', transition: 'opacity 250ms' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.6')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            Explore the Edit →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

function PromiseStrip() {
  const { ref, inView } = useInView(0.3)
  const promises = [
    { title: 'Curated, not cluttered', desc: '12–18 SKUs per drop. Every product earns its place.' },
    { title: 'Cash on Delivery', desc: 'Nationwide COD. No trust issues, no upfront risk.' },
    { title: 'Limited drops', desc: 'When it\'s gone, it\'s gone. New drops every season.' },
  ]
  return (
    <section style={{ background: C.ink, padding: 'clamp(4rem,8vw,7rem) clamp(1.5rem,6vw,5rem)' }}>
      <div ref={ref} style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(1,1fr)', gap: '2.5rem' }} className="md:grid-cols-3 md:gap-16">
        {promises.map((p, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }} style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: C.rose, marginBottom: '1rem', letterSpacing: '0.3em' }}>✦</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem,2vw,1.7rem)', fontWeight: 300, color: C.bg, margin: '0 0 0.75rem', letterSpacing: '-0.01em' }}>{p.title}</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: 1.7, color: 'rgba(250,248,244,0.45)', margin: 0 }}>{p.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function FinalCTA() {
  const { ref, inView } = useInView(0.3)
  return (
    <section ref={ref} style={{ background: C.rose, padding: 'clamp(4rem,8vw,7rem) clamp(1.5rem,6vw,5rem)', textAlign: 'center' as const }}>
      <motion.div initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}>
        <Label light>New Season</Label>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem,6vw,5.5rem)', fontWeight: 300, color: C.white, margin: '1.5rem 0', letterSpacing: '-0.025em', lineHeight: 1.02 }}>Ready to glow?</h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(13px,1.5vw,15px)', color: 'rgba(255,255,255,0.7)', marginBottom: '2.5rem', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
          New drops every season. Limited quantities. Nationwide COD. No excuses not to treat yourself.
        </p>
        <Link href="/shop" data-cursor="hover" style={{ display: 'inline-block', padding: '16px 52px', background: C.white, color: C.rose, fontFamily: 'var(--font-sans)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase' as const, textDecoration: 'none', transition: 'background 300ms, color 300ms' }}
          onMouseEnter={e => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = C.white }}
          onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.color = C.rose }}>
          Shop the Collection
        </Link>
      </motion.div>
    </section>
  )
}

export default function HomePage() {
  return (
    <main style={{ background: C.bg, overflowX: 'hidden' }}>
      <Hero />
      <Marquee bg={C.ink} color={C.bg} duration={50} />
      <Products />
      <Marquee bg={C.rose} color={C.white} duration={35} reverse />
      <BrandStory />
      <PromiseStrip />
      <FinalCTA />
    </main>
  )
}
