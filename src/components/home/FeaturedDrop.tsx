'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import ProductCard from '@/components/shop/ProductCard'
import { AnimatedText } from '@/components/shared/AnimatedText'

gsap.registerPlugin(ScrollTrigger)

const MOCK_PRODUCTS = [
  {
    _id: '1',
    name: 'Rose Quartz Gua Sha',
    tagline: 'Sculpt. Depuff. Glow.',
    price: 2800,
    comparePrice: 3500,
    category: 'self-care',
    isNewDrop: true,
    isBestSeller: false,
    images: [],
    slug: 'rose-quartz-gua-sha',
  },
  {
    _id: '2',
    name: 'LED Glow Mirror',
    tagline: 'Studio lighting, anywhere.',
    price: 4500,
    comparePrice: 5500,
    category: 'self-care',
    isNewDrop: false,
    isBestSeller: true,
    images: [],
    slug: 'led-glow-mirror',
  },
  {
    _id: '3',
    name: 'Mini Chain Crossbody',
    tagline: 'Small bag. Big statement.',
    price: 3200,
    comparePrice: null,
    category: 'accessories',
    isNewDrop: true,
    isBestSeller: false,
    images: [],
    slug: 'mini-chain-crossbody',
  },
]

export default function FeaturedDrop() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!sectionRef.current || !headerRef.current || !cardsRef.current) return

      /* header fade-in */
      gsap.fromTo(
        headerRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      )

      /* cards stagger */
      const cards = cardsRef.current.querySelectorAll<HTMLElement>('.product-card-item')
      gsap.fromTo(
        cards,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 85%',
            once: true,
          },
        }
      )
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      className="py-32 px-8 md:px-16 lg:px-24 bg-[--color-nuura-cream]"
    >
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div
          ref={headerRef}
          className="flex items-end justify-between mb-16"
          style={{ opacity: 0 }}
        >
          <div>
            <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-[--color-nuura-muted] mb-4">
              Featured Drop
            </p>
            <h2
              className="font-display font-light text-[--color-nuura-charcoal] leading-tight"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}
            >
              <AnimatedText text="This season's" delay={0.1} />
              <AnimatedText text="obsessions." delay={0.25} />
            </h2>
          </div>

          <Link
            href="/shop"
            className="hidden md:inline-flex items-center gap-2 group font-sans text-sm tracking-widest uppercase text-[--color-nuura-charcoal]"
          >
            <span className="relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[--color-nuura-charcoal] after:transition-all after:duration-300 group-hover:after:w-full">
              View All
            </span>
            <ArrowRight
              size={14}
              strokeWidth={1.5}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Product grid */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {MOCK_PRODUCTS.map((product) => (
            <div key={product._id} className="product-card-item" style={{ opacity: 0 }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
