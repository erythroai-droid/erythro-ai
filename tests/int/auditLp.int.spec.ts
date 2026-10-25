import { describe, expect, it } from 'vitest'
import {
  AUDIT_LP_HOST_BY_LOCALE,
  AUDIT_LP_HOSTS_BY_PRODUCT,
  auditLpCanonicalUrl,
  auditLpInternalPath,
  auditLpLocaleFromHost,
  auditLpLocaleFromPathname,
  auditLpPlanSlug,
  auditLpTargetFromHost,
  auditLpTargetFromPathname,
  isAuditLpHost,
  mainSiteUrl,
} from '@/lib/auditLp'

describe('audit LP host / path lock', () => {
  it('maps production hosts to fixed locales (free)', () => {
    expect(auditLpLocaleFromHost('audit-rus.erythro.ai')).toBe('ru')
    expect(auditLpLocaleFromHost('audit-ru.erythro.ai')).toBe('ru')
    expect(auditLpLocaleFromHost('AUDIT-EN.erythro.ai')).toBe('en')
    expect(auditLpLocaleFromHost('audit-he.erythro.ai:443')).toBe('he')
    expect(auditLpLocaleFromHost('erythro.ai')).toBeNull()
    expect(isAuditLpHost(AUDIT_LP_HOST_BY_LOCALE.ru)).toBe(true)
    expect(AUDIT_LP_HOST_BY_LOCALE.ru).toBe('audit-ru.erythro.ai')
  })

  it('maps pro / diagnostic hosts before free labels', () => {
    expect(auditLpTargetFromHost('audit-pro-en.erythro.ai')).toEqual({
      product: 'pro',
      locale: 'en',
    })
    expect(auditLpTargetFromHost('audit-pro-ru.erythro.ai')).toEqual({
      product: 'pro',
      locale: 'ru',
    })
    expect(auditLpTargetFromHost('audit-diag-he.erythro.ai')).toEqual({
      product: 'diagnostic',
      locale: 'he',
    })
    expect(AUDIT_LP_HOSTS_BY_PRODUCT.pro.ru).toBe('audit-pro-ru.erythro.ai')
    expect(AUDIT_LP_HOSTS_BY_PRODUCT.diagnostic.en).toBe('audit-diag-en.erythro.ai')
  })

  it('locks locale from /lp/audit/{locale} and paid product paths', () => {
    expect(auditLpLocaleFromPathname('/lp/audit/ru')).toBe('ru')
    expect(auditLpLocaleFromPathname('/lp/audit/he/')).toBe('he')
    expect(auditLpTargetFromPathname('/lp/audit/pro/en')).toEqual({
      product: 'pro',
      locale: 'en',
    })
    expect(auditLpTargetFromPathname('/lp/audit/diagnostic/ru')).toEqual({
      product: 'diagnostic',
      locale: 'ru',
    })
    expect(auditLpLocaleFromPathname('/audit')).toBeNull()
    expect(auditLpTargetFromPathname('/lp/audit/pro')).toBeNull()
  })

  it('builds internal paths and canonical LP URLs', () => {
    expect(auditLpInternalPath('free', 'ru')).toBe('/lp/audit/ru')
    expect(auditLpInternalPath('pro', 'en')).toBe('/lp/audit/pro/en')
    expect(auditLpInternalPath('diagnostic', 'he')).toBe('/lp/audit/diagnostic/he')
    expect(auditLpCanonicalUrl('ru')).toBe('https://audit-ru.erythro.ai/')
    expect(auditLpCanonicalUrl('ru', 'pro')).toBe('https://audit-pro-ru.erythro.ai/')
    expect(auditLpCanonicalUrl('en', 'diagnostic')).toBe('https://audit-diag-en.erythro.ai/')
    expect(mainSiteUrl('/privacy')).toBe('https://erythro.ai/privacy')
    expect(mainSiteUrl('/audit/report/1?k=abc')).toContain('https://erythro.ai/audit/report/1?k=abc')
  })

  it('maps paid products to Grow plan slugs', () => {
    expect(auditLpPlanSlug('pro')).toBe('audit-pro')
    expect(auditLpPlanSlug('diagnostic')).toBe('audit-diagnostic')
  })
})
