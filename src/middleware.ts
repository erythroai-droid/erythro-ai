import { NextRequest, NextResponse } from 'next/server'
import { HOMEPAGE_LINK_HEADER } from '@/lib/agentDiscovery'
import { auditLpInternalPath, auditLpTargetFromHost } from '@/lib/auditLp'
import { shouldServeMarkdown } from '@/lib/markdownAccept'
import {
  canonicalUrlForPath,
  isVercelAppHost,
  requestHost,
  shouldRedirectVercelAppToCanonical,
  shouldSkipVercelAppRedirect,
} from '@/lib/vercelHost'

/**
 * Edge middleware for markdown negotiation + discovery Link header.
 *
 * Do NOT set NEXT_LOCALE here. A Set-Cookie on the response prevents Vercel/CDN
 * HTML cache (no s-maxage HIT). Locale is applied client-side via bootstrap +
 * useSitePrefs (see PIT-056). Ads audit LPs lock locale from the host instead.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const host = requestHost(request.headers, request.nextUrl.hostname)
  const auditLp = auditLpTargetFromHost(host)

  // Ads Final URLs: audit[-pro|-diag]-{locale}.erythro.ai → /lp/audit[/pro|/diagnostic]/{locale}
  // (URL bar stays on the subdomain; no Set-Cookie).
  if (auditLp) {
    const internalPath = auditLpInternalPath(auditLp.product, auditLp.locale)
    const isRoot = pathname === '/' || pathname === ''
    const alreadyLp = pathname === internalPath || pathname.startsWith(`${internalPath}/`)

    let response: NextResponse
    if (isRoot) {
      const url = request.nextUrl.clone()
      url.pathname = internalPath
      response = NextResponse.rewrite(url)
    } else if (alreadyLp || pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
      response = NextResponse.next()
    } else {
      // Keep API/static on this host; send the rest to the main site.
      const location = canonicalUrlForPath(pathname, request.nextUrl.search)
      response = NextResponse.redirect(location, 308)
    }

    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.headers.delete('x-powered-by')
    return response
  }

  if (isVercelAppHost(host)) {
    if (
      shouldRedirectVercelAppToCanonical(host) &&
      !shouldSkipVercelAppRedirect(pathname)
    ) {
      const location = canonicalUrlForPath(pathname, request.nextUrl.search)
      const redirect = NextResponse.redirect(location, 308)
      redirect.headers.set('X-Robots-Tag', 'noindex, nofollow')
      redirect.headers.delete('x-powered-by')
      return redirect
    }
  }

  // Ads traffic hitting /audit with campaign tags → free LP subdomain.
  // Do NOT redirect on bare `?lang=` — LP “see all packages” links use
  // https://erythro.ai/audit?lang=… and must stay on the main pricing page.
  if (pathname === '/audit' || pathname === '/audit/') {
    const campaign = (request.nextUrl.searchParams.get('utm_campaign') || '').toLowerCase()
    if (campaign) {
      const lang = (request.nextUrl.searchParams.get('lang') || '').toLowerCase()
      let targetLocale: 'ru' | 'en' | 'he' | null = null
      if (campaign.includes('_ru') || campaign.endsWith('ru') || lang === 'ru') {
        targetLocale = 'ru'
      } else if (campaign.includes('_en') || campaign.endsWith('en') || lang === 'en') {
        targetLocale = 'en'
      } else if (campaign.includes('_he') || campaign.endsWith('he') || lang === 'he') {
        targetLocale = 'he'
      }
      if (targetLocale) {
        const targetUrl = new URL(`https://audit-${targetLocale}.erythro.ai/`)
        targetUrl.search = request.nextUrl.search
        const redirect = NextResponse.redirect(targetUrl, 307)
        redirect.headers.set('X-Robots-Tag', 'noindex, nofollow')
        redirect.headers.delete('x-powered-by')
        return redirect
      }
    }
  }

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

  if (isVercelAppHost(host)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  // RFC 8288 / RFC 9727 — advertise machine-readable discovery on the homepage.
  if (pathname === '/') {
    response.headers.set('Link', HOMEPAGE_LINK_HEADER)
  }

  // Defense in depth with next.config poweredByHeader:false (Payload may re-add).
  response.headers.delete('x-powered-by')

  return response
}

export const config = {
  // Skip Next internals, static files, and media proxy paths.
  // Keep robots.txt + sitemap.xml so *.vercel.app can noindex / redirect them.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/media|.*\\..*).*)',
    '/robots.txt',
    '/sitemap.xml',
  ],
}
