import { describe, expect, it, beforeEach } from 'vitest'
import { createElement } from 'react'
import { render } from '@testing-library/react'
import {
  sanitizeEmail,
  sanitizeMessage,
  sanitizePhone,
  sanitizePlainText,
} from '@/lib/contactSanitize'
import {
  consumeContactRateLimit,
  getRequestIp,
  resetContactRateLimitStoreForTests,
} from '@/lib/contactRateLimit'
import { guardContactSubmission } from '@/lib/contactSubmissionGuard'
import { CONTACT_HONEYPOT_FIELD, isContactHoneypotTriggered } from '@/lib/contactHoneypot'
import { ContactHoneypotField } from '@/components/ContactHoneypotField'

describe('contactSanitize', () => {
  it('strips html and scripts from plain text', () => {
    expect(sanitizePlainText('<b>Hi</b> <script>alert(1)</script>', 120)).toBe('Hi alert(1)')
    expect(sanitizePlainText('javascript:alert(1)', 120)).toBe('alert(1)')
  })

  it('keeps newlines in messages but collapses excess blank lines', () => {
    const out = sanitizeMessage('Hello\n\n\n\nWorld<script>', 5000)
    expect(out).toBe('Hello\n\nWorld')
  })

  it('normalizes email and phone', () => {
    expect(sanitizeEmail('  Foo.Bar+1@Example.COM ')).toBe('foo.bar+1@example.com')
    expect(sanitizePhone('+972 (50) 931-2746<script>')).toBe('+972 (50) 931-2746')
  })
})

describe('guardContactSubmission', () => {
  it('accepts a clean payload', () => {
    const result = guardContactSubmission({
      name: 'Ada',
      email: 'ada@example.com',
      phone: '',
      message: 'Hello',
      privacyConsent: true,
      source: 'contact',
      locale: 'en',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.email).toBe('ada@example.com')
      expect(result.data.source).toBe('contact')
    }
  })

  it('sanitizes before accepting', () => {
    const result = guardContactSubmission({
      name: '<img src=x onerror=alert(1)>Ada',
      email: 'ADA@EXAMPLE.COM',
      message: 'Need <b>help</b>',
      privacyConsent: true,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.name).toBe('Ada')
      expect(result.data.message).toBe('Need help')
    }
  })

  it('rejects missing consent and invalid email', () => {
    expect(
      guardContactSubmission({
        name: 'Ada',
        email: 'ada@example.com',
        message: 'Hi',
        privacyConsent: false,
      }).ok,
    ).toBe(false)
    expect(
      guardContactSubmission({
        name: 'Ada',
        email: 'not-an-email',
        message: 'Hi',
        privacyConsent: true,
      }).ok,
    ).toBe(false)
  })

  it('requires website and report language for audit source', () => {
    expect(
      guardContactSubmission({
        name: 'Ada',
        email: 'ada@example.com',
        phone: '+972501234567',
        message: 'AI Audit request',
        privacyConsent: true,
        source: 'audit',
      }).ok,
    ).toBe(false)

    expect(
      guardContactSubmission({
        name: 'Ada',
        email: 'ada@example.com',
        phone: '+1',
        message: 'AI Audit Order',
        privacyConsent: true,
        source: 'audit',
        website: 'example.com',
        auditLanguage: 'ru',
      }).ok,
    ).toBe(false)

    const result = guardContactSubmission({
      name: 'Ada',
      email: 'ada@example.com',
      phone: '+972501234567',
      message: 'AI Audit Order',
      privacyConsent: true,
      source: 'audit',
      website: 'example.com',
      auditLanguage: 'ru',
      planSlug: 'audit-diagnostic',
      planTotal: '99 ₪',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.website).toBe('https://example.com')
      expect(result.data.auditLanguage).toBe('ru')
      expect(result.data.planSlug).toBe('audit-diagnostic')
      expect(result.data.planTotal).toBe('99 ₪')
      expect(result.data.auditStatus).toBe('new')
      expect(result.data.phone).toBe('+972501234567')
    }
  })
})

describe('contactHoneypot', () => {
  it('ignores empty trap field', () => {
    expect(isContactHoneypotTriggered({ hp_erythro_trap: '' })).toBe(false)
    expect(isContactHoneypotTriggered({ hp_erythro_trap: '   ' })).toBe(false)
    expect(isContactHoneypotTriggered({ name: 'Ada' })).toBe(false)
  })

  it('does not treat a real audit/order website URL as the trap', () => {
    expect(
      isContactHoneypotTriggered({
        website: 'https://erythro.ai',
        hp_erythro_trap: '',
      }),
    ).toBe(false)
  })

  it('detects filled trap field', () => {
    expect(isContactHoneypotTriggered({ hp_erythro_trap: 'https://spam.example' })).toBe(true)
    expect(isContactHoneypotTriggered({ hp_erythro_trap: 1 })).toBe(true)
  })

  it('still drops the legacy company_website name (scraped bots / old clients)', () => {
    expect(isContactHoneypotTriggered({ company_website: 'https://spam.example' })).toBe(true)
    expect(isContactHoneypotTriggered({ company_website: '' })).toBe(false)
  })

  it('is not a company/website autofill target', () => {
    const { container } = render(createElement(ContactHoneypotField, { idPrefix: 'test' }))
    const input = container.querySelector('input')
    expect(input?.name).toBe(CONTACT_HONEYPOT_FIELD)
    expect(input?.readOnly).toBe(true)
    expect(input?.getAttribute('autocomplete')).toBe('off')
    expect(input?.id).not.toMatch(/company|website/i)
    expect(container.textContent).not.toMatch(/company website/i)
  })
})

describe('contactRateLimit', () => {
  beforeEach(() => {
    resetContactRateLimitStoreForTests()
    process.env.CONTACT_RATE_LIMIT_MAX = '3'
    process.env.CONTACT_RATE_LIMIT_WINDOW_MS = '60000'
  })

  it('allows up to the limit then blocks', () => {
    expect(consumeContactRateLimit('t:ip').ok).toBe(true)
    expect(consumeContactRateLimit('t:ip').ok).toBe(true)
    expect(consumeContactRateLimit('t:ip').ok).toBe(true)
    const blocked = consumeContactRateLimit('t:ip')
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfterSec).toBeGreaterThan(0)
  })

  it('reads Cloudflare connecting IP first', () => {
    const req = new Request('https://erythro.ai/api/contact', {
      headers: {
        'cf-connecting-ip': '1.2.3.4',
        'x-forwarded-for': '9.9.9.9',
      },
    })
    expect(getRequestIp(req)).toBe('1.2.3.4')
  })
})
