const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Hostinger mailbox used as SMTP From for contact-form notifications. */
export const CONTACT_MAILBOX = 'order@erythro.ai'
const HOSTINGER_SMTP_HOST = 'smtp.hostinger.com'
const HOSTINGER_SMTP_PORT = 465

export type ContactFormSource = 'contact' | 'order' | 'audit'

export type ContactNotificationInput = {
  name: string
  email: string
  phone?: string
  message: string
  locale?: string
  source?: ContactFormSource
  website?: string
  auditLanguage?: string
  planSlug?: string
  planTotal?: string
  /** Numeric CMS id; rendered as AUD-{id} for audit orders */
  submissionId?: number | string
}

export type SiteEmailSettings = {
  email?: string | null
  emails?: Array<{ label?: string | null; address?: string | null } | null> | null
  displayEmailFooter?: string | null
  displayEmailContacts?: string | null
  displayEmailLegal?: string | null
  notifyEmailContact?: string | null
  notifyEmailOrder?: string | null
}

export function isUsableEmail(value: string | null | undefined): value is string {
  return Boolean(value && EMAIL_RE.test(value.trim()))
}

export function listSiteEmailAddresses(settings?: SiteEmailSettings | null): string[] {
  const out: string[] = []
  const add = (value: string | null | undefined) => {
    const email = value?.trim()
    if (!isUsableEmail(email)) return
    const key = email.toLowerCase()
    if (!out.some((item) => item.toLowerCase() === key)) out.push(email)
  }
  if (Array.isArray(settings?.emails)) {
    for (const row of settings.emails) add(row?.address)
  }
  add(settings?.email)
  return out
}

function firstSiteEmail(settings?: SiteEmailSettings | null): string {
  return listSiteEmailAddresses(settings)[0] || CONTACT_MAILBOX
}

export function resolveDisplayEmail(
  settings: SiteEmailSettings | null | undefined,
  surface: 'footer' | 'contacts' | 'legal',
): string {
  const pick =
    surface === 'footer'
      ? settings?.displayEmailFooter
      : surface === 'contacts'
        ? settings?.displayEmailContacts
        : settings?.displayEmailLegal
  if (isUsableEmail(pick)) return pick.trim()
  if (isUsableEmail(settings?.email)) return settings!.email!.trim()
  return firstSiteEmail(settings)
}

/** Inbox for a form source. CMS notify field wins; env is fallback only when CMS is empty. */
export function resolveNotifyRecipients(
  settings?: SiteEmailSettings | string | null,
  source: ContactFormSource = 'contact',
): string[] {
  const recipients: string[] = []
  const add = (value: string | null | undefined) => {
    const email = value?.trim()
    if (!isUsableEmail(email)) return
    const key = email.toLowerCase()
    if (!recipients.some((item) => item.toLowerCase() === key)) recipients.push(email)
  }

  if (typeof settings === 'string' || settings == null) {
    add(typeof settings === 'string' ? settings : null)
    add(process.env.CONTACT_NOTIFY_EMAIL)
    if (!recipients.length) add(CONTACT_MAILBOX)
    return recipients
  }

  const primary =
    source === 'order' || source === 'audit'
      ? settings.notifyEmailOrder || settings.notifyEmailContact
      : settings.notifyEmailContact
  add(primary)
  if (!recipients.length) {
    add(settings.displayEmailFooter)
    add(settings.email)
    add(firstSiteEmail(settings))
  }
  if (!recipients.length) add(process.env.CONTACT_NOTIFY_EMAIL)
  if (!recipients.length) add(CONTACT_MAILBOX)
  return recipients
}

/** @deprecated use resolveNotifyRecipients */
export function resolveNotifyEmail(
  settingsEmail?: string | null,
  source: ContactFormSource = 'contact',
): string {
  return resolveNotifyRecipients(settingsEmail, source)[0] || CONTACT_MAILBOX
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildContactEmail(input: ContactNotificationInput): { subject: string; text: string; html: string } {
  const source = input.source === 'order' ? 'order' : input.source === 'audit' ? 'audit' : 'contact'
  const subject =
    source === 'order'
      ? `Erythro.ai order inquiry: ${input.name}`
      : source === 'audit'
        ? `Erythro.ai AI audit: ${input.name}`
        : `Erythro.ai contact: ${input.name}`
  const lines = [
    `Source: ${source}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone?.trim() || '—'}`,
    `Locale: ${input.locale || '—'}`,
  ]
  if (source === 'audit') {
    lines.push(`Website: ${input.website?.trim() || '—'}`)
    lines.push(`Report language: ${input.auditLanguage || '—'}`)
    lines.push(`Plan: ${input.planSlug?.trim() || '—'}`)
    if (input.planTotal?.trim()) lines.push(`Total: ${input.planTotal.trim()}`)
    if (input.submissionId != null && String(input.submissionId).trim()) {
      lines.push(`Order ID: AUD-${String(input.submissionId).trim()}`)
    }
  }
  lines.push('', input.message)
  const text = lines.join('\n')
  const auditRows =
    source === 'audit'
      ? `
    <p><strong>Website:</strong> ${escapeHtml(input.website?.trim() || '—')}</p>
    <p><strong>Report language:</strong> ${escapeHtml(input.auditLanguage || '—')}</p>
    <p><strong>Plan:</strong> ${escapeHtml(input.planSlug?.trim() || '—')}</p>
    ${input.planTotal?.trim() ? `<p><strong>Total:</strong> ${escapeHtml(input.planTotal.trim())}</p>` : ''}
    ${
      input.submissionId != null && String(input.submissionId).trim()
        ? `<p><strong>Order ID:</strong> <code>AUD-${escapeHtml(String(input.submissionId).trim())}</code></p>`
        : ''
    }
      `
      : ''
  const html = `
    <p><strong>Source:</strong> ${escapeHtml(source)}</p>
    <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(input.phone?.trim() || '—')}</p>
    <p><strong>Locale:</strong> ${escapeHtml(input.locale || '—')}</p>
    ${auditRows}
    <p><strong>Message:</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(input.message)}</pre>
  `.trim()
  return { subject, text, html }
}

function smtpHost(): string {
  return process.env.SMTP_HOST?.trim() || HOSTINGER_SMTP_HOST
}

function smtpUser(): string {
  return process.env.SMTP_USER?.trim() || CONTACT_MAILBOX
}

function smtpPort(): number {
  const raw = process.env.SMTP_PORT?.trim()
  if (raw && Number.isFinite(Number(raw))) return Number(raw)
  return HOSTINGER_SMTP_PORT
}

function fromAddress(): string {
  return (
    process.env.CONTACT_FROM_EMAIL?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    smtpUser()
  )
}

/** Hostinger often spam-folders bare From; a clear display name helps. */
function formatFromHeader(): string {
  const addr = fromAddress()
  if (addr.includes('<')) return addr
  return `"Erythro.ai" <${addr}>`
}

function formatReplyTo(name: string, email: string): string {
  const safeName = name.replace(/[\r\n"<>]/g, '').trim().slice(0, 80)
  if (!safeName) return email
  return `"${safeName}" <${email}>`
}

async function sendViaResend(
  to: string | string[],
  replyTo: string,
  content: ReturnType<typeof buildContactEmail>,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = formatFromHeader()
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required for Resend')
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      reply_to: replyTo,
      subject: content.subject,
      text: content.text,
      html: content.html,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
      },
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`)
  }
}

async function sendViaSmtp(
  to: string | string[],
  replyTo: string,
  content: ReturnType<typeof buildContactEmail>,
): Promise<void> {
  const host = smtpHost()
  const user = smtpUser()
  const pass = process.env.SMTP_PASS?.trim()
  const from = formatFromHeader()
  const envelopeFrom = fromAddress().includes('<')
    ? fromAddress().replace(/^.*<([^>]+)>.*$/, '$1').trim()
    : fromAddress()
  if (!pass) {
    throw new Error('SMTP_PASS is required (Hostinger mailbox password for order@erythro.ai)')
  }
  const port = smtpPort()
  const nodemailer = await import('nodemailer')
  const createTransport = nodemailer.createTransport ?? nodemailer.default.createTransport
  const recipients = Array.isArray(to) ? to : [to]

  const sendWith = async (usePort: number, secure: boolean) => {
    const transporter = createTransport({
      host,
      port: usePort,
      secure,
      auth: { user, pass },
    })
    await transporter.sendMail({
      from,
      to: recipients,
      replyTo,
      subject: content.subject,
      text: content.text,
      html: content.html,
      // Align envelope with authenticated mailbox (avoids SPF weirdness).
      envelope: { from: envelopeFrom, to: recipients },
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
        'X-Mailer': 'Erythro.ai contact form',
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

export async function sendContactNotification(
  to: string | string[],
  input: ContactNotificationInput,
): Promise<{ sent: boolean; reason?: string }> {
  const recipients = (Array.isArray(to) ? to : [to]).filter(isUsableEmail)
  if (!recipients.length) {
    return { sent: false, reason: 'invalid notify email' }
  }
  const content = buildContactEmail(input)
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim())
  const hasSmtp = Boolean(process.env.SMTP_PASS?.trim())

  if (!hasResend && !hasSmtp) {
    return {
      sent: false,
      reason: 'No mail transport: set SMTP_PASS (Hostinger order@erythro.ai) or RESEND_API_KEY',
    }
  }

  const replyTo = formatReplyTo(input.name, input.email)

  try {
    if (hasSmtp) await sendViaSmtp(recipients, replyTo, content)
    else await sendViaResend(recipients, replyTo, content)
    return { sent: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[contactNotification] send failed:', message)
    return { sent: false, reason: message }
  }
}
