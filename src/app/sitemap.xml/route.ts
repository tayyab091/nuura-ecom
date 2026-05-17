import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import { SITE_CONFIG, PRODUCT_CATEGORIES } from '@/lib/constants'

export async function GET() {
  try {
    await connectDB({ maxWaitMS: 8000 })
    const products = await Product.find({}).lean().limit(500)
    const base = SITE_CONFIG.url.replace(/\/$/, '')

    const urls = [
      `${base}/`,
      `${base}/shop`,
    ]

    for (const cat of PRODUCT_CATEGORIES) {
      urls.push(`${base}/shop?category=${encodeURIComponent(cat.slug)}`)
    }

    for (const p of products) {
      if (p?.slug) urls.push(`${base}/product/${p.slug}`)
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `<url><loc>${u}</loc></url>`)
      .join('\n')}\n</urlset>`

    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml' },
    })
  } catch (err) {
    console.error('Sitemap generation failed:', err)
    return new NextResponse('Sitemap generation failed', { status: 500 })
  }
}
