import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

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
  options: { disallow: readonly string[] },
): void {
  lines.push(`User-Agent: ${userAgent}`)
  lines.push(`Content-Signal: ${CONTENT_SIGNAL}`)
  lines.push('Allow: /')
  for (const path of options.disallow) {
    lines.push(`Disallow: ${path}`)
  }
  lines.push('')
}

/** Dynamic robots.txt with Content-Signal preferences (Next 15 has no robots.ts `other` field). */
export function GET() {
  const lines: string[] = []

  for (const userAgent of AI_BOT_AGENTS) {
    appendRule(lines, userAgent, { disallow: SHARED_DISALLOWS })
  }

  appendRule(lines, '*', {
    disallow: [...SHARED_DISALLOWS, '/my-route'],
  })

  lines.push(`Host: ${SITE_URL}`)
  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`)
  lines.push('')

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
