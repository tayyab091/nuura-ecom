'use client'

import { useEffect } from 'react'
import { useLenis as useLenisCore } from 'lenis/react'

export function useLenis() {
  const lenis = useLenisCore()

  const scrollTo = (target: string | number | HTMLElement, options?: { offset?: number; duration?: number }) => {
    if (lenis) {
      lenis.scrollTo(target, options)
    }
  }

  const stop = () => {
    if (lenis) lenis.stop()
  }

  const start = () => {
    if (lenis) lenis.start()
  }

  return { lenis, scrollTo, stop, start }
}
