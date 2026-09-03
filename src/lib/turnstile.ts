import type { ContactFormSource } from '@/lib/contactNotification'

export const TURNSTILE_TOKEN_FIELD = 'cf-turnstile-response' as const
export const TURNSTILE_TOKEN_MAX_LEN = 2048
export const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export type TurnstileAction = ContactFormSource

type SiteverifyResult = {
  success?: boolean
  action?: string
  hostname?: string
  'error-codes'?: string[]
}

export function turnstileSecret(): string {
  return (process.env.TURNSTILE_SECRET || process.env.TURNSTILE_SECRET_KEY || '').trim()
}

/** Public widget sitekey. Browser inlining uses NEXT_PUBLIC_ (see next.config env map). */
export function turnstileSiteKey(): string {
  return (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY || '').trim()
}

/** Deployment-specific frontend hosts. Production must not include localhost. */
export function turnstileHostnames(): Set<string> {
  const fromEnv = (process.env.TURNSTILE_HOSTNAMES ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
  if (fromEnv.length) return new Set(fromEnv)

  if (process.env.NODE_ENV !== 'production') {
    return new Set(['localhost', '127.0.0.1'])
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'
  try {
    const host = new URL(site).hostname.toLowerCase().replace(/^www\./, '')
    return new Set([host, `www.${host}`])
  } catch {
    return new Set(['erythro.ai', 'www.erythro.ai'])
  }
}

export function turnstileActionFromBody(body: unknown): TurnstileAction {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'contact'
  const source = (body as Record<string, unknown>).source
  if (source === 'audit' || source === 'order' || source === 'contact') return source
  return 'contact'
}

export function readTurnstileToken(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return ''
  const raw = (body as Record<string, unknown>)[TURNSTILE_TOKEN_FIELD]
  return typeof raw === 'string' ? raw.trim() : ''
}

export type TurnstileVerifyFailure = {
  ok: false
  status: 403
  message: string
}

export type TurnstileVerifySuccess = { ok: true }

/**
 * Canonical Cloudflare siteverify. Tokens are single-use.
 * Skips only in non-production when no secret is configured (local without keys).
 */
export async function verifyTurnstileToken(input: {
  token: string
  action: TurnstileAction
  remoteip?: string
}): Promise<TurnstileVerifySuccess | TurnstileVerifyFailure> {
  const secret = turnstileSecret()
  const hostnames = turnstileHostnames()

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, status: 403, message: 'Verification failed' }
    }
    return { ok: true }
  }

  const { token, action, remoteip } = input
  if (!token || token.length > TURNSTILE_TOKEN_MAX_LEN || hostnames.size === 0) {
    return { ok: false, status: 403, message: 'Verification failed' }
  }

  let result: SiteverifyResult
  try {
    const r = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret,
        response: token,
        ...(remoteip ? { remoteip } : {}),
      }),
    })
    if (!r.ok) return { ok: false, status: 403, message: 'Verification failed' }
    result = (await r.json()) as SiteverifyResult
  } catch {
    return { ok: false, status: 403, message: 'Verification failed' }
  }

  const hostname = (result.hostname || '').toLowerCase()
  if (result.success !== true || result.action !== action || !hostnames.has(hostname)) {
    return { ok: false, status: 403, message: 'Verification failed' }
  }

  return { ok: true }
}
