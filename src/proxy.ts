import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page through
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('nuura-admin-token')?.value
    const secretKey = process.env.ADMIN_SECRET_KEY ?? 'nuura-admin-secret-key-2025'

    if (!adminToken || adminToken !== secretKey) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
