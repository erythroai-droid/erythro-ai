import React from 'react'
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { heebo, inter, interCyrillic, interLatinFamily, robotoMono } from '@/lib/fonts'
import AnalyticsBootstrap from '@/components/AnalyticsBootstrap'
import AnalyticsLoader from '@/components/AnalyticsLoader'
import SkipToContent from '@/components/SkipToContent'
import { isAuditLpLocale, LP_LOCALE_HEADER, type AuditLpLocale } from '@/lib/auditLp'
import { LOCALE_BOOTSTRAP_SCRIPT, THEME_BOOTSTRAP_SCRIPT } from '@/lib/sitePrefs'
import { SPLASH_SKIP_BOOTSTRAP_SCRIPT } from '@/lib/splash'
import { DEFAULT_OG_IMAGE } from '@/lib/ogImages'
import '../(frontend)/styles.css'

/**
 * Separate root layout for ads / AI-audit LPs so SSR can emit the locked
 * `lang` / `dir` without calling `headers()` in the main-site ISR shell (PIT-056).
 * Locale comes from proxy `x-lp-locale` (host or `/lp/audit/…` path).
 */
export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

export const viewport: Viewport = {
  themeColor: '#0d0d0d',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'Erythro.ai',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/favicon/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Erythro.ai' }],
  },
}

async function resolveLpLocale(): Promise<AuditLpLocale> {
  const h = await headers()
  const raw = (h.get(LP_LOCALE_HEADER) || '').toLowerCase()
  return isAuditLpLocale(raw) ? raw : 'en'
}

export default async function AuditLpLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const locale = await resolveLpLocale()
  const dir = locale === 'he' ? 'rtl' : 'ltr'
  const fontVars = [inter.variable, interCyrillic.variable, heebo.variable, robotoMono.variable]
    .filter(Boolean)
    .join(' ')

  return (
    <html
      lang={locale}
      dir={dir}
      data-locale-lock={locale}
      className={fontVars}
      style={{ '--font-inter-latin': interLatinFamily } as React.CSSProperties}
      suppressHydrationWarning
    >
      <head>
        <AnalyticsBootstrap />
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
      </head>
      <body>
        <script
          id="theme-bootstrap"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        <script
          id="locale-bootstrap"
          dangerouslySetInnerHTML={{ __html: LOCALE_BOOTSTRAP_SCRIPT }}
        />
        <script
          id="splash-skip-bootstrap"
          dangerouslySetInnerHTML={{ __html: SPLASH_SKIP_BOOTSTRAP_SCRIPT }}
        />
        <AnalyticsLoader />
        <SkipToContent locale={locale} />
        <main id="main-content">{children}</main>
      </body>
    </html>
  )
}
