import React from 'react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ProjectClient from './ProjectClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import {
  getAllPortfolioSlugsCms,
  getPortfolioProjectBySlug,
} from '@/lib/cmsPages'
import { getAllPortfolioSlugs } from '@/lib/portfolioProjects'

const SUPPORTED_LOCALES = ['en', 'ru', 'he']
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
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  const project = await getPortfolioProjectBySlug(slug, locale)

  if (!project) {
    return {
      title: 'Project not found | Erythro.ai',
    }
  }

  const url = `${SITE_URL}/portfolio/${project.slug}`
  const metaTitle = project.seoTitle || `${project.title} | Portfolio | Erythro.ai`
  const metaDescription = project.seoDescription || project.summary

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: `/portfolio/${project.slug}`,
    },
    openGraph: {
      title: project.seoTitle || `${project.title} | Erythro.ai`,
      description: metaDescription,
      url,
      siteName: 'Erythro.ai',
      type: 'article',
      images: [
        {
          url: project.hero.src,
          alt: project.title,
        },
      ],
    },
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const initialLocale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  const project = await getPortfolioProjectBySlug(slug, initialLocale)
  if (!project) notFound()

  const content = await getCachedSiteContent()

  return (
    <ProjectClient initialLocale={initialLocale} content={content} project={project} />
  )
}
