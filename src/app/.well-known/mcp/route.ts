import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

/** SEP-1960-style MCP discovery manifest for AI agents. */
export async function GET() {
  const body = {
    mcp_version: '1.0',
    server_name: 'Erythro.ai Brand Info',
    server_version: '1.0.0',
    endpoints: {
      streamable_http: `${SITE_URL}/api/mcp`,
    },
    capabilities: {
      tools: false,
      resources: true,
      prompts: false,
      sampling: false,
      roots: false,
    },
    authentication: {
      required: false,
      methods: [] as string[],
    },
    documentation: `${SITE_URL}/llms.txt`,
    privacy_policy: `${SITE_URL}/privacy`,
    terms_of_service: `${SITE_URL}/terms`,
  }

  return NextResponse.json(body, {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
