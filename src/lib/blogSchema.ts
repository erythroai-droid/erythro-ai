import type { BlogPost } from '@/lib/blogPosts'
import { tBlog } from '@/lib/blogPosts'
import { blogBodyPlain } from '@/lib/blogCms'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${SITE_URL}${path}`
}

/** BlogPosting + BreadcrumbList for a published post (SEO + AI citation). */
export function buildBlogPostingSchema(post: BlogPost, locale: string) {
  const title = tBlog(post.seoTitle, locale) || tBlog(post.title, locale)
  const description =
    tBlog(post.seoDescription, locale) || tBlog(post.excerpt, locale) || blogBodyPlain(post, locale).slice(0, 300)
  const url = `${SITE_URL}/blog/${post.slug}`
  const image = post.cover?.src ? absoluteUrl(post.cover.src) : `${SITE_URL}/images/og-image.png`
  const datePublished = post.publishedAt || post.updatedAt || undefined
  const dateModified = post.updatedAt || post.publishedAt || undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    headline: title,
    description,
    image: [image],
    datePublished,
    dateModified,
    inLanguage: locale === 'ru' || locale === 'he' ? locale : 'en',
    isAccessibleForFree: true,
    keywords: post.tags.length ? post.tags.join(', ') : undefined,
    author: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Erythro.ai',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Erythro.ai',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    isPartOf: {
      '@type': 'Blog',
      '@id': `${SITE_URL}/blog#blog`,
      name: 'Erythro.ai Blog',
      url: `${SITE_URL}/blog`,
    },
  }
}

export function buildBlogBreadcrumbSchema(post: BlogPost, locale: string) {
  const title = tBlog(post.title, locale)
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${SITE_URL}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: `${SITE_URL}/blog/${post.slug}`,
      },
    ],
  }
}

export function buildBlogIndexSchema(posts: BlogPost[], locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE_URL}/blog#blog`,
    name: 'Erythro.ai Blog',
    description:
      locale === 'ru'
        ? 'Статьи Erythro.ai про GEO, AI-видимость, CRO и инженерию.'
        : locale === 'he'
          ? 'מאמרי Erythro.ai על GEO, נראות AI, CRO והנדסה.'
          : 'GEO, AI visibility, CRO, and engineering articles from Erythro.ai.',
    url: `${SITE_URL}/blog`,
    inLanguage: ['en', 'ru', 'he'],
    publisher: { '@id': `${SITE_URL}/#organization` },
    blogPost: posts.slice(0, 50).map((p) => ({
      '@type': 'BlogPosting',
      '@id': `${SITE_URL}/blog/${p.slug}#article`,
      headline: tBlog(p.title, locale),
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.publishedAt || undefined,
      description: tBlog(p.excerpt, locale),
    })),
  }
}
