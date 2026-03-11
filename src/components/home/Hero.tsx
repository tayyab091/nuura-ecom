'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { SITE_CONFIG } from '@/lib/constants'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { MagneticButton } from '@/components/shared/MagneticButton'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#FDFCFB] overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 brand-gradient opacity-40" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center max-w-4xl mx-auto px-8"
      >
        {/* Eyebrow */}
        <motion.p
          variants={fadeInUp}
          className="font-sans text-xs tracking-[0.3em] uppercase text-[#8A7F7A] mb-8"
        >
          Premium Self-Care & Accessories
        </motion.p>

        {/* Headline */}
        <motion.h1
          variants={fadeInUp}
          className="font-display text-6xl md:text-8xl lg:text-9xl text-[#2C2C2C] leading-[0.95] mb-8"
        >
          {SITE_CONFIG.name}
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={fadeInUp}
          className="font-accent text-xl md:text-2xl text-[#8A7F7A] italic mb-12"
        >
          {SITE_CONFIG.tagline}
        </motion.p>

        {/* CTA */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
          <MagneticButton href="/shop">
            <span className="inline-block px-10 py-4 bg-[#2C2C2C] text-white font-sans text-sm tracking-widest uppercase hover:bg-[#8A7F7A] transition-colors duration-300">
              Explore Collection
            </span>
          </MagneticButton>
          <MagneticButton href="/shop?filter=new">
            <span className="inline-block px-10 py-4 border border-[#2C2C2C] text-[#2C2C2C] font-sans text-sm tracking-widest uppercase hover:bg-[#2C2C2C] hover:text-white transition-colors duration-300">
              New Drops
            </span>
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#8A7F7A]">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-8 bg-[#8A7F7A]"
        />
      </motion.div>
    </section>
  )
}
