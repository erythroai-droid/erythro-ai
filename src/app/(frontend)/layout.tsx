import React from 'react'
import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { getCachedSeoSettings } from '@/lib/getSiteContent'
import Script from 'next/script'
import { heebo, inter, robotoMono } from '@/lib/fonts'
import SplashHost from '@/components/SplashHost'
import NavigationTopLoader from '@/components/NavigationTopLoader'
import './styles.css'

const SUPPORTED_LOCALES = ['en', 'ru', 'he'] as const
type Locale = (typeof SUPPORTED_LOCALES)[number]

const SITE_NAME = 'Erythro.ai'
const SITE_TITLE = 'Erythro.ai - digital agency'

// Used to resolve absolute URLs for Open Graph / canonical. Override in prod
// via NEXT_PUBLIC_SITE_URL (e.g. https://erythro.ai).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

const DESCRIPTIONS: Record<Locale, string> = {
  en: 'Erythro.ai is a digital agency building high-performance websites, brand identity, and AI automation — from strategy to launch.',
  ru: 'Erythro.ai — цифровое агентство: высокопроизводительные сайты, брендинг и AI-автоматизация бизнес-процессов. От стратегии до запуска.',
  he: 'Erythro.ai היא סוכנות דיגיטל לבניית אתרים בעלי ביצועים גבוהים, מיתוג ואוטומציה מבוססת בינה מלאכותית — מאסטרטגיה ועד השקה.',
}

const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  ru: 'ru_RU',
  he: 'he_IL',
}

const KEYWORDS = [
  'Erythro.ai',
  'digital agency',
  'web development',
  'web design',
  'branding',
  'AI automation',
  'AI agents',
  'Next.js',
  'UI/UX',
]

function resolveLocale(value?: string): Locale {
  return value && SUPPORTED_LOCALES.includes(value as Locale) ? (value as Locale) : 'en'
}

export const viewport: Viewport = {
  themeColor: '#0d0d0d',
  width: 'device-width',
  initialScale: 1,
}

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const locale = resolveLocale(cookieStore.get('NEXT_LOCALE')?.value)

  // SEO is editable from the Payload "Site Settings" global; fall back to
  // the static values below when a field is left empty (or DB is unavailable).
  const seo = await getCachedSeoSettings()
  const title = seo.title || SITE_TITLE
  const description = seo.description?.[locale] || DESCRIPTIONS[locale]
  const ogImage = seo.ogImage || '/images/og-image.png'

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    applicationName: SITE_NAME,
    keywords: KEYWORDS,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical: '/',
    },
    manifest: '/images/favicon/site.webmanifest',
    icons: {
      icon: [
        { url: '/images/favicon/favicon.ico', sizes: 'any' },
        { url: '/images/favicon/favicon_32x32.svg', type: 'image/svg+xml' },
        { url: '/images/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/images/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [{ url: '/images/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url: '/',
      locale: OG_LOCALE[locale],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    verification: {
      google: 'YPeQiGKCZE7HbtVPrL9NhkfiYe01eJ4FXheHGa93sAY',
    },
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const cookieStore = await cookies()
  const locale = resolveLocale(cookieStore.get('NEXT_LOCALE')?.value)

  return (
    <html
      lang={locale}
      dir={locale === 'he' ? 'rtl' : 'ltr'}
      className={`${inter.variable} ${heebo.variable} ${robotoMono.variable}`}
    >
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-F3BTVWGDRS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-F3BTVWGDRS');
          `}
        </Script>
        <SplashHost />
        <NavigationTopLoader />
        <main>{children}</main>
      </body>
    </html>
  )
}
