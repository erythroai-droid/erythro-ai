import { NextResponse } from 'next/server'
import {
  API_CATALOG_PROFILE,
  buildApiCatalogLinkset,
  HOMEPAGE_LINK_HEADER,
} from '@/lib/agentDiscovery'

/**
 * RFC 9727 api-catalog well-known URI.
 * Returns application/linkset+json (RFC 9264) with the RFC 9727 profile.
 */
export function GET() {
  return NextResponse.json(buildApiCatalogLinkset(), {
    headers: {
      'Content-Type': `application/linkset+json; profile="${API_CATALOG_PROFILE}"`,
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      // RFC 9727 §2: HEAD/GET responses may include the api-catalog Link relation.
      Link: HOMEPAGE_LINK_HEADER,
    },
  })
}
