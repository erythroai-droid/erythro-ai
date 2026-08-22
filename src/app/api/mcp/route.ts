import { NextResponse } from 'next/server'
import { getCachedSiteContent } from '@/lib/getSiteContent'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

/** Read-only brand facts for MCP-capable agents (no auth). */
export async function GET() {
  const content = await getCachedSiteContent()
  const site = content.siteSettings

  const sameAs = [site.facebook, site.tiktok].filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0,
  )

  return NextResponse.json(
    {
      name: 'Erythro.ai',
      url: SITE_URL,
      description:
        'Digital agency building high-performance websites, brand identity, and AI automation — from strategy to launch.',
      location: 'Eilat, Israel',
      email: site.emailContacts || site.email,
      phone: site.phoneDisplay || site.phone,
      services: ['Web development', 'Design & branding', 'AI automation', 'CMS', 'Motion & launch'],
      sameAs,
      canonicalPages: {
        about: `${SITE_URL}/about`,
        contacts: `${SITE_URL}/contacts`,
        privacy: `${SITE_URL}/privacy`,
        faq: `${SITE_URL}/#faq`,
        llmsTxt: `${SITE_URL}/llms.txt`,
      },
      correctionContact: site.emailContacts || site.email,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  )
}
