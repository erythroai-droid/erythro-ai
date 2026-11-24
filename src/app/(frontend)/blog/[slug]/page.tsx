import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BlogPostClient from './BlogPostClient'
import { BlogPostJsonLd } from '@/components/blog/BlogPostJsonLd'
import FaqJsonLd from '@/components/FaqJsonLd'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import {
  getAllPublishedBlogSlugs,
  getBlogPostBySlug,
  getCachedPublishedBlogPosts,
} from '@/lib/blogCms'
import { tBlog } from '@/lib/blogPosts'
import { defaultShareImages, ogImageFields } from '@/lib/ogImages'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'
const DEFAULT_LOCALE = 'en'

export const dynamic = 'force-static'
export const revalidate = 3600

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPublishedBlogSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) {
    return { title: 'Post not found | Erythro.ai', robots: { index: false, follow: false } }
  }

  const title = tBlog(post.seoTitle, DEFAULT_LOCALE) || `${tBlog(post.title, DEFAULT_LOCALE)} | Blog | Erythro.ai`
  const description =
    tBlog(post.seoDescription, DEFAULT_LOCALE) || tBlog(post.excerpt, DEFAULT_LOCALE)
  const url = `${SITE_URL}/blog/${post.slug}`
  const ogImage = post.cover?.src || defaultShareImages(title).twitterImages[0]
  const share = ogImageFields(ogImage, tBlog(post.title, DEFAULT_LOCALE))

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: tBlog(post.seoTitle, DEFAULT_LOCALE) || `${tBlog(post.title, DEFAULT_LOCALE)} | Erythro.ai`,
      description,
      url,
      siteName: 'Erythro.ai',
      type: 'article',
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      images: [share],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  // Warm cache / ensure list is consistent with detail
  await getCachedPublishedBlogPosts()
  const content = await getCachedSiteContent()

  return (
    <>
      <BlogPostJsonLd post={post} locale={DEFAULT_LOCALE} />
      {post.faq?.items?.length ? (
        <FaqJsonLd
          items={post.faq.items}
          locale={DEFAULT_LOCALE}
          id={`${SITE_URL}/blog/${post.slug}#faq`}
        />
      ) : null}
      <BlogPostClient
        initialLocale={DEFAULT_LOCALE}
        content={content}
        post={post}
        clientHydratePrefs
      />
    </>
  )
}
