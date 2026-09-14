import { NextResponse } from 'next/server'
import { canonicalSiteOrigin, isVercelAppHost, requestHost } from '@/lib/vercelHost'

const SITE_URL = canonicalSiteOrigin()

/**
 * Content Signals (https://contentsignals.org/):
 * - search=yes — allow classic search indexing
 * - ai-input=yes — allow RAG / grounding / AI answers (matches llms.txt + MCP)
 * - ai-train=no — disallow model training / fine-tuning on site content
 */
const CONTENT_SIGNAL = 'ai-train=no, search=yes, ai-input=yes'

const AI_BOT_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'anthropic-ai',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'PerplexityBot',
] as const

const SHARED_DISALLOWS = ['/admin', '/api/'] as const

function appendRule(
  lines: string[],
  userAgent: string,
  options: { allow: boolean; disallow: readonly string[] },
): void {
  lines.push(`User-Agent: ${userAgent}`)
  lines.push(`Content-Signal: ${CONTENT_SIGNAL}`)
  if (options.allow) lines.push('Allow: /')
  for (const path of options.disallow) {
    lines.push(`Disallow: ${path}`)
  }
  lines.push('')
}

function vercelAppRobotsBody(): string {
  const lines: string[] = [
    'User-Agent: *',
    'Disallow: /',
    '',
  ]
  return lines.join('\n')
}

function productionRobotsBody(): string {
  const lines: string[] = []

  for (const userAgent of AI_BOT_AGENTS) {
    appendRule(lines, userAgent, { allow: true, disallow: SHARED_DISALLOWS })
  }

  appendRule(lines, '*', {
    allow: true,
    disallow: [...SHARED_DISALLOWS, '/my-route'],
  })

  lines.push(`Host: ${SITE_URL}`)
  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`)
  lines.push('')

  return lines.join('\n')
}

function robotsResponse(body: string, extraHeaders?: Record<string, string>) {
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': extraHeaders?.['Cache-Control'] || 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  })
}

/** Dynamic robots.txt with Content-Signal preferences (Next 15 has no robots.ts `other` field). */
export function GET(request?: Request) {
  const host = request ? requestHost(request.headers) : ''
  if (isVercelAppHost(host)) {
    return robotsResponse(vercelAppRobotsBody(), {
      'Cache-Control': 'public, max-age=300',
      'X-Robots-Tag': 'noindex, nofollow',
    })
  }

  return robotsResponse(productionRobotsBody())
}
