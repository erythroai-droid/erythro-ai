import { describe, expect, it } from 'vitest'
import {
  buildAuditSubmissionMessage,
  normalizeAuditWebsite,
  sanitizeAuditWebsite,
  validateAuditForm,
} from '@/lib/auditFormValidation'

describe('auditFormValidation', () => {
  it('validates required fields and website format', () => {
    expect(validateAuditForm({ website: '', name: '', email: '', phone: '', auditLanguage: 'en' })).toEqual({
      website: 'required',
      name: 'required',
      email: 'required',
      phone: 'required',
    })

    expect(
      validateAuditForm({
        website: 'not a url',
        name: 'Ada',
        email: 'bad',
        phone: '',
        auditLanguage: 'en',
      }),
    ).toEqual({
      website: 'invalid',
      email: 'invalid',
      phone: 'required',
    })

    expect(
      validateAuditForm({
        website: 'example.com',
        name: 'Ada',
        email: 'ada@example.com',
        phone: '+1',
        auditLanguage: 'ru',
      }),
    ).toEqual({
      phone: 'invalid',
    })

    expect(
      validateAuditForm({
        website: 'example.com',
        name: 'Ada',
        email: 'ada@example.com',
        phone: '+972501234567',
        auditLanguage: 'ru',
      }),
    ).toEqual({})
  })

  it('normalizes website and builds submission message', () => {
    expect(normalizeAuditWebsite('example.com')).toBe('https://example.com')
    expect(normalizeAuditWebsite('https://example.com/path')).toBe('https://example.com/path')
    expect(buildAuditSubmissionMessage('https://example.com', 'ru')).toContain('Russian')
    expect(buildAuditSubmissionMessage('https://example.com', 'ru')).toContain('https://example.com')
  })

  it('drops credentials and non-http website URLs', () => {
    expect(sanitizeAuditWebsite('javascript:example.com')).toBe('')
    expect(sanitizeAuditWebsite('https://user:pass@example.com')).toBe('')
    expect(sanitizeAuditWebsite('ftp://example.com')).toBe('')
  })
})
