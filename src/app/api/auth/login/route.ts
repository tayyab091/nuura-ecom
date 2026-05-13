import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { connectDB, MongoUnavailableError } from '@/lib/mongodb'
import User from '@/models/User'
import { signCustomerToken } from '@/lib/customerAuth'

const LoginSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(72),
})

const COOKIE_NAME = 'nuura-user-token'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function POST(request: Request) {
  try {
    await connectDB({ maxWaitMS: 8000 })
    const raw = await request.json()
    const parsed = LoginSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { email, password } = parsed.data
    const user = await User.findOne({ email: email.toLowerCase() }).select('_id name email passwordHash').lean()
    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const { token } = signCustomerToken({ sub: String(user._id), email: user.email }, MAX_AGE)
    const res = NextResponse.json({
      success: true,
      user: { id: String(user._id), name: user.name, email: user.email },
    })

    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: MAX_AGE,
    })

    return res
  } catch (err) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('Customer login error:', err)
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 })
  }
}
