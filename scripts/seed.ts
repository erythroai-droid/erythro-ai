import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import {
  navbar,
  cookieConsent,
  hero,
  services,
  caseStudies,
  solutions,
  faq,
  footer,
} from '../src/translations'
import { SERVICE_PAGES, SERVICE_ID_TO_SLUG } from '../src/lib/servicePages'
import { ORDER_PLANS } from '../src/lib/orderPlans'
import { PORTFOLIO_PROJECTS } from '../src/lib/portfolioProjects'
import { lexicalFromParagraphs, lexicalFromText } from '../src/lib/lexical'

/* eslint-disable @typescript-eslint/no-explicit-any */

const LOCALES = ['en', 'ru', 'he'] as const
type Locale = (typeof LOCALES)[number]

const SITE = {
  email: 'erythro.ai@gmail.com',
  phone: '+972509312746',
  phoneDisplay: '+972 50 931 27 46',
  facebook: 'https://facebook.com/erythro.ai',
  tiktok: 'https://tiktok.com/@erythro.ai',
}

const SEO_DESCRIPTIONS: Record<Locale, string> = {
  en: 'Erythro.ai is a digital agency building high-performance websites, brand identity, and AI automation — from strategy to launch.',
  ru: 'Erythro.ai — цифровое агентство: высокопроизводительные сайты, брендинг и AI-автоматизация бизнес-процессов. От стратегии до запуска.',
  he: 'Erythro.ai היא סוכנות דיגיטל לבניית אתרים מהירים, מיתוג ואוטומציה מבוססת בינה מלאכותית — מאסטרטגיה ועד השקה.',
}

/** Copy Payload-generated row ids (by array index) from `source` into `target`. */
function applyIds(target: any, source: any): void {
  if (!target || !source) return
  if (Array.isArray(target) && Array.isArray(source)) {
    for (let i = 0; i < target.length; i++) {
      if (source[i] && target[i] && typeof target[i] === 'object') {
        if (source[i].id != null) target[i].id = source[i].id
        applyIds(target[i], source[i])
      }
    }
  } else if (typeof target === 'object' && typeof source === 'object') {
    for (const k of Object.keys(target)) {
      if (k in source) applyIds(target[k], source[k])
    }
  }
}

async function seedGlobal(payload: any, slug: string, byLocale: Record<Locale, any>) {
  let doc = await payload.updateGlobal({ slug, locale: 'en', data: byLocale.en, depth: 0 })
  for (const loc of ['ru', 'he'] as const) {
    const data = byLocale[loc]
    applyIds(data, doc)
    doc = await payload.updateGlobal({ slug, locale: loc, data, depth: 0 })
  }
  console.log(`  ✓ global: ${slug}`)
}

async function seedCollection(
  payload: any,
  collection: string,
  rowsByLocale: Record<Locale, any[]>,
) {
  const existing = await payload.find({ collection, limit: 1000, depth: 0 })
  for (const d of existing.docs) await payload.delete({ collection, id: d.id })

  const created: any[] = []
  for (let i = 0; i < rowsByLocale.en.length; i++) {
    created.push(await payload.create({ collection, locale: 'en', data: rowsByLocale.en[i], depth: 0 }))
  }
  for (const loc of ['ru', 'he'] as const) {
    for (let i = 0; i < created.length; i++) {
      const data = rowsByLocale[loc][i]
      applyIds(data, created[i])
      await payload.update({ collection, id: created[i].id, locale: loc, data, depth: 0 })
    }
  }
  console.log(`  ✓ collection: ${collection} (${created.length} docs)`)
}

const byLocale = <T>(fn: (loc: Locale) => T): Record<Locale, T> =>
  LOCALES.reduce((acc, loc) => ({ ...acc, [loc]: fn(loc) }), {} as Record<Locale, T>)

async function run() {
  const payload = await getPayload({ config })
  console.log('Seeding Payload content...')

  // Header
  await seedGlobal(
    payload,
    'header',
    byLocale((loc) => ({
      navItems: navbar.navItems.map((n) => ({ label: n.label[loc], href: n.href })),
      ctaLabel: navbar.ctaLabel[loc],
    })),
  )

  // Hero
  await seedGlobal(
    payload,
    'hero',
    byLocale((loc) => ({
      preHeading: hero.preHeading[loc],
      mainHeading: hero.mainHeading[loc],
      subtext: hero.subtext[loc],
      ctaFind: hero.ctaFind[loc],
      words: hero.motionHeadings.map((phrase) => ({
        word: phrase.text[loc],
        outline: phrase.outline[loc],
      })),
    })),
  )

  // Services section intro
  await seedGlobal(
    payload,
    'services-section',
    byLocale((loc) => ({
      sectionTitle: services.sectionTitle[loc],
      sectionSubtitle: services.sectionSubtitle[loc],
      startCTA: services.startCTA[loc],
      priceLabel: services.priceLabel[loc],
    })),
  )

  // Case studies
  await seedGlobal(
    payload,
    'case-studies',
    byLocale((loc) => ({
      preTitle: caseStudies.preTitle[loc],
      subtitle: caseStudies.subtitle[loc],
      cardTitle: caseStudies.cardTitle[loc],
      cardCategory: caseStudies.cardCategory[loc],
      cardDescription: caseStudies.cardDescription[loc],
      cardCTA: caseStudies.cardCTA[loc],
      viewAllProjects: caseStudies.viewAllProjects[loc],
    })),
  )

  // Solutions section intro
  await seedGlobal(
    payload,
    'solutions-section',
    byLocale((loc) => ({
      sectionTitle: solutions.sectionTitle[loc],
      sectionSubtitle: solutions.sectionSubtitle[loc],
      ctaLabel: solutions.ctaLabel[loc],
    })),
  )

  // FAQ section
  await seedGlobal(
    payload,
    'faq-section',
    byLocale((loc) => ({
      sectionTitle: faq.sectionTitle[loc],
      sectionSubtitle: faq.sectionSubtitle[loc],
      items: faq.items.map((item) => ({
        question: item.question[loc],
        answer: lexicalFromText(item.answer[loc] || item.answer.en),
      })),
    })),
  )

  // Footer
  await seedGlobal(
    payload,
    'footer',
    byLocale((loc) => ({
      ctaHeadingLine1: footer.ctaHeadingLine1[loc],
      ctaHeadingLine2: footer.ctaHeadingLine2[loc],
      ctaButton: footer.ctaButton[loc],
      companyTitle: footer.companyTitle[loc],
      companyLinks: footer.companyLinks.map((l) => ({ label: l.label[loc], href: l.href })),
      contactTitle: footer.contactTitle[loc],
      emailLabel: footer.emailLabel[loc],
      phoneLabel: footer.phoneLabel[loc],
      locationLabel: footer.locationLabel[loc],
      locationValue: footer.locationValue[loc],
      copyright: footer.copyright[loc],
      legalLinks: footer.legalLinks.map((l) => ({ key: l.id, label: l.label[loc], href: l.href })),
    })),
  )

  // Site settings (contacts + cookie banner + seo)
  await seedGlobal(
    payload,
    'site-settings',
    byLocale((loc) => ({
      ...SITE,
      cookieMessage: cookieConsent.message[loc],
      cookieAccept: cookieConsent.accept[loc],
      cookieDecline: cookieConsent.decline[loc],
      seoTitle: 'Erythro.ai - digital agency',
      seoDescription: SEO_DESCRIPTIONS[loc],
    })),
  )

  // Services collection (home cards + /services/[slug])
  await seedCollection(
    payload,
    'services',
    byLocale((loc) =>
      services.items.map((item, i) => {
        const page = SERVICE_PAGES.find((p) => p.id === item.id) || SERVICE_PAGES[i]
        return {
          title: item.title[loc],
          slug: page?.slug || SERVICE_ID_TO_SLUG[item.id] || item.id,
          currency: page?.currency || 'USD',
          number: item.number,
          order: i,
          features: item.features[loc].map((f) => ({ feature: f })),
          ...(page?.summary
            ? { summary: lexicalFromText(page.summary[loc] || page.summary.en) }
            : {}),
          ...(page?.description
            ? {
                description: lexicalFromParagraphs(
                  page.description[loc] || page.description.en || [],
                ),
              }
            : {}),
          ...(page?.offerings
            ? {
                offerings: page.offerings.map((o) => ({
                  name: o.name[loc] || o.name.en,
                  ...(o.description
                    ? { description: o.description[loc] || o.description.en }
                    : {}),
                  price: o.price,
                  ...(o.pricePrefix
                    ? { pricePrefix: o.pricePrefix[loc] || o.pricePrefix.en }
                    : {}),
                })),
              }
            : {}),
        }
      }),
    ),
  )

  // Solution plans (home cards + /order/[slug])
  await seedCollection(
    payload,
    'solution-plans',
    byLocale((loc) =>
      solutions.cards.map((card, i) => {
        const plan = ORDER_PLANS.find((p) => p.slug === card.id) || ORDER_PLANS[i]
        return {
          title: card.title[loc],
          slug: card.id,
          price: card.price,
          currency: card.currency || 'ILS',
          order: i,
          priceNote: !!card.priceNote,
          featured: !!card.featured,
          ...(card.pricePrefix ? { pricePrefix: card.pricePrefix[loc] } : {}),
          ...(card.originalPrice ? { originalPrice: card.originalPrice } : {}),
          ...(card.disclaimer ? { disclaimer: card.disclaimer[loc] } : {}),
          features: card.features.map((f) => ({
            ...(f.label ? { label: f.label[loc] } : {}),
            ...(f.value ? { value: f.value[loc] } : {}),
            ...(f.full ? { full: f.full[loc] } : {}),
            ...(f.homeOnly ? { homeOnly: true } : {}),
          })),
          ...(plan?.subtitle ? { subtitle: plan.subtitle[loc] || plan.subtitle.en } : {}),
          ...(plan?.promo ? { promo: plan.promo[loc] || plan.promo.en } : {}),
          ...(plan?.periods
            ? {
                periods: plan.periods.map((p) => ({
                  periodId: p.id,
                  label: p.label[loc] || p.label.en,
                  months: p.months,
                  discountPercent: p.discountPercent,
                })),
              }
            : {}),
          ...(plan?.addons
            ? {
                addons: plan.addons.map((a) => ({
                  addonId: a.id,
                  name: a.name[loc] || a.name.en,
                  description: a.description[loc] || a.description.en,
                  price: a.price,
                  recommended: !!a.recommended,
                  mandatory: !!a.mandatory,
                  ...(a.note ? { note: a.note[loc] || a.note.en } : {}),
                })),
              }
            : {}),
        }
      }),
    ),
  )

  // Portfolio projects (/portfolio + /portfolio/[slug])
  // Media URLs stay as public paths via frontend fallback until uploaded in admin.
  await seedCollection(
    payload,
    'portfolio-projects',
    byLocale((_loc) =>
      PORTFOLIO_PROJECTS.map((project, i) => ({
        slug: project.slug,
        title: project.title,
        category: project.category,
        categoryLabel: project.categoryLabel,
        description: project.description,
        summary: project.summary,
        date: project.date,
        client: project.client,
        ...(project.link ? { link: project.link } : {}),
        order: i,
        stack: project.stack.map((item) => ({ item })),
        tags: project.tags.map((tag) => ({ tag })),
        body: project.body.map((section) => ({
          ...(section.heading ? { heading: section.heading } : {}),
          paragraphs: section.paragraphs.map((text) => ({ text })),
          // Skip image uploads in seed — editors add media in admin; fallback uses static paths
        })),
      })),
    ),
  )

  console.log('Done. Content seeded for en / ru / he.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
