'use client'

import { useRef } from 'react'
import { motion, useSpring } from 'framer-motion'
import Link from 'next/link'

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  href?: string
}

export function MagneticButton({
  children,
  className = '',
  onClick,
  href,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, { stiffness: 300, damping: 30 })
  const y = useSpring(0, { stiffness: 300, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.4)
    y.set((e.clientY - centerY) * 0.4)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const content = (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block ${className}`}
      data-cursor="hover"
    >
      {children}
    </motion.div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return <div onClick={onClick}>{content}</div>
}
