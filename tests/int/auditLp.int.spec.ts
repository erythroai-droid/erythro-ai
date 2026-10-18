import { describe, expect, it } from 'vitest'
import {
  AUDIT_LP_HOST_BY_LOCALE,
  auditLpCanonicalUrl,
  auditLpLocaleFromHost,
  auditLpLocaleFromPathname,
  isAuditLpHost,
  mainSiteUrl,
} from '@/lib/auditLp'

describe('audit LP host / path lock', () => {
  it('maps production hosts to fixed locales', () => {
    expect(auditLpLocaleFromHost('audit-rus.erythro.ai')).toBe('ru')
    expect(auditLpLocaleFromHost('audit-ru.erythro.ai')).toBe('ru')
    expect(auditLpLocaleFromHost('AUDIT-EN.erythro.ai')).toBe('en')
    expect(auditLpLocaleFromHost('audit-he.erythro.ai:443')).toBe('he')
    expect(auditLpLocaleFromHost('erythro.ai')).toBeNull()
    expect(isAuditLpHost(AUDIT_LP_HOST_BY_LOCALE.ru)).toBe(true)
    expect(AUDIT_LP_HOST_BY_LOCALE.ru).toBe('audit-rus.erythro.ai')
  })

  it('locks locale from /lp/audit/{locale} path (local preview)', () => {
    expect(auditLpLocaleFromPathname('/lp/audit/ru')).toBe('ru')
    expect(auditLpLocaleFromPathname('/lp/audit/he/')).toBe('he')
    expect(auditLpLocaleFromPathname('/audit')).toBeNull()
  })

  it('builds canonical LP and main-site URLs', () => {
    expect(auditLpCanonicalUrl('ru')).toBe('https://audit-rus.erythro.ai/')
    expect(mainSiteUrl('/privacy')).toBe('https://erythro.ai/privacy')
    expect(mainSiteUrl('/audit/report/1?k=abc')).toContain('https://erythro.ai/audit/report/1?k=abc')
  })
})
