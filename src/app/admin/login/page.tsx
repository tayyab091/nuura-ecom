'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Invalid credentials')
        return
      }
      router.replace('/admin')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-n-offwhite flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-n-card border border-n-border rounded-2xl overflow-hidden">
          <div className="h-1 bg-n-gold" />

          <div className="p-8">
            <div className="text-center">
              <p className="[font-family:var(--font-accent)] text-[18px] tracking-[0.45em] text-n-ink leading-none">
                NUURA
              </p>
              <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-n-muted mt-3">
                Admin Login
              </p>
            </div>

            <h1 className="[font-family:var(--font-display)] text-3xl font-light text-n-ink mt-8 text-center">
              Welcome back
            </h1>
            <p className="font-sans text-sm text-n-muted mt-3 text-center">
              Sign in to manage orders, products, and settings.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8" aria-busy={loading}>
              <label className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-n-muted">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  autoComplete="email"
                  data-cursor="hover"
                  aria-invalid={Boolean(error)}
                  className="bg-n-white border border-n-border text-n-ink placeholder-n-muted/70 px-4 py-3.5 w-full rounded-lg focus:outline-none focus:border-n-gold focus-visible:ring-2 focus-visible:ring-n-gold/15 font-sans text-sm transition-colors"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-n-muted">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  data-cursor="hover"
                  aria-invalid={Boolean(error)}
                  className="bg-n-white border border-n-border text-n-ink placeholder-n-muted/70 px-4 py-3.5 w-full rounded-lg focus:outline-none focus:border-n-gold focus-visible:ring-2 focus-visible:ring-n-gold/15 font-sans text-sm transition-colors"
                />
              </label>

              {error && (
                <p role="alert" aria-live="polite" className="text-red-600 font-sans text-xs">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                data-cursor="hover"
                className="bg-n-forest text-n-cream w-full py-3.5 mt-2 rounded-lg font-sans text-xs tracking-widest uppercase hover:bg-n-gold hover:text-n-forest transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
