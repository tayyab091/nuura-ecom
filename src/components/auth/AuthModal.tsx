'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function AuthModal() {
  const router = useRouter()
  const {
    isAuthOpen,
    authMode,
    closeAuthModal,
    setAuthMode,
    refreshSession,
    setSession,
    authFormResetAt,
  } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAuthModal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeAuthModal, isAuthOpen])

  useEffect(() => {
    if (!isAuthOpen) return
    setError('')
    setSubmitting(false)
  }, [isAuthOpen, authMode])

  useEffect(() => {
    // Clear credential fields when reset is triggered (e.g., on logout)
    setName('')
    setEmail('')
    setPhone('')
    setPassword('')
  }, [authFormResetAt])

  if (!isAuthOpen) return null

  async function submitLogin() {
    const payload = { email: email.trim(), password }

    const adminRes = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (adminRes.ok) {
      setSession({ role: 'admin', user: { email: payload.email.toLowerCase(), name: 'Admin' } })
      closeAuthModal()
      router.replace('/admin')
      router.refresh()
      return
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error(data?.error ?? 'Login failed')
    }

    setSession({
      role: 'customer',
      user: data.user ?? { email: payload.email },
    })
    closeAuthModal()
    router.replace('/')
    router.refresh()
  }

  async function submitRegister() {
    const payload = { name, email: email.trim(), phone, password }
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error(data?.error ?? 'Registration failed')
    }

    setSession({
      role: 'customer',
      user: data.user ?? { email: payload.email, name: payload.name },
    })
    closeAuthModal()
    router.replace('/')
    router.refresh()
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (authMode === 'login') {
        await submitLogin()
      } else {
        await submitRegister()
      }
      await refreshSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const isRegister = authMode === 'register'

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-[10px] px-4 py-6 sm:px-6 flex items-center justify-center"
      onClick={closeAuthModal}
      role="presentation"
    >
      <div
        className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-n-border bg-n-card shadow-[0_32px_100px_rgba(0,0,0,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid md:grid-cols-5">
          <aside className="md:col-span-2 bg-n-forest text-n-cream p-8 md:p-10 border-b md:border-b-0 md:border-r border-n-cream/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className="uppercase text-n-cream leading-none inline-block translate-x-[2px]"
                  style={{ fontFamily: 'var(--font-accent)', fontSize: '20px', letterSpacing: '0.45em' }}
                >
                  NUURA
                </p>
                <p className="font-sans text-[10px] tracking-[0.28em] uppercase text-n-cream/70 mt-3">
                  Customer Portal
                </p>
              </div>
              <button
                type="button"
                onClick={closeAuthModal}
                className="inline-flex items-center justify-center size-10 rounded-full border border-n-cream/10 hover:border-n-cream/30 hover:bg-n-cream/10 transition-colors"
                aria-label="Close login modal"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div className="mt-12">
              <p className="[font-family:var(--font-display)] text-3xl font-light leading-tight">
                {isRegister ? 'Create your account.' : 'Welcome back.'}
              </p>
              <div className="mt-5 h-px w-12 bg-n-gold/70" />
              <p className="font-sans text-sm text-n-cream/75 mt-5 max-w-xs">
                {isRegister
                  ? 'Save your details for faster checkout and future order tracking.'
                  : 'Sign in to continue shopping or access your admin workspace.'}
              </p>
            </div>

            <p className="mt-12 font-sans text-[10px] tracking-[0.3em] uppercase text-n-cream/50">
              Glow in your own light
            </p>
          </aside>

          <section className="md:col-span-3 p-8 md:p-10">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-sans text-[10px] tracking-[0.28em] uppercase text-nuura-muted">
                  {isRegister ? 'Create Account' : 'Customer Login'}
                </p>
                <h2 className="[font-family:var(--font-display)] text-3xl md:text-4xl font-light text-nuura-charcoal mt-3">
                  {isRegister ? 'Join Nuura' : 'Sign in'}
                </h2>
              </div>

              <div className="inline-flex rounded-full border border-n-border bg-n-white p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={
                    'px-4 py-2 rounded-full font-sans text-[10px] tracking-[0.22em] uppercase transition-colors ' +
                    (!isRegister ? 'bg-n-forest text-n-cream' : 'text-nuura-muted hover:text-nuura-charcoal')
                  }
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={
                    'px-4 py-2 rounded-full font-sans text-[10px] tracking-[0.22em] uppercase transition-colors ' +
                    (isRegister ? 'bg-n-forest text-n-cream' : 'text-nuura-muted hover:text-nuura-charcoal')
                  }
                >
                  Sign Up
                </button>
              </div>
            </div>

            {error && <p className="mt-5 font-sans text-xs text-red-600">{error}</p>}

            <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit} autoComplete="off">
              {isRegister && (
                <label className="flex flex-col gap-2">
                  <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-nuura-muted">Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    required
                    className="bg-n-white border border-n-border text-nuura-charcoal placeholder-nuura-muted/70 px-4 py-3.5 w-full rounded-lg focus:outline-none focus:border-n-forest font-sans text-sm transition-colors"
                    placeholder="Your name"
                  />
                </label>
              )}

              <label className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-nuura-muted">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="bg-n-white border border-n-border text-nuura-charcoal placeholder-nuura-muted/70 px-4 py-3.5 w-full rounded-lg focus:outline-none focus:border-n-forest font-sans text-sm transition-colors"
                  placeholder="you@example.com"
                />
              </label>

              {isRegister && (
                <label className="flex flex-col gap-2">
                  <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-nuura-muted">Phone (optional)</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                    className="bg-n-white border border-n-border text-nuura-charcoal placeholder-nuura-muted/70 px-4 py-3.5 w-full rounded-lg focus:outline-none focus:border-n-forest font-sans text-sm transition-colors"
                    placeholder="+92..."
                  />
                </label>
              )}

              <label className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-nuura-muted">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  className="bg-n-white border border-n-border text-nuura-charcoal placeholder-nuura-muted/70 px-4 py-3.5 w-full rounded-lg focus:outline-none focus:border-n-forest font-sans text-sm transition-colors"
                  placeholder={isRegister ? 'Min 8 characters' : '••••••••'}
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="bg-n-forest text-n-cream w-full py-3.5 mt-2 rounded-lg font-sans text-xs tracking-widest uppercase disabled:opacity-60"
              >
                {submitting ? (isRegister ? 'Creating...' : 'Signing in...') : isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setAuthMode(isRegister ? 'login' : 'register')}
                className="w-full py-3.5 rounded-lg font-sans text-xs tracking-widest uppercase text-center border border-n-border text-nuura-charcoal hover:bg-n-offwhite transition-colors"
              >
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeAuthModal()
                  router.replace('/')
                }}
                className="bg-n-forest text-n-cream w-full py-3.5 rounded-lg font-sans text-xs tracking-widest uppercase hover:bg-n-gold hover:text-n-forest transition-colors"
              >
                Continue to Shop
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}