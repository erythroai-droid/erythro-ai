/**
 * Copy outbound team@ messages into Hostinger IMAP Sent (SMTP alone does not).
 * Failures are logged and swallowed — delivery already succeeded via SMTP.
 */
import { ImapFlow } from 'imapflow'
import MailComposer from 'nodemailer/lib/mail-composer/index.js'

const TEAM_MAILBOX = 'team@erythro.ai'
const SENT_CANDIDATES = ['INBOX.Sent', 'Sent', 'Sent Messages', 'Sent Items'] as const

function imapHost(): string {
  return process.env.IMAP_HOST?.trim() || 'imap.hostinger.com'
}

function imapPort(): number {
  const raw = process.env.IMAP_PORT?.trim()
  const n = raw ? Number(raw) : 993
  return Number.isFinite(n) ? n : 993
}

async function buildRawMessage(input: {
  to: string
  subject: string
  text: string
  html: string
  listUnsubscribeUrl?: string
}): Promise<Buffer> {
  const listUnsub = input.listUnsubscribeUrl?.trim()
  const composer = new MailComposer({
    from: `"Erythro.ai" <${TEAM_MAILBOX}>`,
    to: input.to,
    replyTo: TEAM_MAILBOX,
    subject: input.subject,
    text: input.text,
    html: input.html,
    headers: {
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'All',
      'X-Mailer': 'Erythro.ai ads funnel',
      ...(listUnsub ? { 'List-Unsubscribe': `<${listUnsub}>` } : {}),
    },
  })
  return composer.compile().build()
}

async function resolveSentPath(client: ImapFlow): Promise<string> {
  const boxes = await client.list()
  const paths = new Set(boxes.map((b) => b.path))
  for (const candidate of SENT_CANDIDATES) {
    if (paths.has(candidate)) return candidate
  }
  const bySpecial = boxes.find((b) => b.specialUse === '\\Sent')
  if (bySpecial?.path) return bySpecial.path
  return 'INBOX.Sent'
}

/**
 * Best-effort IMAP APPEND into team@ Sent after SMTP send.
 */
export async function appendTeamMailToSent(input: {
  to: string
  subject: string
  text: string
  html: string
  listUnsubscribeUrl?: string
}): Promise<void> {
  const pass = process.env.TEAM_SMTP_PASS?.trim()
  if (!pass) return

  const raw = await buildRawMessage(input)
  const client = new ImapFlow({
    host: imapHost(),
    port: imapPort(),
    secure: true,
    auth: { user: TEAM_MAILBOX, pass },
    logger: false,
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 15_000,
  })

  try {
    await client.connect()
    const mailbox = await resolveSentPath(client)
    await client.append(mailbox, raw, ['\\Seen'])
  } finally {
    try {
      await client.logout()
    } catch {
      client.close()
    }
  }
}

/** Fire-and-forget wrapper: never throws into the send path. */
export function appendTeamMailToSentSafe(
  input: {
    to: string
    subject: string
    text: string
    html: string
    listUnsubscribeUrl?: string
  },
  logLabel = 'team-mail-sent',
): void {
  void appendTeamMailToSent(input).catch((err) => {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[${logLabel}] IMAP Sent append failed:`, msg.slice(0, 240))
  })
}
