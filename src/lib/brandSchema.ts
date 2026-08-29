import type { SiteContent } from '@/lib/defaultContent'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

export const DEFAULT_ORGANIZATION_DESCRIPTION =
  'Digital agency building high-performance websites, custom brand identities, and AI automation.'

export const CANONICAL_SAME_AS = [
  'https://github.com/erythroai-droid',
  'https://www.linkedin.com/in/erythro-ai',
]

type FaqItem = SiteContent['faq']['items'][number]

export function buildOrganizationSchema(
  content: SiteContent,
  description: string = DEFAULT_ORGANIZATION_DESCRIPTION,
) {
  const site = content.siteSettings
  const sameAs = [
    ...CANONICAL_SAME_AS,
    site.facebook,
    site.telegram,
  ].filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0,
  )
  const uniqueSameAs = Array.from(new Set(sameAs))

  return {
    '@type': 'Organization',
    additionalType: 'https://schema.org/ProfessionalService',
    '@id': `${SITE_URL}/#organization`,
    name: 'Erythro.ai',
    alternateName: [
      'Erythro AI',
      'Erythro Digital Agency',
      'Эритро.ай',
      'Эритро AI',
      'איריתרו',
      'איריתרו איי איי',
    ],
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/images/og-image.png`,
    description,
    email: (site.emailContacts || site.email).toLowerCase(),
    telephone: site.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Eilat',
      addressCountry: 'IL',
    },
    areaServed: [
      { '@type': 'Country', name: 'Israel' },
      { '@type': 'AdministrativeArea', name: 'Global' },
      { '@type': 'AdministrativeArea', name: 'CIS' },
      { '@type': 'Country', name: 'United States' },
    ],
    knowsLanguage: ['en', 'ru', 'he'],
    inLanguage: ['en', 'ru', 'he'],
    sameAs: uniqueSameAs,
    founder: {
      '@type': 'Person',
      name: 'Founder',
      url: 'https://www.linkedin.com/in/erythro-ai',
      sameAs: [
        'https://www.linkedin.com/in/erythro-ai',
        'https://github.com/erythroai-droid',
      ],
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: (site.emailContacts || site.email).toLowerCase(),
        telephone: site.phone,
        areaServed: 'IL',
        availableLanguage: ['English', 'Russian', 'Hebrew'],
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Erythro.ai Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Web Development / Разработка сайтов / פיתוח אתרים',
            description:
              'High-performance Next.js 15 websites, modern CMS, and full responsiveness.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Design & Branding / Дизайн и брендинг / עיצוב ומיתוג',
            description:
              'Distinctive visual identity, UI/UX design systems, and art direction.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'AI Automation / AI-автоматизация / אוטומציית בינה מלאכותית',
            description:
              'Autonomous AI agents, RAG workflows, and business process automation.',
          },
        },
      ],
    },
  }
}

export function buildWebSiteSchema(description: string = DEFAULT_ORGANIZATION_DESCRIPTION) {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: 'Erythro.ai',
    alternateName: ['Erythro AI', 'Эритро.ай', 'איריתרו'],
    description,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: ['en', 'ru', 'he'],
  }
}

export function buildFaqPageSchema(items: FaqItem[]) {
  const mainEntity = items
    .map((item) => ({
      question: item.question.en,
      answer: item.answer.en,
    }))
    .filter((row) => row.question && row.answer)
    .map((row) => ({
      '@type': 'Question',
      name: row.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: row.answer,
      },
    }))

  if (!mainEntity.length) return null

  return {
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/#faq`,
    mainEntity,
  }
}
