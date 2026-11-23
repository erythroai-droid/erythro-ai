import { NextRequest, NextResponse } from 'next/server'
import { HOMEPAGE_LINK_HEADER } from '@/lib/agentDiscovery'
import {
  LP_LOCALE_HEADER,
  auditLpInternalPath,
  auditLpLocaleFromPathname,
  auditLpTargetFromHost,
  auditLpTargetFromPathname,
  isIndexableAuditLpProduct,
  leakLpInternalPath,
  leakLpLocaleFromHost,
  leakLpLocaleFromPathname,
  type AuditLpLocale,
} from '@/lib/auditLp'
import { shouldServeMarkdown } from '@/lib/markdownAccept'
import {
  canonicalUrlForPath,
  isVercelAppHost,
  requestHost,
  shouldRedirectVercelAppToCanonical,
  shouldSkipVercelAppRedirect,
} from '@/lib/vercelHost'

function withLpLocale(request: NextRequest, locale: AuditLpLocale): Headers {
  const headers = new Headers(request.headers)
  headers.set(LP_LOCALE_HEADER, locale)
  return headers
}

function isAuditLpInternalPath(pathname: string): boolean {
  return (
    auditLpTargetFromPathname(pathname) != null || leakLpLocaleFromPathname(pathname) != null
  )
}

/**
 * Proxy (Next 16 name for middleware; runs on the Node.js runtime) for markdown negotiation
 * + discovery Link header + audit LP host rewrites.
 *
 * Do NOT set NEXT_LOCALE here. A Set-Cookie on the response prevents Vercel/CDN
 * HTML cache (no s-maxage HIT). Locale is applied client-side via bootstrap +
 * useSitePrefs (see PIT-056). Ads audit LPs lock locale from the host instead
 * (and SSR `lang`/`dir` via `x-lp-locale` on the dedicated LP layout).
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const host = requestHost(request.headers, request.nextUrl.hostname)
  const auditLp = auditLpTargetFromHost(host)
  const leakLpLocale = auditLp ? null : leakLpLocaleFromHost(host)

  // Ads Final URLs: audit[-pro|-diag]-{locale}.erythro.ai → /lp/audit[/pro|/diagnostic]/{locale};
  // AI-audit landing: ai-audit-{locale}.erythro.ai → /lp/audit/leak/{locale}
  // (URL bar stays on the subdomain; no Set-Cookie).
  if (auditLp || leakLpLocale) {
    const locale: AuditLpLocale = auditLp?.locale ?? leakLpLocale!
    const internalPath = auditLp
      ? auditLpInternalPath(auditLp.product, auditLp.locale)
      : leakLpInternalPath(leakLpLocale!)
    const isRoot = pathname === '/' || pathname === ''
    const alreadyLp = pathname === internalPath || pathname.startsWith(`${internalPath}/`)
    const requestHeaders = withLpLocale(request, locale)

    let response: NextResponse
    if (isRoot) {
      const url = request.nextUrl.clone()
      url.pathname = internalPath
      response = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    } else if (alreadyLp || pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
      response = NextResponse.next({ request: { headers: requestHeaders } })
    } else {
      // Keep API/static on this host; send the rest to the main site.
      const location = canonicalUrlForPath(pathname, request.nextUrl.search)
      response = NextResponse.redirect(location, 308)
    }

    // Indexable as separate pages: free (audit-*), calc (leak-*), AI-audit (ai-audit-*).
    // Pro / diagnostic stay noindex. Redirects off these hosts always noindex.
    const product = auditLp?.product ?? (leakLpLocale ? 'leak' : null)
    const indexablePage =
      isIndexableAuditLpProduct(product) && (isRoot || alreadyLp) && response.status < 300
    if (!indexablePage) response.headers.set('X-Robots-Tag', 'noindex, nofollow')
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

  const pathLocale = auditLpLocaleFromPathname(pathname)
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
  } else if (pathLocale) {
    // Internal `/lp/audit/…` on the apex: lock SSR locale, but keep noindex so
    // these paths do not compete with organic `/audit` or the subdomain canons.
    response = NextResponse.next({
      request: { headers: withLpLocale(request, pathLocale) },
    })
  } else {
    response = NextResponse.next()
  }

  if (isVercelAppHost(host) || isAuditLpInternalPath(pathname)) {
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
