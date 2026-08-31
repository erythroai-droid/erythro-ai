/**
 * Send completed audit report email to the client (Hostinger SMTP order@erythro.ai).
 */

import nodemailer from 'nodemailer'

const MAILBOX = 'order@erythro.ai'
const SUPPORT_EMAIL = 'order@erythro.ai'

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatAuditOrderId(id) {
  const n = typeof id === 'number' ? id : Number(id)
  if (!Number.isSafeInteger(n) || n <= 0) return `AUD-${String(id).trim()}`
  return `AUD-${n}`
}

function copyForLocale(locale) {
  if (locale === 'ru') {
    return {
      subject: (url, orderId) => `Ваш отчёт AI-аудита (${orderId}) — ${url}`,
      greeting: (name) => `Здравствуйте${name ? `, ${name}` : ''}!`,
      body: 'Отчёт по вашему сайту готов. Открыть можно по ссылке ниже:',
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
      body: 'הדוח עבור האתר שלך מוכן. ניתן לפתוח בקישור:',
      orderIdLabel: 'מספר הזמנה',
      support: 'אם משהו לא עובד — פנו לתמיכה וציינו את מספר ההזמנה.',
      footer: 'Erythro.ai',
    }
  }
  return {
    subject: (url, orderId) => `Your AI Audit report (${orderId}) — ${url}`,
    greeting: (name) => `Hello${name ? `, ${name}` : ''},`,
    body: 'Your website audit report is ready. Open it here:',
    orderIdLabel: 'Order ID',
    support: 'If the link fails or something goes wrong, contact support and quote this Order ID.',
    footer: 'Erythro.ai',
  }
}

/**
 * @param {{
 *   to: string,
 *   clientName?: string,
 *   targetUrl: string,
 *   statusPageUrl: string,
 *   orderId: string | number,
 *   locale?: string,
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
  const copy = copyForLocale(locale)
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

  const html = `
    <p>${escapeHtml(copy.greeting(input.clientName))}</p>
    <p><strong>${escapeHtml(copy.orderIdLabel)}:</strong> <code>${escapeHtml(orderId)}</code></p>
    <p>${escapeHtml(copy.body)}</p>
    <p><a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></p>
    <p>${escapeHtml(copy.support)}<br/><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
    <p>${escapeHtml(copy.footer)}</p>
  `

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
    headers: {
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'All',
      'X-Mailer': 'Erythro.ai audit agent',
      'X-Erythro-Audit-Order-Id': orderId,
    },
  })

  return { sent: true, orderId }
}
