'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type AuthRole = 'admin' | 'customer'

export type AuthUser = {
  id?: string
  name?: string
  email: string
}

export type AuthSession = {
  role: AuthRole
  user: AuthUser
}

type AuthMode = 'login' | 'register'

type AuthContextValue = {
  session: AuthSession | null
  ready: boolean
  isAuthOpen: boolean
  authMode: AuthMode
  openAuthModal: (mode?: AuthMode) => void
  closeAuthModal: () => void
  setAuthMode: (mode: AuthMode) => void
  refreshSession: () => Promise<void>
  setSession: (session: AuthSession | null) => void
  // admin auth form reset control (used to clear login inputs on logout)
  authFormResetAt: number
  resetAuthForm: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [ready, setReady] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authFormResetAt, setAuthFormResetAt] = useState<number>(0)

  const refreshSession = async () => {
    try {
      const adminRes = await fetch('/api/admin/me', { cache: 'no-store' })
      if (adminRes.ok) {
        const data = await readJson<{ admin?: AuthUser }>(adminRes)
        if (data?.admin?.email) {
          setSession({ role: 'admin', user: data.admin })
          return
        }
      }

      const userRes = await fetch('/api/auth/me', { cache: 'no-store' })
      if (userRes.ok) {
        const data = await readJson<{ user?: AuthUser }>(userRes)
        if (data?.user?.email) {
          setSession({ role: 'customer', user: data.user })
          return
        }
      }

      setSession(null)
    } finally {
      setReady(true)
    }
  }

  useEffect(() => {
    void refreshSession()
  }, [])

  useEffect(() => {
    if (!isAuthOpen) {
      document.body.style.overflow = ''
      return
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isAuthOpen])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      isAuthOpen,
      authMode,
      openAuthModal: (mode = 'login') => {
        setAuthMode(mode)
        setIsAuthOpen(true)
      },
      closeAuthModal: () => {
        setIsAuthOpen(false)
        setAuthMode('login')
      },
      setAuthMode,
      refreshSession,
      setSession,
      authFormResetAt,
      resetAuthForm: () => setAuthFormResetAt(Date.now()),
    }),
    [authMode, isAuthOpen, ready, session]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}