export type TicketSource = 'contact' | 'order' | 'audit' | 'brief' | 'tech'

const PREFIX: Record<TicketSource, string> = {
  contact: 'REQ',
  order: 'ORD',
  audit: 'AUD',
  // Consultant entities: technical brief and technical-consultation ticket.
  brief: 'TZ',
  tech: 'TC',
}

const TICKET_RE = /^(AUD|ORD|REQ|TZ|TC)-(.+)$/i

function ticketSource(source: string | undefined): TicketSource {
  if (source === 'order' || source === 'audit' || source === 'brief' || source === 'tech') {
    return source
  }
  return 'contact'
}

/** Client-facing ticket / order id, e.g. AUD-153, ORD-88, REQ-42, TZ-12, TC-7. */
export function formatSubmissionTicketId(
  source: string | undefined,
  id: number | string | null | undefined,
): string | null {
  if (id == null) return null
  const raw = typeof id === 'number' ? String(id) : String(id).trim()
  if (!raw) return null

  const existing = TICKET_RE.exec(raw)
  if (existing) return `${existing[1].toUpperCase()}-${existing[2]}`

  return `${PREFIX[ticketSource(source)]}-${raw}`
}
