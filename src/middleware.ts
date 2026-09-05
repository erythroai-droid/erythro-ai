import { NextRequest, NextResponse } from 'next/server'
import { HOMEPAGE_LINK_HEADER } from '@/lib/agentDiscovery'
import { shouldServeMarkdown } from '@/lib/markdownAccept'

/**
 * Edge middleware for markdown negotiation + discovery Link header.
 *
 * Do NOT set NEXT_LOCALE here. A Set-Cookie on the response prevents Vercel/CDN
 * HTML cache (no s-maxage HIT). Locale is applied client-side via bootstrap +
 * useSitePrefs (see PIT-056).
 */
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
