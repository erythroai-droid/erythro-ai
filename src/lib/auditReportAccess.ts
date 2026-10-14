import { randomBytes } from 'node:crypto'
import { timingSafeStringEqual } from '@/lib/agentAuth'

/** Opaque unguessable token for client report links (`?k=`). */
export function generateReportAccessToken(): string {
  return randomBytes(24).toString('base64url')
}

/** Accept base64url-ish tokens from query strings. */
export function parseReportAccessToken(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const token = raw.trim()
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return null
  return token
}

/**
 * Constant-time compare. Missing expected or provided token → false
 * (legacy rows without a token stay closed after deploy + backfill).
 */
export function reportAccessTokenMatches(
  expected: string | null | undefined,
  provided: string | null | undefined,
): boolean {
  if (typeof expected !== 'string' || !expected.trim()) return false
  if (typeof provided !== 'string' || !provided.trim()) return false
  return timingSafeStringEqual(expected.trim(), provided.trim())
}
