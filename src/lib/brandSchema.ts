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
    '@id': `${SITE_URL}/#organization`,
    name: 'Erythro.ai',
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
  }
}

export function buildWebSiteSchema(description: string = DEFAULT_ORGANIZATION_DESCRIPTION) {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: 'Erythro.ai',
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
