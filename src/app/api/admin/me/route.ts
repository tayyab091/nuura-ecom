import { NextResponse } from 'next/server'
import { ADMIN_CREDENTIALS, isAdminAuthed } from '@/lib/adminAuth'

export async function GET(request: Request) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ admin: null })
  }

  return NextResponse.json({
    admin: {
      email: ADMIN_CREDENTIALS.email,
      name: 'Admin',
    },
  })
}