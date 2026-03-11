'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { fadeInUp } from '@/lib/animations'

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-5% 0px' })

  return (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
