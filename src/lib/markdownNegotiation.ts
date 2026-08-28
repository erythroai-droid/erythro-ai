import { getCachedSiteContent } from './getSiteContent'
import { aboutPage, tAbout } from './aboutPage'
import { contactsPage, tContacts } from './contactsPage'
import { getCachedLegalPage } from './legalPages.server'
import { tLegal, type LegalPageId } from './legalPages'
import {
  getCachedPortfolioProjects,
  getCachedPortfolioCategories,
  getPortfolioProjectBySlug,
  getCachedServicePages,
  getServicePageBySlug,
  getOrderPlanBySlug,
} from './cmsPages'
import { tLocale, tLocaleList } from './servicePages'

export { shouldServeMarkdown } from './markdownAccept'

const SUPPORTED_LOCALES = ['en', 'ru', 'he'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

export function resolveLocale(loc?: string | null): SupportedLocale {
  if (loc && SUPPORTED_LOCALES.includes(loc.toLowerCase() as SupportedLocale)) {
    return loc.toLowerCase() as SupportedLocale
  }
  return 'en'
}

/**
 * Estimates token count for Markdown content (~4 characters per token).
 */
export function estimateMarkdownTokens(markdown: string): number {
  if (!markdown) return 0
  return Math.max(1, Math.ceil(markdown.length / 4))
}

/**
 * Generates clean, structured Markdown representation for any site route.
 */
export async function generateMarkdownForRoute(
  rawPath: string,
  rawLocale?: string | null,
): Promise<{ markdown: string; status: number }> {
  const locale = resolveLocale(rawLocale)
  const pathname = (rawPath.split('?')[0] || '/').replace(/\/+$/, '') || '/'

  // 1. Home page
  if (pathname === '/' || pathname === '/home') {
    return {
      status: 200,
      markdown: await generateHomeMarkdown(locale),
    }
  }

  // 2. About page
  if (pathname === '/about') {
    return {
      status: 200,
      markdown: await generateAboutMarkdown(locale),
    }
  }

  // 3. Contacts page
  if (pathname === '/contacts') {
    return {
      status: 200,
      markdown: await generateContactsMarkdown(locale),
    }
  }

  // 4. Portfolio index
  if (pathname === '/portfolio') {
    return {
      status: 200,
      markdown: await generatePortfolioIndexMarkdown(locale),
    }
  }

  // 5. Portfolio project detail
  if (pathname.startsWith('/portfolio/')) {
    const slug = pathname.slice('/portfolio/'.length).trim()
    const md = await generatePortfolioProjectMarkdown(slug, locale)
    if (md) return { status: 200, markdown: md }
    return { status: 404, markdown: generateNotFoundMarkdown(pathname, locale) }
  }

  // 6. Services index
  if (pathname === '/services') {
    return {
      status: 200,
      markdown: await generateServicesIndexMarkdown(locale),
    }
  }

  // 7. Services detail
  if (pathname.startsWith('/services/')) {
    const slug = pathname.slice('/services/'.length).trim()
    const md = await generateServiceDetailMarkdown(slug, locale)
    if (md) return { status: 200, markdown: md }
    return { status: 404, markdown: generateNotFoundMarkdown(pathname, locale) }
  }

  // 8. Legal pages
  if (pathname === '/privacy' || pathname === '/terms' || pathname === '/accessibility') {
    const pageId = pathname.slice(1) as LegalPageId
    const md = await generateLegalMarkdown(pageId, locale)
    if (md) return { status: 200, markdown: md }
    return { status: 404, markdown: generateNotFoundMarkdown(pathname, locale) }
  }

  // 9. Audit page — stub until /audit ships; avoid importing uncommitted auditPage.
  if (pathname === '/audit') {
    return {
      status: 200,
      markdown: generateAuditMarkdownStub(),
    }
  }

  // 10. Order / Solution Plan detail
  if (pathname.startsWith('/order/')) {
    const slug = pathname.slice('/order/'.length).trim()
    const md = await generateOrderPlanMarkdown(slug, locale)
    if (md) return { status: 200, markdown: md }
    return { status: 404, markdown: generateNotFoundMarkdown(pathname, locale) }
  }

  // Fallback 404
  return {
    status: 404,
    markdown: generateNotFoundMarkdown(pathname, locale),
  }
}

/* ========================================================================= */
/* Generators                                                                */
/* ========================================================================= */

async function generateHomeMarkdown(locale: SupportedLocale): Promise<string> {
  const content = await getCachedSiteContent()

  const lines: string[] = []

  // Header & Title
  const mainHeading = content.hero.mainHeading[locale] || content.hero.mainHeading.en
  const preHeading = content.hero.preHeading[locale] || content.hero.preHeading.en
  const subtext = content.hero.subtext[locale] || content.hero.subtext.en

  lines.push(`# Erythro.ai — ${mainHeading}`)
  lines.push('')
  lines.push(`> **${preHeading}** — ${subtext}`)
  lines.push('')
  lines.push(`- **Canonical URL:** ${SITE_URL}/`)
  lines.push(`- **Official Site:** ${SITE_URL}`)
  lines.push(`- **Location:** Eilat, Israel`)
  lines.push(`- **Email:** ${content.siteSettings.email || 'order@erythro.ai'}`)
  lines.push(`- **Phone:** ${content.siteSettings.phone || '+972 50 530 83 05'}`)
  lines.push(`- **LLMs Guide:** ${SITE_URL}/llms.txt`)
  lines.push('')

  // Services section
  lines.push(`## ${content.services.sectionTitle[locale] || 'Services'}`)
  if (content.services.sectionSubtitle[locale]) {
    lines.push(`*${content.services.sectionSubtitle[locale]}*`)
    lines.push('')
  }
  for (const item of content.services.items) {
    const title = item.title[locale] || item.title.en
    const features = item.features[locale] || item.features.en || []
    const link = item.slug ? ` [Learn more](${SITE_URL}/services/${item.slug})` : ''
    lines.push(`### ${item.number}. ${title}${link}`)
    if (features.length) {
      for (const feat of features) {
        lines.push(`- ${feat}`)
      }
    }
    lines.push('')
  }

  // Solution Packages
  lines.push(`## ${content.solutions.sectionTitle[locale] || 'Solutions & Plans'}`)
  if (content.solutions.sectionSubtitle[locale]) {
    lines.push(`*${content.solutions.sectionSubtitle[locale]}*`)
    lines.push('')
  }
  for (const card of content.solutions.cards) {
    const cardTitle = card.title[locale] || card.title.en
    const pricePrefix = card.pricePrefix ? card.pricePrefix[locale] || card.pricePrefix.en : ''
    const price = `${pricePrefix ? pricePrefix + ' ' : ''}${card.currency === 'ILS' ? '₪' : card.currency === 'EUR' ? '€' : '$'}${card.price}`
    lines.push(`### ${cardTitle} (${price})`)
    for (const f of card.features) {
      const label = f.label?.[locale] || f.label?.en || ''
      const val = f.value?.[locale] || f.value?.en || ''
      if (label && val) {
        lines.push(`- **${label}:** ${val}`)
      } else if (label || val) {
        lines.push(`- ${label || val}`)
      }
    }
    lines.push(`- [View plan details](${SITE_URL}/order/${card.id})`)
    lines.push('')
  }

  // Case Studies / Featured Project
  lines.push(`## ${content.caseStudies.cardTitle[locale] || 'Featured Case Study'}`)
  lines.push(`*${content.caseStudies.cardDescription[locale] || ''}*`)
  lines.push(`- Category: ${content.caseStudies.cardCategory[locale] || ''}`)
  lines.push(`- [Explore all portfolio case studies](${SITE_URL}/portfolio)`)
  lines.push('')

  // FAQ
  lines.push(`## ${content.faq.sectionTitle[locale] || 'Frequently Asked Questions'}`)
  lines.push('')
  for (const item of content.faq.items) {
    const q = item.question[locale] || item.question.en
    const a = item.answer[locale] || item.answer.en
    lines.push(`### Q: ${q}`)
    lines.push(`${a}`)
    lines.push('')
  }

  // Contact Footer
  lines.push(`## Contact & Office`)
  lines.push(`- **Email:** ${content.siteSettings.email || 'order@erythro.ai'}`)
  lines.push(`- **Phone:** ${content.siteSettings.phone || '+972 50 530 83 05'}`)
  lines.push(`- **Location:** Eilat, Israel`)
  if (content.siteSettings.telegram) lines.push(`- **Telegram:** ${content.siteSettings.telegram}`)
  if (content.siteSettings.facebook) lines.push(`- **Facebook:** ${content.siteSettings.facebook}`)
  lines.push('')

  return lines.join('\n').trim() + '\n'
}

async function generateAboutMarkdown(locale: SupportedLocale): Promise<string> {
  const content = await getCachedSiteContent()
  const title = tAbout(aboutPage.title, locale)
  const intro = tAbout(aboutPage.intro, locale)
  const metaDesc = tAbout(aboutPage.metaDescription, locale)
  const factsHeading = tAbout(aboutPage.factsHeading, locale)
  const servicesHeading = tAbout(aboutPage.servicesHeading, locale)
  const servicesList = tAbout(aboutPage.servicesList, locale)
  const correctionHeading = tAbout(aboutPage.correctionHeading, locale)
  const correctionText = tAbout(aboutPage.correctionText, locale)

  const lines: string[] = [
    `# ${title}`,
    '',
    `> ${intro}`,
    '',
    `- **Canonical URL:** ${SITE_URL}/about`,
    `- **Meta Description:** ${metaDesc}`,
    `- **Official Name:** Erythro.ai`,
    `- **Location:** Eilat, Israel`,
    `- **Operating Languages:** English, Russian, Hebrew`,
    `- **Contact Email:** ${content.siteSettings.email || 'order@erythro.ai'}`,
    `- **Contact Phone:** ${content.siteSettings.phone || '+972 50 530 83 05'}`,
    '',
    `## ${factsHeading}`,
    `- **Specialization:** High-performance web development, brand identity, AI automation, and custom CMS solutions.`,
    `- **Tech Stack:** Next.js, React, TypeScript, Payload CMS, PostgreSQL, Tailwind CSS, GSAP, Node.js.`,
    `- **AI Integration:** AI agent architectures, automated lead workflows, knowledge bases, LLM readiness (llms.txt, schema, structured data).`,
    '',
    `## ${servicesHeading}`,
    `${servicesList}`,
    '',
    `- [Design & Branding](${SITE_URL}/services/design-branding)`,
    `- [Web Development](${SITE_URL}/services/development)`,
    `- [Project Management & Strategy](${SITE_URL}/services/management)`,
    `- [AI Automation & Agents](${SITE_URL}/services/ai-automation)`,
    '',
    `## ${correctionHeading}`,
    `${correctionText}`,
    '',
    `- Contact: [${content.siteSettings.email || 'order@erythro.ai'}](mailto:${content.siteSettings.email || 'order@erythro.ai'})`,
    `- [Visit Contacts Page](${SITE_URL}/contacts)`,
  ]

  return lines.join('\n').trim() + '\n'
}

async function generateContactsMarkdown(locale: SupportedLocale): Promise<string> {
  const content = await getCachedSiteContent()
  const title = tContacts(contactsPage.title, locale)
  const intro = tContacts(contactsPage.intro, locale)
  const metaDesc = tContacts(contactsPage.metaDescription, locale)

  const lines: string[] = [
    `# ${title} — Erythro.ai`,
    '',
    `> ${intro}`,
    '',
    `- **Canonical URL:** ${SITE_URL}/contacts`,
    `- **Description:** ${metaDesc}`,
    '',
    `## Direct Contact Methods`,
    `- **General Inquiries & Orders:** [${content.siteSettings.emailContacts || content.siteSettings.email || 'order@erythro.ai'}](mailto:${content.siteSettings.emailContacts || content.siteSettings.email || 'order@erythro.ai'})`,
    `- **Legal & Privacy Contact:** [${content.siteSettings.emailLegal || 'erythro.ai@gmail.com'}](mailto:${content.siteSettings.emailLegal || 'erythro.ai@gmail.com'})`,
    `- **Phone:** ${content.siteSettings.phone || '+972 50 530 83 05'}`,
    `- **Office Location:** Eilat, Israel`,
  ]

  if (content.siteSettings.telegram) {
    lines.push(`- **Telegram:** ${content.siteSettings.telegram}`)
  }
  if (content.siteSettings.facebook) {
    lines.push(`- **Facebook:** ${content.siteSettings.facebook}`)
  }

  lines.push('')
  lines.push(`## Business Response Commitment`)
  lines.push(`We review incoming briefs and inquiries within one business day. Initial project estimates, technical consultations, and AI audits are available on request.`)
  lines.push('')
  lines.push(`- [Request Free AI & Website Audit](${SITE_URL}/audit)`)
  lines.push(`- [View Our Portfolio](${SITE_URL}/portfolio)`)

  return lines.join('\n').trim() + '\n'
}

async function generatePortfolioIndexMarkdown(locale: SupportedLocale): Promise<string> {
  const [projects, categories] = await Promise.all([
    getCachedPortfolioProjects(),
    getCachedPortfolioCategories(),
  ])

  const lines: string[] = [
    `# Portfolio & Case Studies — Erythro.ai`,
    '',
    `> Projects built end-to-end — AI agents, web applications, CRM systems, brand identities, and digital products by Erythro.ai.`,
    '',
    `- **Canonical URL:** ${SITE_URL}/portfolio`,
    '',
    `## Categories`,
  ]

  for (const cat of categories) {
    const label = cat.label[locale] || cat.label.en
    lines.push(`- **${label}** (\`${cat.id}\`)`)
  }

  lines.push('')
  lines.push(`## Selected Projects`)
  lines.push('')

  for (const project of projects) {
    const title = project.title[locale] || project.title.en
    const catLabel = project.categoryLabel[locale] || project.categoryLabel.en
    const summary = project.summary[locale] || project.summary.en
    const desc = project.description[locale] || project.description.en
    const link = `${SITE_URL}/portfolio/${project.slug}`

    lines.push(`### [${title}](${link})`)
    lines.push(`- **Category:** ${catLabel}`)
    if (project.client) lines.push(`- **Client:** ${project.client}`)
    if (project.date) lines.push(`- **Date:** ${project.date}`)
    if (project.stack?.length) lines.push(`- **Tech Stack:** ${project.stack.join(', ')}`)
    if (project.tags?.length) lines.push(`- **Tags:** ${project.tags.join(', ')}`)
    if (summary) lines.push(`- **Summary:** ${summary}`)
    if (desc) lines.push(`- **Overview:** ${desc}`)
    if (project.link) lines.push(`- **Live Site:** ${project.link}`)
    lines.push(`- [Read complete case study](${link})`)
    lines.push('')
  }

  return lines.join('\n').trim() + '\n'
}

async function generatePortfolioProjectMarkdown(
  slug: string,
  locale: SupportedLocale,
): Promise<string | null> {
  const project = await getPortfolioProjectBySlug(slug)
  if (!project) return null

  const title = project.title[locale] || project.title.en
  const catLabel = project.categoryLabel[locale] || project.categoryLabel.en
  const summary = project.summary[locale] || project.summary.en
  const subtitle = project.subtitle ? project.subtitle[locale] || project.subtitle.en : ''
  const desc = project.description[locale] || project.description.en

  const lines: string[] = [
    `# ${title} — Case Study`,
    '',
    `> ${summary || desc}`,
    '',
    `- **Canonical URL:** ${SITE_URL}/portfolio/${project.slug}`,
    `- **Category:** ${catLabel}`,
    project.client ? `- **Client:** ${project.client}` : '',
    project.date ? `- **Date:** ${project.date}` : '',
    project.link ? `- **Live Project:** ${project.link}` : '',
    project.stack?.length ? `- **Tech Stack:** ${project.stack.join(', ')}` : '',
    project.tags?.length ? `- **Tags:** ${project.tags.join(', ')}` : '',
  ].filter(Boolean)

  lines.push('')

  if (subtitle) {
    lines.push(`## Overview`)
    lines.push(subtitle)
    lines.push('')
  }

  if (desc && desc !== summary) {
    lines.push(desc)
    lines.push('')
  }

  if (Array.isArray(project.body) && project.body.length) {
    for (const section of project.body) {
      const heading = section.heading ? section.heading[locale] || section.heading.en : ''
      if (heading) {
        lines.push(`## ${heading}`)
        lines.push('')
      }
      const paragraphs = section.paragraphs[locale] || section.paragraphs.en || []
      for (const p of paragraphs) {
        if (p.trim()) {
          lines.push(p.trim())
          lines.push('')
        }
      }
    }
  }

  lines.push(`## Next Steps`)
  lines.push(`- [View all case studies](${SITE_URL}/portfolio)`)
  lines.push(`- [Discuss your project with us](${SITE_URL}/contacts)`)

  return lines.join('\n').trim() + '\n'
}

async function generateServicesIndexMarkdown(locale: SupportedLocale): Promise<string> {
  const services = await getCachedServicePages()

  const lines: string[] = [
    `# Services — Erythro.ai`,
    '',
    `> End-to-end digital services: design & branding, full-stack web development, product management, and custom AI agent automation.`,
    '',
    `- **Canonical URL:** ${SITE_URL}/services`,
    '',
    `## Available Services`,
    '',
  ]

  for (const s of services) {
    const title = tLocale(s.title, locale)
    const summary = tLocale(s.summary, locale)
    const features = tLocaleList(s.features, locale)
    const link = `${SITE_URL}/services/${s.slug}`

    lines.push(`### [${title}](${link})`)
    if (summary) lines.push(`*${summary}*`)
    lines.push('')
    if (features.length) {
      lines.push(`**Key capabilities:**`)
      for (const f of features) {
        lines.push(`- ${f}`)
      }
    }
    lines.push(`- [Explore service & offerings](${link})`)
    lines.push('')
  }

  return lines.join('\n').trim() + '\n'
}

async function generateServiceDetailMarkdown(
  slug: string,
  locale: SupportedLocale,
): Promise<string | null> {
  const service = await getServicePageBySlug(slug)
  if (!service) return null

  const title = tLocale(service.title, locale)
  const summary = tLocale(service.summary, locale)
  const descriptions = tLocaleList(service.description, locale)
  const features = tLocaleList(service.features, locale)
  const currencySymbol = service.currency === 'ILS' ? '₪' : service.currency === 'EUR' ? '€' : '$'

  const lines: string[] = [
    `# ${title} — Erythro.ai`,
    '',
    `> ${summary}`,
    '',
    `- **Canonical URL:** ${SITE_URL}/services/${service.slug}`,
    '',
  ]

  if (descriptions.length) {
    lines.push(`## About this service`)
    for (const d of descriptions) {
      lines.push(d)
      lines.push('')
    }
  }

  if (features.length) {
    lines.push(`## What we do`)
    for (const f of features) {
      lines.push(`- ${f}`)
    }
    lines.push('')
  }

  if (service.offerings?.length) {
    lines.push(`## Packages & Offerings`)
    lines.push('')
    for (const o of service.offerings) {
      const name = tLocale(o.name, locale)
      const desc = o.description ? tLocale(o.description, locale) : ''
      const prefix = o.pricePrefix ? tLocale(o.pricePrefix, locale) : ''
      const priceText = o.price ? `${prefix ? prefix + ' ' : ''}${currencySymbol}${o.price}` : ''

      lines.push(`### ${name}${priceText ? ` (${priceText})` : ''}`)
      if (desc) lines.push(`${desc}`)
      lines.push('')
    }
  }

  lines.push(`## Start a project`)
  lines.push(`Ready to start or need a custom consultation?`)
  lines.push(`- [Contact us](${SITE_URL}/contacts)`)
  lines.push(`- [Request free audit](${SITE_URL}/audit)`)
  lines.push(`- [View other services](${SITE_URL}/services)`)

  return lines.join('\n').trim() + '\n'
}

async function generateLegalMarkdown(
  pageId: LegalPageId,
  locale: SupportedLocale,
): Promise<string | null> {
  const page = await getCachedLegalPage(pageId)
  if (!page) return null

  const title = tLegal(page.title, locale)
  const metaDesc = tLegal(page.metaDescription, locale)
  const intro = tLegal(page.intro, locale)
  const closing = page.closing ? tLegal(page.closing, locale) : ''

  const lines: string[] = [
    `# ${title} — Erythro.ai`,
    '',
    `> ${metaDesc || intro}`,
    '',
    `- **Canonical URL:** ${SITE_URL}/${page.slug}`,
    page.updatedAt ? `- **Effective Date:** ${page.updatedAt}` : '',
    '',
  ].filter(Boolean)

  if (intro) {
    lines.push(intro)
    lines.push('')
  }

  if (Array.isArray(page.sections)) {
    for (const s of page.sections) {
      const heading = tLegal(s.heading, locale)
      if (heading) {
        lines.push(`## ${heading}`)
        lines.push('')
      }

      const paragraphs = s.paragraphs[locale] || s.paragraphs.en || []
      for (const p of paragraphs) {
        if (p.trim()) {
          lines.push(p.trim())
          lines.push('')
        }
      }

      if (s.bullets) {
        const bullets = s.bullets[locale] || s.bullets.en || []
        for (const b of bullets) {
          if (b.trim()) lines.push(`- ${b.trim()}`)
        }
        lines.push('')
      }
    }
  }

  if (closing) {
    lines.push(`## Contact`)
    lines.push(closing)
    lines.push('')
  }

  return lines.join('\n').trim() + '\n'
}

function generateAuditMarkdownStub(): string {
  return [
    `# AI & Website Audit — Erythro.ai`,
    '',
    `> Commercial QA audit for speed, forms, SEO, security, and AI readiness.`,
    '',
    `- **Canonical URL:** ${SITE_URL}/audit`,
    `- **Contact:** [order@erythro.ai](mailto:order@erythro.ai) · [Contacts](${SITE_URL}/contacts)`,
    '',
  ].join('\n')
}

async function generateOrderPlanMarkdown(
  slug: string,
  locale: SupportedLocale,
): Promise<string | null> {
  const plan = await getOrderPlanBySlug(slug)
  if (!plan) return null

  const cardTitle = plan.card.title[locale] || plan.card.title.en
  const currencySymbol = plan.card.currency === 'ILS' ? '₪' : plan.card.currency === 'EUR' ? '€' : '$'
  const pricePrefix = plan.card.pricePrefix ? plan.card.pricePrefix[locale] || plan.card.pricePrefix.en : ''
  const basePrice = `${pricePrefix ? pricePrefix + ' ' : ''}${currencySymbol}${plan.card.price}`
  const subtitle = plan.subtitle ? plan.subtitle[locale] || plan.subtitle.en : ''
  const includes = plan.includes ? plan.includes[locale] || plan.includes.en : ''

  const lines: string[] = [
    `# Order Plan: ${cardTitle} — Erythro.ai`,
    '',
    `> **Base Price:** ${basePrice}`,
    '',
    `- **Canonical URL:** ${SITE_URL}/order/${plan.slug}`,
  ]

  if (subtitle) {
    lines.push(`- **Overview:** ${subtitle}`)
  }

  lines.push('')

  if (includes) {
    lines.push(`## What is Included`)
    lines.push(includes)
    lines.push('')
  }

  if (plan.card.features?.length) {
    lines.push(`## Core Deliverables & Features`)
    for (const f of plan.card.features) {
      const label = f.label?.[locale] || f.label?.en || ''
      const val = f.value?.[locale] || f.value?.en || ''
      if (label && val) {
        lines.push(`- **${label}:** ${val}`)
      } else if (label || val) {
        lines.push(`- ${label || val}`)
      }
    }
    lines.push('')
  }

  if (plan.periods?.length) {
    lines.push(`## Commitment Periods & Discounts`)
    for (const p of plan.periods) {
      const plabel = p.label[locale] || p.label.en
      const discount = p.discountPercent > 0 ? ` (${p.discountPercent}% discount)` : ''
      lines.push(`- **${plabel}:** ${p.months} month(s)${discount}`)
    }
    lines.push('')
  }

  if (plan.addons?.length) {
    lines.push(`## Optional Add-ons`)
    for (const a of plan.addons) {
      const aname = a.name[locale] || a.name.en
      const adesc = a.description ? a.description[locale] || a.description.en : ''
      const aprice = a.price ? a.price[locale] || a.price.en : ''
      lines.push(`### ${aname}${aprice ? ` — ${aprice}` : ''}`)
      if (adesc) lines.push(`${adesc}`)
      if (a.full) {
        const full = a.full[locale] || a.full.en
        if (full) lines.push(full)
      }
      lines.push('')
    }
  }

  lines.push(`## How to Order`)
  lines.push(`Contact us directly to order this plan or customize features:`)
  lines.push(`- **Email:** [order@erythro.ai](mailto:order@erythro.ai)`)
  lines.push(`- **Phone:** +972 50 530 83 05`)
  lines.push(`- [Contacts page](${SITE_URL}/contacts)`)

  return lines.join('\n').trim() + '\n'
}

function generateNotFoundMarkdown(pathname: string, _locale: SupportedLocale): string {
  return [
    `# 404 - Not Found`,
    '',
    `The requested page \`${pathname}\` was not found on Erythro.ai.`,
    '',
    `## Canonical Resources`,
    `- [Home](${SITE_URL}/)`,
    `- [About & Brand Facts](${SITE_URL}/about)`,
    `- [Services](${SITE_URL}/services)`,
    `- [Portfolio](${SITE_URL}/portfolio)`,
    `- [AI & Website Audit](${SITE_URL}/audit)`,
    `- [Contacts](${SITE_URL}/contacts)`,
    `- [LLMs Guide](${SITE_URL}/llms.txt)`,
    '',
  ].join('\n')
}
