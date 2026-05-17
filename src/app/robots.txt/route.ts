import { NextResponse } from 'next/server'
import { SITE_CONFIG } from '@/lib/constants'

export async function GET() {
  const base = SITE_CONFIG.url.replace(/\/$/, '')
  const content = `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${base}/sitemap.xml\n`
  return new NextResponse(content, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
