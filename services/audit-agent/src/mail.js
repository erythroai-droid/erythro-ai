/**
 * Send completed audit report email to the client (Hostinger SMTP order@erythro.ai).
 */

import nodemailer from 'nodemailer'
import { buildAuditPdfFilename, formatAuditOrderId } from './pdfFilename.js'

const MAILBOX = 'order@erythro.ai'
const SUPPORT_EMAIL = 'order@erythro.ai'

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function copyForLocale(locale, withPdf) {
  if (locale === 'ru') {
    return {
      subject: (url, orderId) => `Ваш отчёт AI-аудита (${orderId}) — ${url}`,
      greeting: (name) => `Здравствуйте${name ? `, ${name}` : ''}!`,
      body: withPdf
        ? 'Готовый PDF во вложении. Открыть в браузере можно по ссылке:'
        : 'Отчёт по вашему сайту готов. Открыть можно по ссылке ниже:',
      orderIdLabel: 'ID заказа',
      support:
        'Если ссылка не открывается или возникла ошибка — напишите в поддержку и укажите этот ID заказа.',
      footer: 'Erythro.ai',
    }
  }
  if (locale === 'he') {
    return {
      subject: (url, orderId) => `דוח ביקורת AI (${orderId}) — ${url}`,
      greeting: (name) => `שלום${name ? ` ${name}` : ''},`,
      body: withPdf
        ? 'קובץ ה-PDF מצורף. אפשר גם לפתוח בדפדפן:'
        : 'הדוח עבור האתר שלך מוכן. ניתן לפתוח בקישור:',
      orderIdLabel: 'מספר הזמנה',
      support: 'אם משהו לא עובד — פנו לתמיכה וציינו את מספר ההזמנה.',
      footer: 'Erythro.ai',
    }
  }
  return {
    subject: (url, orderId) => `Your AI Audit report (${orderId}) — ${url}`,
    greeting: (name) => `Hello${name ? `, ${name}` : ''},`,
    body: withPdf
      ? 'The PDF is attached. You can also open it in the browser:'
      : 'Your website audit report is ready. Open it here:',
    orderIdLabel: 'Order ID',
    support: 'If the link fails or something goes wrong, contact support and quote this Order ID.',
    footer: 'Erythro.ai',
  }
}

// The site answered the lab with a bot challenge: no report, the link explains what to do (PIT-149)
const BLOCKED_COPY = {
  ru: {
    subject: (url, orderId) => `Аудит не выполнен (${orderId}) — ${url}`,
    body: 'Мы не смогли проверить сайт: он закрыт защитой от ботов. Что сделать, чтобы мы проверили его заново, — по ссылке:',
  },
  he: {
    subject: (url, orderId) => `הבדיקה לא בוצעה (${orderId}) — ${url}`,
    body: 'לא הצלחנו לבדוק את האתר: הוא מוגן מפני בוטים. מה לעשות כדי שנבדוק אותו מחדש — בקישור:',
  },
  en: {
    subject: (url, orderId) => `Audit not completed (${orderId}) — ${url}`,
    body: 'We could not check your site: it is behind bot protection. What to do so we can check it again:',
  },
}

// Paid order, site closed to the lab: not a report — the audit waits for access and starts by
// itself; the link is the order status page (PIT-150)
const WAITING_COPY = {
  ru: {
    subject: (url, orderId) => `Оплата получена — откройте доступ для аудита (${orderId}) — ${url}`,
    body: 'Оплата получена, но ваш сайт закрыт защитой от ботов, и лаборатория Erythro.ai не может его проверить. Добавьте IP 46.202.155.56 в allowlist вашей защиты (Cloudflare, AWS WAF, панель хостинга). Мы проверяем доступ каждые 30 минут и запустим аудит сразу, как он откроется; отчёт придёт на этот адрес. Статус заказа:',
  },
  he: {
    subject: (url, orderId) => `התשלום התקבל — פתחו גישה לביקורת (${orderId}) — ${url}`,
    body: 'התשלום התקבל, אבל האתר שלכם מוגן מפני בוטים והמעבדה של Erythro.ai לא יכולה לבדוק אותו. הוסיפו את ה-IP ‏46.202.155.56 לרשימת ההיתרים (allowlist) בהגנה שלכם (Cloudflare, AWS WAF, לוח הבקרה של האחסון). אנחנו בודקים את הגישה כל 30 דקות ונריץ את הביקורת ברגע שהיא תיפתח; הדוח יישלח לכתובת הזו. סטטוס ההזמנה:',
  },
  en: {
    subject: (url, orderId) => `Payment received — open access for the audit (${orderId}) — ${url}`,
    body: 'Payment received, but your site is behind bot protection and the Erythro.ai lab cannot check it. Add IP 46.202.155.56 to the allowlist of your protection (Cloudflare, AWS WAF, hosting panel). We check access every 30 minutes and start the audit as soon as it opens; the report will come to this address. Order status:',
  },
}

const TEAM_ALERT_TO = 'team@erythro.ai'

/**
 * Internal alert: a paid audit is waiting for the client to open access (PIT-150).
 * @param {{ orderId: string|number, targetUrl: string, planSlug?: string, clientEmail?: string, protection?: string, status?: string, expired?: boolean, statusPageUrl?: string }} input
 */
export async function sendTeamBlockedAlert(input) {
  const pass = process.env.SMTP_PASS?.trim()
  if (!pass) return { sent: false, reason: 'SMTP_PASS not set' }
  const orderId = formatAuditOrderId(input.orderId)
  const port = Number(process.env.SMTP_PORT || 465)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || 'smtp.hostinger.com',
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER?.trim() || MAILBOX, pass },
  })
  const head = input.expired
    ? `72 часа без доступа: платный аудит ${orderId} не выполнен`
    : `Платный аудит ${orderId} ждёт доступа: сайт закрыт защитой от ботов`
  const text = [
    head,
    '',
    `Сайт: ${input.targetUrl}`,
    `Тариф: ${input.planSlug || '—'}`,
    `Клиент: ${input.clientEmail || '—'}`,
    `Защита: ${input.protection || '—'} (${input.status || '—'})`,
    input.statusPageUrl ? `Статус заказа: ${input.statusPageUrl}` : '',
    '',
    input.expired
      ? 'Заказ переведён в failed. Свяжитесь с клиентом: доступ для IP 46.202.155.56, перезапуск из админки или возврат.'
      : 'Клиенту ушло письмо с просьбой добавить IP 46.202.155.56 в allowlist. Воркер проверяет доступ каждые 30 минут до 72 часов и сам запустит аудит.',
  ].filter((l) => l !== null).join('\n')
  await transporter.sendMail({
    from: `"Erythro.ai audit agent" <${MAILBOX}>`,
    to: TEAM_ALERT_TO,
    subject: `[audit] ${head} — ${input.targetUrl}`,
    text,
    envelope: { from: MAILBOX, to: [TEAM_ALERT_TO] },
    headers: { 'Auto-Submitted': 'auto-generated', 'X-Erythro-Audit-Order-Id': orderId },
  })
  return { sent: true }
}

/**
 * @param {{
 *   to: string,
 *   clientName?: string,
 *   targetUrl: string,
 *   statusPageUrl: string,
 *   orderId: string | number,
 *   locale?: string,
 *   planSlug?: string,
 *   pdfBuffer?: Buffer | Uint8Array | null,
 *   pdfFilename?: string,
 *   blocked?: boolean,
 *   waitingAccess?: boolean,
 * }} input
 */
export async function sendClientAuditEmail(input) {
  const pass = process.env.SMTP_PASS?.trim()
  if (!pass) {
    return { sent: false, reason: 'SMTP_PASS not set' }
  }
  const to = input.to?.trim()
  if (!to || !to.includes('@')) {
    return { sent: false, reason: 'invalid client email' }
  }

  const locale = input.locale || 'en'
  const pdfBuffer = input.blocked || input.waitingAccess ? null : input.pdfBuffer
  const withPdf = Boolean(pdfBuffer && pdfBuffer.length)
  const copyLang = locale === 'ru' || locale === 'he' ? locale : 'en'
  const copy = input.waitingAccess
    ? { ...copyForLocale(locale, false), ...WAITING_COPY[copyLang] }
    : input.blocked
      ? { ...copyForLocale(locale, false), ...BLOCKED_COPY[copyLang] }
      : copyForLocale(locale, withPdf)
  const orderId = formatAuditOrderId(input.orderId)
  const host = process.env.SMTP_HOST?.trim() || 'smtp.hostinger.com'
  const port = Number(process.env.SMTP_PORT || 465)
  const user = process.env.SMTP_USER?.trim() || MAILBOX
  const fromName = process.env.CONTACT_FROM_NAME?.trim() || 'Erythro.ai'
  const from = `"${fromName}" <${MAILBOX}>`
  const pageUrl = input.statusPageUrl?.trim()
  if (!pageUrl) {
    return { sent: false, reason: 'missing status page url' }
  }

  const subject = copy.subject(input.targetUrl, orderId)
  const text = [
    copy.greeting(input.clientName),
    '',
    `${copy.orderIdLabel}: ${orderId}`,
    '',
    copy.body,
    pageUrl,
    '',
    copy.support,
    SUPPORT_EMAIL,
    '',
    copy.footer,
  ].join('\n')

  const isRtl = locale === 'he'
  const dir = isRtl ? 'rtl' : 'ltr'
  const align = isRtl ? 'right' : 'left'
  // Table + inline styles: many clients ignore dir on bare <p>; URLs/IDs stay LTR.
  const html = `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}" dir="${dir}">
<body style="margin:0;padding:0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${dir}" style="direction:${dir};text-align:${align};">
    <tr>
      <td dir="${dir}" align="${align}" style="direction:${dir};text-align:${align};font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#111111;padding:16px;">
        <p style="margin:0 0 12px;text-align:${align};direction:${dir};">${escapeHtml(copy.greeting(input.clientName))}</p>
        <p style="margin:0 0 12px;text-align:${align};direction:${dir};"><strong>${escapeHtml(copy.orderIdLabel)}:</strong> <code dir="ltr" style="direction:ltr;unicode-bidi:isolate;">${escapeHtml(orderId)}</code></p>
        <p style="margin:0 0 12px;text-align:${align};direction:${dir};">${escapeHtml(copy.body)}</p>
        <p style="margin:0 0 12px;text-align:${align};"><a dir="ltr" style="direction:ltr;unicode-bidi:isolate;word-break:break-all;" href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></p>
        <p style="margin:0 0 12px;text-align:${align};direction:${dir};">${escapeHtml(copy.support)}<br/><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        <p style="margin:0;text-align:${align};direction:${dir};color:#666666;">${escapeHtml(copy.footer)}</p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
    envelope: { from: MAILBOX, to: [to] },
    attachments: withPdf
      ? [
          {
            filename:
              input.pdfFilename ||
              buildAuditPdfFilename({
                orderId: input.orderId,
                targetUrl: input.targetUrl,
                locale,
              }),
            content: Buffer.from(pdfBuffer),
            contentType: 'application/pdf',
          },
        ]
      : [],
    headers: {
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'All',
      'X-Mailer': 'Erythro.ai audit agent',
      'X-Erythro-Audit-Order-Id': orderId,
      ...(isRtl ? { 'Content-Language': 'he' } : {}),
    },
  })

  return { sent: true, orderId }
}
