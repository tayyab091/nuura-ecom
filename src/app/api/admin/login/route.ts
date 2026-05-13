import { NextResponse } from 'next/server'
import { ADMIN_CREDENTIALS } from '@/lib/adminAuth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body as { email: string; password: string }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const emailMatch = email.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()
    const passwordMatch = password === ADMIN_CREDENTIALS.password

    if (!emailMatch || !passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = process.env.ADMIN_SECRET_KEY ?? 'nuura-admin-secret-key-2025'

    const res = NextResponse.json({ success: true })
    res.cookies.set('nuura-admin-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24h
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
