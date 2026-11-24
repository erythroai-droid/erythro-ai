import React from 'react'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import BlogClient from '../../BlogClient'
import { BlogIndexJsonLd } from '@/components/blog/BlogPostJsonLd'
import { getCachedShellSiteContent } from '@/lib/getSiteContent'
import { getCachedPublishedBlogPosts } from '@/lib/blogCms'
import {
  BLOG_PAGE_SIZE,
  blogIndexHref,
  blogPageCount,
  blogUi,
  sliceBlogPage,
  tBlog,
} from '@/lib/blogPosts'
import { defaultShareImages } from '@/lib/ogImages'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

export const dynamic = 'force-static'
export const revalidate = 3600

type Props = { params: Promise<{ page: string }> }

export async function generateStaticParams() {
  const posts = await getCachedPublishedBlogPosts()
  const totalPages = blogPageCount(posts.length, BLOG_PAGE_SIZE)
  // Page 1 lives at /blog; only emit 2…N
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page: raw } = await params
  const pageNum = Number(raw)
  if (!Number.isInteger(pageNum) || pageNum < 2) {
    return { robots: { index: false, follow: true } }
  }

  const posts = await getCachedPublishedBlogPosts()
  const totalPages = blogPageCount(posts.length)
  if (pageNum > totalPages) {
    return { robots: { index: false, follow: true } }
  }

  const suffix = `${tBlog(blogUi.pageMetaSuffix, 'en')} ${pageNum}`
  const title = `${tBlog(blogUi.indexTitle, 'en')} — ${suffix} | Erythro.ai`
  const description = tBlog(blogUi.metaDescription, 'en')
  const path = blogIndexHref(pageNum)
  const { openGraphImages, twitterImages } = defaultShareImages(title)

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: 'Erythro.ai',
      type: 'website',
      images: openGraphImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: twitterImages,
    },
    robots: { index: true, follow: true },
  }
}

export default async function BlogPagedPage({ params }: Props) {
  const { page: raw } = await params
  const pageNum = Number(raw)
  if (!Number.isInteger(pageNum) || pageNum < 1) notFound()
  if (pageNum === 1) permanentRedirect('/blog')

  const [content, allPosts] = await Promise.all([
    getCachedShellSiteContent(),
    getCachedPublishedBlogPosts(),
  ])
  const totalPages = blogPageCount(allPosts.length)
  if (pageNum > totalPages) notFound()

  const { items, page, totalPages: pages } = sliceBlogPage(allPosts, pageNum)

  return (
    <>
      <BlogIndexJsonLd posts={items} locale="en" />
      <BlogClient
        initialLocale="en"
        content={content}
        posts={items}
        page={page}
        totalPages={pages}
        clientHydratePrefs
      />
    </>
  )
}
