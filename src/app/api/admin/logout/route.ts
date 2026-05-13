import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('nuura-admin-token', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
