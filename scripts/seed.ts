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
import { ORDER_PLANS, AUDIT_ORDER_PLANS } from '../src/lib/orderPlans'
import { auditPage } from '../src/lib/auditPage'
import { PORTFOLIO_PROJECTS } from '../src/lib/portfolioProjects'
import { lexicalFromParagraphs, lexicalFromText } from '../src/lib/lexical'

/* eslint-disable @typescript-eslint/no-explicit-any */

const LOCALES = ['en', 'ru', 'he'] as const
type Locale = (typeof LOCALES)[number]

const SITE = {
  email: 'order@erythro.ai',
  emails: [
    { label: 'Orders', address: 'order@erythro.ai' },
    { label: 'Privacy', address: 'erythro.ai@gmail.com' },
  ],
  displayEmailFooter: 'order@erythro.ai',
  displayEmailContacts: 'order@erythro.ai',
  displayEmailLegal: 'erythro.ai@gmail.com',
  notifyEmailContact: 'order@erythro.ai',
  notifyEmailOrder: 'order@erythro.ai',
  phone: '+972509312746',
  phoneDisplay: '+972 50 931 27 46',
  facebook: 'https://facebook.com/erythro.ai',
  telegram: 'https://t.me/erythroai',
}

const SEO_TITLES: Record<Locale, string> = {
  en: 'Erythro.ai - digital agency',
  ru: 'Erythro.ai — цифровое агентство',
  he: 'Erythro.ai - סוכנות דיגיטל',
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
      navItems: navbar.navItems.map((n) => ({
        label: n.label[loc],
        description: n.description?.[loc] ?? '',
        href: n.href,
        children: (n.children ?? []).map((c) => ({
          label: c.label[loc],
          href: c.href,
        })),
      })),
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
      seoTitle: SEO_TITLES[loc],
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

  // Plans (homepage Solutions + /order + AI Audit /order/audit-*)
  await seedCollection(
    payload,
    'solution-plans',
    byLocale((loc) => {
      const solutionRows = solutions.cards.map((card, i) => {
        const plan = ORDER_PLANS.find((p) => p.slug === card.id) || ORDER_PLANS[i]
        return {
          title: card.title[loc],
          kind: 'solution' as const,
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
                  priceDisplay:
                    typeof a.price === 'string'
                      ? a.price
                      : a.price?.[loc] || a.price?.en || '',
                  recommended: !!a.recommended,
                  mandatory: !!a.mandatory,
                  discountMonths1: a.discountMonths1 || 0,
                  discountMonths6: a.discountMonths6 || 0,
                  discountMonths12: a.discountMonths12 || 0,
                  ...(a.note ? { note: a.note[loc] || a.note.en } : {}),
                  ...(a.full ? { full: a.full[loc] || a.full.en } : {}),
                })),
              }
            : {}),
          ...(plan?.seoTitle || plan?.seoDescription
            ? {
                seo: {
                  ...(plan.seoTitle ? { title: plan.seoTitle[loc] || plan.seoTitle.en } : {}),
                  ...(plan.seoDescription
                    ? { description: plan.seoDescription[loc] || plan.seoDescription.en }
                    : {}),
                },
              }
            : {}),
        }
      })

      const auditRows = AUDIT_ORDER_PLANS.map((plan, i) => ({
        title: plan.card.title[loc] || plan.card.title.en,
        kind: 'audit' as const,
        slug: plan.slug,
        price: plan.card.price,
        currency: plan.card.currency || 'ILS',
        order: 100 + i,
        priceNote: !!plan.card.priceNote,
        featured: !!plan.card.featured,
        ...(plan.card.originalPrice ? { originalPrice: plan.card.originalPrice } : {}),
        features: plan.card.features.map((f) => ({
          ...(f.label ? { label: f.label[loc] || f.label.en } : {}),
          ...(f.value ? { value: f.value[loc] || f.value.en } : {}),
        })),
        ...(plan.subtitle ? { subtitle: plan.subtitle[loc] || plan.subtitle.en } : {}),
        ...(plan.includes
          ? { includes: lexicalFromText(plan.includes[loc] || plan.includes.en) }
          : {}),
        ...(plan.seoTitle || plan.seoDescription
          ? {
              seo: {
                ...(plan.seoTitle ? { title: plan.seoTitle[loc] || plan.seoTitle.en } : {}),
                ...(plan.seoDescription
                  ? { description: plan.seoDescription[loc] || plan.seoDescription.en }
                  : {}),
              },
            }
          : {}),
      }))

      return [...solutionRows, ...auditRows]
    }),
  )

  // Audit landing page (/audit)
  await seedGlobal(
    payload,
    'audit-page',
    byLocale((loc) => ({
      title: auditPage.title[loc],
      metaDescription: auditPage.metaDescription[loc],
      tabs: {
        audit: auditPage.tabs.audit[loc],
        how: auditPage.tabs.how[loc],
        pricing: auditPage.tabs.pricing[loc],
      },
      form: {
        heading: auditPage.form.heading[loc],
        intro: auditPage.form.intro[loc],
        introNote: auditPage.form.introNote[loc],
        requiredNote: auditPage.form.requiredNote[loc],
        website: auditPage.form.website[loc],
        websitePlaceholder: auditPage.form.websitePlaceholder[loc],
        websiteInvalid: auditPage.form.websiteInvalid[loc],
        auditLanguage: auditPage.form.auditLanguage[loc],
        auditLanguageOptions: {
          en: auditPage.form.auditLanguageOptions.en[loc],
          ru: auditPage.form.auditLanguageOptions.ru[loc],
          he: auditPage.form.auditLanguageOptions.he[loc],
        },
        submit: auditPage.form.submit[loc],
        success: auditPage.form.success[loc],
      },
      how: {
        kicker: auditPage.how.kicker[loc],
        heroTitle: auditPage.how.heroTitle[loc],
        heroIntro: auditPage.how.heroIntro[loc],
        stats: auditPage.how.stats.map((s) => ({ label: s[loc] })),
        stepsHeading: auditPage.how.stepsHeading[loc],
        steps: auditPage.how.steps.map((s) => ({
          label: s.label[loc],
          title: s.title[loc],
          body: s.body[loc],
        })),
        methodologyTitle: auditPage.how.methodologyTitle[loc],
        weightNote: auditPage.how.weightNote[loc],
        methodologyIntro: auditPage.how.methodologyIntro[loc],
        pillars: auditPage.how.pillars.map((p) => ({
          weight: p.weight,
          title: p.title[loc],
          body: p.body[loc],
        })),
        categoriesTitle: auditPage.how.categoriesTitle[loc],
        categoriesIntro: auditPage.how.categoriesIntro[loc],
        categories: auditPage.how.categories.map((c) => ({
          title: c.title[loc],
          body: c.body[loc],
        })),
        principlesTitle: auditPage.how.principlesTitle[loc],
        principles: auditPage.how.principles.map((p) => ({
          title: p.title[loc],
          body: p.body[loc],
        })),
      },
      pricing: {
        kicker: auditPage.pricing.kicker[loc],
        title: auditPage.pricing.title[loc],
        intro: auditPage.pricing.intro[loc],
        footnote: auditPage.pricing.footnote[loc],
        agency: auditPage.pricing.agency[loc],
        agencyCta: auditPage.pricing.agencyCta[loc],
        plans: auditPage.pricing.plans.map((p) => ({
          planId: p.id,
          featured: p.id === 'diagnostic',
          name: p.name[loc],
          price: p.price[loc],
          ...(p.priceCompare ? { priceCompare: p.priceCompare[loc] } : {}),
          ...(p.priceNote ? { priceNote: p.priceNote[loc] } : {}),
          ...(p.description ? { description: p.description[loc] } : {}),
          features: p.features.map((f) => ({ feature: f[loc] })),
          cta: p.cta[loc],
          ctaHref: p.ctaHref,
        })),
      },
    })),
  )

  // Portfolio projects (/portfolio + /portfolio/[slug])
  // Media URLs stay as public paths via frontend fallback until uploaded in admin.
  // `category` is a relationship — resolve stable `value` → document id (seeded by migration).
  const categoryDocs = await payload.find({
    collection: 'portfolio-categories',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  const categoryIdByValue = new Map<string, number>()
  for (const doc of categoryDocs.docs as { id?: unknown; value?: unknown }[]) {
    if (typeof doc.value === 'string' && typeof doc.id === 'number') {
      categoryIdByValue.set(doc.value, doc.id)
    }
  }
  const resolveCategoryId = (value: string) => {
    const id = categoryIdByValue.get(value)
    if (typeof id !== 'number') {
      throw new Error(
        `portfolio-categories missing value="${value}". Ensure migrations have run before seeding.`,
      )
    }
    return id
  }

  await seedCollection(
    payload,
    'portfolio-projects',
    byLocale((loc) =>
      PORTFOLIO_PROJECTS.map((project, i) => ({
        slug: project.slug,
        title: project.title[loc] || project.title.en,
        category: resolveCategoryId(project.category),
        categoryLabel: project.categoryLabel[loc] || project.categoryLabel.en,
        description: project.description[loc] || project.description.en,
        summary: lexicalFromText(project.summary[loc] || project.summary.en),
        ...(project.subtitle
          ? { subtitle: lexicalFromText(project.subtitle[loc] || project.subtitle.en) }
          : {}),
        date: project.date,
        client: project.client,
        ...(project.link ? { link: project.link } : {}),
        order: i,
        stack: project.stack.map((item) => ({ item })),
        tags: project.tags.map((tag) => ({ tag })),
        body: project.body.map((section) => ({
          ...(section.heading
            ? { heading: section.heading[loc] || section.heading.en }
            : {}),
          paragraphs: (section.paragraphs[loc] || section.paragraphs.en || []).map(
            (text) => ({ text: lexicalFromText(text) }),
          ),
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
