import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

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

export default function robots(): MetadataRoute.Robots {
  const aiAllowRules = AI_BOT_AGENTS.map((userAgent) => ({
    userAgent,
    allow: '/' as const,
    disallow: ['/admin', '/api/'] as const,
  }))

  return {
    rules: [
      ...aiAllowRules,
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/my-route'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
