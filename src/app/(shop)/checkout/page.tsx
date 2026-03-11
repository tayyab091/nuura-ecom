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
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(10, 'Enter a valid Pakistani phone number'),
  street: z.string().min(5, 'Enter your full street address'),
  city: z.string().min(1, 'Select your city'),
  province: z.string().min(2, 'Enter your province'),
  notes: z.string().optional(),
  paymentMethod: z.enum(['cod', 'jazzcash', 'easypaisa', 'nayapay']),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

const PAYMENT_OPTIONS = [
  {
    id: 'cod' as const,
    title: 'Cash on Delivery',
    subtitle: 'Pay when your order arrives',
    badge: 'Most Popular',
    icon: <Truck size={22} strokeWidth={1.5} className="text-[--color-nuura-muted]" />,
  },
  {
    id: 'jazzcash' as const,
    title: 'JazzCash',
    subtitle: 'Instant mobile transfer',
    color: '#ED1C24',
    letter: 'J',
  },
  {
    id: 'easypaisa' as const,
    title: 'EasyPaisa',
    subtitle: 'Instant mobile transfer',
    color: '#4CAF50',
    letter: 'E',
  },
  {
    id: 'nayapay' as const,
    title: 'NayaPay',
    subtitle: 'Instant mobile transfer',
    color: '#7B2D8B',
    letter: 'N',
  },
]

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const totalPrice = useCartStore((s) => s.totalPrice())
  const clearCart = useCartStore((s) => s.clearCart)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [copied, setCopied] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'cod' },
  })

  const selectedCity = watch('city')
  const selectedPayment = watch('paymentMethod')

  const shippingFee =
    totalPrice >= FREE_SHIPPING_THRESHOLD
      ? 0
      : selectedCity
      ? SHIPPING_RATES[selectedCity] ?? SHIPPING_RATES['Other']
      : 0

  const total = totalPrice + shippingFee

  useEffect(() => {
    if (items.length === 0) router.replace('/shop')
  }, [items.length, router])

  const isManualTransfer = ['jazzcash', 'easypaisa', 'nayapay'].includes(selectedPayment)
  const selectedAccount = isManualTransfer
    ? PAYMENT_ACCOUNTS[selectedPayment as keyof typeof PAYMENT_ACCOUNTS]
    : null

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onSubmit = async (data: CheckoutForm) => {
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: data.fullName, email: data.email, phone: data.phone },
          items,
          shippingAddress: { street: data.street, city: data.city, province: data.province },
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
      router.push(`/order-confirmation?order=${result.orderNumber}&method=${data.paymentMethod}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) return null

  return (
    <main className="min-h-screen bg-[--color-nuura-warm-white] pt-24 pb-16">
      <div className="max-w-[1200px] mx-auto px-8 md:px-16 lg:px-24">
        <h1 className="font-display font-light text-4xl text-[--color-nuura-charcoal] mb-12">
          Checkout
        </h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-12 lg:gap-16 items-start">

            {/* ─── LEFT: FORM ─── */}
            <div className="flex flex-col gap-10">

              {/* Section 1 — Contact */}
              <section>
                <h2 className="font-display text-xl text-[--color-nuura-charcoal] mb-6">Contact Information</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <input
                      {...register('fullName')}
                      placeholder="Full Name"
                      className="w-full border border-[--color-nuura-nude] bg-transparent px-4 py-3.5 font-sans text-sm text-[--color-nuura-charcoal] placeholder-[--color-nuura-muted] focus:outline-none focus:border-[--color-nuura-charcoal] transition-colors"
                    />
                    {errors.fullName && <p className="font-sans text-[11px] text-red-500 mt-1">{errors.fullName.message}</p>}
                  </div>
                  <div>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="Email Address"
                      className="w-full border border-[--color-nuura-nude] bg-transparent px-4 py-3.5 font-sans text-sm text-[--color-nuura-charcoal] placeholder-[--color-nuura-muted] focus:outline-none focus:border-[--color-nuura-charcoal] transition-colors"
                    />
                    {errors.email && <p className="font-sans text-[11px] text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="03XX-XXXXXXX"
                      className="w-full border border-[--color-nuura-nude] bg-transparent px-4 py-3.5 font-sans text-sm text-[--color-nuura-charcoal] placeholder-[--color-nuura-muted] focus:outline-none focus:border-[--color-nuura-charcoal] transition-colors"
                    />
                    {errors.phone && <p className="font-sans text-[11px] text-red-500 mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
              </section>

              {/* Section 2 — Address */}
              <section>
                <h2 className="font-display text-xl text-[--color-nuura-charcoal] mb-6">Delivery Address</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <textarea
                      {...register('street')}
                      rows={2}
                      placeholder="Street Address, Building, Apartment"
                      className="w-full border border-[--color-nuura-nude] bg-transparent px-4 py-3.5 font-sans text-sm text-[--color-nuura-charcoal] placeholder-[--color-nuura-muted] focus:outline-none focus:border-[--color-nuura-charcoal] transition-colors resize-none"
                    />
                    {errors.street && <p className="font-sans text-[11px] text-red-500 mt-1">{errors.street.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <select
                        {...register('city')}
                        className="w-full border border-[--color-nuura-nude] bg-[--color-nuura-warm-white] px-4 py-3.5 font-sans text-sm text-[--color-nuura-charcoal] focus:outline-none focus:border-[--color-nuura-charcoal] transition-colors cursor-pointer"
                      >
                        <option value="">Select City</option>
                        {CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {errors.city && <p className="font-sans text-[11px] text-red-500 mt-1">{errors.city.message}</p>}
                    </div>
                    <div>
                      <input
                        {...register('province')}
                        placeholder="Province"
                        className="w-full border border-[--color-nuura-nude] bg-transparent px-4 py-3.5 font-sans text-sm text-[--color-nuura-charcoal] placeholder-[--color-nuura-muted] focus:outline-none focus:border-[--color-nuura-charcoal] transition-colors"
                      />
                      {errors.province && <p className="font-sans text-[11px] text-red-500 mt-1">{errors.province.message}</p>}
                    </div>
                  </div>
                  <div>
                    <textarea
                      {...register('notes')}
                      rows={2}
                      placeholder="Landmark, delivery notes... (optional)"
                      className="w-full border border-[--color-nuura-nude] bg-transparent px-4 py-3.5 font-sans text-sm text-[--color-nuura-charcoal] placeholder-[--color-nuura-muted] focus:outline-none focus:border-[--color-nuura-charcoal] transition-colors resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Section 3 — Payment */}
              <section>
                <h2 className="font-display text-xl text-[--color-nuura-charcoal] mb-6">Payment Method</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PAYMENT_OPTIONS.map((opt) => {
                    const isSelected = selectedPayment === opt.id
                    return (
                      <label
                        key={opt.id}
                        className={[
                          'flex items-center gap-4 p-4 border cursor-pointer transition-all duration-200',
                          isSelected
                            ? 'border-[--color-nuura-charcoal] bg-[--color-nuura-cream]'
                            : 'border-[--color-nuura-nude] hover:border-[--color-nuura-charcoal]/50',
                        ].join(' ')}
                      >
                        <input
                          {...register('paymentMethod')}
                          type="radio"
                          value={opt.id}
                          className="sr-only"
                        />
                        {'icon' in opt && opt.icon ? (
                          opt.icon
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-sans text-sm font-medium flex-shrink-0"
                            style={{ backgroundColor: (opt as { color: string }).color }}
                          >
                            {(opt as { letter: string }).letter}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-sm text-[--color-nuura-charcoal]">{opt.title}</span>
                            {'badge' in opt && opt.badge && (
                              <span className="bg-[--color-nuura-sage] text-white font-sans text-[9px] tracking-wider uppercase px-2 py-0.5">{opt.badge}</span>
                            )}
                          </div>
                          <span className="font-sans text-[11px] text-[--color-nuura-muted]">{opt.subtitle}</span>
                        </div>
                        {isSelected && (
                          <CheckCircle size={16} className="text-[--color-nuura-charcoal] flex-shrink-0" />
                        )}
                      </label>
                    )
                  })}
                </div>

                {/* Manual Transfer Instructions */}
                <AnimatePresence>
                  {isManualTransfer && selectedAccount && (
                    <motion.div
                      key="transfer-box"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.25 }}
                      className="mt-4 bg-[--color-nuura-cream] border border-[--color-nuura-nude] p-6"
                    >
                      <h3 className="font-display text-lg text-[--color-nuura-charcoal] mb-4">Send Payment To</h3>

                      <div className="mb-4">
                        <p className="font-sans text-[10px] tracking-wider uppercase text-[--color-nuura-muted] mb-1">{selectedAccount.name} Account</p>
                        <p className="font-sans text-xs text-[--color-nuura-muted] mb-2">{selectedAccount.accountName}</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedAccount.number)}
                          className="flex items-center gap-2 group"
                        >
                          <span className="font-display text-2xl tracking-wider text-[--color-nuura-charcoal]">{selectedAccount.number}</span>
                          <Copy size={14} className="text-[--color-nuura-muted] group-hover:text-[--color-nuura-charcoal] transition-colors" />
                        </button>
                        <p className="font-sans text-[10px] text-[--color-nuura-muted] mt-1">
                          {copied ? '✓ Copied!' : 'Tap to copy'}
                        </p>
                      </div>

                      <div className="mb-5">
                        <p className="font-sans text-[10px] tracking-wider uppercase text-[--color-nuura-muted] mb-1">Send exactly:</p>
                        <p className="font-display text-3xl text-[--color-nuura-charcoal]">PKR {total.toLocaleString()}</p>
                      </div>

                      <ol className="flex flex-col gap-2 mb-5">
                        {[
                          `Open ${selectedAccount.name} app`,
                          `Send PKR ${total.toLocaleString()} to the number above`,
                          'Take a screenshot of the confirmation',
                          'WhatsApp the screenshot to us after placing order',
                        ].map((step, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="font-sans text-[10px] text-[--color-nuura-muted] mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
                            <span className="font-sans text-xs text-[--color-nuura-charcoal]">{step}</span>
                          </li>
                        ))}
                      </ol>

                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi!%20I%20just%20placed%20an%20order%20and%20am%20sending%20my%20payment%20screenshot.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#25D366] text-white font-sans text-xs tracking-wider uppercase px-5 py-3"
                      >
                        <MessageCircle size={14} strokeWidth={1.5} />
                        WhatsApp Us
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Submit */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[--color-nuura-charcoal] text-white font-sans text-xs tracking-widest uppercase py-5 hover:bg-[--color-nuura-muted] transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Placing Order...' : 'Place Order'}
                </button>
                {submitError && (
                  <p className="font-sans text-xs text-red-500 mt-3 text-center">{submitError}</p>
                )}
              </div>
            </div>

            {/* ─── RIGHT: ORDER SUMMARY ─── */}
            <div className="lg:sticky lg:top-24">
              <div className="bg-[--color-nuura-cream] border border-[--color-nuura-nude]/40 p-8">
                <h2 className="font-display text-xl text-[--color-nuura-charcoal] mb-6">Order Summary</h2>

                {/* Items */}
                <div className="flex flex-col divide-y divide-[--color-nuura-nude]/30">
                  {items.map((item) => (
                    <div key={item.product._id} className="flex items-center gap-4 py-3">
                      <div className="w-[60px] h-[60px] flex-shrink-0 relative rounded-sm overflow-hidden bg-[--color-nuura-nude]">
                        {item.product.images?.[0] && (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-base text-[--color-nuura-charcoal] leading-tight">{item.product.name}</p>
                        <p className="font-sans text-xs text-[--color-nuura-muted] mt-0.5">x{item.quantity}</p>
                      </div>
                      <span className="font-sans text-sm text-[--color-nuura-charcoal] ml-auto flex-shrink-0">
                        PKR {(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pricing breakdown */}
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="font-sans text-xs text-[--color-nuura-muted]">Subtotal</span>
                    <span className="font-sans text-sm text-[--color-nuura-charcoal]">PKR {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-xs text-[--color-nuura-muted]">Shipping</span>
                    <span className="font-sans text-sm text-[--color-nuura-charcoal]">
                      {!selectedCity
                        ? '—'
                        : shippingFee === 0
                        ? 'Free'
                        : `PKR ${shippingFee.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div className="border-t border-[--color-nuura-nude]/40 my-4" />

                <div className="flex justify-between items-baseline">
                  <span className="font-display text-xl text-[--color-nuura-charcoal]">Total</span>
                  <span className="font-display text-xl text-[--color-nuura-charcoal]">PKR {total.toLocaleString()}</span>
                </div>

                {selectedPayment === 'cod' && (
                  <p className="font-sans text-[10px] text-[--color-nuura-muted] mt-2">
                    You&apos;ll pay this amount on delivery
                  </p>
                )}
              </div>
            </div>

          </div>
        </form>
      </div>
    </main>
  )
}
