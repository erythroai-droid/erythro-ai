import { NextResponse } from 'next/server'
import { buildOpenApiDocument } from '@/lib/agentDiscovery'

/** Machine-readable service description (rel=service-desc) for the public brand API. */
export function GET() {
  return NextResponse.json(buildOpenApiDocument(), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
