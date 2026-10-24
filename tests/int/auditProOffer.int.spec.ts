import { verifyMailOpenToken } from '@/lib/mailOpenTrack'
import { describe, expect, it } from 'vitest'
import {
  buildProOfferCheckoutUrl,
  buildProOfferEmail,
  computeProOfferExpiresAt,
  computeProOfferNudgeDueAt,
  isAuditProOfferEnabled,
  PRO_ADS_PRICE,
  PRO_LIST_PRICE,
  PRO_OFFER_NUDGE_BEFORE_MS,
  resolveProOfferLocale,
} from '@/lib/auditProOffer'
import {
  signProOfferCheckoutAccess,
  verifyProOfferCheckoutAccess,
} from '@/lib/proOfferCheckoutAccess'
import {
  isFreeAuditPlanSlug,
  isHiddenAuditOrderSlug,
  isPaidAuditFunnelPlanSlug,
  getOrderPlan,
} from '@/lib/orderPlans'
import {
  signMailUnsubscribeToken,
  verifyMailUnsubscribeToken,
} from '@/lib/mailUnsubscribe'

describe('auditProOffer', () => {
  it('ads checkout URL is signed (email-only gate)', () => {
    const prev = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = 'test-pro-offer-secret'
    const url = buildProOfferCheckoutUrl('ru', 42)
    expect(url).toContain('/order/audit-pro-ads')
    expect(url).toContain('lang=ru')
    expect(url).toContain('t=')
    const t = new URL(url).searchParams.get('t')
    expect(verifyProOfferCheckoutAccess(t)?.submissionId).toBe('42')
    expect(verifyProOfferCheckoutAccess(undefined)).toBeNull()
    expect(verifyProOfferCheckoutAccess('42.9999999999.bad')).toBeNull()
    const expired = signProOfferCheckoutAccess(7, Date.now() - 60_000)
    expect(verifyProOfferCheckoutAccess(expired)).toBeNull()
    expect(PRO_ADS_PRICE).toBe(390)
    if (prev === undefined) delete process.env.PAYLOAD_SECRET
    else process.env.PAYLOAD_SECRET = prev
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

  it('RU offer is Pro-only (no name, no modernization block)', () => {
    const prev = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = 'test-pro-offer-secret'
    const mail = buildProOfferEmail({
      name: 'Иван',
      email: 'ivan@example.com',
      locale: 'ru',
      checkoutUrl: 'https://erythro.ai/order/audit-pro-ads?lang=ru',
      reportUrl: 'https://erythro.ai/audit/report/1?k=abc',
      orderId: 'AUD-1',
      kind: 'offer',
    })
    expect(mail.subject).toBe('Ваш отчёт готов: AI Аудит Pro для вашего сайта')
    expect(mail.subject).not.toContain('ivan@example.com')
    expect(mail.html).not.toContain('/api/mail/open')
    expect(mail.text).toContain('₪390')
    expect(mail.text).toContain('вместо ₪490')
    expect(mail.text).toContain('72 часа')
    expect(mail.text).toContain('чеклист 60+')
    expect(mail.text).not.toContain('Иван')
    expect(mail.text).not.toContain('Здравствуйте')
    expect(mail.text).not.toContain('модернизац')
    expect(mail.text).not.toContain('AI-агент')
    expect(mail.html).toContain('letterhead-full-email.png')
    expect(mail.html).toContain('email-header-plate.png')
    expect(mail.html).toContain('color-scheme')
    expect(mail.html).toContain('#b5a58d')
    expect(mail.html).toContain('Эйлат, Израиль')
    expect(mail.html).toContain('audit-pro-ads')
    expect(mail.html).toContain('https://erythro.ai/samples/audit/pro-ru.html')
    expect(mail.text).toContain('Смотреть пример отчёта Pro: https://erythro.ai/samples/audit/pro-ru.html')
    expect(mail.html).not.toContain('/audit/report/')
    expect(mail.html).toContain('text-decoration:line-through')
    expect(mail.html).toContain(`₪${PRO_LIST_PRICE}`)
    expect(mail.html).not.toContain('WhatsApp')
    expect(mail.html).not.toContain('linear-gradient')
    expect(mail.html).toContain('Отписаться от рассылки')
    expect(mail.html).toContain('/unsubscribe')
    expect(mail.html).toContain('t=')
    expect(mail.unsubscribeUrl).toContain('/unsubscribe')
    if (prev === undefined) delete process.env.PAYLOAD_SECRET
    else process.env.PAYLOAD_SECRET = prev
  })

  it('EN / HE offers have locale copy without personal greeting', () => {
    const prev = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = 'test-pro-offer-secret'
    const en = buildProOfferEmail({
      email: 'ada@example.com',
      locale: 'en',
      checkoutUrl: 'https://erythro.ai/order/audit-pro-ads?lang=en',
      kind: 'offer',
    })
    const he = buildProOfferEmail({
      email: 'ada@example.com',
      locale: 'he',
      checkoutUrl: 'https://erythro.ai/order/audit-pro-ads?lang=he',
      kind: 'offer',
    })
    expect(en.subject).toBe('Your report is ready: AI Audit Pro for your site')
    expect(en.text).toContain('Pay for Pro')
    expect(en.text).not.toMatch(/^Hello/m)
    expect(en.html).toContain('Unsubscribe from mailing')
    expect(he.subject).toBe('הדוח שלכם מוכן: AI Audit Pro לאתר שלכם')
    expect(he.html).toContain('dir="rtl"')
    expect(he.html).toContain('ביטול הרשמה לדיוור')
    expect(he.text).not.toMatch(/^שלום/m)
    if (prev === undefined) delete process.env.PAYLOAD_SECRET
    else process.env.PAYLOAD_SECRET = prev
  })

  it('unsubscribe token round-trips email', () => {
    const prev = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = 'test-unsub-secret'
    const token = signMailUnsubscribeToken('Ada@Example.COM')
    expect(verifyMailUnsubscribeToken(token)).toBe('ada@example.com')
    expect(verifyMailUnsubscribeToken('bad')).toBeNull()
    if (prev === undefined) delete process.env.PAYLOAD_SECRET
    else process.env.PAYLOAD_SECRET = prev
  })

  it('HE offer shell is RTL letterhead', () => {
    const prev = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = 'test-pro-offer-secret'
    const mail = buildProOfferEmail({
      email: 'ada@example.com',
      locale: 'he',
      checkoutUrl: 'https://erythro.ai/order/audit-pro-ads?lang=he',
      kind: 'offer',
    })
    expect(mail.html).toContain('dir="rtl"')
    expect(mail.html).toContain('text-align:right')
    expect(mail.html).toContain('אילת, ישראל')
    expect(mail.html).toContain('הדוח שלכם מוכן: AI Audit Pro לאתר שלכם')
    expect(mail.html).toContain('ביטול הרשמה לדיוור')
    expect(mail.html).not.toContain('WhatsApp')
    expect(mail.html).not.toContain('טל.')
    if (prev === undefined) delete process.env.PAYLOAD_SECRET
    else process.env.PAYLOAD_SECRET = prev
  })

  it('RU 24h nudge is urgency Pro (not development)', () => {
    const prev = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = 'test-pro-offer-secret'
    const mail = buildProOfferEmail({
      email: 'ivan@example.com',
      locale: 'ru',
      checkoutUrl: 'https://erythro.ai/order/audit-pro-ads?lang=ru',
      kind: 'nudge',
    })
    expect(mail.subject).toBe('AI Аудит Pro: цена ₪390 действует ещё 24 часа')
    expect(mail.text).toContain('24 часа')
    expect(mail.text).toContain('₪390')
    expect(mail.text).toContain('Оплатить Pro')
    expect(mail.text).not.toContain('разработк')
    expect(mail.html).toContain('text-decoration:line-through')
    expect(mail.html).toContain('Отписаться от рассылки')
    const expiresMs = Date.parse(computeProOfferExpiresAt(1_000_000))
    const nudgeMs = Date.parse(computeProOfferNudgeDueAt(expiresMs))
    expect(expiresMs - nudgeMs).toBe(PRO_OFFER_NUDGE_BEFORE_MS)
    if (prev === undefined) delete process.env.PAYLOAD_SECRET
    else process.env.PAYLOAD_SECRET = prev
  })

  it('RU +72h letter is development offer (not Pro promo)', () => {
    const prev = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = 'test-pro-offer-secret'
    const mail = buildProOfferEmail({
      name: 'Иван',
      email: 'ivan@example.com',
      locale: 'ru',
      checkoutUrl: 'https://erythro.ai/order/audit-pro-ads?lang=ru',
      reportUrl: 'https://erythro.ai/audit/report/1?k=abc',
      kind: 'reminder',
    })
    expect(mail.subject).toBe('Как развить сайт: идеи по разработке')
    expect(mail.html).toContain('Как развить сайт: идеи по разработке')
    expect(mail.text).toContain('Спецпредложение на Pro уже завершилось')
    expect(mail.text).toContain('другой путь')
    expect(mail.text).toContain('консультация')
    expect(mail.text).toContain('высокопроизводительных: сайта')
    expect(mail.text).not.toContain('Иван')
    expect(mail.text).not.toContain('Оплатить Pro')
    expect(mail.html).not.toContain('Открыть отчёт')
    expect(mail.html).toContain('services/ai-automation')
    expect(mail.html).toContain('Отписаться от рассылки')
    if (prev === undefined) delete process.env.PAYLOAD_SECRET
    else process.env.PAYLOAD_SECRET = prev
  })

  it('RU paid_dev letter offers fixes or rebuild after Pro/Diagnostic', () => {
    const prev = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = 'test-pro-offer-secret'
    const mail = buildProOfferEmail({
      name: 'Иван',
      email: 'ivan@example.com',
      locale: 'ru',
      checkoutUrl: 'https://erythro.ai/services/development?lang=ru',
      reportUrl: 'https://erythro.ai/audit/report/42?k=abc',
      kind: 'paid_dev',
    })
    expect(mail.subject).toBe('Что делать с результатами аудита: варианты доработки')
    expect(mail.text).toContain('Отчёт по вашему аудиту готов')
    expect(mail.text).toContain('правки и изменения')
    expect(mail.text).toContain('полностью пересобрать')
    expect(mail.text).toContain('Правки и доработки по результатам аудита')
    expect(mail.text).toContain('«правки»')
    expect(mail.text).toContain('Открыть отчёт: https://erythro.ai/audit/report/42')
    expect(mail.text).not.toContain('Спецпредложение на Pro уже завершилось')
    expect(mail.text).not.toContain('Иван')
    expect(mail.text).not.toContain('Оплатить Pro')
    expect(mail.html).toContain('Открыть отчёт')
    expect(mail.html).toContain('services/development')
    expect(mail.html).toContain('Отписаться от рассылки')
    if (prev === undefined) delete process.env.PAYLOAD_SECRET
    else process.env.PAYLOAD_SECRET = prev
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
    expect(isPaidAuditFunnelPlanSlug('audit-pro')).toBe(true)
    expect(isPaidAuditFunnelPlanSlug('audit-diagnostic')).toBe(true)
    expect(isPaidAuditFunnelPlanSlug('audit-free')).toBe(false)
  })
})

describe('buildProOfferEmail sample Pro report link', () => {
  for (const [locale, label] of [
    ['en', 'View sample Pro report'],
    ['ru', 'Смотреть пример отчёта Pro'],
    ['he', 'צפו בדוגמת דוח Pro'],
  ] as const) {
    for (const kind of ['offer', 'nudge'] as const) {
      it(`${kind} ${locale} links sample in same language`, () => {
        const prev = process.env.PAYLOAD_SECRET
        process.env.PAYLOAD_SECRET = 'test-pro-offer-secret'
        const mail = buildProOfferEmail({
          email: 'a@example.com',
          locale,
          checkoutUrl: 'https://erythro.ai/order/audit-pro-ads',
          reportUrl: 'https://erythro.ai/audit/report/1?k=abc',
          kind,
        })
        process.env.PAYLOAD_SECRET = prev
        expect(mail.html).toContain(`https://erythro.ai/samples/audit/pro-${locale}.html`)
        expect(mail.html).toContain(label)
        expect(mail.html).not.toContain('/audit/report/')
        expect(mail.text).not.toContain('/audit/report/')
      })
    }
  }

  it('adds a signed open-tracking pixel only when submissionId is given', () => {
    const prev = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = 'test-pro-offer-secret'
    const base = {
      email: 'ivan@example.com',
      locale: 'ru',
      checkoutUrl: 'https://erythro.ai/order/audit-pro-ads?lang=ru',
      kind: 'offer' as const,
    }
    const mail = buildProOfferEmail({ ...base, submissionId: 42 })
    const m = mail.html.match(/\/api\/mail\/open\?t=([^"]+)"/)
    expect(m).not.toBeNull()
    expect(verifyMailOpenToken(decodeURIComponent(m![1]!))).toEqual({
      submissionId: 42,
      kind: 'offer',
    })
    expect(verifyMailOpenToken('42.offer.forged')).toBeNull()
    expect(buildProOfferEmail(base).html).not.toContain('/api/mail/open')
    if (prev === undefined) delete process.env.PAYLOAD_SECRET
    else process.env.PAYLOAD_SECRET = prev
  })
})
