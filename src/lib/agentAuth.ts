import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Shared auth for Next ↔ audit-agent ↔ n8n.
 * Prefer HMAC (`x-agent-signature`) when a body is present; always require
 * `x-agent-secret-key` matching AGENT_SECRET_TOKEN (constant-time).
 */

export const AGENT_SECRET_HEADER = 'x-agent-secret-key'
export const AGENT_SIGNATURE_HEADER = 'x-agent-signature'

function secret(): string {
  return process.env.AGENT_SECRET_TOKEN?.trim() || ''
}

export function timingSafeStringEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function agentSecretAuthorized(headerValue: string | null | undefined): boolean {
  const expected = secret()
  if (!expected || typeof headerValue !== 'string') return false
  return timingSafeStringEqual(headerValue, expected)
}

/** HMAC-SHA256 hex of raw body bytes (or empty string). */
export function signAgentBody(rawBody: string | Buffer): string | null {
  const expected = secret()
  if (!expected) return null
  return createHmac('sha256', expected).update(rawBody).digest('hex')
}

export function verifyAgentSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
): boolean {
  if (typeof signatureHeader !== 'string' || !signatureHeader.trim()) return false
  const expected = signAgentBody(rawBody)
  if (!expected) return false
  const provided = signatureHeader.trim().toLowerCase().replace(/^sha256=/i, '')
  return timingSafeStringEqual(provided, expected)
}

/**
 * Authorize an internal audit request.
 * - Secret header is always required.
 * - When `requireSignature` and a body are provided, HMAC must match.
 */
export function authorizeAgentRequest(opts: {
  secretHeader: string | null | undefined
  signatureHeader?: string | null
  rawBody?: string | Buffer
  requireSignature?: boolean
}): boolean {
  if (!agentSecretAuthorized(opts.secretHeader)) return false
  if (!opts.requireSignature) return true
  if (opts.rawBody === undefined) return false
  return verifyAgentSignature(opts.rawBody, opts.signatureHeader)
}
