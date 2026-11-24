import React from 'react'
import type { Metadata } from 'next'
import BlogClient from './BlogClient'
import { BlogIndexJsonLd } from '@/components/blog/BlogPostJsonLd'
import { getCachedShellSiteContent } from '@/lib/getSiteContent'
import { getCachedPublishedBlogPosts } from '@/lib/blogCms'
import { blogUi, tBlog } from '@/lib/blogPosts'
import { defaultShareImages } from '@/lib/ogImages'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

/**
 * Full Route Cache / CDN: static HTML with ISR. Must not call cookies()/headers()
 * anywhere in this tree. Locale hydrates client-side (PIT-056).
 */
export const dynamic = 'force-static'
export const revalidate = 3600

const BLOG_TITLE = tBlog(blogUi.metaTitle, 'en')
const BLOG_DESCRIPTION = tBlog(blogUi.metaDescription, 'en')
const { openGraphImages, twitterImages } = defaultShareImages(BLOG_TITLE)

export const metadata: Metadata = {
  title: BLOG_TITLE,
  description: BLOG_DESCRIPTION,
  alternates: {
    canonical: '/blog',
    types: {
      'application/rss+xml': `${SITE_URL}/blog/rss.xml`,
    },
  },
  openGraph: {
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    url: `${SITE_URL}/blog`,
    siteName: 'Erythro.ai',
    type: 'website',
    images: openGraphImages,
  },
  twitter: {
    card: 'summary_large_image',
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    images: twitterImages,
  },
  robots: { index: true, follow: true },
}

export default async function BlogPage() {
  const [content, posts] = await Promise.all([
    getCachedShellSiteContent(),
    getCachedPublishedBlogPosts(),
  ])

  return (
    <>
      <BlogIndexJsonLd posts={posts} locale="en" />
      <BlogClient initialLocale="en" content={content} posts={posts} clientHydratePrefs />
    </>
  )
}
