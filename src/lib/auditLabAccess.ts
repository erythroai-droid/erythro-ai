import { AGENT_SECRET_HEADER, AGENT_SIGNATURE_HEADER, signAgentBody } from '@/lib/agentAuth'
import { getAuditAgentBaseUrl } from '@/lib/auditAgentTrigger'

/**
 * Can the audit lab (the VPS worker IP) see the site, or does it get a bot challenge? (PIT-150)
 * Asked before a paid checkout: a paid client must not pay for an audit the lab cannot run.
 * The check runs on the worker, not here — Vercel IPs may pass a WAF that blocks the lab.
 */

export const AUDIT_LAB_IP = '46.202.155.56'

export type LabAccessResult =
  | { checked: true; blocked: false }
  | { checked: true; blocked: true; protection: string | null; status: string | null }
  | { checked: false; reason: string }

const TIMEOUT_MS = 25_000

/** Diagnostic, Pro and their promo variants; Free and the manual contact plan are not checked. */
export function isPaidAuditCheckoutSlug(slug: string | null | undefined): boolean {
  const s = String(slug || '').trim().toLowerCase()
  return s.startsWith('audit-') && s !== 'audit-free' && s !== 'audit-manual'
}

export async function checkLabAccess(targetUrl: string, timeoutMs = TIMEOUT_MS): Promise<LabAccessResult> {
  const secret = process.env.AGENT_SECRET_TOKEN?.trim()
  if (!secret) return { checked: false, reason: 'missing_agent_secret' }
  const body = JSON.stringify({ targetUrl })
  const signature = signAgentBody(body)
  try {
    const res = await fetch(`${getAuditAgentBaseUrl()}/api/check-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AGENT_SECRET_HEADER]: secret,
        ...(signature ? { [AGENT_SIGNATURE_HEADER]: signature } : {}),
      },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return { checked: false, reason: `http_${res.status}` }
    const data = (await res.json().catch(() => null)) as {
      blocked?: boolean
      protection?: string | null
      status?: string | null
    } | null
    if (!data || typeof data.blocked !== 'boolean') return { checked: false, reason: 'bad_response' }
    return data.blocked
      ? { checked: true, blocked: true, protection: data.protection ?? null, status: data.status ?? null }
      : { checked: true, blocked: false }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { checked: false, reason: message.includes('abort') || message.includes('timeout') ? 'timeout' : 'network_error' }
  }
}
