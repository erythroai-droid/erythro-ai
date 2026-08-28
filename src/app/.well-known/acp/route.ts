import { NextResponse } from 'next/server'
import { buildAcpDiscoveryDocument } from '@/lib/agentDiscovery'

export const dynamic = 'force-static'

export function GET() {
  const doc = buildAcpDiscoveryDocument()
  return NextResponse.json(doc, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  })
}

export function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  })
}
