'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Truck, MessageCircle, PackageCheck, MapPin } from 'lucide-react'
import Link from 'next/link'
import { WHATSAPP_NUMBER } from '@/lib/constants'

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') ?? ''
  const method = searchParams.get('method') ?? 'cod'
  const isCOD = method === 'cod'
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  const waLink = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=Hi!%20I%20just%20placed%20order%20and%20am%20sending%20my%20payment%20screenshot.'
  return (
    <div className="max-w-lg mx-auto flex flex-col items-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.5, delay: 0.1 }} className="w-20 h-20 rounded-full bg-[--color-nuura-sage]/20 flex items-center justify-center">
        <CheckCircle2 size={40} strokeWidth={1.5} className="text-[--color-nuura-sage]" />
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="font-display font-light text-4xl text-[--color-nuura-charcoal] text-center mt-8">Order Placed!</motion.h1>
      {orderNumber && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="font-sans text-sm text-[--color-nuura-muted] tracking-wider text-center mt-3">Order #{orderNumber}</motion.p>}
      <div className="w-full border-t border-[--color-nuura-nude]/40 mt-8" />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={isCOD ? 'w-full p-6 mt-6 flex flex-col gap-3 bg-[--color-nuura-cream]' : 'w-full p-6 mt-6 flex flex-col gap-3 bg-[--color-nuura-blush]/40'}>
        <div className="flex items-center gap-3">
          {isCOD ? <Truck size={18} strokeWidth={1.5} className="text-[--color-nuura-muted] flex-shrink-0" /> : <MessageCircle size={18} strokeWidth={1.5} className="text-[--color-nuura-muted] flex-shrink-0" />}
          <p className="font-display text-base text-[--color-nuura-charcoal]">{isCOD ? 'Your order is confirmed' : 'Almost there!'}</p>
        </div>
        {isCOD ? (
          <div className="flex flex-col gap-1 pl-7">
            <p className="font-sans text-xs text-[--color-nuura-muted]">We&apos;ll call you before delivery to confirm your address.</p>
            <p className="font-sans text-xs text-[--color-nuura-muted]">Expected delivery: 3-5 business days</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pl-7">
            <p className="font-sans text-xs text-[--color-nuura-muted]">Your order is reserved. Send your payment screenshot on WhatsApp to confirm.</p>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 self-start bg-[#25D366] text-white font-sans text-xs tracking-wider uppercase px-5 py-3"><MessageCircle size={13} strokeWidth={1.5} />WhatsApp Us</a>
          </div>
        )}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full mt-8">
        <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[--color-nuura-muted] mb-5">What happens next</p>
        <div className="grid grid-cols-3 gap-4">
          {[{ icon: <PackageCheck size={20} strokeWidth={1.5} />, label: 'Order Received', sub: 'We have your order' },
            { icon: <Truck size={20} strokeWidth={1.5} />, label: 'Being Packed', sub: 'Usually within 24 hours' },
            { icon: <MapPin size={20} strokeWidth={1.5} />, label: 'Out for Delivery', sub: '3-5 business days' }]
            .map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full border border-[--color-nuura-nude] flex items-center justify-center text-[--color-nuura-muted]">{step.icon}</div>
                <p className="font-sans text-xs text-[--color-nuura-charcoal]">{step.label}</p>
                <p className="font-sans text-[10px] text-[--color-nuura-muted]">{step.sub}</p>
              </div>
            ))}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="w-full flex flex-col gap-3 mt-10">
        <Link href="/shop" className="w-full block bg-[--color-nuura-charcoal] text-white font-sans text-xs tracking-widest uppercase py-4 text-center hover:bg-[--color-nuura-muted] transition-colors duration-200">Continue Shopping</Link>
        <Link href="/" className="w-full block border border-[--color-nuura-charcoal] text-[--color-nuura-charcoal] font-sans text-xs tracking-widest uppercase py-4 text-center hover:bg-[--color-nuura-cream] transition-colors duration-200">Back to Home</Link>
      </motion.div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <main className="min-h-screen bg-[--color-nuura-warm-white] pt-32 pb-16 px-8">
      <Suspense fallback={<div className="max-w-lg mx-auto flex flex-col items-center pt-8"><div className="w-20 h-20 rounded-full bg-[--color-nuura-nude] animate-pulse" /></div>}>
        <OrderConfirmationContent />
      </Suspense>
    </main>
  )
}
