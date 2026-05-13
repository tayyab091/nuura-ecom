export const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL ?? 'admin@nuura.pk',
  password: process.env.ADMIN_PASSWORD ?? 'nuura2025',
}

export function isAdminRequest(request: Request): boolean {
  const adminKey = request.headers.get('x-admin-key')
  return adminKey === process.env.ADMIN_SECRET_KEY
}

export function isAdminAuthed(request: Request): boolean {
  const secretKey = process.env.ADMIN_SECRET_KEY ?? 'nuura-admin-secret-key-2025'

  // Header-based auth (useful for server-to-server tools).
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey && adminKey === secretKey) return true

  // Cookie-based auth (used by the admin UI).
  const cookie = request.headers.get('cookie') ?? ''
  const match = cookie.match(/(?:^|;\s*)nuura-admin-token=([^;]+)/)
  const token = match?.[1]
  if (!token) return false

  try {
    return decodeURIComponent(token) === secretKey
  } catch {
    return token === secretKey
  }
}
