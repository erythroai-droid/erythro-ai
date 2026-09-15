/**
 * Erythro side effects for the consultant: transcripts, briefs, technical
 * tickets, email and CRM. This is the only consultant file that knows about
 * Payload — the portable module in `src/lib/consultant/` receives these as
 * injected dependencies.
 */
import 'server-only'

import {
  resolveTechConsultRecipient,
  sendConsultantMail,
  CONTACT_MAILBOX,
} from './contactNotification'
import { createMondayProject } from './crm/monday'
import { formatSubmissionTicketId } from './submissionTicket'
import {
  escapeHtml,
  sanitizeBriefMarkdown,
  sanitizeHeaderValue,
  sanitizeText,
  type ConsultLocale,
  type ConsultMessage,
  type EscalateTechInput,
  type EscalateTechResult,
  type IdentifyClientInput,
  type SubmitBriefInput,
  type SubmitBriefResult,
} from './consultant'

type PayloadLike = {
  create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
  update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
  find: (args: Record<string, unknown>) => Promise<{ docs: Record<string, unknown>[] }>
  findGlobal: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
}

async function getPayloadClient(): Promise<PayloadLike> {
  const { getPayload } = await import('payload')
  const config = (await import('@payload-config')).default
  return (await getPayload({ config })) as unknown as PayloadLike
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Text-only body: no attachments and no links, per the brief rules. */
function textToHtml(body: string): string {
  return `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(body)}</pre>`
}

/**
 * Identity is rebuilt from the verified email on every request instead of
 * trusting anything the client echoes back.
 */
export async function resolveConsultIdentity(
  email: string,
): Promise<{ sessionId: number | null; phone: string | null }> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'consult-sessions',
      where: { email: { equals: email } },
      sort: '-createdAt',
      limit: 1,
      depth: 0,
    })
    const doc = docs[0]
    if (!doc) return { sessionId: null, phone: null }
    const id = typeof doc.id === 'number' ? doc.id : Number(doc.id)
    return {
      sessionId: Number.isFinite(id) ? id : null,
      phone: str(doc.phone) || null,
    }
  } catch (err) {
    console.error(
      '[consultantStore] identity lookup failed:',
      err instanceof Error ? err.message : String(err),
    )
    return { sessionId: null, phone: null }
  }
}

/**
 * Creates the transcript row. Called only after the email was confirmed by
 * one-time code and the storage notice was shown in the chat.
 */
export async function identifyClient(
  input: IdentifyClientInput & { ip?: string },
): Promise<{ sessionId: number | null }> {
  const payload = await getPayloadClient()
  const existing = await resolveConsultIdentity(input.email)
  const now = new Date().toISOString()

  if (existing.sessionId) {
    await payload.update({
      collection: 'consult-sessions',
      id: existing.sessionId,
      data: { phone: input.phone, messages: input.messages, identifiedAt: now },
    })
    return { sessionId: existing.sessionId }
  }

  const doc = await payload.create({
    collection: 'consult-sessions',
    data: {
      email: input.email,
      phone: input.phone,
      locale: input.locale,
      messages: input.messages,
      handoff: 'bot',
      emailVerifiedAt: now,
      identifiedAt: now,
      ...(input.ip ? { ip: input.ip } : {}),
    },
  })
  const id = typeof doc.id === 'number' ? doc.id : Number(doc.id)
  return { sessionId: Number.isFinite(id) ? id : null }
}

export async function persistSession(input: {
  sessionId: number
  messages: ConsultMessage[]
}): Promise<void> {
  const payload = await getPayloadClient()
  await payload.update({
    collection: 'consult-sessions',
    id: input.sessionId,
    data: { messages: input.messages },
  })
}

async function techRecipient(locale: ConsultLocale): Promise<string> {
  try {
    const payload = await getPayloadClient()
    const global = await payload.findGlobal({ slug: 'consultant-settings', locale, depth: 0 })
    return resolveTechConsultRecipient(str(global.techConsultantEmail))
  } catch {
    return CONTACT_MAILBOX
  }
}

/**
 * Non-standard technical question → ticket + mail to the specialist.
 * The client is answered by email; the widget deliberately has no thread.
 */
export async function escalateTech(input: EscalateTechInput): Promise<EscalateTechResult> {
  const payload = await getPayloadClient()
  const doc = await payload.create({
    collection: 'tech-consult-tickets',
    data: {
      email: input.email,
      locale: input.locale,
      question: input.question,
      excerpt: input.excerpt,
      status: 'open',
      ...(input.sessionId ? { session: input.sessionId } : {}),
    },
  })

  const ticketId =
    formatSubmissionTicketId('tech', doc.id as number | string) || `TC-${String(doc.id)}`
  await payload.update({
    collection: 'tech-consult-tickets',
    id: doc.id as number,
    data: { ticketNumber: ticketId },
  })

  const body = [
    `Тикет: ${ticketId}`,
    `Клиент: ${input.email}`,
    `Язык: ${input.locale}`,
    '',
    'Вопрос:',
    input.question,
    '',
    'Фрагмент переписки:',
    input.excerpt || '—',
  ].join('\n')

  const sent = await sendConsultantMail({
    to: await techRecipient(input.locale),
    replyTo: input.email,
    subject: `техконсультация #${ticketId}`,
    text: body,
    html: textToHtml(body),
  })

  if (sent.sent) {
    await payload.update({
      collection: 'tech-consult-tickets',
      id: doc.id as number,
      data: { emailedAt: new Date().toISOString() },
    })
  }

  return { ticketId }
}

/**
 * Order matters: insert → number → email to `order@` → CRM → status.
 * SMTP or CRM failures leave the row behind (`draft` / `crmStatus=pending`)
 * instead of dropping the interview.
 */
export async function submitBrief(input: SubmitBriefInput): Promise<SubmitBriefResult> {
  const payload = await getPayloadClient()
  const briefMarkdown = sanitizeBriefMarkdown(input.briefMarkdown)

  const doc = await payload.create({
    collection: 'project-briefs',
    data: {
      email: input.email,
      phone: input.phone,
      locale: input.locale,
      briefMarkdown,
      status: 'draft',
      crmStatus: 'pending',
      translaterStatus: input.translaterStatus,
      ...(input.name ? { name: sanitizeText(input.name, 120) } : {}),
      ...(input.company ? { company: sanitizeText(input.company, 120) } : {}),
      ...(input.sessionId ? { session: input.sessionId } : {}),
    },
  })

  const briefId = doc.id as number
  const projectNumber =
    formatSubmissionTicketId('brief', briefId) || `TZ-${String(briefId)}`
  // Subject wording is fixed — the team filters on it.
  const subject = `техническое задание на разработку проекта #${projectNumber}`

  await payload.update({
    collection: 'project-briefs',
    id: briefId,
    data: { projectNumber, subject },
  })

  const body = [
    `Проект: ${projectNumber}`,
    `Имя: ${input.name || '—'}`,
    `Компания: ${input.company || '—'}`,
    `Email: ${input.email}`,
    `Телефон: ${input.phone}`,
    `Язык: ${input.locale}`,
    '',
    briefMarkdown,
    '',
    'Файлы и референсы — в карточке проекта в CRM, в переписке их нет.',
  ].join('\n')

  // No copy to the client in v1.
  const sent = await sendConsultantMail({
    to: CONTACT_MAILBOX,
    replyTo: input.email,
    subject: sanitizeHeaderValue(subject, 200),
    text: body,
    html: textToHtml(body),
  })

  if (sent.sent) {
    await payload.update({
      collection: 'project-briefs',
      id: briefId,
      data: { status: 'sent', emailedAt: new Date().toISOString() },
    })
  }

  const crm = await createMondayProject({
    projectNumber,
    briefMarkdown,
    contact: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.company ? { company: input.company } : {}),
      email: input.email,
      phone: input.phone,
      locale: input.locale,
    },
  })

  await payload.update({
    collection: 'project-briefs',
    id: briefId,
    data: {
      crmStatus: crm.status,
      ...(crm.itemId ? { crmItemId: crm.itemId } : {}),
    },
  })

  return { projectNumber, crmStatus: crm.status, emailed: sent.sent }
}
