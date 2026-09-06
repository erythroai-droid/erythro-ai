import { NextResponse } from 'next/server'

/**
 * RFC 9116 security.txt — vulnerability disclosure contact for researchers.
 * Served at `/.well-known/security.txt`.
 */
const SECURITY_TXT = [
  'Contact: mailto:order@erythro.ai',
  'Expires: 2027-01-01T00:00:00.000Z',
  'Preferred-Languages: en, ru',
  'Canonical: https://erythro.ai/.well-known/security.txt',
  '',
].join('\n')

const HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'public, max-age=86400',
  'Access-Control-Allow-Origin': '*',
} as const

export function GET() {
  return new NextResponse(SECURITY_TXT, { status: 200, headers: HEADERS })
}

export function HEAD() {
  return new NextResponse(null, { status: 200, headers: HEADERS })
}
