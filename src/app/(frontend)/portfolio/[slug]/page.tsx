import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProjectClient from './ProjectClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import {
  getAllPortfolioSlugsCms,
  getCachedPortfolioProjects,
  getPortfolioProjectBySlug,
} from '@/lib/cmsPages'
import { getAllPortfolioSlugs, tLocale } from '@/lib/portfolioProjects'
import { ogImageFields, ogImageForPortfolioProject } from '@/lib/ogImages'

/**
 * Full Route Cache / CDN: static HTML with ISR. Must not call cookies()/headers()
 * anywhere in this tree. Locale/theme hydrate client-side (PIT-056).
 */
export const dynamic = 'force-static'
export const revalidate = 3600

const DEFAULT_LOCALE = 'en'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPortfolioSlugsCms()
    if (slugs.length) return slugs.map((slug) => ({ slug }))
  } catch {
    /* fall through */
  }
  return getAllPortfolioSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const locale = DEFAULT_LOCALE

  const project = await getPortfolioProjectBySlug(slug)

  if (!project) {
    return {
      title: 'Project not found | Erythro.ai',
    }
  }

  const title = tLocale(project.title, locale)
  const summary = tLocale(project.summary, locale)
  const url = `${SITE_URL}/portfolio/${project.slug}`
  const metaTitle = tLocale(project.seoTitle, locale) || `${title} | Portfolio | Erythro.ai`
  const metaDescription = tLocale(project.seoDescription, locale) || summary

  const ogTitle = tLocale(project.seoTitle, locale) || `${title} | Erythro.ai`
  const ogImage = ogImageForPortfolioProject(project.slug, project.hero.src)
  const shareImage = ogImageFields(ogImage, title)

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: `/portfolio/${project.slug}`,
    },
    openGraph: {
      title: ogTitle,
      description: metaDescription,
      url,
      siteName: 'Erythro.ai',
      type: 'article',
      images: [shareImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: metaDescription,
      images: [ogImage],
    },
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params

  const project = await getPortfolioProjectBySlug(slug)
  if (!project) notFound()

  const [content, projects] = await Promise.all([
    getCachedSiteContent(),
    getCachedPortfolioProjects(),
  ])

  const index = projects.findIndex((p) => p.slug === project.slug)
  const prevProject =
    index > 0 ? projects[index - 1] : projects.length > 1 ? projects[projects.length - 1] : null
  const nextProject =
    index >= 0 && index < projects.length - 1
      ? projects[index + 1]
      : projects.length > 1
        ? projects[0]
        : null

  const toNeighbor = (p: (typeof projects)[number] | null) =>
    p ? { slug: p.slug, title: p.title } : null

  return (
    <ProjectClient
      initialLocale={DEFAULT_LOCALE}
      content={content}
      project={project}
      prev={toNeighbor(prevProject)}
      next={toNeighbor(nextProject)}
      clientHydratePrefs
    />
  )
}
