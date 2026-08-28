import { NextRequest, NextResponse } from 'next/server'
import { HOMEPAGE_LINK_HEADER } from '@/lib/agentDiscovery'
import { shouldServeMarkdown } from '@/lib/markdownNegotiation'

const SUPPORTED_LOCALES = ['en', 'ru', 'he'] as const
const DEFAULT_LOCALE = 'en'
export const LOCALE_COOKIE = 'NEXT_LOCALE'

// Parse the Accept-Language header and return the best matching supported locale.
function detectLocaleFromHeader(acceptLanguage: string | null): string {
  if (!acceptLanguage) return DEFAULT_LOCALE

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

  return DEFAULT_LOCALE
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const wantsMarkdown =
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/admin') &&
    shouldServeMarkdown(request.headers.get('accept'))

  let response: NextResponse
  if (wantsMarkdown) {
    const url = request.nextUrl.clone()
    url.pathname = '/api/markdown-negotiate'
    url.searchParams.set('path', pathname)
    response = NextResponse.rewrite(url)
  } else {
    response = NextResponse.next()
  }

  const existing = request.cookies.get(LOCALE_COOKIE)?.value

  // Only set the cookie when it is missing or invalid, so an explicit user
  // choice (set on the client) is never overwritten.
  if (!existing || !SUPPORTED_LOCALES.includes(existing as (typeof SUPPORTED_LOCALES)[number])) {
    const locale = detectLocaleFromHeader(request.headers.get('accept-language'))
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    })
  }

  // RFC 8288 / RFC 9727 — advertise machine-readable discovery on the homepage.
  if (pathname === '/') {
    response.headers.set('Link', HOMEPAGE_LINK_HEADER)
  }

  return response
}

export const config = {
  // Skip Next internals, static files, and media proxy paths.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/media|.*\\..*).*)',
  ],
}
