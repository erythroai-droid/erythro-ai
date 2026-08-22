import type { SiteContent } from '@/lib/defaultContent'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

type FaqItem = SiteContent['faq']['items'][number]

export function buildOrganizationSchema(content: SiteContent, description: string) {
  const site = content.siteSettings
  const sameAs = [site.facebook, site.telegram].filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0,
  )

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Erythro.ai',
    url: SITE_URL,
    logo: `${SITE_URL}/images/favicon/android-chrome-512x512.png`,
    image: `${SITE_URL}/images/og-image.png`,
    description,
    email: (site.emailContacts || site.email).toLowerCase(),
    telephone: site.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Eilat',
      addressCountry: 'IL',
    },
    sameAs,
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

export function buildWebSiteSchema(description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'Erythro.ai',
    url: SITE_URL,
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
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/#faq`,
    mainEntity,
  }
}
