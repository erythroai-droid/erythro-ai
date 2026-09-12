import { describe, expect, it } from 'vitest'
import {
  AUDIT_SAMPLE_REPORT_LABEL,
  AUDIT_SAMPLE_REPORT_LOCALES,
  AUDIT_SAMPLE_REPORT_TIERS,
  auditSampleReportHref,
  auditSampleReportLabel,
  auditSampleTierFromSlug,
} from '@/lib/auditSampleReports'

describe('auditSampleReportHref', () => {
  it('maps each audit plan slug to the sample in the active locale', () => {
    expect(auditSampleReportHref('audit-free', 'en')).toBe('/samples/audit/free-en.html')
    expect(auditSampleReportHref('audit-diagnostic', 'ru')).toBe(
      '/samples/audit/diagnostic-ru.html',
    )
    expect(auditSampleReportHref('audit-pro', 'he')).toBe('/samples/audit/pro-he.html')
  })

  it('falls back to English when the locale is unknown', () => {
    expect(auditSampleReportHref('audit-free', 'de')).toBe('/samples/audit/free-en.html')
  })

  it('returns null for non-audit plans', () => {
    expect(auditSampleReportHref('ai-business-card', 'en')).toBeNull()
    expect(auditSampleTierFromSlug('enterprise-custom')).toBeNull()
  })
})

describe('auditSampleReportLabel', () => {
  it('has EN / RU / HE copy', () => {
    expect(AUDIT_SAMPLE_REPORT_LABEL.en).toBeTruthy()
    expect(AUDIT_SAMPLE_REPORT_LABEL.ru).toBeTruthy()
    expect(AUDIT_SAMPLE_REPORT_LABEL.he).toBeTruthy()
    expect(auditSampleReportLabel('ru')).toBe(AUDIT_SAMPLE_REPORT_LABEL.ru)
    expect(auditSampleReportLabel('he')).toBe(AUDIT_SAMPLE_REPORT_LABEL.he)
    expect(auditSampleReportLabel('en')).toBe(AUDIT_SAMPLE_REPORT_LABEL.en)
  })
})

describe('sample HTML files', () => {
  it('ships one rewritten report per tier and locale', async () => {
    const { readFile } = await import('node:fs/promises')
    const path = await import('node:path')
    const root = process.cwd()

    for (const [slug, tier] of Object.entries(AUDIT_SAMPLE_REPORT_TIERS)) {
      for (const locale of AUDIT_SAMPLE_REPORT_LOCALES) {
        const href = auditSampleReportHref(slug, locale)
        expect(href).toBe(`/samples/audit/${tier}-${locale}.html`)
        const html = await readFile(path.join(root, 'public', href!.slice(1)), 'utf8')
        expect(html).toContain(`class="report-a4-4 tier-${tier}`)
        expect(html).toMatch(new RegExp(`<html lang="${locale}"`))
        expect(html).toContain('/templates/figma-assets/')
        expect(html).not.toContain('../../templates/figma-assets/')
      }
    }
  })
})
