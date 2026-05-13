import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isAdminAuthed(request: NextRequest) {
  const adminToken = request.cookies.get('nuura-admin-token')?.value
  const secretKey = process.env.ADMIN_SECRET_KEY ?? 'nuura-admin-secret-key-2025'
  return Boolean(adminToken && adminToken === secretKey)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin pages
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next()
    if (!isAdminAuthed(request)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.search = ''
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Admin APIs
  if (pathname.startsWith('/api/admin')) {
    if (pathname === '/api/admin/login') return NextResponse.next()
    if (pathname === '/api/admin/logout') return NextResponse.next()
    if (!isAdminAuthed(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Orders API: allow public order creation, protect admin listing.
  if (pathname === '/api/orders') {
    if (request.method === 'POST') return NextResponse.next()
    if (!isAdminAuthed(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Products API: allow public reads, protect admin writes.
  if (pathname === '/api/products' || pathname.startsWith('/api/products/')) {
    if (request.method === 'GET') return NextResponse.next()
    if (!isAdminAuthed(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/orders',
    '/api/products',
    '/api/products/:path*',
  ],
}
