import type { Metadata } from 'next'
import { cormorant, dmSans, italiana } from '@/lib/fonts'
import { SITE_CONFIG } from '@/lib/constants'
import QueryProvider from '@/providers/QueryProvider'
import SmoothScrollProvider from '@/providers/SmoothScrollProvider'
import { CustomCursor } from '@/components/shared/CustomCursor'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import IntelligentChat from '@/components/shared/IntelligentChat'
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${italiana.variable}`}
    >
      <body>
        <SmoothScrollProvider>
          <QueryProvider>
            <LoadingScreen />
            <CustomCursor />
            {children}
            <IntelligentChat />
          </QueryProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  )
}