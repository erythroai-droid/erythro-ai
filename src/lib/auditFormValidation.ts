import { CONTACT_HONEYPOT_FIELD } from '@/lib/contactHoneypot'
import { toE164Phone } from '@/lib/phoneE164'

export const AUDIT_REPORT_LANGUAGES = ['en', 'ru', 'he'] as const
export type AuditReportLanguage = (typeof AUDIT_REPORT_LANGUAGES)[number]

export type AuditFormValues = {
  website: string
  name: string
  email: string
  phone: string
  auditLanguage: AuditReportLanguage
}

export type AuditField = keyof AuditFormValues
export type AuditFieldError = 'required' | 'invalid' | 'unreachable' | 'platform'
export type AuditFieldErrors = Partial<Record<AuditField, AuditFieldError>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Accepts domain or full URL with optional protocol. */
export const AUDIT_WEBSITE_RE =
  /^(?:https?:\/\/)?(?:[\da-z](?:[\da-z-]{0,61}[\da-z])?\.)+[a-z]{2,}(?:\/[^\s]*)?$/i

/**
 * Social / video / messenger hosts — not a business site we can audit.
 * Match exact host or any subdomain (www.youtube.com, m.facebook.com).
 */
export const AUDIT_PLATFORM_HOST_SUFFIXES = [
  'youtube.com',
  'youtu.be',
  'facebook.com',
  'fb.com',
  'fb.me',
  'instagram.com',
  'tiktok.com',
  'linkedin.com',
  'lnkd.in',
  'twitter.com',
  'x.com',
  't.co',
  'threads.net',
  'pinterest.com',
  'pin.it',
  'reddit.com',
  'vk.com',
  'vk.ru',
  'ok.ru',
  't.me',
  'telegram.me',
  'telegram.org',
  'wa.me',
  'whatsapp.com',
  'snapchat.com',
  'vimeo.com',
  'twitch.tv',
] as const

export function isAuditEmailFormat(raw: string): boolean {
  return EMAIL_RE.test(raw.trim())
}

export function isAuditWebsiteFormat(raw: string): boolean {
  return AUDIT_WEBSITE_RE.test(raw.trim())
}

/** True when hostname is a known social/video/messenger platform. */
export function isAuditPlatformHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '')
  if (!host) return false
  return AUDIT_PLATFORM_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  )
}

/** Parse hostname from a typed website field; empty if format is invalid. */
export function auditWebsiteHostname(raw: string): string | null {
  const normalized = sanitizeAuditWebsite(raw)
  if (!normalized) return null
  try {
    return new URL(normalized).hostname.toLowerCase()
  } catch {
    return null
  }
}

/** http(s) only, no credentials / javascript: — used before DB write. */
export function sanitizeAuditWebsite(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed || !isAuditWebsiteFormat(trimmed)) return ''
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let url: URL
  try {
    url = new URL(withProto)
  } catch {
    return ''
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
  if (url.username || url.password) return ''
  if (!isAuditWebsiteFormat(url.hostname)) return ''
  const path = `${url.pathname}${url.search}`
  const suffix = path === '/' ? '' : path
  return `${url.protocol}//${url.host}${suffix}`
}

export function normalizeAuditWebsite(raw: string): string {
  return sanitizeAuditWebsite(raw)
}

export type ValidateAuditFormOptions = {
  /** Default true. Free audit intake does not collect name/phone. */
  requireNamePhone?: boolean
}

export function validateAuditForm(
  values: AuditFormValues,
  options?: ValidateAuditFormOptions,
): AuditFieldErrors {
  const errors: AuditFieldErrors = {}
  const website = values.website.trim()
  const requireNamePhone = options?.requireNamePhone !== false

  if (!website) errors.website = 'required'
  else if (!isAuditWebsiteFormat(website)) errors.website = 'invalid'
  else {
    const host = auditWebsiteHostname(website)
    if (host && isAuditPlatformHost(host)) errors.website = 'platform'
  }

  if (requireNamePhone && !values.name.trim()) errors.name = 'required'
  if (!values.email.trim()) errors.email = 'required'
  else if (!isAuditEmailFormat(values.email)) errors.email = 'invalid'

  if (requireNamePhone) {
    if (!values.phone.trim()) errors.phone = 'required'
    else if (!toE164Phone(values.phone)) errors.phone = 'invalid'
  }

  if (!values.auditLanguage || !AUDIT_REPORT_LANGUAGES.includes(values.auditLanguage)) {
    errors.auditLanguage = 'required'
  }

  return errors
}

export function hasAuditFieldErrors(errors: AuditFieldErrors): boolean {
  return Object.keys(errors).length > 0
}

export function auditLanguageLabel(language: AuditReportLanguage): string {
  const labels: Record<AuditReportLanguage, string> = {
    en: 'English',
    ru: 'Russian',
    he: 'Hebrew',
  }
  return labels[language]
}

export function buildAuditSubmissionMessage(
  website: string,
  auditLanguage: AuditReportLanguage,
): string {
  const normalized = normalizeAuditWebsite(website)
  return `AI Audit request\nWebsite: ${normalized}\nReport language: ${auditLanguageLabel(auditLanguage)}`
}

export function buildAuditOrderMessage(input: {
  planTitle: string
  planSlug: string
  website: string
  auditLanguage: AuditReportLanguage
  totalFormatted: string
}): string {
  const normalized = normalizeAuditWebsite(input.website)
  return [
    `AI Audit Order: ${input.planTitle}`,
    `Plan: ${input.planTitle} (${input.planSlug})`,
    `Website: ${normalized}`,
    `Report language: ${auditLanguageLabel(input.auditLanguage)}`,
    `Total: ${input.totalFormatted}`,
  ].join('\n')
}

/** JSON body fields shared by /audit and /order audit checkout → POST /api/contact */
export function buildAuditContactPayload(input: {
  values: AuditFormValues
  locale: string
  honeypot: string
  message: string
  planSlug?: string
  planTotal?: string
}) {
  const website = normalizeAuditWebsite(input.values.website)
  return {
    name: input.values.name.trim(),
    email: input.values.email.trim(),
    phone: toE164Phone(input.values.phone) || input.values.phone.trim(),
    message: input.message,
    website,
    auditLanguage: input.values.auditLanguage,
    ...(input.planSlug ? { planSlug: input.planSlug } : {}),
    ...(input.planTotal ? { planTotal: input.planTotal } : {}),
    [CONTACT_HONEYPOT_FIELD]: input.honeypot,
    locale: input.locale,
    privacyConsent: true as const,
    source: 'audit' as const,
  }
}
