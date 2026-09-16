/**
 * Wire protocol between `POST /api/consult` and the widget.
 *
 * Deliberately hand-rolled SSE instead of the AI SDK UI stream: the widget
 * ships as a plain CSS module with no SDK dependency, and the consultant needs
 * to push *side effects* (verification required, chip hand-off, brief number)
 * next to the text, not only token deltas.
 */

export type ConsultNoticeCode =
  | 'otp_required'
  | 'phone_required'
  | 'anon_quota_exhausted'
  | 'daily_quota_exhausted'
  | 'unconfigured'
  | 'rate_limited'

export type ConsultEscalationTarget = 'form' | 'whatsapp' | 'audit' | 'order'

export type ConsultAction =
  | { kind: 'escalate'; target: ConsultEscalationTarget; slug?: string }
  | { kind: 'brief_ready'; markdown: string }
  | { kind: 'brief_sent'; projectNumber: string; crmStatus: 'created' | 'pending' }
  | { kind: 'ticket_created'; ticketId: string }
  | { kind: 'identified'; sessionId: number | null }

export type ConsultEvent =
  | { type: 'text-delta'; delta: string }
  | { type: 'notice'; code: ConsultNoticeCode }
  | { type: 'action'; action: ConsultAction }
  | { type: 'error'; message: string }
  | { type: 'done' }

export const CONSULT_STREAM_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
}

export type ConsultEmitter = {
  emit: (event: ConsultEvent) => void
  close: () => Promise<void>
}

/** Server side: an SSE body plus a fire-and-forget emitter for tool callbacks. */
export function createConsultStream(): { body: ReadableStream<Uint8Array>; emitter: ConsultEmitter } {
  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()
  let closed = false
  // Tools emit synchronously from inside `execute`; serialise the writes so a
  // slow consumer cannot interleave half-written frames.
  let queue: Promise<unknown> = Promise.resolve()

  const emit = (event: ConsultEvent) => {
    if (closed) return
    queue = queue
      .then(() => writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)))
      .catch(() => {
        closed = true
      })
  }

  const close = async () => {
    if (closed) return
    emit({ type: 'done' })
    closed = true
    await queue.catch(() => {})
    await writer.close().catch(() => {})
  }

  return { body: readable, emitter: { emit, close } }
}

/** Single-shot SSE body for a refusal that never reaches the model. */
export function consultNoticeResponse(code: ConsultNoticeCode, status = 200): Response {
  const payload = [
    `data: ${JSON.stringify({ type: 'notice', code } satisfies ConsultEvent)}\n\n`,
    `data: ${JSON.stringify({ type: 'done' } satisfies ConsultEvent)}\n\n`,
  ].join('')
  return new Response(payload, { status, headers: CONSULT_STREAM_HEADERS })
}

/**
 * Client side: turns the SSE body into `ConsultEvent`s. Kept here (not in the
 * UI folder) so the protocol has exactly one definition.
 */
export async function* readConsultStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<ConsultEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const line = frame.split('\n').find((l) => l.startsWith('data: '))
        if (line) {
          try {
            yield JSON.parse(line.slice(6)) as ConsultEvent
          } catch {
            // Ignore malformed frames rather than killing the conversation.
          }
        }
        boundary = buffer.indexOf('\n\n')
      }
    }
  } finally {
    reader.releaseLock()
  }
}
