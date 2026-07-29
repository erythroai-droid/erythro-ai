export const CONSENT_COOKIE = 'cookie_consent'
export const CONSENT_ACCEPTED = 'accepted'
export const CONSENT_DECLINED = 'declined'
export const CONSENT_EVENT = 'erythro:cookie-consent-changed'
export const CONSENT_OPEN_EVENT = 'erythro:cookie-consent-open'

export type ConsentValue = typeof CONSENT_ACCEPTED | typeof CONSENT_DECLINED

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=')
  return value ? decodeURIComponent(value) : null
}

export function getConsentValue(): ConsentValue | null {
  const value = readCookie(CONSENT_COOKIE)
  return value === CONSENT_ACCEPTED || value === CONSENT_DECLINED ? value : null
}

export function hasAcceptedConsent(): boolean {
  return getConsentValue() === CONSENT_ACCEPTED
}

export function setConsentValue(value: ConsentValue) {
  if (typeof document === 'undefined') return
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }))
}

export function openConsentSettings() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))
}

function expireCookie(name: string, domain?: string) {
  if (typeof document === 'undefined') return
  const domainPart = domain ? `; domain=${domain}` : ''
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax${domainPart}`
}

export function clearAnalyticsCookies() {
  if (typeof document === 'undefined') return
  const host = window.location.hostname
  const domainParts = host.split('.')
  const domains = new Set<string | undefined>([undefined, host])

  if (domainParts.length >= 2) {
    domains.add(`.${domainParts.slice(-2).join('.')}`)
  }

  for (const domain of domains) {
    expireCookie('_ga', domain)
    expireCookie('_gid', domain)
    expireCookie('_gat', domain)
    expireCookie('_ga_F3BTVWGDRS', domain)
  }
}
