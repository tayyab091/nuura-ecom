import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { connectDB, MongoUnavailableError } from '@/lib/mongodb'
import User from '@/models/User'
import { signCustomerToken } from '@/lib/customerAuth'

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  password: z.string().min(8).max(72),
})

const COOKIE_NAME = 'nuura-user-token'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function POST(request: Request) {
  try {
    await connectDB({ maxWaitMS: 8000 })
    const raw = await request.json()
    const parsed = RegisterSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { name, email, phone, password } = parsed.data
    const existing = await User.findOne({ email: email.toLowerCase() }).select('_id').lean()
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone || undefined,
      passwordHash,
      addresses: [],
    })

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
    console.error('Customer register error:', err)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}
