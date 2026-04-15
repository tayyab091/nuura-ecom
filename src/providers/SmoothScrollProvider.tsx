'use client'

import { ReactLenis } from 'lenis/react'
import { useEffect, useState } from 'react'

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Default to disabled so mobile never "briefly" mounts Lenis on first paint.
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    try {
      const prefersReduced = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isCoarsePointer = Boolean(window.matchMedia?.('(pointer: coarse)')?.matches)
      const isSmallScreen = Boolean(window.matchMedia?.('(max-width: 767px)')?.matches)

      // Lenis can cause jank/scroll bugs on mobile Safari; keep it desktop-only.
      setEnabled(!(prefersReduced || isTouch || isCoarsePointer || isSmallScreen))
    } catch {
      setEnabled(false)
    }
  }, [])

  if (!enabled) return <>{children}</>

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.4,
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  )
}
