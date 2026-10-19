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
  const pdfBuffer = input.pdfBuffer
  const withPdf = Boolean(pdfBuffer && pdfBuffer.length)
  const copy = copyForLocale(locale, withPdf)
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
