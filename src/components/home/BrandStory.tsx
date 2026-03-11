'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AnimatedText } from '@/components/shared/AnimatedText'
import { AnimatedSection } from '@/components/shared/AnimatedSection'
import { MagneticButton } from '@/components/shared/MagneticButton'

gsap.registerPlugin(ScrollTrigger)

export default function BrandStory() {
  const sectionRef = useRef<HTMLElement>(null)
  const backCardRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!backCardRef.current || !sectionRef.current) return

      gsap.fromTo(
        backCardRef.current,
        { rotation: -6 },
        {
          rotation: -3,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'center center',
            scrub: 1.5,
          },
        }
      )
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      className="py-32 px-8 md:px-16 lg:px-24 bg-[--color-nuura-warm-white]"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-16 items-center">

          {/* Left - Visual Stack */}
          <div className="relative aspect-[4/5]">
            {/* Back card */}
            <div
              ref={backCardRef}
              className="absolute top-8 left-8 right-0 bottom-0 bg-[--color-nuura-blush] rounded-sm"
              style={{ transformOrigin: 'center center', transform: 'rotate(-6deg)' }}
            />

            {/* Front card */}
            <div className="relative z-10 h-full bg-[--color-nuura-nude] rounded-sm flex flex-col items-center justify-center gap-3">
              <span
                className="font-accent text-5xl text-[--color-nuura-charcoal]/40"
                style={{ fontFamily: 'var(--font-accent)' }}
              >
                {'\u0646\u0648\u0631'}
              </span>
              <span className="font-sans text-xs tracking-widest uppercase text-[--color-nuura-muted]">
                Light
              </span>
            </div>

            {/* Decorative square */}
            <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-[--color-nuura-sage] opacity-60" />
          </div>

          {/* Right - Text */}
          <div className="flex flex-col justify-center pl-0 md:pl-16">
            <AnimatedSection>
              <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-[--color-nuura-muted] mb-6">
                Our Philosophy
              </p>
            </AnimatedSection>

            <h2
              className="font-display font-light text-[--color-nuura-charcoal] leading-[1.1]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            >
              <AnimatedText text="We don't sell products." delay={0.1} />
              <AnimatedText text="We curate rituals." delay={0.25} />
            </h2>

            <AnimatedSection delay={0.3}>
              <div className="mt-8 flex flex-col gap-4 max-w-md">
                <p className="font-sans text-sm text-[--color-nuura-muted] leading-relaxed">
                  Nuura was born from a simple truth - Pakistani women deserve
                  beauty that reflects their sophistication. Not fast fashion.
                  Not cluttered marketplaces.
                </p>
                <p className="font-sans text-sm text-[--color-nuura-muted] leading-relaxed">
                  Every product we carry is tested, curated, and chosen because
                  it earns its place in your ritual.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.45}>
              <div className="mt-10">
                <MagneticButton href="/shop">
                  <span className="font-sans text-sm tracking-widest uppercase text-[--color-nuura-charcoal] border-b border-[--color-nuura-charcoal] pb-1 hover:text-[--color-nuura-muted] hover:border-[--color-nuura-muted] transition-colors duration-200">
                    Explore the Edit
                  </span>
                </MagneticButton>
              </div>
            </AnimatedSection>
          </div>

        </div>
      </div>
    </section>
  )
}
