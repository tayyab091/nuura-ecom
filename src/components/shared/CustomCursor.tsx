'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'

export function CustomCursor() {
  const [mounted] = useState<boolean>(() => typeof window !== 'undefined')
  const [isTouch] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0
    } catch {
      return false
    }
  })
  const [variant, setVariant] = useState<'default'|'hover'|'hidden'>('default')

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const dotX = useSpring(mouseX, { stiffness: 600, damping: 35 })
  const dotY = useSpring(mouseY, { stiffness: 600, damping: 35 })
  const ringX = useSpring(mouseX, { stiffness: 100, damping: 20 })
  const ringY = useSpring(mouseY, { stiffness: 100, damping: 20 })

  useEffect(() => {
    if (typeof window === 'undefined' || isTouch) return
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    const over = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest('[data-cursor]') as HTMLElement | null
      setVariant((t?.dataset.cursor as 'default'|'hover'|'hidden') ?? 'default')
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseover', over)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
    }
  }, [mouseX, mouseY, isTouch])

  if (!mounted || isTouch) return null

  return (
    <>
      <motion.div
        style={{ position: 'fixed', top: 0, left: 0, width: 5, height: 5, borderRadius: '50%', background: '#1B2E1F', pointerEvents: 'none', zIndex: 99999, x: dotX, y: dotY, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: variant === 'hidden' ? 0 : 1, scale: variant === 'hover' ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      />
      <motion.div
        style={{ position: 'fixed', top: 0, left: 0, borderRadius: '50%', border: '1.5px solid #D4A853', pointerEvents: 'none', zIndex: 99998, x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{ width: variant === 'hover' ? 52 : variant === 'hidden' ? 0 : 34, height: variant === 'hover' ? 52 : variant === 'hidden' ? 0 : 34, opacity: variant === 'hidden' ? 0 : 1, backgroundColor: variant === 'hover' ? 'rgba(212,168,83,0.1)' : 'transparent' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
    </>
  )
}