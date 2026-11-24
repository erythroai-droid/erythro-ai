import { bearerToken, timingSafeStringEqual } from '@/lib/agentAuth'

export const BLOG_API_TOKEN_HEADER = 'x-blog-api-token'

function expectedToken(): string {
  return process.env.BLOG_API_TOKEN?.trim() || ''
}

/** Authorize blog write/read API. Bearer or `x-blog-api-token`. */
export function blogApiAuthorized(headers: { get(name: string): string | null }): boolean {
  const expected = expectedToken()
  if (!expected) return false

  const fromHeader = headers.get(BLOG_API_TOKEN_HEADER)?.trim()
  if (fromHeader && timingSafeStringEqual(fromHeader, expected)) return true

  const bearer = bearerToken(headers.get('authorization'))
  if (bearer && timingSafeStringEqual(bearer, expected)) return true

  return false
}

export function blogApiTokenConfigured(): boolean {
  return Boolean(expectedToken())
}
