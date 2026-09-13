import { describe, expect, it } from 'vitest'
import {
  buildClientAckEmail,
  buildContactEmail,
  resolveDisplayEmail,
  resolveNotifyEmail,
  resolveNotifyRecipients,
} from '@/lib/contactNotification'

describe('contactNotification', () => {
  it('uses Site Settings email when valid (legacy string)', () => {
    expect(resolveNotifyEmail('ada@example.com')).toBe('ada@example.com')
  })

  it('routes contact vs order notify targets from CMS', () => {
    delete process.env.CONTACT_NOTIFY_EMAIL
    const settings = {
      emails: [
        { label: 'Orders', address: 'order@erythro.ai' },
        { label: 'Inbox', address: 'hello@erythro.ai' },
      ],
      notifyEmailContact: 'hello@erythro.ai',
      notifyEmailOrder: 'order@erythro.ai',
    }
    expect(resolveNotifyRecipients(settings, 'contact')).toEqual(['hello@erythro.ai'])
    expect(resolveNotifyRecipients(settings, 'order')).toEqual(['order@erythro.ai'])
  })

  it('falls back to Hostinger mailbox when CMS email is empty', () => {
    delete process.env.CONTACT_NOTIFY_EMAIL
    expect(resolveNotifyEmail('')).toBe('order@erythro.ai')
    expect(resolveNotifyEmail(null)).toBe('order@erythro.ai')
  })

  it('resolves display emails per surface', () => {
    const settings = {
      email: 'order@erythro.ai',
      displayEmailFooter: 'order@erythro.ai',
      displayEmailContacts: 'hello@erythro.ai',
      displayEmailLegal: 'privacy@erythro.ai',
    }
    expect(resolveDisplayEmail(settings, 'footer')).toBe('order@erythro.ai')
    expect(resolveDisplayEmail(settings, 'contacts')).toBe('hello@erythro.ai')
    expect(resolveDisplayEmail(settings, 'legal')).toBe('privacy@erythro.ai')
  })

  it('escapes HTML in the notification body', () => {
    const { html, subject } = buildContactEmail({
      name: 'Ada <script>',
      email: 'ada@example.com',
      phone: '',
      message: 'Hello <b>there</b>',
      locale: 'en',
      source: 'order',
    })
    expect(subject).toContain('order inquiry')
    expect(html).toContain('Ada &lt;script&gt;')
    expect(html).toContain('Hello &lt;b&gt;there&lt;/b&gt;')
    expect(html).not.toContain('<script>')
  })

  it('adds a ticket id to staff mail for every source', () => {
    const { html, subject, text } = buildContactEmail({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hello',
      source: 'contact',
      submissionId: 42,
    })
    expect(subject).toBe('Erythro.ai contact REQ-42: Ada')
    expect(text).toContain('Ticket: REQ-42')
    expect(html).toContain('REQ-42')
  })

  it('builds a localized client ack with escaped name', () => {
    const { html, subject, text } = buildClientAckEmail({
      name: 'Ada <script>',
      locale: 'ru',
    })
    expect(subject).toBe('Заявка принята — Erythro.ai')
    expect(text).toContain('Спасибо, заявка принята')
    expect(text).toContain('Ada script')
    expect(html).toContain('Ada script')
    expect(html).toContain('dir="ltr"')
    expect(html).toContain('color:#000000')
    expect(html).toContain('background-color:#ffffff')
    expect(html).not.toContain('<script>')
  })

  it('includes a source ticket in the client ack', () => {
    const { html, subject, text } = buildClientAckEmail({
      name: 'Ada',
      locale: 'ru',
      source: 'audit',
      submissionId: 153,
    })
    expect(subject).toBe('Заявка принята — Erythro.ai #AUD-153')
    expect(text).toContain('Номер вашей заявки #AUD-153.')
    expect(html).toContain('#AUD-153')
    expect(html).toContain('dir="ltr"')
  })

  it('uses RTL markup for Hebrew client ack', () => {
    const { html, subject } = buildClientAckEmail({
      name: 'Ada',
      locale: 'he',
    })
    expect(subject).toContain('הפנייה התקבלה')
    expect(html).toContain('dir="rtl"')
    expect(html).toContain('שלום, Ada.')
  })
})
