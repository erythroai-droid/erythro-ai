import React from 'react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ServiceClient from './ServiceClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getAllServiceSlugsCms, getServicePageBySlug } from '@/lib/cmsPages'
import { getAllServiceSlugs, tLocale } from '@/lib/servicePages'
import { getRequestPrefs } from '@/lib/requestPrefs'

const SUPPORTED_LOCALES = ['en', 'ru', 'he']
const DEFAULT_LOCALE = 'en'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

interface ServicePageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllServiceSlugsCms()
    if (slugs.length) return slugs.map((slug) => ({ slug }))
  } catch {
    /* fall through */
  }
  return getAllServiceSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params
  const service = await getServicePageBySlug(slug)

  if (!service) {
    return {
      title: 'Service not found | Erythro.ai',
    }
  }

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  const customTitle = tLocale(service.seoTitle, locale)
  const customDescription = tLocale(service.seoDescription, locale)
  const pageTitle = tLocale(service.title, locale)
  const title = customTitle || `${pageTitle} | Services | Erythro.ai`
  const summary = customDescription || tLocale(service.summary, locale)
  const url = `${SITE_URL}/services/${service.slug}`

  return {
    title,
    description: summary,
    alternates: {
      canonical: `/services/${service.slug}`,
    },
    openGraph: {
      title: customTitle || `${pageTitle} | Erythro.ai`,
      description: summary,
      url,
      siteName: 'Erythro.ai',
      type: 'website',
      images: [
        {
          url: service.hero.src,
          alt: pageTitle,
        },
      ],
    },
  }
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params
  const service = await getServicePageBySlug(slug)

  if (!service) notFound()

  const { initialLocale, initialTheme } = await getRequestPrefs()
  const content = await getCachedSiteContent()

  return (
    <ServiceClient
      initialLocale={initialLocale}
      initialTheme={initialTheme}
      content={content}
      service={service}
    />
  )
}
