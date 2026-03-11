'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface AnimatedTextProps {
  text: string
  className?: string
  delay?: number
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'
}

export function AnimatedText({
  text,
  className = '',
  delay = 0,
  tag = 'p',
}: AnimatedTextProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })

  const words = text.split(' ')

  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: delay,
      },
    },
  }

  const wordVariant = {
    hidden: { y: '100%', opacity: 0 },
    visible: {
      y: '0%',
      opacity: 1,
      transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] },
    },
  }

  const MotionTag = motion[tag]

  return (
    <div ref={ref}>
      <MotionTag
        className={`flex flex-wrap gap-x-[0.25em] ${className}`}
        variants={container}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        {words.map((word, i) => (
          <span key={i} className="overflow-hidden inline-block">
            <motion.span className="inline-block" variants={wordVariant}>
              {word}
            </motion.span>
          </span>
        ))}
      </MotionTag>
    </div>
  )
}
