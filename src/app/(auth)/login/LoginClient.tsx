/* eslint-disable react/no-unescaped-entities */

'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

export default function LoginClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const callbackUrl = useMemo(() => sp.get('next') || '/shop', [sp])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Login failed')
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-nuura-warm-white px-4 py-16 flex items-center justify-center relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-20 -left-20 size-80 border border-n-gold/20" />
        <div className="absolute -bottom-24 -right-24 size-96 border border-n-forest/10" />
      </div>

      <div className="w-full max-w-4xl">
        <div className="border border-n-border bg-n-white rounded-2xl overflow-hidden">
          <div className="h-1 bg-n-gold" />

          <div className="grid md:grid-cols-5">
            <div className="md:col-span-2 bg-n-forest text-n-cream p-10 border-b md:border-b-0 md:border-r border-n-cream/10">
              <p
                className="uppercase text-n-cream leading-none inline-block translate-x-[2px]"
                style={{ fontFamily: 'var(--font-accent)', fontSize: '20px', letterSpacing: '0.45em' }}
              >
                NUURA
              </p>
              <p className="font-sans text-[10px] tracking-[0.28em] uppercase text-n-cream/70 mt-2">Customer Portal</p>

              <div className="mt-10">
                <p className="[font-family:var(--font-display)] text-3xl font-light leading-tight">A softer way to shop.</p>
                <div className="mt-5 h-px w-12 bg-n-gold/70" />
                <p className="font-sans text-sm text-n-cream/75 mt-5">
                  Sign in to access your account.
                </p>
              </div>

              <p className="mt-12 font-sans text-[10px] tracking-[0.3em] uppercase text-n-cream/50">Glow in your own light</p>
            </div>

            <div className="md:col-span-3 p-10 bg-n-card">
              <p className="font-sans text-[10px] tracking-[0.28em] uppercase text-nuura-muted">Customer Login</p>
              <h1 className="[font-family:var(--font-display)] text-4xl font-light text-nuura-charcoal mt-5">Welcome back</h1>
              <p className="font-sans text-sm text-nuura-muted mt-3">Enter your details to continue.</p>

              {error && <p className="mt-6 font-sans text-xs text-red-600">{error}</p>}

              <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
                <label className="flex flex-col gap-2">
                  <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-nuura-muted">Email</span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-n-white border border-n-border text-nuura-charcoal placeholder-nuura-muted/70 px-4 py-3.5 w-full rounded-lg focus:outline-none focus:border-n-forest font-sans text-sm transition-colors"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-nuura-muted">Password</span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-n-white border border-n-border text-nuura-charcoal placeholder-nuura-muted/70 px-4 py-3.5 w-full rounded-lg focus:outline-none focus:border-n-forest font-sans text-sm transition-colors"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-n-forest text-n-cream w-full py-3.5 mt-2 rounded-lg font-sans text-xs tracking-widest uppercase disabled:opacity-60"
                >
                  {submitting ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/shop"
                  data-cursor="hover"
                  className="bg-n-forest text-n-cream w-full py-3.5 rounded-lg font-sans text-xs tracking-widest uppercase text-center hover:bg-n-gold hover:text-n-forest transition-colors"
                >
                  Continue to Shop
                </Link>
                <Link
                  href="/register"
                  data-cursor="hover"
                  className="w-full py-3.5 rounded-lg font-sans text-xs tracking-widest uppercase text-center border border-n-border text-nuura-charcoal hover:bg-n-offwhite transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
