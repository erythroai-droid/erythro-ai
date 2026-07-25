import { NextRequest, NextResponse } from 'next/server'

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

/** Site-wide Basic Auth — on when either credential env is set. */
function requireBasicAuth(request: NextRequest): NextResponse | null {
  const user = process.env.BASIC_AUTH_USER?.trim()
  const pass = process.env.BASIC_AUTH_PASSWORD?.trim()

  // Both empty → public. One set without the other → fail closed (401 for everyone).
  if (!user && !pass) return null

  const unauthorized = () =>
    new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Erythro.ai", charset="UTF-8"',
        'Cache-Control': 'no-store',
      },
    })

  if (!user || !pass) return unauthorized()

  const header = request.headers.get('authorization')
  if (header?.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6))
      const colon = decoded.indexOf(':')
      if (colon >= 0) {
        const u = decoded.slice(0, colon)
        const p = decoded.slice(colon + 1)
        if (u === user && p === pass) return null
      }
    } catch {
      // fall through to 401
    }
  }

  return unauthorized()
}

export function middleware(request: NextRequest) {
  const denied = requireBasicAuth(request)
  if (denied) return denied

  const response = NextResponse.next()

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

  return response
}

export const config = {
  // Protect pages + admin + api; skip Next internals, static files, and media
  // proxy paths (even without a file extension in the matcher edge cases).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/media|.*\\..*).*)',
  ],
}
