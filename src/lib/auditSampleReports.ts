import { tLocale, type LocaleMap } from '@/lib/orderPlans'

export const AUDIT_SAMPLE_REPORT_TIERS = {
  'audit-free': 'free',
  'audit-diagnostic': 'diagnostic',
  'audit-pro': 'pro',
} as const

export type AuditSampleTier =
  (typeof AUDIT_SAMPLE_REPORT_TIERS)[keyof typeof AUDIT_SAMPLE_REPORT_TIERS]

export const AUDIT_SAMPLE_REPORT_LOCALES = ['en', 'ru', 'he'] as const
export type AuditSampleLocale = (typeof AUDIT_SAMPLE_REPORT_LOCALES)[number]

export const AUDIT_SAMPLE_REPORT_LABEL: LocaleMap = {
  en: 'View sample HTML report',
  ru: 'Смотреть пример HTML-отчёта',
  he: 'צפו בדוגמת דוח HTML',
}

function isAuditSampleLocale(value: string): value is AuditSampleLocale {
  return AUDIT_SAMPLE_REPORT_LOCALES.includes(value as AuditSampleLocale)
}

export function auditSampleTierFromSlug(slug: string): AuditSampleTier | null {
  return AUDIT_SAMPLE_REPORT_TIERS[slug as keyof typeof AUDIT_SAMPLE_REPORT_TIERS] ?? null
}

/** Sample HTML for this audit plan in the active UI locale (EN / RU / HE). */
export function auditSampleReportHref(slug: string, locale: string): string | null {
  const tier = auditSampleTierFromSlug(slug)
  if (!tier) return null
  const lang: AuditSampleLocale = isAuditSampleLocale(locale) ? locale : 'en'
  return `/samples/audit/${tier}-${lang}.html`
}

export function auditSampleReportLabel(locale: string): string {
  return tLocale(AUDIT_SAMPLE_REPORT_LABEL, locale)
}
