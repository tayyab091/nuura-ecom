import type { Metadata } from 'next'
import { cormorant, dmSans, italiana } from '@/lib/fonts'
import { SITE_CONFIG } from '@/lib/constants'
import QueryProvider from '@/providers/QueryProvider'
import SmoothScrollProvider from '@/providers/SmoothScrollProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AuthModal from '@/components/auth/AuthModal'
import { CustomCursor } from '@/components/shared/CustomCursor'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import './globals.css'

export const metadata: Metadata = {
  title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
  description: SITE_CONFIG.description,
  openGraph: {
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    images: [`${SITE_CONFIG.url}/og-image.png`],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const base = SITE_CONFIG.url.replace(/\/$/, '')
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: base,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${base}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${italiana.variable}`}
    >
      <body>
        <SmoothScrollProvider>
          <QueryProvider>
            <AuthProvider>
              <LoadingScreen />
              <CustomCursor />
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
              {children}
              <AuthModal />
            </AuthProvider>
          </QueryProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  )
}