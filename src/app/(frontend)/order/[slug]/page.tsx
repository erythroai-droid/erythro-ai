import React from 'react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import OrderClient from './OrderClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getAllOrderSlugsCms, getCachedOrderPlans, getOrderPlanBySlug } from '@/lib/cmsPages'
import { getAllOrderSlugs, ORDER_PLANS, tLocale } from '@/lib/orderPlans'
import { getCachedAuditPage } from '@/lib/auditPage.server'
import { getRequestPrefs } from '@/lib/requestPrefs'

const SUPPORTED_LOCALES = ['en', 'ru', 'he']
const DEFAULT_LOCALE = 'en'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

interface OrderPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllOrderSlugsCms()
    if (slugs.length) return slugs.map((slug) => ({ slug }))
  } catch {
    /* fall through */
  }
  return getAllOrderSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { slug } = await params
  const plan = await getOrderPlanBySlug(slug)

  if (!plan) {
    return { title: 'Order not found | Erythro.ai' }
  }

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  const customTitle = tLocale(plan.seoTitle, locale)
  const customDescription = tLocale(plan.seoDescription, locale)
  const pageTitle = tLocale(plan.card.title, locale)
  const title = customTitle || `${pageTitle} | Order | Erythro.ai`
  const subtitle = customDescription || tLocale(plan.subtitle, locale)

  return {
    title,
    description: subtitle,
    alternates: { canonical: `/order/${plan.slug}` },
    openGraph: {
      title,
      description: subtitle,
      url: `${SITE_URL}/order/${plan.slug}`,
      siteName: 'Erythro.ai',
      type: 'website',
    },
  }
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { slug } = await params
  const plan = await getOrderPlanBySlug(slug)
  if (!plan) notFound()

  const { initialLocale, initialTheme } = await getRequestPrefs('light')
  const [content, plans, auditPageContent] = await Promise.all([
    getCachedSiteContent(),
    getCachedOrderPlans().catch(() => ORDER_PLANS),
    getCachedAuditPage(),
  ])

  const list = plans.length ? plans : ORDER_PLANS
  const isAuditPlan = plan.kind === 'audit' || plan.slug.startsWith('audit-')
  const navList = list.filter((p) =>
    isAuditPlan
      ? p.kind === 'audit' || p.slug.startsWith('audit-')
      : !p.kind || p.kind === 'solution' || !p.slug.startsWith('audit-'),
  )
  const effectiveList = navList.length ? navList : list
  const index = effectiveList.findIndex((p) => p.slug === plan.slug)
  const prevPlan =
    index > 0 ? effectiveList[index - 1] : effectiveList.length > 1 ? effectiveList[effectiveList.length - 1] : null
  const nextPlan =
    index >= 0 && index < effectiveList.length - 1
      ? effectiveList[index + 1]
      : effectiveList.length > 1
        ? effectiveList[0]
        : null

  const toNeighbor = (p: (typeof list)[number] | null) =>
    p
      ? {
          slug: p.slug,
          title: tLocale(p.card.title, initialLocale),
        }
      : null

  return (
    <OrderClient
      initialLocale={initialLocale}
      initialTheme={initialTheme}
      content={content}
      plan={plan}
      prev={toNeighbor(prevPlan)}
      next={toNeighbor(nextPlan)}
      auditForm={isAuditPlan ? auditPageContent.form : undefined}
    />
  )
}
