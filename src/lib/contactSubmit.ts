export const CONTACT_SUBMIT_TIMEOUT_MS = 30_000
export const WEBSITE_CHECK_TIMEOUT_MS = 8_000

export type ContactSubmitErrorBody = {
  message?: string
  reason?: string
}

export type ContactSubmitCopy = {
  error: string
  rateLimited: string
  captchaFailed: string
}

/** Localized client copy; cooldown 429 may already be in the user's language. */
export function contactSubmitErrorMessage(
  status: number,
  body: ContactSubmitErrorBody | null,
  copy: ContactSubmitCopy,
): string {
  if (status === 429) {
    if (body?.reason === 'domain_recent' || body?.reason === 'user_recent') {
      return body.message?.trim() || copy.rateLimited
    }
    return copy.rateLimited
  }
  if (status === 403) return copy.captchaFailed
  return copy.error
}

export async function readContactSubmitErrorBody(res: Response): Promise<ContactSubmitErrorBody | null> {
  return (await res.json().catch(() => null)) as ContactSubmitErrorBody | null
}

export function readContactSubmitTicketId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const rec = payload as { ticketId?: unknown; orderId?: unknown }
  if (typeof rec.ticketId === 'string' && rec.ticketId.trim()) return rec.ticketId.trim()
  if (typeof rec.orderId === 'string' && rec.orderId.trim()) return rec.orderId.trim()
  return null
}

export async function postContactForm(
  body: unknown,
  timeoutMs = CONTACT_SUBMIT_TIMEOUT_MS,
): Promise<Response> {
  return fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
}
