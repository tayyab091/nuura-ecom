'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, MessageCircle, Copy, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import {
  PAYMENT_ACCOUNTS,
  SHIPPING_RATES,
  FREE_SHIPPING_THRESHOLD,
  WHATSAPP_NUMBER,
  SHIPPING_CITIES,
} from '@/lib/constants'

const CITIES = [...SHIPPING_CITIES, 'Other'] as const

const checkoutSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  street: z.string().min(5),
  city: z.string().min(1),
  province: z.string().min(2),
  notes: z.string().optional(),
  paymentMethod: z.enum(['cod', 'jazzcash', 'easypaisa', 'nayapay']),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

type PaymentOption = {
  id: 'cod' | 'jazzcash' | 'easypaisa' | 'nayapay'
  title: string
  subtitle: string
  icon?: React.ReactNode
  color?: string
  letter?: string
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'cod',
    title: 'Cash on Delivery',
    subtitle: 'Pay when your order arrives',
    icon: <Truck size={20} strokeWidth={1.5} style={{ color: '#8C8078' }} />,
  },
  { id: 'jazzcash', title: 'JazzCash', subtitle: 'Instant mobile transfer', color: '#ED1C24', letter: 'J' },
  { id: 'easypaisa', title: 'EasyPaisa', subtitle: 'Instant mobile transfer', color: '#4CAF50', letter: 'E' },
  { id: 'nayapay', title: 'NayaPay', subtitle: 'Instant mobile transfer', color: '#7B2D8B', letter: 'N' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E8E0D8',
  color: '#1A1714',
  padding: '0.8rem 1rem',
  fontFamily: 'var(--font-sans)',
  fontSize: '14px',
  borderRadius: 0,
  outline: 'none',
}

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const totalPrice = useCartStore((s) => s.totalPrice())
  const clearCart = useCartStore((s) => s.clearCart)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [copied, setCopied] = useState(false)
  const [storeSettings, setStoreSettings] = useState<null | {
    shippingFlatFee: number
    freeShippingThreshold: number
    whatsappNumber?: string
    paymentCodEnabled: boolean
    paymentJazzcashEnabled: boolean
    paymentEasypaisaEnabled: boolean
    paymentNayapayEnabled: boolean
  }>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'cod' },
  })

  const selectedCity = watch('city')
  const selectedPayment = watch('paymentMethod')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d?.settings) {
          setStoreSettings({
            shippingFlatFee: Number(d.settings.shippingFlatFee ?? 0),
            freeShippingThreshold: Number(d.settings.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD),
            whatsappNumber: typeof d.settings.whatsappNumber === 'string' ? d.settings.whatsappNumber : undefined,
            paymentCodEnabled: Boolean(d.settings.paymentCodEnabled ?? true),
            paymentJazzcashEnabled: Boolean(d.settings.paymentJazzcashEnabled ?? true),
            paymentEasypaisaEnabled: Boolean(d.settings.paymentEasypaisaEnabled ?? true),
            paymentNayapayEnabled: Boolean(d.settings.paymentNayapayEnabled ?? true),
          })
        }
      })
      .catch(() => {})
  }, [])

  const whatsappNumber = storeSettings?.whatsappNumber?.trim() || WHATSAPP_NUMBER

  const enabledPayments = {
    cod: storeSettings?.paymentCodEnabled ?? true,
    jazzcash: storeSettings?.paymentJazzcashEnabled ?? true,
    easypaisa: storeSettings?.paymentEasypaisaEnabled ?? true,
    nayapay: storeSettings?.paymentNayapayEnabled ?? true,
  }

  const paymentOptions = PAYMENT_OPTIONS.filter((p) => enabledPayments[p.id])

  useEffect(() => {
    if (enabledPayments[selectedPayment]) return
    const next = (paymentOptions[0]?.id ?? 'cod') as CheckoutForm['paymentMethod']
    setValue('paymentMethod', next, { shouldDirty: true, shouldValidate: true })
  }, [enabledPayments, paymentOptions, selectedPayment, setValue])

  const freeThreshold = storeSettings?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD
  const flatFee = storeSettings?.shippingFlatFee ?? 0

  const shippingFee =
    totalPrice >= freeThreshold
      ? 0
      : flatFee > 0
        ? flatFee
        : selectedCity
          ? SHIPPING_RATES[selectedCity as keyof typeof SHIPPING_RATES] ?? SHIPPING_RATES.Other
          : 0
  const total = totalPrice + shippingFee

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/shop')
    }
  }, [items.length, router])

  const isManualTransfer = ['jazzcash', 'easypaisa', 'nayapay'].includes(selectedPayment)
  const selectedAccount = isManualTransfer ? PAYMENT_ACCOUNTS[selectedPayment as keyof typeof PAYMENT_ACCOUNTS] : null

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  async function onSubmit(data: CheckoutForm) {
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: data.fullName,
            email: data.email,
            phone: data.phone,
          },
          items,
          shippingAddress: {
            street: data.street,
            city: data.city,
            province: data.province,
          },
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          subtotal: totalPrice,
          shippingFee,
          total,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Order failed')

      clearCart()
      router.push('/order-confirmation?order=' + result.orderNumber + '&method=' + data.paymentMethod)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) return null

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAF8F4', paddingTop: '6rem' }}>
      <div style={{ padding: '4rem clamp(1.5rem, 6vw, 5rem)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: '#1A1714', marginBottom: '2rem' }}>Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className='grid grid-cols-1 lg:grid-cols-[60%_40%] gap-12 items-start'>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <section>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: '#1A1714', marginBottom: '1rem' }}>Contact Information</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input {...register('fullName')} placeholder='Full Name' style={inputStyle} />
                  {errors.fullName && <p style={{ fontFamily: 'var(--font-sans)', color: '#C4614A', fontSize: '12px' }}>{errors.fullName.message}</p>}

                  <input {...register('email')} type='email' placeholder='Email Address' style={inputStyle} />
                  {errors.email && <p style={{ fontFamily: 'var(--font-sans)', color: '#C4614A', fontSize: '12px' }}>{errors.email.message}</p>}

                  <input {...register('phone')} type='tel' placeholder='03XX-XXXXXXX' style={inputStyle} />
                  {errors.phone && <p style={{ fontFamily: 'var(--font-sans)', color: '#C4614A', fontSize: '12px' }}>{errors.phone.message}</p>}
                </div>
              </section>

              <section>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: '#1A1714', marginBottom: '1rem' }}>Delivery Address</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <textarea {...register('street')} rows={2} placeholder='Street Address, Building, Apartment' style={inputStyle} />
                  {errors.street && <p style={{ fontFamily: 'var(--font-sans)', color: '#C4614A', fontSize: '12px' }}>{errors.street.message}</p>}

                  <div className='grid grid-cols-2 gap-3'>
                    <select {...register('city')} style={inputStyle}>
                      <option value=''>Select City</option>
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input {...register('province')} placeholder='Province' style={inputStyle} />
                  </div>
                  {(errors.city || errors.province) && (
                    <p style={{ fontFamily: 'var(--font-sans)', color: '#C4614A', fontSize: '12px' }}>
                      {errors.city?.message || errors.province?.message}
                    </p>
                  )}

                  <textarea {...register('notes')} rows={2} placeholder='Landmark, delivery notes... (optional)' style={inputStyle} />
                </div>
              </section>

              <section>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: '#1A1714', marginBottom: '1rem' }}>Payment Method</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }} className='sm:grid-cols-2'>
                  {paymentOptions.map((opt) => {
                    const isSelected = selectedPayment === opt.id
                    return (
                      <label
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          backgroundColor: isSelected ? '#FAF8F4' : '#FFFFFF',
                          border: isSelected ? '1px solid #C4614A' : '1px solid #E8E0D8',
                          boxShadow: isSelected ? 'inset 3px 0 0 #C4614A' : 'none',
                          padding: '1rem',
                          borderRadius: 0,
                          cursor: 'pointer',
                          transition: 'all 200ms ease',
                        }}
                      >
                        <input {...register('paymentMethod')} type='radio' value={opt.id} style={{ display: 'none' }} />
                        {opt.icon ? (
                          opt.icon
                        ) : (
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '9999px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              fontFamily: 'var(--font-sans)',
                              fontSize: '13px',
                              backgroundColor: opt.color,
                            }}
                          >
                            {opt.letter}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#1A1714' }}>{opt.title}</span>
                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#8C8078' }}>{opt.subtitle}</p>
                        </div>
                        {isSelected && <CheckCircle size={16} style={{ color: '#C4614A' }} />}
                      </label>
                    )
                  })}
                </div>

                <AnimatePresence>
                  {isManualTransfer && selectedAccount && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{
                        marginTop: '1rem',
                        backgroundColor: '#F2EDE4',
                        borderLeft: '3px solid #C4614A',
                        padding: '1.5rem',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#1A1714', marginBottom: '0.75rem' }}>Manual Transfer</h3>
                      <p style={{ fontSize: '12px', color: '#8C8078', marginBottom: '0.35rem' }}>{selectedAccount.name} Account</p>
                      <button
                        type='button'
                        onClick={() => handleCopy(selectedAccount.number)}
                        style={{ background: 'transparent', border: 0, padding: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#1A1714' }}
                      >
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.04em' }}>{selectedAccount.number}</span>
                        <Copy size={14} style={{ color: '#8C8078' }} />
                      </button>
                      <p style={{ fontSize: '11px', color: '#8C8078', marginTop: '0.25rem' }}>{copied ? 'Copied!' : 'Tap to copy'}</p>
                      <p style={{ marginTop: '0.75rem', fontSize: '14px', color: '#C4614A' }}>Send exactly: PKR {total.toLocaleString()}</p>
                      <a
                        href={'https://wa.me/' + whatsappNumber}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          marginTop: '1rem',
                          backgroundColor: '#1A1714',
                          color: '#FAF8F4',
                          textDecoration: 'none',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '11px',
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          padding: '0.75rem 1rem',
                          borderRadius: 0,
                        }}
                      >
                        <MessageCircle size={14} strokeWidth={1.5} />
                        WhatsApp Us
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              <button
                type='submit'
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  backgroundColor: '#1A1714',
                  color: '#FAF8F4',
                  border: 0,
                  borderRadius: 0,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  transition: 'background-color 250ms ease',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#C4614A'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1A1714'
                }}
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>

              {submitError && <p style={{ fontFamily: 'var(--font-sans)', color: '#C4614A', fontSize: '12px', textAlign: 'center' }}>{submitError}</p>}
            </div>

            <aside style={{ position: 'sticky', top: '6rem' }}>
              <div style={{ backgroundColor: '#F2EDE4', border: '1px solid #E8E0D8', padding: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: '#1A1714', marginBottom: '1rem' }}>Order Summary</h2>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {items.map((item) => (
                    <div key={item.product._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid #E8E0D8' }}>
                      <div style={{ width: '60px', height: '60px', position: 'relative', overflow: 'hidden', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
                        {item.product.images?.[0] && <Image src={item.product.images[0]} alt={item.product.name} fill style={{ objectFit: 'cover' }} sizes='60px' />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: '#1A1714' }}>{item.product.name}</p>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#8C8078' }}>x{item.quantity}</p>
                      </div>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#C4614A' }}>
                        PKR {(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#8C8078' }}>
                    <span>Subtotal</span>
                    <span style={{ color: '#C4614A' }}>PKR {totalPrice.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#8C8078' }}>
                    <span>Shipping</span>
                    <span style={{ color: '#C4614A' }}>{shippingFee === 0 ? 'Free' : 'PKR ' + shippingFee.toLocaleString()}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #E8E0D8', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#8C8078', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: '#1A1714' }}>PKR {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>

      <style jsx>{`
        input::placeholder,
        textarea::placeholder {
          color: #8c8078;
        }
        input:focus,
        textarea:focus,
        select:focus {
          border-color: #c4614a !important;
        }
      `}</style>
    </main>
  )
}
