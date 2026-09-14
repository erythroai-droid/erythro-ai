const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

/** Host header / forwarded host without port. */
export function normalizeHost(host: string | null | undefined): string {
  return (host || '').split(',')[0]!.trim().split(':')[0]!.toLowerCase()
}

/** Preview, production alias, and hashed `*.vercel.app` deployment URLs. */
export function isVercelAppHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host)
  return h === 'vercel.app' || h.endsWith('.vercel.app')
}

export function requestHost(headers: {
  get(name: string): string | null
}, fallbackHostname?: string): string {
  return normalizeHost(
    headers.get('x-forwarded-host') || headers.get('host') || fallbackHostname || '',
  )
}

/**
 * Production `*.vercel.app` aliases duplicate https://erythro.ai.
 * Previews stay on their Vercel URL (SSO) but still get noindex.
 */
export function shouldRedirectVercelAppToCanonical(
  host: string | null | undefined,
  env: string | undefined = process.env.VERCEL_ENV,
): boolean {
  return env === 'production' && isVercelAppHost(host)
}

const SKIP_VERCEL_REDIRECT_PATHS = new Set(['/robots.txt'])

export function shouldSkipVercelAppRedirect(pathname: string): boolean {
  if (SKIP_VERCEL_REDIRECT_PATHS.has(pathname)) return true
  if (pathname.startsWith('/api/')) return true
  return false
}

export function canonicalSiteOrigin(): string {
  return SITE_URL.replace(/\/+$/, '')
}

export function canonicalUrlForPath(pathname: string, search = ''): string {
  const origin = canonicalSiteOrigin()
  if (pathname === '/' || pathname === '') return `${origin}${search}`
  return `${origin}${pathname}${search}`
}
