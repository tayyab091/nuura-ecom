'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'
import { MOCK_PRODUCTS } from '@/lib/mockData'
import { formatPKR } from '@/lib/utils'

const C = {
  forest: '#1B2E1F', cream: '#F5F0E6', gold: '#D4A853',
  goldLight: '#E8C97A', white: '#FAFAF8', offwhite: '#F0EBE3',
  ink: '#0F1A11', muted: '#6B7B6E', border: '#DDD8CF',
}

const BG_BY_SLUG: Record<string, string> = {
  'rose-quartz-gua-sha': '#F5EFEC',
  'led-glow-mirror': '#ECF0F5',
  'mini-chain-crossbody': '#F0EBE4',
  'jade-face-roller': '#ECF5EE',
  'acrylic-clutch': '#F0ECF5',
  'facial-steamer': '#ECF5F5',
}

const PRODUCTS = MOCK_PRODUCTS.map((p) => ({
  id: String(p._id),
  name: p.name,
  tagline: p.tagline,
  price: formatPKR(p.price),
  comparePrice: typeof p.comparePrice === 'number' ? formatPKR(p.comparePrice) : null,
  category: p.category === 'self-care' ? 'Self-Care' : 'Accessories',
  slug: p.slug,
  isNew: Boolean(p.isNewDrop),
  bg: BG_BY_SLUG[p.slug] ?? '#F0EBE3',
  img: p.images?.[0] || '/placeholder.jpg',
}))

const REVIEWS = [
  { name:'Aisha K.', city:'Lahore', rating:5, text:'The gua sha changed my entire morning routine. My skin looks lifted and I get compliments every day. Worth every rupee and more.', product:'Rose Quartz Gua Sha', initials:'AK' },
  { name:'Fatima R.', city:'Karachi', rating:5, text:'Finally a Pakistani brand that feels premium. The packaging is gorgeous, delivery was fast, and the LED mirror is absolutely stunning.', product:'LED Glow Mirror', initials:'FR' },
  { name:'Zara M.', city:'Islamabad', rating:5, text:'I ordered the chain crossbody for Eid and literally everyone asked where I got it. Nuura is my go-to now.', product:'Mini Chain Crossbody', initials:'ZM' },
  { name:'Nadia S.', city:'Lahore', rating:5, text:'The facial steamer has transformed my skin. I use it twice a week and my moisturizer absorbs so much better. Game changer.', product:'USB Facial Steamer', initials:'NS' },
  { name:'Hira T.', city:'Faisalabad', rating:5, text:'COD made it so easy to order without any hesitation. The jade roller arrived beautifully packaged. Love this brand.', product:'Jade Face Roller', initials:'HT' },
  { name:'Sara A.', city:'Rawalpindi', rating:5, text:'The acrylic clutch is exactly what my collection was missing. Got so many messages on Instagram asking about it!', product:'Acrylic Box Clutch', initials:'SA' },
]

const STATS = [
  { value: '10K+', label: 'Happy Customers' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '48h', label: 'Avg. Delivery' },
  { value: '100%', label: 'Authentic Products' },
]

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el); return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useIsMobile() {
  const [v, setV] = useState(false)
  useEffect(() => {
    const c = () => setV(window.innerWidth < 768)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])
  return v
}

// ── HERO ──────────────────────────────────────────────────────────
function Hero() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', v => setScrolled(v > 80))

  return (
    <section style={{ position:'relative', minHeight:'100svh', background:C.forest, overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div style={{ position:'absolute', inset:0, zIndex:0 }}>
        <Image src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1600&q=90" alt="Nuura Hero" fill style={{ objectFit:'cover', objectPosition:'center top' }} priority />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(11,26,15,0.96) 0%, rgba(11,26,15,0.55) 45%, rgba(11,26,15,0.15) 100%)' }} />
      </div>

      <div style={{ position:'relative', zIndex:1, padding:'clamp(3rem,6vw,5rem) clamp(1.5rem,6vw,5rem)', maxWidth:'1400px', width:'100%', margin:'0 auto' }}>
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }}
          style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'2rem' }}>
          <motion.span initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ duration:0.5, delay:0.3 }}
            style={{ display:'block', width:'32px', height:'1px', background:C.gold, transformOrigin:'left' }} />
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'10px', letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(245,240,230,0.6)' }}>
            New Collection — 2026
          </span>
        </motion.div>

        <h1 style={{ fontFamily:'var(--font-display)', fontWeight:300, lineHeight:0.92, letterSpacing:'-0.03em', fontSize:'clamp(3.5rem,9vw,9rem)', margin:'0 0 clamp(2rem,3vw,3rem)', color:C.cream }}>
          {[{t:'Your',i:false,g:false},{t:'glow,',i:true,g:false},{t:'your',i:false,g:false},{t:'ritual.',i:true,g:true}].map((w,i) => (
            <div key={i} style={{ overflow:'hidden', display:'block' }}>
              <motion.span initial={{ y:'110%', skewY:3 }} animate={{ y:'0%', skewY:0 }} transition={{ duration:1, ease:[0.76,0,0.24,1], delay:0.3+i*0.1 }}
                style={{ display:'block', fontStyle:w.i?'italic':'normal', color:w.g?C.gold:C.cream }}>{w.t}</motion.span>
            </div>
          ))}
        </h1>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.9 }}
          style={{ display:'flex', flexWrap:'wrap' as const, alignItems:'center', justifyContent:'space-between', gap:'2rem', paddingTop:'2rem', borderTop:'1px solid rgba(245,240,230,0.12)' }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'clamp(13px,1.5vw,16px)', lineHeight:1.7, color:'rgba(245,240,230,0.65)', maxWidth:'380px', margin:0 }}>
            Curated self-care and aesthetic accessories for the woman who moves with intention.
          </p>
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' as const }}>
            <Link href="/shop" data-cursor="hover"
              style={{ display:'inline-block', padding:'15px 44px', background:C.gold, color:C.forest, fontFamily:'var(--font-sans)', fontSize:'11px', letterSpacing:'0.28em', textTransform:'uppercase' as const, textDecoration:'none', fontWeight:600, transition:'all 300ms' }}
              onMouseEnter={e=>{ e.currentTarget.style.background=C.goldLight; e.currentTarget.style.transform='scale(1.03)' }}
              onMouseLeave={e=>{ e.currentTarget.style.background=C.gold; e.currentTarget.style.transform='scale(1)' }}>
              Shop Now
            </Link>
            <Link href="/shop?filter=new" data-cursor="hover"
              style={{ display:'inline-block', padding:'15px 44px', border:'1px solid rgba(245,240,230,0.25)', color:C.cream, fontFamily:'var(--font-sans)', fontSize:'11px', letterSpacing:'0.28em', textTransform:'uppercase' as const, textDecoration:'none', transition:'all 300ms' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.gold; e.currentTarget.style.color=C.gold }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(245,240,230,0.25)'; e.currentTarget.style.color=C.cream }}>
              New Drops
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div animate={{ opacity:scrolled?0:1 }}
        style={{ position:'absolute', bottom:'2.5rem', right:'clamp(1.5rem,6vw,5rem)', display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'8px', pointerEvents:'none', zIndex:2 }}>
        <motion.div animate={{ scaleY:[1,1.8,1] }} transition={{ duration:1.6, repeat:Infinity, ease:'easeInOut' }}
          style={{ width:'1px', height:'48px', background:C.gold, transformOrigin:'top' }} />
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'9px', letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(245,240,230,0.35)', writingMode:'vertical-rl' as const }}>Scroll</span>
      </motion.div>
    </section>
  )
}

// ── MARQUEE ───────────────────────────────────────────────────────
function Marquee({ bg=C.forest, color=C.cream, duration=55, reverse=false }: { bg?:string; color?:string; duration?:number; reverse?:boolean }) {
  const text = 'Self-Care  ✦  Glow Up  ✦  Curated Drops  ✦  Aesthetic  ✦  New Arrivals  ✦  Limited Edition  ✦  Nuura  ✦  نور  ✦  '
  return (
    <div style={{ background:bg, overflow:'hidden', padding:'14px 0' }}>
      <motion.div animate={{ x: reverse?['-50%','0%']:['0%','-50%'] }} transition={{ duration, repeat:Infinity, ease:'linear' }}
        style={{ display:'flex', whiteSpace:'nowrap' as const }}>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'11px', letterSpacing:'0.28em', textTransform:'uppercase' as const, color }}>{text.repeat(8)}</span>
      </motion.div>
    </div>
  )
}

// ── STATS BAR ─────────────────────────────────────────────────────
function StatsBar() {
  const { ref, inView } = useInView(0.3)
  return (
    <section style={{ background:C.ink, padding:'clamp(2.5rem,5vw,4rem) clamp(1.5rem,6vw,5rem)' }}>
      <div ref={ref} style={{ maxWidth:'1400px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'2rem' }} className="md:grid-cols-4">
        {STATS.map((s,i) => (
          <motion.div key={i} initial={{ opacity:0, y:24 }} animate={inView?{ opacity:1, y:0 }:{} } transition={{ duration:0.6, delay:i*0.1 }}
            style={{ textAlign:'center' as const, padding:'1.5rem', borderLeft: i>0?`1px solid rgba(245,240,230,0.1)`:'none' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:300, color:C.cream, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:'11px', letterSpacing:'0.2em', textTransform:'uppercase' as const, color:'rgba(245,240,230,0.6)', marginTop:'8px' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ── PRODUCT CARD ──────────────────────────────────────────────────
function PCard({ p, i }: { p:typeof PRODUCTS[0]; i:number }) {
  const [hov, setHov] = useState(false)
  return (
    <Link href={`/product/${p.slug}`} data-cursor="hover" style={{ textDecoration:'none', display:'block' }}>
      <motion.div onHoverStart={()=>setHov(true)} onHoverEnd={()=>setHov(false)} animate={{ y: hov?-10:0 }} transition={{ duration:0.4, ease:[0.25,0.1,0.25,1] }}>
        <div style={{ position:'relative', aspectRatio:'3/4', background:p.bg, overflow:'hidden', marginBottom:'1.25rem' }}>
          <Image src={p.img} alt={p.name} fill sizes="(max-width:768px) 72vw, 25vw" style={{ objectFit:'cover', transition:'transform 800ms ease', transform: hov?'scale(1.07)':'scale(1)' }} />
          <div style={{ position:'absolute', inset:0, background: hov?'rgba(11,26,15,0.15)':'transparent', transition:'background 400ms' }} />
          {p.isNew && <span style={{ position:'absolute', top:'14px', left:'14px', background:C.forest, color:C.cream, fontFamily:'var(--font-sans)', fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase' as const, padding:'5px 12px' }}>New</span>}
          <div style={{ position:'absolute', bottom:'14px', right:'14px', fontFamily:'var(--font-display)', fontSize:'2.5rem', color:'rgba(255,255,255,0.2)', lineHeight:1 }}>{String(i + 1).padStart(2, '0')}</div>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(27,46,31,0.9)', backdropFilter:'blur(4px)', padding:'14px', textAlign:'center' as const, transform: hov?'translateY(0)':'translateY(100%)', transition:'transform 350ms ease', fontFamily:'var(--font-sans)', fontSize:'10px', letterSpacing:'0.25em', textTransform:'uppercase' as const, color:C.gold }}>
            Quick Add +
          </div>
        </div>
        <p style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:C.cream, margin:'0 0 4px', letterSpacing:'-0.01em' }}>{p.name}</p>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:'12px', color:'rgba(245,240,230,0.6)', margin:'0 0 10px' }}>{p.tagline}</p>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'14px', color:C.gold, fontWeight:500 }}>{p.price}</span>
          {p.comparePrice && <span style={{ fontFamily:'var(--font-sans)', fontSize:'12px', color:'rgba(245,240,230,0.4)', textDecoration:'line-through' }}>{p.comparePrice}</span>}
        </div>
      </motion.div>
    </Link>
  )
}

// ── DESKTOP HORIZONTAL SCROLL WITH ARROWS ─────────────────────────
function DesktopProducts() {
  const [current, setCurrent] = useState(0)
  const itemsPerView = 4
  const pages = []
  for (let i = 0; i < PRODUCTS.length; i += itemsPerView) {
    pages.push(PRODUCTS.slice(i, i + itemsPerView))
  }
  const totalPages = pages.length
  const canGoNext = current < totalPages - 1
  const canGoPrev = current > 0

  const prev = () => {
    if (canGoPrev) setCurrent(c => c - 1)
  }
  const next = () => {
    if (canGoNext) setCurrent(c => c + 1)
  }

  return (
    <div style={{ background:C.forest, padding:'clamp(5rem,10vw,8rem) clamp(1.5rem,6vw,5rem)' }}>
      <div style={{ maxWidth:'1400px', margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'3rem' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'0.75rem' }}>
              <span style={{ display:'block', width:'24px', height:'1px', background:C.gold }} />
              <span style={{ fontFamily:'var(--font-sans)', fontSize:'10px', letterSpacing:'0.35em', textTransform:'uppercase' as const, color:'rgba(245,240,230,0.4)' }}>Featured Drop</span>
            </div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,4vw,3.5rem)', fontWeight:300, color:C.cream, margin:0, letterSpacing:'-0.025em' }}>This season&apos;s obsessions.</h2>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={prev} disabled={!canGoPrev}
                style={{ width:'48px', height:'48px', border:`1px solid ${canGoPrev?'rgba(245,240,230,0.3)':'rgba(245,240,230,0.08)'}`, background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:canGoPrev?'pointer':'not-allowed', opacity:canGoPrev?1:0.3, transition:'all 200ms' }}>
                <ChevronLeft size={20} color={C.cream} strokeWidth={1.5} />
              </button>
              <button onClick={next} disabled={!canGoNext}
                style={{ width:'48px', height:'48px', border:`1px solid ${canGoNext?'rgba(245,240,230,0.3)':'rgba(245,240,230,0.08)'}`, background:canGoNext?'rgba(212,168,83,0.1)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:canGoNext?'pointer':'not-allowed', opacity:canGoNext?1:0.3, transition:'all 200ms' }}>
                <ChevronRight size={20} color={C.cream} strokeWidth={1.5} />
              </button>
            </div>
            <Link href="/shop" data-cursor="hover" style={{ fontFamily:'var(--font-sans)', fontSize:'11px', letterSpacing:'0.22em', textTransform:'uppercase' as const, color:C.gold, textDecoration:'none', borderBottom:`1px solid ${C.gold}`, paddingBottom:'2px', whiteSpace:'nowrap' }}>View All →</Link>
          </div>
        </div>

        <div style={{ overflow:'hidden', marginBottom:'2rem' }}>
          <motion.div animate={{ x:`-${current * (100 / totalPages)}%` }} transition={{ duration:0.6, ease:[0.25,0.1,0.25,1] }} style={{ display:'flex', width:`${totalPages * 100}%` }}>
            {pages.map((page, pageIndex) => (
              <div key={pageIndex} style={{ display:'grid', gridTemplateColumns:`repeat(${itemsPerView}, 1fr)`, gap:'2rem', width:`${100 / totalPages}%`, flexShrink:0 }}>
                {page.map((p, i) => (
                  <div key={p.id} style={{ minWidth:0 }}>
                    <PCard p={p} i={pageIndex * itemsPerView + i} />
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </div>

        <div style={{ display:'flex', justifyContent:'center', gap:'6px' }}>
          {[...Array(totalPages)].map((_,i) => (
            <button key={i} onClick={()=>setCurrent(i)} style={{ width:i===current?'24px':'6px', height:'6px', borderRadius:'3px', background:i===current?C.gold:C.border, border:'none', padding:0, cursor:'pointer', transition:'all 300ms' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── MOBILE CAROUSEL WITH ARROWS ───────────────────────────────────
function MobileProducts() {
  const [active, setActive] = useState(0)
  const startX = useRef(0)
  const prev = () => setActive(p => Math.max(p-1, 0))
  const next = () => setActive(p => Math.min(p+1, PRODUCTS.length-1))

  return (
    <div style={{ background:C.forest, paddingTop:'3rem', paddingBottom:'2.5rem' }}>
      <div style={{ padding:'0 1.5rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'0.5rem' }}>
            <span style={{ display:'block', width:'20px', height:'1px', background:C.gold }} />
            <span style={{ fontFamily:'var(--font-sans)', fontSize:'10px', letterSpacing:'0.35em', textTransform:'uppercase' as const, color:'rgba(245,240,230,0.4)' }}>Featured</span>
          </div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300, color:C.cream, margin:0, letterSpacing:'-0.02em' }}>This season&apos;s<br/>obsessions.</h2>
        </div>
        {/* Arrow navigation */}
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={prev} disabled={active===0}
            style={{ width:'44px', height:'44px', border:`1px solid ${active===0?'rgba(245,240,230,0.08)':'rgba(245,240,230,0.3)'}`, background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:active===0?'not-allowed':'pointer', opacity:active===0?0.3:1, transition:'all 200ms' }}>
            <ChevronLeft size={18} color={C.cream} strokeWidth={1.5} />
          </button>
          <button onClick={next} disabled={active===PRODUCTS.length-1}
            style={{ width:'44px', height:'44px', border:`1px solid ${active===PRODUCTS.length-1?'rgba(245,240,230,0.08)':'rgba(245,240,230,0.3)'}`, background:active===PRODUCTS.length-1?'transparent':'rgba(212,168,83,0.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:active===PRODUCTS.length-1?'not-allowed':'pointer', opacity:active===PRODUCTS.length-1?0.3:1, transition:'all 200ms' }}>
            <ChevronRight size={18} color={C.cream} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div style={{ overflow:'hidden', paddingLeft:'1.5rem' }}
        onTouchStart={e=>{ startX.current=e.touches[0].clientX }}
        onTouchEnd={e=>{ const d=startX.current-e.changedTouches[0].clientX; if(Math.abs(d)>40){ if(d>0)next(); else prev() } }}>
        <motion.div animate={{ x:`calc(-${active*58}vw - ${active*1}rem)` }} transition={{ duration:0.5, ease:[0.25,0.1,0.25,1] }} style={{ display:'flex', gap:'1rem' }}>
          {PRODUCTS.map((p,i) => (
            <div key={p.id} style={{ width:'58vw', flexShrink:0 }}><PCard p={p} i={i} /></div>
          ))}
        </motion.div>
      </div>

      <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginTop:'1.5rem' }}>
        {PRODUCTS.map((_,i) => (
          <button key={i} onClick={()=>setActive(i)} style={{ width:i===active?'28px':'6px', height:'6px', borderRadius:'3px', background:i===active?C.gold:C.border, border:'none', padding:0, cursor:'pointer', transition:'all 300ms' }} />
        ))}
      </div>

      <div style={{ display:'flex', justifyContent:'center', marginTop:'1.5rem' }}>
        <Link href="/shop" style={{ fontFamily:'var(--font-sans)', fontSize:'11px', letterSpacing:'0.22em', textTransform:'uppercase' as const, color:C.gold, textDecoration:'none', borderBottom:`1px solid ${C.gold}`, paddingBottom:'2px' }}>View All Products →</Link>
      </div>
    </div>
  )
}

function Products() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileProducts /> : <DesktopProducts />
}

// ── BRAND STORY ───────────────────────────────────────────────────
function BrandStory() {
  const { ref, inView } = useInView(0.2)
  return (
    <section style={{ background:C.offwhite, padding:'clamp(5rem,10vw,9rem) clamp(1.5rem,6vw,5rem)' }}>
      <div ref={ref} style={{ maxWidth:'1400px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(1,1fr)', gap:'4rem' }} className="md:grid-cols-2 md:gap-24 items-center">
        <div>
          <motion.div initial={{ opacity:0, x:-20 }} animate={inView?{ opacity:1, x:0 }:{} } transition={{ duration:0.6 }}
            style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'2rem' }}>
            <motion.span initial={{ scaleX:0 }} animate={inView?{ scaleX:1 }:{} } transition={{ duration:0.5, delay:0.1 }}
              style={{ display:'block', width:'24px', height:'1px', background:C.gold, transformOrigin:'left' }} />
            <span style={{ fontFamily:'var(--font-sans)', fontSize:'10px', letterSpacing:'0.35em', textTransform:'uppercase' as const, color:C.muted }}>Our Philosophy</span>
          </motion.div>
          {["We don't sell","products.","We curate rituals."].map((line,i) => (
            <div key={i} style={{ overflow:'hidden' }}>
              <motion.div initial={{ y:'105%' }} animate={inView?{ y:'0%' }:{} } transition={{ duration:0.9, ease:[0.76,0,0.24,1], delay:0.1+i*0.12 }}
                style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2.2rem,4.5vw,4rem)', fontWeight:300, lineHeight:1.05, letterSpacing:'-0.025em', color:i===2?C.gold:C.ink, fontStyle:i===2?'italic':'normal' }}>
                {line}
              </motion.div>
            </div>
          ))}
        </div>
        <motion.div initial={{ opacity:0, y:32 }} animate={inView?{ opacity:1, y:0 }:{} } transition={{ duration:0.8, delay:0.4 }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'clamp(14px,1.5vw,16px)', lineHeight:1.85, color:C.muted, marginBottom:'1.5rem' }}>
            Nuura was born from a simple truth — Pakistani women deserve beauty that reflects their sophistication. Not fast fashion. Not cluttered marketplaces.
          </p>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'clamp(14px,1.5vw,16px)', lineHeight:1.85, color:C.muted, marginBottom:'3rem' }}>
            Every product we carry is tested, curated, and chosen because it earns its place in your ritual.
          </p>
          <div style={{ fontFamily:'var(--font-accent)', fontSize:'clamp(4rem,7vw,6rem)', color:C.gold, lineHeight:1, marginBottom:'2.5rem', opacity:0.5 }}>نور</div>
          <Link href="/shop" data-cursor="hover"
            style={{ fontFamily:'var(--font-sans)', fontSize:'11px', letterSpacing:'0.25em', textTransform:'uppercase' as const, color:C.forest, textDecoration:'none', borderBottom:`2px solid ${C.gold}`, paddingBottom:'4px', display:'inline-block', transition:'letter-spacing 300ms, color 300ms' }}
            onMouseEnter={e=>{ e.currentTarget.style.color=C.gold; e.currentTarget.style.letterSpacing='0.32em' }}
            onMouseLeave={e=>{ e.currentTarget.style.color=C.forest; e.currentTarget.style.letterSpacing='0.25em' }}>
            Explore the Edit →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ── REVIEWS ───────────────────────────────────────────────────────
function Reviews() {
  const { ref, inView } = useInView(0.1)
  const [active, setActive] = useState(0)
  const isMobile = useIsMobile()

  useEffect(() => {
    const t = setInterval(() => setActive(p => (p+1) % REVIEWS.length), 4000)
    return () => clearInterval(t)
  }, [])

  const visibleCount = isMobile ? 1 : 3
  const visible = REVIEWS.slice(active, active + visibleCount).concat(
    active + visibleCount > REVIEWS.length ? REVIEWS.slice(0, (active + visibleCount) % REVIEWS.length) : []
  )

  return (
    <section style={{ background:C.forest, padding:'clamp(5rem,10vw,8rem) clamp(1.5rem,6vw,5rem)', overflow:'hidden' }}>
      <div ref={ref} style={{ maxWidth:'1400px', margin:'0 auto' }}>
        <motion.div initial={{ opacity:0, y:24 }} animate={inView?{ opacity:1, y:0 }:{} } transition={{ duration:0.7 }}
          style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'clamp(2.5rem,5vw,4rem)', flexWrap:'wrap' as const, gap:'1rem' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'1rem' }}>
              <span style={{ display:'block', width:'24px', height:'1px', background:C.gold }} />
              <span style={{ fontFamily:'var(--font-sans)', fontSize:'10px', letterSpacing:'0.35em', textTransform:'uppercase' as const, color:'rgba(245,240,230,0.4)' }}>Customer Love</span>
            </div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,4vw,3.5rem)', fontWeight:300, color:C.cream, margin:0, letterSpacing:'-0.025em' }}>
              Loved by thousands. Trusted by all.
            </h2>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={()=>setActive(p=>p===0?REVIEWS.length-1:p-1)}
              style={{ width:'44px', height:'44px', border:'1px solid rgba(245,240,230,0.2)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 200ms' }}
              onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor=C.gold; (e.currentTarget as HTMLButtonElement).style.background='rgba(212,168,83,0.1)' }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor='rgba(245,240,230,0.2)'; (e.currentTarget as HTMLButtonElement).style.background='transparent' }}>
              <ChevronLeft size={18} color={C.cream} strokeWidth={1.5} />
            </button>
            <button onClick={()=>setActive(p=>(p+1)%REVIEWS.length)}
              style={{ width:'44px', height:'44px', border:'1px solid rgba(245,240,230,0.2)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 200ms' }}
              onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor=C.gold; (e.currentTarget as HTMLButtonElement).style.background='rgba(212,168,83,0.1)' }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor='rgba(245,240,230,0.2)'; (e.currentTarget as HTMLButtonElement).style.background='transparent' }}>
              <ChevronRight size={18} color={C.cream} strokeWidth={1.5} />
            </button>
          </div>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:`repeat(${visibleCount},1fr)`, gap:'1.5rem' }}>
          <AnimatePresence mode="popLayout">
            {visible.map((r,i) => (
              <motion.div key={`${active}-${i}`}
                initial={{ opacity:0, x:-150 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:150 }}
                transition={{ duration:0.8, delay:i*0.15, ease:[0.22,1,0.36,1] }}
                style={{ position:'relative', background:'rgba(245,240,230,0.06)', border:'1px solid rgba(245,240,230,0.08)', padding:'clamp(1.5rem,3vw,2.5rem)' }}>
                <motion.div style={{ position:'absolute', left:0, top:0, bottom:0, width:'4px', background:C.gold, borderRadius:'2px' }} initial={{ scaleY:0 }} animate={{ scaleY:1 }} transition={{ duration:1, delay:i*0.15+0.3, ease:[0.76,0,0.24,1] }} />
                <motion.div initial={{ rotate:-180, opacity:0, scale:0 }} animate={{ rotate:0, opacity:1, scale:1 }} transition={{ duration:0.5, delay:i*0.1+0.1 }}>
                  <Quote size={24} color={C.gold} strokeWidth={1} style={{ marginBottom:'1.25rem', opacity:0.6 }} />
                </motion.div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'14px', lineHeight:1.75, color:'rgba(245,240,230,0.75)', marginBottom:'1.5rem' }}>
                  &ldquo;{r.text}&rdquo;
                </p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap' as const, gap:'0.5rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(212,168,83,0.15)', border:`1px solid ${C.gold}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontFamily:'var(--font-display)', fontSize:'14px', color:C.gold }}>{r.initials}</span>
                    </div>
                    <div>
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'13px', color:C.cream, margin:0, fontWeight:500 }}>{r.name}</p>
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'11px', color:'rgba(245,240,230,0.4)', margin:0 }}>{r.city}</p>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'3px' }}>
                    {[...Array(r.rating)].map((_,si) => (
                      <Star key={si} size={12} fill={C.gold} color={C.gold} />
                    ))}
                  </div>
                </div>
                <div style={{ marginTop:'1rem', paddingTop:'1rem', borderTop:'1px solid rgba(245,240,230,0.06)' }}>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'10px', letterSpacing:'0.2em', textTransform:'uppercase' as const, color:'rgba(245,240,230,0.3)' }}>Reviewed: {r.product}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div style={{ display:'flex', justifyContent:'center', gap:'6px', marginTop:'2rem' }}>
          {REVIEWS.map((_,i) => (
            <button key={i} onClick={()=>setActive(i)} style={{ width:i===active?'24px':'6px', height:'6px', borderRadius:'3px', background:i===active?C.gold:'rgba(245,240,230,0.2)', border:'none', padding:0, cursor:'pointer', transition:'all 300ms' }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── PROMISE STRIP ─────────────────────────────────────────────────
function PromiseStrip() {
  const { ref, inView } = useInView(0.2)
  const items = [
    { n:'01', title:'Curated, not cluttered', desc:'12–18 SKUs per drop. Every product earns its place.' },
    { n:'02', title:'Cash on Delivery', desc:'Nationwide COD. No trust issues, no upfront risk.' },
    { n:'03', title:'Limited drops', desc:"When it's gone, it's gone. New drops every season." },
  ]
  return (
    <section style={{ background:C.ink, padding:'clamp(5rem,10vw,8rem) clamp(1.5rem,6vw,5rem)', borderTop:`1px solid rgba(245,240,230,0.05)` }}>
      <div ref={ref} style={{ maxWidth:'1400px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(1,1fr)', gap:'0' }} className="md:grid-cols-3">
        {items.map((item,i) => (
          <motion.div key={i} initial={{ opacity:0, y:40 }} animate={inView?{ opacity:1, y:0 }:{} } transition={{ duration:0.8, delay:i*0.15 }}
            style={{ padding:'clamp(2rem,3vw,3rem)', borderLeft:i>0?`1px solid rgba(245,240,230,0.05)`:'none', borderTop:`3px solid ${i===0?C.gold:'transparent'}`, transition:'background 300ms' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,240,230,0.02)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'3.5rem', color:'rgba(212,168,83,0.3)', lineHeight:1, marginBottom:'1.5rem', fontWeight:300 }}>{item.n}</div>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.4rem,2.5vw,2rem)', fontWeight:300, color:C.cream, margin:'0 0 1rem', letterSpacing:'-0.01em' }}>{item.title}</h3>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'14px', lineHeight:1.75, color:'rgba(245,240,230,0.6)', margin:0 }}>{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ── FINAL CTA ─────────────────────────────────────────────────────
function FinalCTA() {
  const { ref, inView } = useInView(0.3)
  return (
    <section ref={ref} style={{ background:C.forest, padding:'clamp(5rem,10vw,9rem) clamp(1.5rem,6vw,5rem)' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto', textAlign:'center' as const }}>
        <motion.div initial={{ opacity:0 }} animate={inView?{ opacity:1 }:{} } transition={{ duration:0.6 }}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'2rem' }}>
          <span style={{ display:'block', width:'24px', height:'1px', background:C.gold }} />
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'10px', letterSpacing:'0.35em', textTransform:'uppercase' as const, color:'rgba(245,240,230,0.4)' }}>New Season</span>
          <span style={{ display:'block', width:'24px', height:'1px', background:C.gold }} />
        </motion.div>
        {['Ready','to glow?'].map((line,i) => (
          <div key={i} style={{ overflow:'hidden' }}>
            <motion.div initial={{ y:'105%' }} animate={inView?{ y:'0%' }:{} } transition={{ duration:1, ease:[0.76,0,0.24,1], delay:0.1+i*0.1 }}
              style={{ fontFamily:'var(--font-display)', fontSize:'clamp(4rem,10vw,9rem)', fontWeight:300, lineHeight:0.9, color:i===1?C.gold:C.cream, letterSpacing:'-0.03em', fontStyle:i===1?'italic':'normal' }}>
              {line}
            </motion.div>
          </div>
        ))}
        <motion.div initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{} } transition={{ duration:0.7, delay:0.4 }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'clamp(14px,1.5vw,16px)', lineHeight:1.75, color:'rgba(245,240,230,0.55)', margin:'2.5rem auto', maxWidth:'400px' }}>
            New drops every season. Limited quantities. Nationwide COD.
          </p>
          <Link href="/shop" data-cursor="hover"
            style={{ display:'inline-block', padding:'18px 64px', background:C.gold, color:C.forest, fontFamily:'var(--font-sans)', fontSize:'11px', letterSpacing:'0.3em', textTransform:'uppercase' as const, textDecoration:'none', fontWeight:600, transition:'all 300ms' }}
            onMouseEnter={e=>{ e.currentTarget.style.background=C.goldLight; e.currentTarget.style.transform='scale(1.03)' }}
            onMouseLeave={e=>{ e.currentTarget.style.background=C.gold; e.currentTarget.style.transform='scale(1)' }}>
            Shop the Collection
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <main style={{ background:C.white, overflowX:'hidden' }}>
      <Hero />
      <Marquee bg={C.forest} color="rgba(245,240,230,0.4)" duration={55} />
      <StatsBar />
      <Products />
      <Marquee bg={C.gold} color={C.forest} duration={35} reverse />
      <BrandStory />
      <Reviews />
      <PromiseStrip />
      <FinalCTA />
    </main>
  )
}
