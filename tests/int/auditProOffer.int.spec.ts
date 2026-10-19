import { describe, expect, it } from 'vitest'
import {
  buildProOfferCheckoutUrl,
  buildProOfferEmail,
  isAuditProOfferEnabled,
  PRO_ADS_PRICE,
  resolveProOfferLocale,
} from '@/lib/auditProOffer'
import { isFreeAuditPlanSlug, isHiddenAuditOrderSlug, getOrderPlan } from '@/lib/orderPlans'

describe('auditProOffer', () => {
  it('ads checkout is always audit-pro-ads at 390', () => {
    expect(buildProOfferCheckoutUrl('ru')).toContain('/order/audit-pro-ads')
    expect(buildProOfferCheckoutUrl('ru')).toContain('lang=ru')
    expect(PRO_ADS_PRICE).toBe(390)
  })

  it('commercial Pro emails stay off until AUDIT_PRO_OFFER_ENABLED', () => {
    const prev = process.env.AUDIT_PRO_OFFER_ENABLED
    delete process.env.AUDIT_PRO_OFFER_ENABLED
    expect(isAuditProOfferEnabled()).toBe(false)
    process.env.AUDIT_PRO_OFFER_ENABLED = '1'
    expect(isAuditProOfferEnabled()).toBe(true)
    process.env.AUDIT_PRO_OFFER_ENABLED = '0'
    expect(isAuditProOfferEnabled()).toBe(false)
    if (prev === undefined) delete process.env.AUDIT_PRO_OFFER_ENABLED
    else process.env.AUDIT_PRO_OFFER_ENABLED = prev
  })

  it('RU offer is Pro-only (no modernization block)', () => {
    const mail = buildProOfferEmail({
      name: 'Иван',
      email: 'ivan@example.com',
      locale: 'ru',
      checkoutUrl: 'https://erythro.ai/order/audit-pro-ads?lang=ru',
      reportUrl: 'https://erythro.ai/audit/report/1?k=abc',
      orderId: 'AUD-1',
      kind: 'offer',
    })
    expect(mail.subject).toBe('Специальное предложение для ivan@example.com')
    expect(mail.text).toContain('₪390')
    expect(mail.text).toContain('вместо ₪490')
    expect(mail.text).toContain('72 часа')
    expect(mail.text).toContain('чеклист 60+')
    expect(mail.text).not.toContain('модернизац')
    expect(mail.text).not.toContain('AI-агент')
    expect(mail.html).toContain('letterhead-full.svg')
    expect(mail.html).toContain('#b5a58d')
    expect(mail.html).toContain('Эйлат, Израиль')
    expect(mail.html).toContain('audit-pro-ads')
    expect(mail.html).not.toContain('WhatsApp')
    expect(mail.html).not.toContain('linear-gradient')
  })

  it('HE offer shell is RTL letterhead', () => {
    const mail = buildProOfferEmail({
      email: 'ada@example.com',
      locale: 'he',
      checkoutUrl: 'https://erythro.ai/order/audit-pro-ads?lang=he',
      kind: 'offer',
    })
    expect(mail.html).toContain('dir="rtl"')
    expect(mail.html).toContain('text-align:right')
    expect(mail.html).toContain('אילת, ישראל')
    expect(mail.html).toContain('הצעה מיוחדת עבור ada@example.com')
    expect(mail.html).not.toContain('WhatsApp')
    expect(mail.html).not.toContain('טל.')
  })

  it('RU +72h letter is modernization / AI (not Pro promo)', () => {
    const mail = buildProOfferEmail({
      email: 'ivan@example.com',
      locale: 'ru',
      checkoutUrl: 'https://erythro.ai/order/audit-pro-ads?lang=ru',
      kind: 'reminder',
    })
    expect(mail.subject).toContain('ivan@example.com')
    expect(mail.subject).toMatch(/сайт|AI|автоматизац/)
    expect(mail.text).toContain('AI-агент')
    expect(mail.text).toMatch(/устарел|модерниз/)
    expect(mail.text).not.toContain('Оплатить Pro')
    expect(mail.html).toContain('services/ai-automation')
  })

  it('PRO offer locale follows reportLang', () => {
    expect(resolveProOfferLocale({ reportLang: 'ru', locale: 'en' })).toBe('ru')
    expect(resolveProOfferLocale({ reportLang: 'HE' })).toBe('he')
  })

  it('audit-pro-ads plan is hidden Pro checkout', () => {
    const plan = getOrderPlan('audit-pro-ads')
    expect(plan?.card.price).toBe('390')
    expect(isHiddenAuditOrderSlug('audit-pro-ads')).toBe(true)
    expect(isFreeAuditPlanSlug('audit-free')).toBe(true)
  })
})
