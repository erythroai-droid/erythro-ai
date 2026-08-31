import type { ContactFormSource } from '@/lib/contactNotification'
import {
  AUDIT_REPORT_LANGUAGES,
  type AuditReportLanguage,
  normalizeAuditWebsite,
} from '@/lib/auditFormValidation'
import {
  sanitizeEmail,
  sanitizeLocale,
  sanitizeMessage,
  sanitizePhone,
  sanitizePlainText,
} from '@/lib/contactSanitize'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const WEBSITE_RE =
  /^(?:https?:\/\/)?(?:[\da-z](?:[\da-z-]{0,61}[\da-z])?\.)+[a-z]{2,}(?:\/[^\s]*)?$/i
const PLAN_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/i

export const CONTACT_LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  message: 5000,
  website: 500,
  planSlug: 64,
  planTotal: 80,
} as const

export type ContactSubmissionInput = {
  name: string
  email: string
  phone: string
  message: string
  locale?: string
  source: ContactFormSource
  privacyConsent: true
  website?: string
  auditLanguage?: AuditReportLanguage
  planSlug?: string
  planTotal?: string
  auditStatus?: 'new' | 'in_progress' | 'report_sent'
}

export type ContactGuardFailure = {
  ok: false
  status: 400 | 413
  message: string
}

export type ContactGuardSuccess = {
  ok: true
  data: ContactSubmissionInput
}

export type ContactGuardResult = ContactGuardFailure | ContactGuardSuccess

function parseSource(value: unknown): ContactFormSource {
  if (value === 'order') return 'order'
  if (value === 'audit') return 'audit'
  return 'contact'
}

function parseAuditLanguage(value: unknown): AuditReportLanguage | undefined {
  if (typeof value !== 'string') return undefined
  const lang = value.trim().toLowerCase()
  return (AUDIT_REPORT_LANGUAGES as readonly string[]).includes(lang)
    ? (lang as AuditReportLanguage)
    : undefined
}

/**
 * Isolated filter layer for `/api/contact`:
 * sanitize → validate → typed payload (before Payload CMS / SMTP).
 */
export function guardContactSubmission(body: unknown): ContactGuardResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, status: 400, message: 'Invalid JSON' }
  }

  const raw = body as Record<string, unknown>
  const name = sanitizePlainText(raw.name, CONTACT_LIMITS.name)
  const email = sanitizeEmail(raw.email)
  const phone = sanitizePhone(raw.phone)
  const message = sanitizeMessage(raw.message, CONTACT_LIMITS.message)
  const locale = sanitizeLocale(raw.locale)
  const source = parseSource(raw.source)
  const privacyConsent = raw.privacyConsent === true

  if (!privacyConsent) {
    return { ok: false, status: 400, message: 'Privacy consent is required' }
  }
  if (!name || !email || !message) {
    return { ok: false, status: 400, message: 'Missing required fields' }
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, status: 400, message: 'Invalid email' }
  }
  if (typeof raw.message === 'string' && raw.message.length > CONTACT_LIMITS.message * 2) {
    // Reject obviously oversized payloads before they hit CMS/mail.
    return { ok: false, status: 413, message: 'Message too long' }
  }
  if (message.length > CONTACT_LIMITS.message) {
    return { ok: false, status: 413, message: 'Message too long' }
  }

  const data: ContactSubmissionInput = {
    name,
    email,
    phone,
    message,
    locale,
    source,
    privacyConsent: true,
  }

  if (source === 'audit') {
    const websiteRaw = sanitizePlainText(raw.website, CONTACT_LIMITS.website)
    const auditLanguage = parseAuditLanguage(raw.auditLanguage)
    const planSlug = sanitizePlainText(raw.planSlug, CONTACT_LIMITS.planSlug).toLowerCase()
    const planTotal = sanitizePlainText(raw.planTotal, CONTACT_LIMITS.planTotal)

    if (!websiteRaw || !WEBSITE_RE.test(websiteRaw)) {
      return { ok: false, status: 400, message: 'Valid website is required for audit' }
    }
    if (!auditLanguage) {
      return { ok: false, status: 400, message: 'Audit report language is required' }
    }
    if (planSlug && !PLAN_SLUG_RE.test(planSlug)) {
      return { ok: false, status: 400, message: 'Invalid plan' }
    }

    data.website = normalizeAuditWebsite(websiteRaw)
    data.auditLanguage = auditLanguage
    data.auditStatus = 'new'
    if (planSlug) data.planSlug = planSlug
    if (planTotal) data.planTotal = planTotal
  }

  return { ok: true, data }
}
