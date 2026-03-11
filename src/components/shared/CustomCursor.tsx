'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { useMousePosition } from '@/hooks/useMousePosition'

export function CustomCursor() {
  const { x, y } = useMousePosition()
  const [isTouch, setIsTouch] = useState(false)
  const [cursorVariant, setCursorVariant] = useState<'default' | 'hover' | 'hidden'>('default')

  const ringX = useSpring(0, { stiffness: 150, damping: 20 })
  const ringY = useSpring(0, { stiffness: 150, damping: 20 })

  const dotSpringX = useSpring(0, { stiffness: 500, damping: 30 })
  const dotSpringY = useSpring(0, { stiffness: 500, damping: 30 })

  useEffect(() => {
    setIsTouch('ontouchstart' in window)
  }, [])

  useEffect(() => {
    dotSpringX.set(x)
    dotSpringY.set(y)
    ringX.set(x)
    ringY.set(y)
  }, [x, y, dotSpringX, dotSpringY, ringX, ringY])

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

  if (isTouch) return null

  return (
    <>
      {/* Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-[#2C2C2C] pointer-events-none z-[9999]"
        style={{
          x: dotSpringX,
          y: dotSpringY,
          translateX: '-50%',
          translateY: '-50%',
          mixBlendMode: 'difference',
        }}
      />
      {/* Ring */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border-2 border-[#EDE0D4] pointer-events-none z-[9998]"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: cursorVariant === 'hover' ? 64 : cursorVariant === 'hidden' ? 0 : 36,
          height: cursorVariant === 'hover' ? 64 : cursorVariant === 'hidden' ? 0 : 36,
          opacity: cursorVariant === 'hidden' ? 0 : 1,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
    </>
  )
}
