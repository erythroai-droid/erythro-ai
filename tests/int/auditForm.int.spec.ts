import { describe, expect, it } from 'vitest'
import {
  buildAuditSubmissionMessage,
  normalizeAuditWebsite,
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
    ).toEqual({})
  })

  it('normalizes website and builds submission message', () => {
    expect(normalizeAuditWebsite('example.com')).toBe('https://example.com')
    expect(buildAuditSubmissionMessage('https://example.com', 'ru')).toContain('Russian')
    expect(buildAuditSubmissionMessage('https://example.com', 'ru')).toContain('https://example.com')
  })
})
