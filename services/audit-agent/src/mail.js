/**
 * Send completed audit report email to the client (Hostinger SMTP order@erythro.ai).
 */

import nodemailer from 'nodemailer'

const MAILBOX = 'order@erythro.ai'

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function copyForLocale(locale) {
  if (locale === 'ru') {
    return {
      subject: (url) => `Ваш отчёт AI-аудита — ${url}`,
      greeting: (name) => `Здравствуйте${name ? `, ${name}` : ''}!`,
      body: 'Отчёт по вашему сайту готов. Открыть можно по ссылке ниже:',
      status: 'Страница статуса:',
      footer: 'Erythro.ai',
    }
  }
  if (locale === 'he') {
    return {
      subject: (url) => `דוח ביקורת AI מוכן — ${url}`,
      greeting: (name) => `שלום${name ? ` ${name}` : ''},`,
      body: 'הדוח עבור האתר שלך מוכן. ניתן לפתוח בקישור:',
      status: 'עמוד סטטוס:',
      footer: 'Erythro.ai',
    }
  }
  return {
    subject: (url) => `Your AI Audit report — ${url}`,
    greeting: (name) => `Hello${name ? `, ${name}` : ''},`,
    body: 'Your website audit report is ready. Open it here:',
    status: 'Status page:',
    footer: 'Erythro.ai',
  }
}

/**
 * @param {{
 *   to: string,
 *   clientName?: string,
 *   targetUrl: string,
 *   reportUrl: string,
 *   statusPageUrl: string,
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
  const host = process.env.SMTP_HOST?.trim() || 'smtp.hostinger.com'
  const port = Number(process.env.SMTP_PORT || 465)
  const user = process.env.SMTP_USER?.trim() || MAILBOX
  const fromName = process.env.CONTACT_FROM_NAME?.trim() || 'Erythro.ai'
  const from = `"${fromName}" <${MAILBOX}>`

  const subject = copy.subject(input.targetUrl)
  const text = [
    copy.greeting(input.clientName),
    '',
    copy.body,
    input.reportUrl,
    '',
    copy.status,
    input.statusPageUrl,
    '',
    copy.footer,
  ].join('\n')

  const html = `
    <p>${escapeHtml(copy.greeting(input.clientName))}</p>
    <p>${escapeHtml(copy.body)}</p>
    <p><a href="${escapeHtml(input.reportUrl)}">${escapeHtml(input.reportUrl)}</a></p>
    <p>${escapeHtml(copy.status)} <a href="${escapeHtml(input.statusPageUrl)}">${escapeHtml(input.statusPageUrl)}</a></p>
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
    },
  })

  return { sent: true }
}
