import { Suspense } from 'react'
import LoginClient from './LoginClient'

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-nuura-warm-white" />}
    >
      <LoginClient />
    </Suspense>
  )
}
