import {
  AGENT_SECRET_HEADER,
  AGENT_SIGNATURE_HEADER,
  signAgentBody,
} from '@/lib/agentAuth'
import { checkWebsiteReachable } from '@/lib/checkWebsite'

/**
 * Fire-and-forget (or short-timeout) call to VPS audit worker after an audit lead is saved.
 * Never throws — failures are logged; the contact API must still succeed for the client.
 */

export type AuditAgentTriggerInput = {
  submissionId: number | string
  targetUrl: string
  locale?: string
  planSlug?: string
  clientEmail?: string
  clientName?: string
}

export type AuditAgentTriggerResult =
  | { ok: true; status: number }
  | { ok: false; reason: string }

export type TriggerAuditAgentOptions = {
  /** Default 2 so reconcile/cron survive a one-off timeout. Contact uses 1. */
  attempts?: number
}

const DEFAULT_AGENT_URL = 'https://agent-api.erythro.ai'
const DEFAULT_TIMEOUT_MS = 8_000
const RETRY_PAUSE_MS = 400

export function getAuditAgentBaseUrl(): string {
  return (
    process.env.AUDIT_AGENT_URL?.trim().replace(/\/+$/, '') ||
    DEFAULT_AGENT_URL
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function triggerTimeoutMs(): number {
  const n = Number(process.env.AUDIT_AGENT_TIMEOUT_MS)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS
}

function isRetryableReason(reason: string): boolean {
  if (reason === 'timeout' || reason === 'network_error') return true
  if (reason.startsWith('http_5')) return true
  return false
}

async function postRunAuditOnce(
  secret: string,
  input: AuditAgentTriggerInput,
  targetUrl: string,
): Promise<AuditAgentTriggerResult> {
  const url = `${getAuditAgentBaseUrl()}/api/run-audit`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), triggerTimeoutMs())

  const body = JSON.stringify({
    submissionId: input.submissionId,
    targetUrl,
    locale: input.locale || undefined,
    planSlug: input.planSlug || undefined,
    clientEmail: input.clientEmail || undefined,
    clientName: input.clientName || undefined,
  })
  const signature = signAgentBody(body)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AGENT_SECRET_HEADER]: secret,
        ...(signature ? { [AGENT_SIGNATURE_HEADER]: signature } : {}),
      },
      body,
      signal: controller.signal,
    })

    if (!res.ok && res.status !== 202) {
      const text = await res.text().catch(() => '')
      console.error(
        `[audit-agent] trigger failed status=${res.status} body=${text.slice(0, 300)}`,
      )
      return { ok: false, reason: `http_${res.status}` }
    }

    return { ok: true, status: res.status }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[audit-agent] trigger error:', message)
    return { ok: false, reason: message.includes('abort') ? 'timeout' : 'network_error' }
  } finally {
    clearTimeout(timer)
  }
}

export async function triggerAuditAgent(
  input: AuditAgentTriggerInput,
  options: TriggerAuditAgentOptions = {},
): Promise<AuditAgentTriggerResult> {
  const secret = process.env.AGENT_SECRET_TOKEN?.trim()
  if (!secret) {
    console.error('[audit-agent] AGENT_SECRET_TOKEN is not set — skip trigger')
    return { ok: false, reason: 'missing_agent_secret' }
  }

  const targetUrl = input.targetUrl?.trim()
  if (!targetUrl) {
    return { ok: false, reason: 'missing_target_url' }
  }

  const reachable = await checkWebsiteReachable(targetUrl)
  if (!reachable.ok) {
    console.error(`[audit-agent] SSRF/DNS block reason=${reachable.reason} url=${targetUrl}`)
    return { ok: false, reason: `ssrf_${reachable.reason}` }
  }

  const attempts = Math.max(1, Math.min(options.attempts ?? 2, 4))
  let last: AuditAgentTriggerResult = { ok: false, reason: 'network_error' }

  for (let i = 0; i < attempts; i++) {
    last = await postRunAuditOnce(secret, input, targetUrl)
    if (last.ok) return last
    if (!isRetryableReason(last.reason) || i === attempts - 1) return last
    await sleep(RETRY_PAUSE_MS)
  }

  return last
}
