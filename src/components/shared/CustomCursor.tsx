'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { useMousePosition } from '@/hooks/useMousePosition'

export function CustomCursor() {
  const [mounted, setMounted] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const [cursorVariant, setCursorVariant] = useState<'default' | 'hover' | 'hidden'>('default')

  const { x, y } = useMousePosition()

  const dotX = useSpring(0, { stiffness: 600, damping: 35 })
  const dotY = useSpring(0, { stiffness: 600, damping: 35 })
  const ringX = useSpring(0, { stiffness: 120, damping: 18 })
  const ringY = useSpring(0, { stiffness: 120, damping: 18 })

  useEffect(() => {
    setMounted(true)
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  useEffect(() => {
    dotX.set(x)
    dotY.set(y)
    ringX.set(x)
    ringY.set(y)
  }, [x, y, dotX, dotY, ringX, ringY])

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-cursor="hover"]')) {
        setCursorVariant('hover')
      } else if (target.closest('[data-cursor="hidden"]')) {
        setCursorVariant('hidden')
      } else {
        setCursorVariant('default')
      }
    }
    window.addEventListener('mouseover', handleMouseOver)
    return () => window.removeEventListener('mouseover', handleMouseOver)
  }, [])

  // Don't render anything until mounted on client
  if (!mounted || isTouch) return null

  return (
    <>
      {/* Dot */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '5px',
          height: '5px',
          borderRadius: '9999px',
          backgroundColor: '#1A1714',
          pointerEvents: 'none',
          zIndex: 9999,
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          opacity: cursorVariant === 'hidden' ? 0 : 1,
          scale: cursorVariant === 'hidden' ? 0 : 1,
        }}
        transition={{ duration: 0.15 }}
      />

      {/* Ring */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          borderRadius: '9999px',
          border: '1px solid #C4614A',
          pointerEvents: 'none',
          zIndex: 9998,
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: cursorVariant === 'hover' ? 52 : cursorVariant === 'hidden' ? 0 : 32,
          height: cursorVariant === 'hover' ? 52 : cursorVariant === 'hidden' ? 0 : 32,
          opacity: cursorVariant === 'hidden' ? 0 : 1,
          backgroundColor: cursorVariant === 'hover' ? 'rgba(196,97,74,0.08)' : 'transparent',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
    </>
  )
}
