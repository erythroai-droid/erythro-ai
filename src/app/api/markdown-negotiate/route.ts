import { NextRequest, NextResponse } from 'next/server'
import {
  generateMarkdownForRoute,
  estimateMarkdownTokens,
  resolveLocale,
} from '@/lib/markdownNegotiation'

export const dynamic = 'force-dynamic'

const SUPPORTED_LOCALES = ['en', 'ru', 'he'] as const

function detectLocaleFromHeader(acceptLanguage: string | null): string {
  if (!acceptLanguage) return 'en'

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, qValue] = part.trim().split(';q=')
      return {
        lang: tag.split('-')[0].toLowerCase(),
        quality: qValue ? parseFloat(qValue) : 1,
      }
    })
    .sort((a, b) => b.quality - a.quality)

  for (const { lang } of ranked) {
    if (SUPPORTED_LOCALES.includes(lang as (typeof SUPPORTED_LOCALES)[number])) {
      return lang
    }
  }

  return 'en'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || '/'

  // Resolve locale: query param -> cookie -> Accept-Language header -> fallback
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  const headerLocale = detectLocaleFromHeader(request.headers.get('accept-language'))
  const locale = resolveLocale(searchParams.get('locale') || cookieLocale || headerLocale)

  const { markdown, status } = await generateMarkdownForRoute(path, locale)
  const tokens = estimateMarkdownTokens(markdown)

  return new NextResponse(markdown, {
    status,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(tokens),
      'Vary': 'Accept, Accept-Language, Cookie',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      'content-signal': 'ai-train=yes, search=yes',
    },
  })
}

export async function HEAD(request: NextRequest) {
  const res = await GET(request)
  return new NextResponse(null, {
    status: res.status,
    headers: res.headers,
  })
}
