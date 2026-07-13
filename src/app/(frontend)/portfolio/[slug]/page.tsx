import React from 'react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ProjectClient from './ProjectClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import {
  getAllPortfolioSlugs,
  getPortfolioProject,
} from '@/lib/portfolioProjects'

const SUPPORTED_LOCALES = ['en', 'ru', 'he']
const DEFAULT_LOCALE = 'en'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllPortfolioSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = getPortfolioProject(slug)

  if (!project) {
    return {
      title: 'Project not found | Erythro.ai',
    }
  }

  const url = `${SITE_URL}/portfolio/${project.slug}`

  return {
    title: `${project.title} | Portfolio | Erythro.ai`,
    description: project.summary,
    alternates: {
      canonical: `/portfolio/${project.slug}`,
    },
    openGraph: {
      title: `${project.title} | Erythro.ai`,
      description: project.summary,
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
  const project = getPortfolioProject(slug)

  if (!project) notFound()

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const initialLocale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  const content = await getCachedSiteContent()

  return (
    <ProjectClient initialLocale={initialLocale} content={content} project={project} />
  )
}
