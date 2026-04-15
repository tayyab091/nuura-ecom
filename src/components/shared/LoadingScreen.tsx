'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const [visible, setVisible] = useState(true)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (sessionStorage.getItem('nuura-v2-loaded')) {
        setVisible(false)
        setDone(true)
        return
      }
    } catch {
      // Some mobile/private browsing modes can throw on sessionStorage access.
    }
    const t = setTimeout(() => {
      setVisible(false)
      setDone(true)
      try {
        sessionStorage.setItem('nuura-v2-loaded', 'true')
      } catch {
        // ignore
      }
    }, 2400)
    return () => clearTimeout(t)
  }, [])

  if (done) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#1B2E1F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}
        >
          <div style={{ overflow: 'hidden' }}>
            <motion.div
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
              style={{ fontFamily: 'var(--font-accent)', fontSize: 'clamp(3rem,8vw,6rem)', letterSpacing: '0.6em', color: '#F5F0E6', textTransform: 'uppercase', paddingRight: '0.6em' }}
            >
              NUURA
            </motion.div>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: '#D4A853', fontStyle: 'italic', letterSpacing: '0.1em' }}
          >
            Glow in your own light
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
            style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', width: '100%', background: '#D4A853', transformOrigin: 'left' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}