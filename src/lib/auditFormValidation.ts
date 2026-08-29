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
export type AuditFieldError = 'required' | 'invalid'
export type AuditFieldErrors = Partial<Record<AuditField, AuditFieldError>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Accepts domain or full URL with optional protocol. */
const WEBSITE_RE =
  /^(?:https?:\/\/)?(?:[\da-z](?:[\da-z-]{0,61}[\da-z])?\.)+[a-z]{2,}(?:\/[^\s]*)?$/i

export function normalizeAuditWebsite(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function validateAuditForm(values: AuditFormValues): AuditFieldErrors {
  const errors: AuditFieldErrors = {}
  const website = values.website.trim()

  if (!website) errors.website = 'required'
  else if (!WEBSITE_RE.test(website)) errors.website = 'invalid'

  if (!values.name.trim()) errors.name = 'required'
  if (!values.email.trim()) errors.email = 'required'
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'invalid'

  if (!values.phone.trim()) errors.phone = 'required'

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
