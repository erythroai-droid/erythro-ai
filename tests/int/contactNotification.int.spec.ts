import { describe, expect, it } from 'vitest'
import { buildContactEmail, resolveNotifyEmail, resolveNotifyRecipients } from '@/lib/contactNotification'

describe('contactNotification', () => {
  it('uses Site Settings email when valid', () => {
    expect(resolveNotifyEmail('ada@example.com')).toBe('ada@example.com')
  })

  it('always includes the Hostinger mailbox', () => {
    delete process.env.CONTACT_NOTIFY_EMAIL
    expect(resolveNotifyRecipients('ada@example.com')).toEqual([
      'ada@example.com',
      'order@erythro.ai',
    ])
    expect(resolveNotifyRecipients('order@erythro.ai')).toEqual(['order@erythro.ai'])
  })

  it('falls back to Hostinger mailbox when CMS email is empty', () => {
    delete process.env.CONTACT_NOTIFY_EMAIL
    expect(resolveNotifyEmail('')).toBe('order@erythro.ai')
    expect(resolveNotifyEmail(null)).toBe('order@erythro.ai')
  })

  it('escapes HTML in the notification body', () => {
    const { html, subject } = buildContactEmail({
      name: 'Ada <script>',
      email: 'ada@example.com',
      phone: '',
      message: 'Hello <b>there</b>',
      locale: 'en',
    })
    expect(subject).toContain('Ada <script>')
    expect(html).toContain('Ada &lt;script&gt;')
    expect(html).toContain('Hello &lt;b&gt;there&lt;/b&gt;')
    expect(html).not.toContain('<script>')
  })
})
