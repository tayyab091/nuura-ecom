'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'
import { MagneticButton } from '@/components/shared/MagneticButton'
import { AnimatedText } from '@/components/shared/AnimatedText'

const ease = [0.76, 0, 0.24, 1] as const

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
}
const item = {
  hidden: { y: 40, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease } },
}

const STATS = [
  { value: '10K+', label: 'Happy Customers' },
  { value: '50+', label: 'Curated Products' },
  { value: '4.9★', label: 'Avg Rating' },
]

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)

  const { scrollY } = useScroll()

  /* parallax for right panel */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const rightY = useTransform(scrollYProgress, [0, 1], ['0px', '-60px'])

  /* hide scroll indicator */
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 100))

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center bg-[--color-nuura-warm-white] overflow-hidden"
    >
      {/* soft radial wash */}
      <div className="pointer-events-none absolute inset-0 brand-gradient opacity-50" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-12 lg:px-16 pt-28 pb-20 grid grid-cols-1 md:grid-cols-[55%_45%] gap-12 items-center">

        {/* ── Left column ───────────────────────────── */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          {/* Eyebrow */}
          <motion.p
            variants={item}
            className="font-sans text-[11px] tracking-[0.35em] uppercase text-[--color-nuura-muted]"
          >
            New Drop — Spring 2025
          </motion.p>

          {/* Headline */}
          <motion.div variants={item}>
            <h1
              className="font-display font-light text-[--color-nuura-charcoal] leading-[1.0]"
              style={{ fontSize: 'clamp(3.5rem, 7vw, 7rem)' }}
            >
              <AnimatedText text="Your glow," />
              <AnimatedText text="your ritual." delay={0.15} />
            </h1>
          </motion.div>

          {/* Sub-copy */}
          <motion.p
            variants={item}
            className="font-sans text-base leading-relaxed text-[--color-nuura-muted] max-w-md"
          >
            Premium self-care gadgets and aesthetic accessories, curated for
            the modern Pakistani woman who refuses to compromise.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="flex flex-wrap gap-4 pt-2">
            <MagneticButton href="/shop">
              <span className="inline-block px-10 py-4 bg-[--color-nuura-charcoal] text-white font-sans text-xs tracking-widest uppercase transition-colors duration-300">
                Explore Collection
              </span>
            </MagneticButton>
            <MagneticButton href="/shop?filter=new">
              <span className="inline-block px-10 py-4 border border-[--color-nuura-charcoal] text-[--color-nuura-charcoal] font-sans text-xs tracking-widest uppercase hover:bg-[--color-nuura-charcoal] hover:text-white transition-colors duration-300">
                New Drops
              </span>
            </MagneticButton>
          </motion.div>

          {/* Floating Stats */}
          <motion.div
            variants={item}
            className="flex gap-8 mt-4 pt-6 border-t border-[--color-nuura-nude]/60"
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl text-[--color-nuura-charcoal]">{s.value}</p>
                <p className="font-sans text-[10px] tracking-wider uppercase text-[--color-nuura-muted] mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Right column ─────────────────────────── */}
        <motion.div
          style={{ y: rightY }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease, delay: 0.5 }}
          className="relative hidden md:block"
        >
          {/* Product placeholder card */}
          <div className="relative aspect-[3/4] rounded-sm overflow-hidden brand-gradient shadow-2xl">
            {/* shimmer overlay */}
            <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.25)_50%,transparent_60%)] bg-[length:200%_100%]" />

            {/* floating badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-sm px-5 py-3 shadow-xl"
            >
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[--color-nuura-muted]">
                New Arrival
              </p>
              <p className="font-display text-xl text-[--color-nuura-charcoal] mt-0.5">
                Glow Kit 2025
              </p>
            </motion.div>
          </div>

          {/* decorative dot grid */}
          <div
            className="absolute -bottom-6 -right-6 w-32 h-32 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle, var(--color-nuura-muted) 1px, transparent 1px)',
              backgroundSize: '10px 10px',
            }}
          />
        </motion.div>
      </div>

      {/* ── Scroll indicator ─────────────────────── */}
      <motion.div
        animate={{ opacity: scrolled ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none"
      >
        <span className="font-sans text-[9px] tracking-[0.3em] uppercase text-[--color-nuura-muted]">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className="text-[--color-nuura-muted] animate-pulse-soft"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
