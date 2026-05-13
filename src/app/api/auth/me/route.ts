import { NextResponse } from 'next/server'
import { connectDB, MongoUnavailableError } from '@/lib/mongodb'
import User from '@/models/User'
import { verifyCustomerToken } from '@/lib/customerAuth'

const COOKIE_NAME = 'nuura-user-token'

export async function GET(request: Request) {
  try {
    await connectDB({ maxWaitMS: 8000 })

    const cookie = request.headers.get('cookie') ?? ''
    const match = cookie.match(/(?:^|;\s*)nuura-user-token=([^;]+)/)
    const token = match?.[1]
    if (!token) return NextResponse.json({ user: null })

    const payload = verifyCustomerToken(decodeURIComponent(token))
    if (!payload) return NextResponse.json({ user: null })

    const user = await User.findById(payload.sub).select('_id name email phone').lean()
    if (!user) return NextResponse.json({ user: null })

    return NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    })
  } catch (err) {
    if (err instanceof MongoUnavailableError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    console.error('Customer me error:', err)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
