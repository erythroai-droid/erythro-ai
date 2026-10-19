/**
 * Ads LP free-audit funnel (team@erythro.ai):
 * report → +15m Pro ₪390 (72h) → +48h (24h left nudge) → +72h development offer.
 */
import { getPayload, type Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@payload-config'
import { buildAuditReportPath } from '@/lib/auditReport'
import {
  buildMailUnsubscribeUrl,
  isMailUnsubscribed,
} from '@/lib/mailUnsubscribe'
import { unsubscribeCopy } from '@/lib/mailUnsubscribeCopy'
import { isFreeAuditPlanSlug } from '@/lib/orderPlans'
import { signProOfferCheckoutAccess } from '@/lib/proOfferCheckoutAccess'
import { formatSubmissionTicketId } from '@/lib/submissionTicket'

export const PRO_OFFER_DELAY_MS = 15 * 60 * 1000
export const PRO_OFFER_PROMO_MS = 72 * 60 * 60 * 1000
/** Send urgency nudge this long before promo expires. */
export const PRO_OFFER_NUDGE_BEFORE_MS = 24 * 60 * 60 * 1000
export const TEAM_MAILBOX = 'team@erythro.ai'
export const PRO_ADS_PRICE = 390 as const
export const PRO_LIST_PRICE = 490 as const

/**
 * team@ Pro / 24h nudge / development commercial emails.
 * Turn on with Vercel (+ audit-agent) env `AUDIT_PRO_OFFER_ENABLED=1`.
 */
export const AUDIT_PRO_OFFER_ENABLED_DEFAULT = false

export function isAuditProOfferEnabled(): boolean {
  const v = process.env.AUDIT_PRO_OFFER_ENABLED?.trim().toLowerCase()
  if (v === '1' || v === 'true' || v === 'on') return true
  if (v === '0' || v === 'false' || v === 'off') return false
  return AUDIT_PRO_OFFER_ENABLED_DEFAULT
}

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw || raw === '[SENSITIVE]' || raw.startsWith('YOUR_')) {
    return 'https://erythro.ai'
  }
  return raw.replace(/\/+$/, '')
}

const SITE_URL = resolveSiteUrl()

/** Paid funnel plans that mean “already bought / started checkout” — skip promo. */
export const PAID_AUDIT_FUNNEL_SLUGS = [
  'audit-pro',
  'audit-pro-ads',
  'audit-diagnostic',
] as const

export type ProOfferLeadChannel = 'organic' | 'meta_ads'
export type ProOfferStatus =
  | 'none'
  | 'scheduled'
  | 'sent'
  | 'nudge_sent'
  | 'reminder_sent'
  | 'skipped'

type OfferLocale = 'en' | 'ru' | 'he'
type OfferKind = 'offer' | 'nudge' | 'reminder'

/**
 * Same language as the client report email / HTML report.
 */
export function resolveProOfferLocale(input: {
  reportLang?: string | null
  auditLanguage?: string | null
  locale?: string | null
}): OfferLocale {
  for (const raw of [input.reportLang, input.auditLanguage, input.locale]) {
    const v = String(raw || '')
      .trim()
      .toLowerCase()
    if (v === 'ru' || v === 'he' || v === 'en') return v
  }
  return 'en'
}

function offerLocale(raw: string | null | undefined): OfferLocale {
  return resolveProOfferLocale({ locale: raw })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isUsableEmail(value: string | null | undefined): value is string {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
}

/**
 * Email-only checkout URL. Requires HMAC `t` (free-audit submission id + 72h expiry).
 * Bare `/order/audit-pro-ads` returns 404 without a valid token.
 */
export function buildProOfferCheckoutUrl(
  locale: string | null | undefined,
  submissionId: string | number,
  expiresAtMs?: number,
): string {
  const lang = offerLocale(locale)
  const t = signProOfferCheckoutAccess(submissionId, expiresAtMs)
  try {
    const u = new URL(`${SITE_URL}/order/audit-pro-ads`)
    u.searchParams.set('lang', lang)
    u.searchParams.set('t', t)
    return u.toString()
  } catch {
    return `${SITE_URL}/order/audit-pro-ads?lang=${lang}&t=${encodeURIComponent(t)}`
  }
}

function siteUrlWithLang(path: string, locale: OfferLocale): string {
  try {
    const u = new URL(
      path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`,
    )
    u.searchParams.set('lang', locale)
    return u.toString()
  } catch {
    return `${SITE_URL}${path}?lang=${locale}`
  }
}

export function computeProOfferDueAt(fromMs = Date.now()): string {
  return new Date(fromMs + PRO_OFFER_DELAY_MS).toISOString()
}

export function computeProOfferExpiresAt(fromMs = Date.now()): string {
  return new Date(fromMs + PRO_OFFER_PROMO_MS).toISOString()
}

export function computeProOfferNudgeDueAt(expiresAtMs: number): string {
  return new Date(expiresAtMs - PRO_OFFER_NUDGE_BEFORE_MS).toISOString()
}

/** True if this email already started/paid Diagnostic or Pro. */
export async function emailHasPaidAuditFunnelOrder(
  email: string,
  excludeSubmissionId?: number | string,
): Promise<boolean> {
  const raw = email.trim()
  if (!raw) return false

  const payload = await getPayload({ config })
  const found = await payload.find({
    collection: 'contact-submissions',
    depth: 0,
    limit: 10,
    overrideAccess: true,
    where: {
      and: [
        { source: { equals: 'audit' } },
        { email: { equals: raw } },
        { planSlug: { in: [...PAID_AUDIT_FUNNEL_SLUGS] } },
        { paymentStatus: { in: ['pending', 'paid'] } },
        ...(excludeSubmissionId != null
          ? [{ id: { not_equals: excludeSubmissionId } }]
          : []),
      ],
    },
  })
  if (found.docs.length > 0) return true

  // Case-insensitive fallback (same mailbox, different casing).
  const lower = raw.toLowerCase()
  if (lower === raw) return false
  const again = await payload.find({
    collection: 'contact-submissions',
    depth: 0,
    limit: 10,
    overrideAccess: true,
    where: {
      and: [
        { source: { equals: 'audit' } },
        { email: { equals: lower } },
        { planSlug: { in: [...PAID_AUDIT_FUNNEL_SLUGS] } },
        { paymentStatus: { in: ['pending', 'paid'] } },
        ...(excludeSubmissionId != null
          ? [{ id: { not_equals: excludeSubmissionId } }]
          : []),
      ],
    },
  })
  return again.docs.length > 0
}

type SharedMail = {
  reportCta: string
  close: string
  support: string
  brand: string
}

type ProMailCopy = SharedMail & {
  kind: 'offer'
  subject: (email: string) => string
  preheader: string
  intro: string
  proTitle: string
  proBullets: string[]
  priceBadge: string
  priceNote: string
  validity: string
  cta: string
}

type NudgeMailCopy = SharedMail & {
  kind: 'nudge'
  subject: string
  preheader: string
  intro: string
  priceBadge: string
  priceNote: string
  validity: string
  cta: string
}

type ServicesMailCopy = SharedMail & {
  kind: 'reminder'
  subject: (email: string) => string
  preheader: string
  headline: string
  intro: string
  bridge: string
  title: string
  bullets: string[]
  cta: string
  servicesDev: string
  servicesAi: string
  home: string
}

function proCopy(locale: OfferLocale): ProMailCopy {
  const shared: SharedMail = {
    reportCta:
      locale === 'ru' ? 'Открыть отчёт' : locale === 'he' ? 'פתחו את הדוח' : 'Open report',
    close:
      locale === 'ru'
        ? 'Erythro.ai — hi-load веб, AI и автоматизация.'
        : locale === 'he'
          ? 'Erythro.ai — ווב hi-load, AI ואוטומציה.'
          : 'Erythro.ai — hi-load web, AI, and automation.',
    support: 'WhatsApp / тел.: +972 50-530-8305 · team@erythro.ai',
    brand: 'Erythro.ai',
  }
  if (locale === 'ru') {
    return {
      kind: 'offer',
      ...shared,
      subject: (email) => `Специальное предложение для ${email}`,
      preheader: `AI Аудит Pro за ₪${PRO_ADS_PRICE} вместо ₪${PRO_LIST_PRICE} — 72 часа`,
      intro:
        'Вы прошли бесплатный экспресс-аудит на нашем лендинге. Отчёт уже у вас — ниже персональное спецпредложение на полный AI Аудит Pro.',
      proTitle: 'AI Аудит: Pro — что вы получаете',
      proBullets: [
        'Полный чеклист 60+ и план правок под ключ',
        'Обход воронки до 10 URL + Funnel review',
        'AI Visibility + Agent Readiness L1',
        'Полный HTML + PDF отчёт на выбранном языке',
      ],
      priceBadge: `₪${PRO_ADS_PRICE}`,
      priceNote: 'разово',
      validity: 'Спецпредложение действует 72 часа с момента этого письма.',
      cta: `Оплатить Pro — ₪${PRO_ADS_PRICE}`,
    }
  }
  if (locale === 'he') {
    return {
      kind: 'offer',
      ...shared,
      support: 'WhatsApp / טל.: +972 50-530-8305 · team@erythro.ai',
      subject: (email) => `הצעה מיוחדת עבור ${email}`,
      preheader: `AI Audit Pro ב-₪${PRO_ADS_PRICE} במקום ₪${PRO_LIST_PRICE} — 72 שעות`,
      intro:
        'עברתם ביקורת אקספרס חינמית בדף הנחיתה. הדוח כבר אצלכם — להלן הצעה אישית ל-AI Audit Pro המלא.',
      proTitle: 'AI Audit: Pro — מה תקבלו',
      proBullets: [
        'צ׳ק-ליסט 60+ מלא ותוכנית תיקון',
        'סריקת משפך עד 10 כתובות + Funnel review',
        'AI Visibility + Agent Readiness L1',
        'דוח HTML + PDF מלא בשפה שבחרתם',
      ],
      priceBadge: `₪${PRO_ADS_PRICE}`,
      priceNote: 'חד-פעמי',
      validity: 'ההצעה תקפה ל-72 שעות מרגע המייל הזה.',
      cta: `לתשלום Pro — ₪${PRO_ADS_PRICE}`,
    }
  }
  return {
    kind: 'offer',
    ...shared,
    support: 'WhatsApp / tel.: +972 50-530-8305 · team@erythro.ai',
    subject: (email) => `Special offer for ${email}`,
    preheader: `AI Audit Pro for ₪${PRO_ADS_PRICE} instead of ₪${PRO_LIST_PRICE} — 72 hours`,
    intro:
      'You completed the free express audit on our landing page. Your report is ready — here is a personal offer for full AI Audit Pro.',
    proTitle: 'AI Audit: Pro — what you get',
    proBullets: [
      'Full 60+ checklist and turnkey fix plan',
      'Funnel crawl up to 10 URLs + Funnel review',
      'AI Visibility + Agent Readiness L1',
      'Full HTML + PDF report in your language',
    ],
    priceBadge: `₪${PRO_ADS_PRICE}`,
    priceNote: 'one-time',
    validity: 'This special offer is valid for 72 hours from this email.',
    cta: `Pay for Pro — ₪${PRO_ADS_PRICE}`,
  }
}

/** −24h before promo ends: urgency nudge. */
function nudgeCopy(locale: OfferLocale): NudgeMailCopy {
  const shared = proCopy(locale)
  if (locale === 'ru') {
    return {
      kind: 'nudge',
      reportCta: shared.reportCta,
      support: shared.support,
      brand: shared.brand,
      close: shared.close,
      subject: 'Осталось 24 часа до завершения специального предложения!',
      preheader: `AI Аудит Pro ₪${PRO_ADS_PRICE} — осталось 24 часа`,
      intro:
        'Специальное предложение на полный AI Аудит Pro скоро закончится. Успейте зафиксировать цену ₪390 вместо ₪490.',
      priceBadge: `₪${PRO_ADS_PRICE}`,
      priceNote: 'разово',
      validity: 'До конца спецпредложения осталось 24 часа.',
      cta: `Оплатить Pro — ₪${PRO_ADS_PRICE}`,
    }
  }
  if (locale === 'he') {
    return {
      kind: 'nudge',
      reportCta: shared.reportCta,
      support: 'WhatsApp / טל.: +972 50-530-8305 · team@erythro.ai',
      brand: shared.brand,
      close: shared.close,
      subject: 'נותרו 24 שעות לסיום ההצעה המיוחדת!',
      preheader: `AI Audit Pro ₪${PRO_ADS_PRICE} — נותרו 24 שעות`,
      intro:
        'ההצעה המיוחדת ל-AI Audit Pro המלא עומדת להסתיים. קבעו את המחיר ₪390 במקום ₪490 לפני שייגמר.',
      priceBadge: `₪${PRO_ADS_PRICE}`,
      priceNote: 'חד-פעמי',
      validity: 'נותרו 24 שעות לסיום ההצעה המיוחדת.',
      cta: `לתשלום Pro — ₪${PRO_ADS_PRICE}`,
    }
  }
  return {
    kind: 'nudge',
    reportCta: shared.reportCta,
    support: 'WhatsApp / tel.: +972 50-530-8305 · team@erythro.ai',
    brand: shared.brand,
    close: shared.close,
    subject: '24 hours left until the special offer ends!',
    preheader: `AI Audit Pro ₪${PRO_ADS_PRICE} — 24 hours left`,
    intro:
      'The special offer for full AI Audit Pro is about to end. Lock in ₪390 instead of ₪490 while it lasts.',
    priceBadge: `₪${PRO_ADS_PRICE}`,
    priceNote: 'one-time',
    validity: '24 hours left until the special offer ends.',
    cta: `Pay for Pro — ₪${PRO_ADS_PRICE}`,
  }
}

/** +72h: modernization / AI (only if still no paid audit order). */
function servicesCopy(locale: OfferLocale): ServicesMailCopy {
  const shared = proCopy(locale)
  if (locale === 'ru') {
    return {
      kind: 'reminder',
      reportCta: shared.reportCta,
      support: shared.support,
      brand: shared.brand,
      subject: (email) => `Предложение о разработке для ${email}`,
      preheader: 'Сайт, AI-агенты и автоматизация под ключ',
      headline: 'Предложение о разработке',
      intro:
        'Спецпредложение на Pro уже завершилось. Возможно вам нужен другой путь?',
      bridge:
        'Если сайт устарел технологически или процессы происходят вручную — мы внедряем современные решения на базе AI:',
      title: 'Что можем сделать под ключ',
      bullets: [
        'Дизайн и разработка высокопроизводительных: сайта / лендинга / корпоративного портала',
        'AI-агенты, чат-боты и автоматизация процессов (n8n, CRM, заявки)',
        'Enterprise-инженерия: интеграции, админки, безопасность, высокая нагрузка',
        'AI-маркетинг и реклама под ключ — когда воронка готова масштабироваться',
      ],
      cta: 'Ответьте на письмо: «новый сайт», «автоматизация» или «консультация» — пришлём короткое ТЗ и ориентир по срокам.',
      close: shared.close,
      servicesDev: 'Разработка',
      servicesAi: 'AI и автоматизация',
      home: 'Все услуги',
    }
  }
  if (locale === 'he') {
    return {
      kind: 'reminder',
      reportCta: shared.reportCta,
      support: 'WhatsApp / טל.: +972 50-530-8305 · team@erythro.ai',
      brand: shared.brand,
      subject: (email) => `הצעה לפיתוח עבור ${email}`,
      preheader: 'אתר, סוכני AI ואוטומציה turnkey',
      headline: 'הצעה לפיתוח',
      intro: 'מבצע ה-Pro הסתיים. אולי מתאים לכם מסלול אחר?',
      bridge:
        'אם האתר מיושן טכנולוגית או שהתהליכים עדיין ידניים — אנחנו מיישמים פתרונות מודרניים מבוססי AI:',
      title: 'מה אפשר לעשות turnkey',
      bullets: [
        'עיצוב ופיתוח בעלי ביצועים גבוהים: אתר / דף נחיתה / פורטל ארגוני',
        'סוכני AI, צ׳אטבוטים ואוטומציה של תהליכים (n8n, CRM, לידים)',
        'הנדסת Enterprise: אינטגרציות, אדמין, אבטחה, עומס גבוה',
        'שיווק AI ופרסום turnkey — כשהמשפך מוכן לצמיחה',
      ],
      cta: 'השיבו למייל: «אתר חדש», «אוטומציה» או «ייעוץ» — נשלח אפיון קצר ואומדן לוחות זמנים.',
      close: shared.close,
      servicesDev: 'פיתוח',
      servicesAi: 'AI ואוטומציה',
      home: 'כל השירותים',
    }
  }
  return {
    kind: 'reminder',
    reportCta: shared.reportCta,
    support: 'WhatsApp / tel.: +972 50-530-8305 · team@erythro.ai',
    brand: shared.brand,
    subject: (email) => `Development offer for ${email}`,
    preheader: 'Site, AI agents, and turnkey automation',
    headline: 'A development offer',
    intro: 'The Pro special offer has ended. Maybe you need a different path?',
    bridge:
      'If the site is technologically outdated or processes still run manually — we implement modern AI-based solutions:',
    title: 'What we can deliver turnkey',
    bullets: [
      'Design and development of high-performance: site / landing / corporate portal',
      'AI agents, chatbots, and process automation (n8n, CRM, leads)',
      'Enterprise engineering: integrations, admin panels, security, high load',
      'Turnkey AI marketing and ads — when the funnel is ready to scale',
    ],
    cta: 'Reply to this email: “new site”, “automation”, or “consultation” — we will send a short brief and timeline estimate.',
    close: shared.close,
    servicesDev: 'Development',
    servicesAi: 'AI & automation',
    home: 'All services',
  }
}

function bulletRows(items: string[]): string {
  return items
    .map(
      (b) =>
        `<tr><td style="padding:0 0 10px 0;color:#1a1a1a;font-size:15px;line-height:1.45;">
            <span style="color:#c41e3a;font-weight:700;">✓</span>&nbsp;&nbsp;${escapeHtml(b)}
          </td></tr>`,
    )
    .join('')
}

/** Letterhead chrome (matches `design/letterheads/*-blank.html`). */
function letterheadFooterLine(locale: OfferLocale): string {
  if (locale === 'he') return 'Erythro.ai · אילת, ישראל · erythro.ai'
  if (locale === 'ru') return 'Erythro.ai · Эйлат, Израиль · erythro.ai'
  return 'Erythro.ai · Eilat, Israel · erythro.ai'
}

function shellHtml(input: {
  locale: OfferLocale
  dir: string
  subject: string
  preheader: string
  brand: string
  headline: string
  bodyInner: string
  unsubscribeUrl: string
}): string {
  const isRtl = input.dir === 'rtl'
  const align = isRtl ? 'right' : 'left'
  const contactsAlign = isRtl ? 'left' : 'right'
  const fontStack = isRtl
    ? "'Heebo',Arial,Helvetica,sans-serif"
    : "Arial,Helvetica,sans-serif"
  // Wordmark without plate; full header sits on a white pixel plate (Gmail inverts CSS bgcolor).
  const logoUrl = `${SITE_URL}/images/logo/letterhead-full.svg`
  const headerPlateUrl = `${SITE_URL}/images/logo/email-header-plate.svg?v=1`
  const footerLine = letterheadFooterLine(input.locale)
  const unsubLabel = unsubscribeCopy(input.locale).linkLabel
  // Header: full-bleed white plate image + logo / contacts on top (dir flips cells in RTL).
  const headerBlock = `
        <tr>
          <td background="${escapeHtml(headerPlateUrl)}" bgcolor="#ffffff" width="100%" style="background-color:#ffffff;background-image:url('${escapeHtml(headerPlateUrl)}');background-size:100% 100%;background-repeat:no-repeat;padding:18px 28px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" dir="${input.dir}" style="border-collapse:collapse;">
              <tr>
                <td style="padding:0;vertical-align:middle;">
                  <a href="${escapeHtml(SITE_URL)}" style="text-decoration:none;">
                    <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(input.brand)}" width="177" height="56" style="display:block;border:0;outline:none;width:177px;height:auto;max-width:177px;"/>
                  </a>
                </td>
                <td dir="ltr" align="${contactsAlign}" style="padding:0;vertical-align:middle;font-size:11px;line-height:16px;color:#686868 !important;">
                  <a href="${escapeHtml(SITE_URL)}" style="color:#686868 !important;text-decoration:none;">erythro.ai</a><br/>
                  <a href="mailto:${TEAM_MAILBOX}" style="color:#686868 !important;text-decoration:none;">${TEAM_MAILBOX}</a><br/>
                  <span style="white-space:nowrap;color:#686868 !important;">+972 50 530 83 05</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="height:1px;line-height:1px;font-size:0;background:#b5a58d;">&nbsp;</td></tr></table>
          </td>
        </tr>`

  return `<!DOCTYPE html>
<html lang="${input.locale}" dir="${input.dir}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width"/>
<meta name="color-scheme" content="light only"/>
<meta name="supported-color-schemes" content="light"/>
<title>${escapeHtml(input.subject)}</title>
<style type="text/css">
:root { color-scheme: light only; }
</style>
</head>
<body style="margin:0;padding:0;background:#e9e6e1;font-family:${fontStack};color:#1e1e1e;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e9e6e1;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" dir="${input.dir}" style="max-width:600px;background:#ffffff;border-radius:0;">
        ${headerBlock}
        <tr><td dir="${input.dir}" align="${align}" style="padding:22px 28px 8px;text-align:${align};">
          <h1 style="margin:0 0 18px;color:#0d0d0d;font-size:22px;line-height:1.35;font-weight:700;text-align:${align};">${escapeHtml(input.headline)}</h1>
          ${input.bodyInner}
        </td></tr>
        <tr><td style="padding:16px 28px 28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="height:1px;line-height:1px;font-size:0;background:#b5a58d;">&nbsp;</td></tr></table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" dir="${input.dir}" style="margin-top:10px;">
            <tr>
              <td align="${align}" style="font-size:11px;line-height:16px;color:#686868;text-align:${align};">${escapeHtml(footerLine)}</td>
              <td align="${contactsAlign}" style="font-size:11px;line-height:16px;color:#686868;text-align:${contactsAlign};">
                <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#686868;text-decoration:underline;">${escapeHtml(unsubLabel)}</a>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/** Brand HTML email (table layout). Offer = Pro only; reminder = modernization/AI. */
export function buildProOfferEmail(input: {
  name?: string | null
  email: string
  locale?: string | null
  checkoutUrl: string
  reportUrl?: string | null
  orderId?: string | null
  kind?: OfferKind
}): { subject: string; text: string; html: string; unsubscribeUrl: string } {
  const locale = offerLocale(input.locale)
  const dir = locale === 'he' ? 'rtl' : 'ltr'
  const kind = input.kind || 'offer'
  const email = input.email.trim()
  const unsubscribeUrl = buildMailUnsubscribeUrl(email, locale)
  const unsubLabel = unsubscribeCopy(locale).linkLabel
  const servicesDevUrl = siteUrlWithLang('/services/development', locale)
  const servicesAiUrl = siteUrlWithLang('/services/ai-automation', locale)
  const homeUrl = siteUrlWithLang('/', locale)

  if (kind === 'nudge') {
    const copy = nudgeCopy(locale)
    const subject = copy.subject
    const textParts = [
      subject,
      '',
      copy.intro,
      copy.validity,
      '',
      locale === 'ru'
        ? `${copy.priceBadge} вместо ₪${PRO_LIST_PRICE} · ${copy.priceNote}`
        : locale === 'he'
          ? `${copy.priceBadge} במקום ₪${PRO_LIST_PRICE} · ${copy.priceNote}`
          : `${copy.priceBadge} instead of ₪${PRO_LIST_PRICE} · ${copy.priceNote}`,
      `${copy.cta}: ${input.checkoutUrl}`,
    ]
    if (input.reportUrl) textParts.push('', `${copy.reportCta}: ${input.reportUrl}`)
    if (input.orderId) textParts.push('', `Order: ${input.orderId}`)
    textParts.push('', copy.close, `${unsubLabel}: ${unsubscribeUrl}`, '', copy.brand)

    const reportBlock = input.reportUrl
      ? `<p style="margin:0 0 16px;"><a href="${escapeHtml(input.reportUrl)}" style="color:#c41e3a;font-size:14px;font-weight:600;">${escapeHtml(copy.reportCta)} →</a></p>`
      : ''

    const bodyInner = `
      <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.55;">${escapeHtml(copy.intro)}</p>
      <table role="presentation" width="100%" style="background:#fff5f6;border:1px solid #f0c9cf;border-radius:12px;margin:0 0 20px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0 0 2px;color:#9a9a9a;font-size:13px;font-weight:600;line-height:1.2;text-decoration:line-through;">₪${PRO_LIST_PRICE}</p>
          <p style="margin:0 0 4px;color:#c41e3a;font-size:28px;font-weight:800;line-height:1.1;">${escapeHtml(copy.priceBadge)}</p>
          <p style="margin:0 0 8px;color:#555;font-size:14px;">${escapeHtml(copy.priceNote)}</p>
          <p style="margin:0;color:#7a1f2b;font-size:13px;font-weight:600;">${escapeHtml(copy.validity)}</p>
        </td></tr>
      </table>
      ${reportBlock}
      <table role="presentation" width="100%" style="margin:0 0 20px;">
        <tr><td align="center">
          <a href="${escapeHtml(input.checkoutUrl)}"
             style="display:inline-block;background:#c41e3a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:16px;font-weight:700;">
            ${escapeHtml(copy.cta)}
          </a>
        </td></tr>
        <tr><td align="center" style="padding-top:10px;">
          <a href="${escapeHtml(input.checkoutUrl)}" style="color:#888;font-size:12px;word-break:break-all;">${escapeHtml(input.checkoutUrl)}</a>
        </td></tr>
      </table>
      <p style="margin:0;color:#555;font-size:14px;">${escapeHtml(copy.close)}</p>
      ${input.orderId ? `<p style="margin:12px 0 0;color:#999;font-size:12px;"><code dir="ltr">${escapeHtml(input.orderId)}</code></p>` : ''}
    `

    return {
      subject,
      text: textParts.join('\n'),
      html: shellHtml({
        locale,
        dir,
        subject,
        preheader: copy.preheader,
        brand: copy.brand,
        headline: subject,
        bodyInner,
        unsubscribeUrl,
      }),
      unsubscribeUrl,
    }
  }

  if (kind === 'reminder') {
    const copy = servicesCopy(locale)
    const subject = copy.subject(email)
    const textParts = [
      subject,
      copy.intro,
      '',
      copy.bridge,
      '',
      copy.title,
      ...copy.bullets.map((b) => `✓  ${b}`),
      copy.cta,
      '',
      `${copy.servicesDev}  ·  ${copy.servicesAi}  ·  ${copy.home}`,
      `${servicesDevUrl}`,
      `${servicesAiUrl}`,
      `${homeUrl}`,
    ]
    textParts.push('', `${unsubLabel}: ${unsubscribeUrl}`, '', copy.brand)

    const bodyInner = `
      <p style="margin:0 0 14px;color:#333;font-size:15px;line-height:1.55;">${escapeHtml(copy.intro)}</p>
      <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.55;">${escapeHtml(copy.bridge)}</p>
      <p style="margin:0 0 12px;color:#1a1a1a;font-size:17px;font-weight:700;">${escapeHtml(copy.title)}</p>
      <table role="presentation" width="100%" style="margin:0 0 18px;">${bulletRows(copy.bullets)}</table>
      <p style="margin:0 0 18px;color:#333;font-size:15px;line-height:1.5;">${escapeHtml(copy.cta)}</p>
      <p style="margin:0;font-size:13px;">
        <a href="${escapeHtml(servicesDevUrl)}" style="color:#c41e3a;text-decoration:none;font-weight:600;">${escapeHtml(copy.servicesDev)}</a>
        &nbsp;·&nbsp;
        <a href="${escapeHtml(servicesAiUrl)}" style="color:#c41e3a;text-decoration:none;font-weight:600;">${escapeHtml(copy.servicesAi)}</a>
        &nbsp;·&nbsp;
        <a href="${escapeHtml(homeUrl)}" style="color:#c41e3a;text-decoration:none;font-weight:600;">${escapeHtml(copy.home)}</a>
      </p>
    `

    return {
      subject,
      text: textParts.join('\n'),
      html: shellHtml({
        locale,
        dir,
        subject,
        preheader: copy.preheader,
        brand: copy.brand,
        headline: subject,
        bodyInner,
        unsubscribeUrl,
      }),
      unsubscribeUrl,
    }
  }

  const copy = proCopy(locale)
  const subject = copy.subject(email)
  const textParts = [
    copy.intro,
    copy.validity,
    '',
    copy.proTitle,
    ...copy.proBullets.map((b) => `• ${b}`),
    '',
    locale === 'ru'
      ? `${copy.priceBadge} вместо ₪${PRO_LIST_PRICE} · ${copy.priceNote}`
      : locale === 'he'
        ? `${copy.priceBadge} במקום ₪${PRO_LIST_PRICE} · ${copy.priceNote}`
        : `${copy.priceBadge} instead of ₪${PRO_LIST_PRICE} · ${copy.priceNote}`,
    `${copy.cta}: ${input.checkoutUrl}`,
  ]
  if (input.reportUrl) textParts.push('', `${copy.reportCta}: ${input.reportUrl}`)
  if (input.orderId) textParts.push('', `Order: ${input.orderId}`)
  textParts.push('', copy.close, `${unsubLabel}: ${unsubscribeUrl}`, '', copy.brand)

  const reportBlock = input.reportUrl
    ? `<p style="margin:0 0 16px;"><a href="${escapeHtml(input.reportUrl)}" style="color:#c41e3a;font-size:14px;font-weight:600;">${escapeHtml(copy.reportCta)} →</a></p>`
    : ''

  const bodyInner = `
    <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.55;">${escapeHtml(copy.intro)}</p>
    <table role="presentation" width="100%" style="background:#fff5f6;border:1px solid #f0c9cf;border-radius:12px;margin:0 0 20px;">
      <tr><td style="padding:16px 18px;">
        <p style="margin:0 0 2px;color:#9a9a9a;font-size:13px;font-weight:600;line-height:1.2;text-decoration:line-through;">₪${PRO_LIST_PRICE}</p>
        <p style="margin:0 0 4px;color:#c41e3a;font-size:28px;font-weight:800;line-height:1.1;">${escapeHtml(copy.priceBadge)}</p>
        <p style="margin:0 0 8px;color:#555;font-size:14px;">${escapeHtml(copy.priceNote)}</p>
        <p style="margin:0;color:#7a1f2b;font-size:13px;font-weight:600;">${escapeHtml(copy.validity)}</p>
      </td></tr>
    </table>
    ${reportBlock}
    <p style="margin:0 0 12px;color:#1a1a1a;font-size:17px;font-weight:700;">${escapeHtml(copy.proTitle)}</p>
    <table role="presentation" width="100%" style="margin:0 0 22px;">${bulletRows(copy.proBullets)}</table>
    <table role="presentation" width="100%" style="margin:0 0 20px;">
      <tr><td align="center">
        <a href="${escapeHtml(input.checkoutUrl)}"
           style="display:inline-block;background:#c41e3a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:16px;font-weight:700;">
          ${escapeHtml(copy.cta)}
        </a>
      </td></tr>
      <tr><td align="center" style="padding-top:10px;">
        <a href="${escapeHtml(input.checkoutUrl)}" style="color:#888;font-size:12px;word-break:break-all;">${escapeHtml(input.checkoutUrl)}</a>
      </td></tr>
    </table>
    <p style="margin:0;color:#555;font-size:14px;">${escapeHtml(copy.close)}</p>
    ${input.orderId ? `<p style="margin:12px 0 0;color:#999;font-size:12px;"><code dir="ltr">${escapeHtml(input.orderId)}</code></p>` : ''}
  `

  return {
    subject,
    text: textParts.join('\n'),
    html: shellHtml({
      locale,
      dir,
      subject,
      preheader: copy.preheader,
      brand: copy.brand,
      headline: subject,
      bodyInner,
      unsubscribeUrl,
    }),
    unsubscribeUrl,
  }
}

/**
 * Pro-offer field writes must bypass Payload `update` — existing large
 * `html_result` fails textarea re-validation (PIT-035 / audit internal PATCH).
 */
async function patchProOfferFieldsSql(
  payload: Payload,
  submissionId: number | string,
  fields: {
    proOfferStatus?: ProOfferStatus
    proOfferDueAt?: string | null
    proOfferSentAt?: string | null
    proOfferExpiresAt?: string | null
    proOfferNudgeDueAt?: string | null
    proOfferNudgeSentAt?: string | null
    proOfferReminderDueAt?: string | null
    proOfferReminderSentAt?: string | null
  },
): Promise<void> {
  const id = typeof submissionId === 'string' ? Number(submissionId) : submissionId
  if (!Number.isFinite(id)) {
    throw new Error(`Invalid submission id for pro-offer SQL patch: ${submissionId}`)
  }

  const sets: ReturnType<typeof sql>[] = []
  if (typeof fields.proOfferStatus === 'string') {
    sets.push(sql`pro_offer_status = ${fields.proOfferStatus}`)
  }
  if (fields.proOfferDueAt !== undefined) {
    sets.push(
      fields.proOfferDueAt === null
        ? sql`pro_offer_due_at = null`
        : sql`pro_offer_due_at = ${fields.proOfferDueAt}::timestamptz`,
    )
  }
  if (fields.proOfferSentAt !== undefined) {
    sets.push(
      fields.proOfferSentAt === null
        ? sql`pro_offer_sent_at = null`
        : sql`pro_offer_sent_at = ${fields.proOfferSentAt}::timestamptz`,
    )
  }
  if (fields.proOfferExpiresAt !== undefined) {
    sets.push(
      fields.proOfferExpiresAt === null
        ? sql`pro_offer_expires_at = null`
        : sql`pro_offer_expires_at = ${fields.proOfferExpiresAt}::timestamptz`,
    )
  }
  if (fields.proOfferNudgeDueAt !== undefined) {
    sets.push(
      fields.proOfferNudgeDueAt === null
        ? sql`pro_offer_nudge_due_at = null`
        : sql`pro_offer_nudge_due_at = ${fields.proOfferNudgeDueAt}::timestamptz`,
    )
  }
  if (fields.proOfferNudgeSentAt !== undefined) {
    sets.push(
      fields.proOfferNudgeSentAt === null
        ? sql`pro_offer_nudge_sent_at = null`
        : sql`pro_offer_nudge_sent_at = ${fields.proOfferNudgeSentAt}::timestamptz`,
    )
  }
  if (fields.proOfferReminderDueAt !== undefined) {
    sets.push(
      fields.proOfferReminderDueAt === null
        ? sql`pro_offer_reminder_due_at = null`
        : sql`pro_offer_reminder_due_at = ${fields.proOfferReminderDueAt}::timestamptz`,
    )
  }
  if (fields.proOfferReminderSentAt !== undefined) {
    sets.push(
      fields.proOfferReminderSentAt === null
        ? sql`pro_offer_reminder_sent_at = null`
        : sql`pro_offer_reminder_sent_at = ${fields.proOfferReminderSentAt}::timestamptz`,
    )
  }
  if (!sets.length) return

  sets.push(sql`updated_at = now()`)
  let setSql = sets[0]!
  for (let i = 1; i < sets.length; i++) {
    setSql = sql`${setSql}, ${sets[i]!}`
  }

  await payload.db.drizzle.execute(
    sql`update contact_submissions set ${setSql} where id = ${id}`,
  )
}

async function sendViaTeamSmtp(
  to: string,
  content: { subject: string; text: string; html: string },
  options: { listUnsubscribeUrl?: string } = {},
): Promise<void> {
  const pass = process.env.TEAM_SMTP_PASS?.trim()
  if (!pass) {
    throw new Error('TEAM_SMTP_PASS is not set (Hostinger password for team@erythro.ai)')
  }
  const host = process.env.SMTP_HOST?.trim() || 'smtp.hostinger.com'
  const portRaw = process.env.SMTP_PORT?.trim()
  const port = portRaw && Number.isFinite(Number(portRaw)) ? Number(portRaw) : 465
  const nodemailer = await import('nodemailer')
  const createTransport = nodemailer.createTransport ?? nodemailer.default.createTransport
  const listUnsub = options.listUnsubscribeUrl?.trim()

  const sendWith = async (usePort: number, secure: boolean) => {
    const transporter = createTransport({
      host,
      port: usePort,
      secure,
      auth: { user: TEAM_MAILBOX, pass },
      connectionTimeout: 10_000,
      greetingTimeout: 8_000,
      socketTimeout: 15_000,
    })
    await transporter.sendMail({
      from: `"Erythro.ai" <${TEAM_MAILBOX}>`,
      to,
      replyTo: TEAM_MAILBOX,
      subject: content.subject,
      text: content.text,
      html: content.html,
      envelope: { from: TEAM_MAILBOX, to: [to] },
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
        'X-Mailer': 'Erythro.ai ads funnel',
        ...(listUnsub ? { 'List-Unsubscribe': `<${listUnsub}>` } : {}),
      },
    })
  }

  try {
    await sendWith(port, port === 465)
  } catch (firstErr) {
    if (port === 465) {
      await sendWith(587, false)
      return
    }
    throw firstErr
  }
}

function resolveDocLocale(doc: {
  auditSummary?: unknown
  auditLanguage?: string | null
  locale?: string | null
}): OfferLocale {
  const summary =
    doc.auditSummary && typeof doc.auditSummary === 'object' && !Array.isArray(doc.auditSummary)
      ? (doc.auditSummary as { reportLang?: unknown; locale?: unknown })
      : null
  const reportLangFromSummary =
    typeof summary?.reportLang === 'string'
      ? summary.reportLang
      : typeof summary?.locale === 'string'
        ? summary.locale
        : null
  return resolveProOfferLocale({
    reportLang: reportLangFromSummary,
    auditLanguage: typeof doc.auditLanguage === 'string' ? doc.auditLanguage : null,
    locale: typeof doc.locale === 'string' ? doc.locale : null,
  })
}

export type SendProOfferResult =
  | {
      ok: true
      status: 'sent' | 'nudge_sent' | 'reminder_sent' | 'already_sent' | 'skipped'
      reason?: string
    }
  | { ok: false; reason: string }

/**
 * First commercial email (+15m). Ads LP free audits only.
 * Skips if email already has Pro / Diagnostic pending|paid.
 */
export async function trySendAuditProOffer(
  submissionId: number | string,
  options: { force?: boolean } = {},
): Promise<SendProOfferResult> {
  if (!isAuditProOfferEnabled()) {
    return { ok: true, status: 'skipped', reason: 'paused_pending_approval' }
  }

  if (!process.env.TEAM_SMTP_PASS?.trim()) {
    return { ok: false, reason: 'TEAM_SMTP_PASS not set' }
  }

  const payload = await getPayload({ config })
  const doc = await payload.findByID({
    collection: 'contact-submissions',
    id: submissionId,
    depth: 0,
    overrideAccess: true,
  })

  if (!doc || doc.source !== 'audit') {
    return { ok: false, reason: 'not_found' }
  }

  const status = (doc.proOfferStatus as ProOfferStatus | null) || 'none'
  if (status === 'sent' || status === 'nudge_sent' || status === 'reminder_sent') {
    return { ok: true, status: 'already_sent' }
  }

  if (doc.leadChannel !== 'meta_ads') {
    await patchProOfferFieldsSql(payload, submissionId, { proOfferStatus: 'skipped' })
    return { ok: true, status: 'skipped', reason: 'not_ads_lp' }
  }

  const planSlug = typeof doc.planSlug === 'string' ? doc.planSlug : ''
  if (!isFreeAuditPlanSlug(planSlug)) {
    await patchProOfferFieldsSql(payload, submissionId, { proOfferStatus: 'skipped' })
    return { ok: true, status: 'skipped', reason: 'not_free_plan' }
  }

  if (doc.auditStatus !== 'report_sent') {
    return { ok: false, reason: 'report_not_ready' }
  }

  if (!options.force && status === 'scheduled' && doc.proOfferDueAt) {
    const due = new Date(doc.proOfferDueAt).getTime()
    if (Number.isFinite(due) && due > Date.now()) {
      return { ok: false, reason: 'not_due_yet' }
    }
  }

  if (status !== 'scheduled' && status !== 'none' && !options.force) {
    return { ok: true, status: 'skipped', reason: `status_${status}` }
  }

  const email = typeof doc.email === 'string' ? doc.email.trim() : ''
  if (!isUsableEmail(email)) {
    await patchProOfferFieldsSql(payload, submissionId, { proOfferStatus: 'skipped' })
    return { ok: true, status: 'skipped', reason: 'no_email' }
  }

  if (await emailHasPaidAuditFunnelOrder(email, submissionId)) {
    await patchProOfferFieldsSql(payload, submissionId, { proOfferStatus: 'skipped' })
    return { ok: true, status: 'skipped', reason: 'already_ordered_paid_audit' }
  }

  if (await isMailUnsubscribed(email)) {
    await patchProOfferFieldsSql(payload, submissionId, { proOfferStatus: 'skipped' })
    return { ok: true, status: 'skipped', reason: 'unsubscribed' }
  }

  const locale = resolveDocLocale(doc)
  const now = Date.now()
  const expiresAt = computeProOfferExpiresAt(now)
  const expiresAtMs = new Date(expiresAt).getTime()
  const checkoutUrl = buildProOfferCheckoutUrl(locale, submissionId, expiresAtMs)
  const token =
    typeof doc.reportAccessToken === 'string' ? doc.reportAccessToken.trim() : ''
  const reportPath = token ? buildAuditReportPath(submissionId, token, locale) : null
  const reportUrl = reportPath ? `${SITE_URL}${reportPath}` : null
  const orderId = formatSubmissionTicketId('audit', submissionId)

  const mail = buildProOfferEmail({
    name: typeof doc.name === 'string' ? doc.name : '',
    email,
    locale,
    checkoutUrl,
    reportUrl,
    orderId,
    kind: 'offer',
  })

  try {
    await sendViaTeamSmtp(email, mail, { listUnsubscribeUrl: mail.unsubscribeUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[auditProOffer] send failed id=', submissionId, message)
    return { ok: false, reason: message.slice(0, 300) }
  }

  await patchProOfferFieldsSql(payload, submissionId, {
    proOfferStatus: 'sent',
    proOfferSentAt: new Date(now).toISOString(),
    proOfferExpiresAt: expiresAt,
    proOfferNudgeDueAt: computeProOfferNudgeDueAt(expiresAtMs),
    proOfferReminderDueAt: expiresAt,
  })

  return { ok: true, status: 'sent' }
}

/**
 * −24h before promo ends: urgency nudge. Ads LP only; skip if Pro/Diagnostic ordered.
 */
export async function trySendAuditProOfferNudge(
  submissionId: number | string,
  options: { force?: boolean } = {},
): Promise<SendProOfferResult> {
  if (!isAuditProOfferEnabled()) {
    return { ok: true, status: 'skipped', reason: 'paused_pending_approval' }
  }

  if (!process.env.TEAM_SMTP_PASS?.trim()) {
    return { ok: false, reason: 'TEAM_SMTP_PASS not set' }
  }

  const payload = await getPayload({ config })
  const doc = await payload.findByID({
    collection: 'contact-submissions',
    id: submissionId,
    depth: 0,
    overrideAccess: true,
  })

  if (!doc || doc.source !== 'audit') {
    return { ok: false, reason: 'not_found' }
  }

  const status = (doc.proOfferStatus as ProOfferStatus | null) || 'none'
  if (status === 'nudge_sent' || status === 'reminder_sent') {
    return { ok: true, status: 'already_sent' }
  }
  if (status === 'skipped') {
    return { ok: true, status: 'skipped', reason: 'skipped' }
  }
  if (status !== 'sent' && !options.force) {
    return { ok: false, reason: 'offer_not_sent_yet' }
  }

  if (doc.proOfferNudgeSentAt && !options.force) {
    return { ok: true, status: 'already_sent' }
  }

  if (!options.force && doc.proOfferNudgeDueAt) {
    const due = new Date(doc.proOfferNudgeDueAt).getTime()
    if (Number.isFinite(due) && due > Date.now()) {
      return { ok: false, reason: 'not_due_yet' }
    }
  }

  const email = typeof doc.email === 'string' ? doc.email.trim() : ''
  if (!isUsableEmail(email)) {
    return { ok: true, status: 'skipped', reason: 'no_email' }
  }

  if (await emailHasPaidAuditFunnelOrder(email, submissionId)) {
    await patchProOfferFieldsSql(payload, submissionId, { proOfferStatus: 'skipped' })
    return { ok: true, status: 'skipped', reason: 'already_ordered_paid_audit' }
  }

  if (await isMailUnsubscribed(email)) {
    await patchProOfferFieldsSql(payload, submissionId, { proOfferStatus: 'skipped' })
    return { ok: true, status: 'skipped', reason: 'unsubscribed' }
  }

  const locale = resolveDocLocale(doc)
  const expiresAtRaw =
    typeof doc.proOfferExpiresAt === 'string' ? Date.parse(doc.proOfferExpiresAt) : NaN
  const expiresAtMs = Number.isFinite(expiresAtRaw)
    ? expiresAtRaw
    : Date.now() + PRO_OFFER_NUDGE_BEFORE_MS
  const checkoutUrl = buildProOfferCheckoutUrl(locale, submissionId, expiresAtMs)
  const token =
    typeof doc.reportAccessToken === 'string' ? doc.reportAccessToken.trim() : ''
  const reportPath = token ? buildAuditReportPath(submissionId, token, locale) : null
  const reportUrl = reportPath ? `${SITE_URL}${reportPath}` : null
  const orderId = formatSubmissionTicketId('audit', submissionId)

  const mail = buildProOfferEmail({
    name: typeof doc.name === 'string' ? doc.name : '',
    email,
    locale,
    checkoutUrl,
    reportUrl,
    orderId,
    kind: 'nudge',
  })

  try {
    await sendViaTeamSmtp(email, mail, { listUnsubscribeUrl: mail.unsubscribeUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[auditProOffer] nudge failed id=', submissionId, message)
    return { ok: false, reason: message.slice(0, 300) }
  }

  await patchProOfferFieldsSql(payload, submissionId, {
    proOfferStatus: 'nudge_sent',
    proOfferNudgeSentAt: new Date().toISOString(),
  })

  return { ok: true, status: 'nudge_sent' }
}

/**
 * +72h: development offer after promo ends. Ads LP only; skip if Pro/Diagnostic ordered.
 */
export async function trySendAuditProOfferReminder(
  submissionId: number | string,
  options: { force?: boolean } = {},
): Promise<SendProOfferResult> {
  if (!isAuditProOfferEnabled()) {
    return { ok: true, status: 'skipped', reason: 'paused_pending_approval' }
  }

  if (!process.env.TEAM_SMTP_PASS?.trim()) {
    return { ok: false, reason: 'TEAM_SMTP_PASS not set' }
  }

  const payload = await getPayload({ config })
  const doc = await payload.findByID({
    collection: 'contact-submissions',
    id: submissionId,
    depth: 0,
    overrideAccess: true,
  })

  if (!doc || doc.source !== 'audit') {
    return { ok: false, reason: 'not_found' }
  }

  const status = (doc.proOfferStatus as ProOfferStatus | null) || 'none'
  if (status === 'reminder_sent') {
    return { ok: true, status: 'already_sent' }
  }
  if (status === 'skipped') {
    return { ok: true, status: 'skipped', reason: 'skipped' }
  }
  if (status !== 'sent' && status !== 'nudge_sent' && !options.force) {
    return { ok: false, reason: 'offer_not_sent_yet' }
  }

  if (doc.proOfferReminderSentAt && !options.force) {
    return { ok: true, status: 'already_sent' }
  }

  if (!options.force && doc.proOfferReminderDueAt) {
    const due = new Date(doc.proOfferReminderDueAt).getTime()
    if (Number.isFinite(due) && due > Date.now()) {
      return { ok: false, reason: 'not_due_yet' }
    }
  }

  const email = typeof doc.email === 'string' ? doc.email.trim() : ''
  if (!isUsableEmail(email)) {
    return { ok: true, status: 'skipped', reason: 'no_email' }
  }

  if (await emailHasPaidAuditFunnelOrder(email, submissionId)) {
    await patchProOfferFieldsSql(payload, submissionId, { proOfferStatus: 'skipped' })
    return { ok: true, status: 'skipped', reason: 'already_ordered_paid_audit' }
  }

  if (await isMailUnsubscribed(email)) {
    await patchProOfferFieldsSql(payload, submissionId, { proOfferStatus: 'skipped' })
    return { ok: true, status: 'skipped', reason: 'unsubscribed' }
  }

  const locale = resolveDocLocale(doc)
  const expiresAtRaw =
    typeof doc.proOfferExpiresAt === 'string' ? Date.parse(doc.proOfferExpiresAt) : NaN
  const expiresAtMs = Number.isFinite(expiresAtRaw)
    ? expiresAtRaw
    : Date.now() + PRO_OFFER_PROMO_MS
  const checkoutUrl = buildProOfferCheckoutUrl(locale, submissionId, expiresAtMs)
  const token =
    typeof doc.reportAccessToken === 'string' ? doc.reportAccessToken.trim() : ''
  const reportPath = token ? buildAuditReportPath(submissionId, token, locale) : null
  const reportUrl = reportPath ? `${SITE_URL}${reportPath}` : null
  const orderId = formatSubmissionTicketId('audit', submissionId)

  const mail = buildProOfferEmail({
    name: typeof doc.name === 'string' ? doc.name : '',
    email,
    locale,
    checkoutUrl,
    reportUrl,
    orderId,
    kind: 'reminder',
  })

  try {
    await sendViaTeamSmtp(email, mail, { listUnsubscribeUrl: mail.unsubscribeUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[auditProOffer] reminder failed id=', submissionId, message)
    return { ok: false, reason: message.slice(0, 300) }
  }

  await patchProOfferFieldsSql(payload, submissionId, {
    proOfferStatus: 'reminder_sent',
    proOfferReminderSentAt: new Date().toISOString(),
  })

  return { ok: true, status: 'reminder_sent' }
}

export async function sendDueAuditProOffers(limit = 20): Promise<{
  scanned: number
  results: Array<{ id: number | string; result: SendProOfferResult }>
}> {
  if (!isAuditProOfferEnabled()) {
    return { scanned: 0, results: [] }
  }

  const payload = await getPayload({ config })
  const nowIso = new Date().toISOString()
  const found = await payload.find({
    collection: 'contact-submissions',
    depth: 0,
    limit,
    overrideAccess: true,
    where: {
      and: [
        { source: { equals: 'audit' } },
        { leadChannel: { equals: 'meta_ads' } },
        { proOfferStatus: { equals: 'scheduled' } },
        { proOfferDueAt: { less_than_equal: nowIso } },
        { auditStatus: { equals: 'report_sent' } },
      ],
    },
    sort: 'proOfferDueAt',
  })

  const results: Array<{ id: number | string; result: SendProOfferResult }> = []
  for (const doc of found.docs) {
    results.push({ id: doc.id, result: await trySendAuditProOffer(doc.id) })
  }
  return { scanned: found.docs.length, results }
}

export async function sendDueAuditProOfferNudges(limit = 20): Promise<{
  scanned: number
  results: Array<{ id: number | string; result: SendProOfferResult }>
}> {
  if (!isAuditProOfferEnabled()) {
    return { scanned: 0, results: [] }
  }

  const payload = await getPayload({ config })
  const nowIso = new Date().toISOString()
  const found = await payload.find({
    collection: 'contact-submissions',
    depth: 0,
    limit,
    overrideAccess: true,
    where: {
      and: [
        { source: { equals: 'audit' } },
        { leadChannel: { equals: 'meta_ads' } },
        { proOfferStatus: { equals: 'sent' } },
        { proOfferNudgeDueAt: { less_than_equal: nowIso } },
        {
          or: [
            { proOfferNudgeSentAt: { equals: null } },
            { proOfferNudgeSentAt: { exists: false } },
          ],
        },
      ],
    },
    sort: 'proOfferNudgeDueAt',
  })

  const results: Array<{ id: number | string; result: SendProOfferResult }> = []
  for (const doc of found.docs) {
    results.push({ id: doc.id, result: await trySendAuditProOfferNudge(doc.id) })
  }
  return { scanned: found.docs.length, results }
}

export async function sendDueAuditProOfferReminders(limit = 20): Promise<{
  scanned: number
  results: Array<{ id: number | string; result: SendProOfferResult }>
}> {
  if (!isAuditProOfferEnabled()) {
    return { scanned: 0, results: [] }
  }

  const payload = await getPayload({ config })
  const nowIso = new Date().toISOString()
  const found = await payload.find({
    collection: 'contact-submissions',
    depth: 0,
    limit,
    overrideAccess: true,
    where: {
      and: [
        { source: { equals: 'audit' } },
        { leadChannel: { equals: 'meta_ads' } },
        { proOfferStatus: { in: ['sent', 'nudge_sent'] } },
        { proOfferReminderDueAt: { less_than_equal: nowIso } },
        {
          or: [
            { proOfferReminderSentAt: { equals: null } },
            { proOfferReminderSentAt: { exists: false } },
          ],
        },
      ],
    },
    sort: 'proOfferReminderDueAt',
  })

  const results: Array<{ id: number | string; result: SendProOfferResult }> = []
  for (const doc of found.docs) {
    results.push({ id: doc.id, result: await trySendAuditProOfferReminder(doc.id) })
  }
  return { scanned: found.docs.length, results }
}
