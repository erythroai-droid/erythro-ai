import { getCachedPublishedBlogPosts, blogBodyPlain } from '@/lib/blogCms'
import { tBlog } from '@/lib/blogPosts'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** RSS 2.0 for classic SEO aggregators and some AI ingest pipelines. */
export async function GET() {
  const posts = await getCachedPublishedBlogPosts()
  const items = posts
    .map((post) => {
      const title = tBlog(post.title, 'en')
      const description = tBlog(post.excerpt, 'en') || blogBodyPlain(post, 'en').slice(0, 500)
      const link = `${SITE_URL}/blog/${post.slug}`
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date(post.updatedAt || Date.now()).toUTCString()
      return `    <item>
      <title>${xmlEscape(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${xmlEscape(description)}</description>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Erythro.ai Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>GEO, AI visibility, CRO, and engineering articles from Erythro.ai.</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
