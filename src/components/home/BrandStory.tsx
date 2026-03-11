'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { AnimatedText } from '@/components/shared/AnimatedText'
import { AnimatedSection } from '@/components/shared/AnimatedSection'

export default function BrandStory() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [30, -30])

  return (
    <section ref={ref} className="py-32 bg-[#F5F0E6] overflow-hidden">
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Text Column */}
          <div>
            <AnimatedSection>
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-[#8A7F7A] mb-6">
                Our Story
              </p>
            </AnimatedSection>

            <AnimatedText
              text="Born from the belief that every woman deserves to glow"
              tag="h2"
              className="font-display text-3xl md:text-4xl text-[#2C2C2C] leading-snug mb-8"
            />

            <AnimatedSection delay={0.2}>
              <p className="font-sans text-base text-[#8A7F7A] leading-relaxed mb-6">
                Nuura was created for the modern Pakistani woman — she who juggles work, home, and dreams without skipping a beat. We curate premium self-care tools and aesthetic accessories that honour her time, her skin, and her ritual.
              </p>
              <p className="font-sans text-base text-[#8A7F7A] leading-relaxed">
                Every product is chosen with intention. No filler. No compromise. Just the kind of beauty that glows from within.
              </p>
            </AnimatedSection>
          </div>

          {/* Visual Column */}
          <AnimatedSection delay={0.1}>
            <motion.div
              style={{ y }}
              className="relative aspect-square max-w-md mx-auto"
            >
              <div className="absolute inset-4 bg-[#EDE0D4] rounded-brand-lg" />
              <div className="absolute inset-0 bg-[#F8D7DA]/60 rounded-brand-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-accent text-5xl text-[#2C2C2C]/20 tracking-widest">
                  Nuura
                </span>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
