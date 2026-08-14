const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Hostinger mailbox used to send contact-form notifications. */
export const CONTACT_MAILBOX = 'order@erythro.ai'
const HOSTINGER_SMTP_HOST = 'smtp.hostinger.com'
const HOSTINGER_SMTP_PORT = 465

export type ContactNotificationInput = {
  name: string
  email: string
  phone?: string
  message: string
  locale?: string
}

export function isUsableEmail(value: string | null | undefined): value is string {
  return Boolean(value && EMAIL_RE.test(value.trim()))
}

/** Inbox list: Site Settings email plus Hostinger mailbox, de-duplicated. */
export function resolveNotifyRecipients(settingsEmail?: string | null): string[] {
  const recipients: string[] = []
  const add = (value: string | null | undefined) => {
    const email = value?.trim()
    if (!isUsableEmail(email)) return
    const key = email.toLowerCase()
    if (!recipients.some((item) => item.toLowerCase() === key)) recipients.push(email)
  }
  add(settingsEmail)
  add(process.env.CONTACT_NOTIFY_EMAIL)
  add(CONTACT_MAILBOX)
  return recipients
}

/** @deprecated use resolveNotifyRecipients */
export function resolveNotifyEmail(settingsEmail?: string | null): string {
  return resolveNotifyRecipients(settingsEmail)[0] || CONTACT_MAILBOX
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildContactEmail(input: ContactNotificationInput): { subject: string; text: string; html: string } {
  const subject = `Erythro.ai contact: ${input.name}`
  const lines = [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone?.trim() || '—'}`,
    `Locale: ${input.locale || '—'}`,
    '',
    input.message,
  ]
  const text = lines.join('\n')
  const html = `
    <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(input.phone?.trim() || '—')}</p>
    <p><strong>Locale:</strong> ${escapeHtml(input.locale || '—')}</p>
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

async function sendViaResend(to: string | string[], replyTo: string, content: ReturnType<typeof buildContactEmail>): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = fromAddress()
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
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`)
  }
}

async function sendViaSmtp(to: string | string[], replyTo: string, content: ReturnType<typeof buildContactEmail>): Promise<void> {
  const host = smtpHost()
  const user = smtpUser()
  const pass = process.env.SMTP_PASS?.trim()
  const from = fromAddress()
  if (!pass) {
    throw new Error('SMTP_PASS is required (Hostinger mailbox password for order@erythro.ai)')
  }
  const port = smtpPort()
  const nodemailer = await import('nodemailer')
  const createTransport = nodemailer.createTransport ?? nodemailer.default.createTransport

  const sendWith = async (usePort: number, secure: boolean) => {
    const transporter = createTransport({
      host,
      port: usePort,
      secure,
      auth: { user, pass },
    })
    await transporter.sendMail({
      from,
      to,
      replyTo,
      subject: content.subject,
      text: content.text,
      html: content.html,
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

  try {
    if (hasSmtp) await sendViaSmtp(recipients, input.email, content)
    else await sendViaResend(recipients, input.email, content)
    return { sent: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[contactNotification] send failed:', message)
    return { sent: false, reason: message }
  }
}
