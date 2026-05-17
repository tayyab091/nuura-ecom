'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Truck, Package, PackageCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { WHATSAPP_NUMBER } from '@/lib/constants'

type InfoBoxProps = { isCOD: boolean }
type TimelineStepProps = { icon: React.ReactNode; label: string; active: boolean }

const TimelineStep = ({ icon, label, active }: TimelineStepProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.4rem' }}>
    <div style={{ color: active ? '#C4614A' : '#8C8078' }}>{icon}</div>
    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: active ? '#C4614A' : '#8C8078' }}>{label}</p>
  </div>
)

const InfoBox = ({ isCOD }: InfoBoxProps) => {
  const [whatsappNumber, setWhatsappNumber] = useState<string>(WHATSAPP_NUMBER)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        const n = d?.settings?.whatsappNumber
        if (typeof n === 'string' && n.trim()) setWhatsappNumber(n.trim())
      })
      .catch(() => {})
  }, [])

  const waLink =
    'https://wa.me/' +
    whatsappNumber +
    '?text=Hi!%20I%20just%20placed%20an%20order%20and%20am%20sending%20my%20payment%20screenshot.'

  return (
    <div
      style={{
        backgroundColor: '#F2EDE4',
        borderLeft: isCOD ? '3px solid #C4614A' : '3px solid #D4796A',
        padding: '1.5rem',
        marginTop: '2rem',
        textAlign: 'left',
      }}
    >
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#1A1714', marginBottom: '0.5rem' }}>
        {isCOD ? 'What happens next?' : 'Action Required'}
      </h3>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#8C8078', lineHeight: 1.6 }}>
        {isCOD
          ? 'Your order is confirmed. We will prepare it for shipment and you will receive a tracking number via email within 24 hours. Expect delivery in 3-5 business days.'
          : 'Your order is on hold. To confirm it, please send a screenshot of your payment to our WhatsApp number.'}
      </p>
      {!isCOD && (
        <a
          href={waLink}
          target='_blank'
          rel='noopener noreferrer'
          data-cursor='hover'
          style={{
            marginTop: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'underline',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            color: '#C4614A',
          }}
        >
          Confirm on WhatsApp <ArrowRight size={16} />
        </a>
      )}
    </div>
  )
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const method = searchParams.get('method') || 'cod'
  const isCOD = method === 'cod'
  const [mounted] = useState<boolean>(() => typeof window !== 'undefined')

  if (!mounted) return <div style={{ minHeight: '50vh' }} />

  return (
    <div style={{ maxWidth: '32rem', margin: '0 auto', padding: '0 2rem 4rem', textAlign: 'center' }}>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '1px solid #C4614A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
        }}
      >
        <CheckCircle2 size={36} strokeWidth={1.5} style={{ color: '#C4614A' }} />
      </motion.div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: '#1A1714', marginTop: '1.5rem' }}>Order Placed!</h1>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          color: '#8C8078',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginTop: '0.75rem',
        }}
      >
        Order #{orderNumber}
      </p>

      <InfoBox isCOD={isCOD} />

      <div style={{ margin: '2.5rem 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', alignItems: 'start', gap: '0.5rem' }}>
          <TimelineStep icon={<Package size={22} />} label='Order Placed' active={true} />
          <div style={{ borderBottom: '1px dashed #E8E0D8', marginTop: '0.65rem' }} />
          <TimelineStep icon={<PackageCheck size={22} />} label='Processing' active={isCOD} />
          <div style={{ borderBottom: '1px dashed #E8E0D8', marginTop: '0.65rem' }} />
          <TimelineStep icon={<Truck size={22} />} label='Shipped' active={false} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Link
          href='/shop'
          data-cursor='hover'
          style={{
            display: 'block',
            width: '100%',
            padding: '1rem',
            backgroundColor: '#1A1714',
            color: '#FAF8F4',
            border: 0,
            borderRadius: 0,
            textDecoration: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            transition: 'background-color 250ms ease',
          }}
        >
          Continue Shopping
        </Link>
        <Link
          href='/'
          data-cursor='hover'
          style={{
            display: 'block',
            width: '100%',
            padding: '1rem',
            backgroundColor: 'transparent',
            color: '#8C8078',
            border: '1px solid #E8E0D8',
            borderRadius: 0,
            textDecoration: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}
        >
          Back to Home
        </Link>
      </div>

      <style jsx>{`
        a[href='/shop']:hover {
          background-color: #c4614a !important;
        }
        a[href='/']:hover {
          color: #1a1714 !important;
          border-color: #1a1714 !important;
        }
      `}</style>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <main style={{ backgroundColor: '#FAF8F4', minHeight: '100vh', paddingTop: '8rem' }}>
      <Suspense fallback={<div style={{ width: '100%', height: '24rem' }} />}>
        <OrderConfirmationContent />
      </Suspense>
    </main>
  )
}
