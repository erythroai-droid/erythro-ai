import type { GlobalConfig } from 'payload'
import { locText } from '../fields/localized'
import { ctaHrefField } from '../fields/ctaHref'
import { revalidateGlobal } from '../lib/revalidate'

export const ServicesIntro: GlobalConfig = {
  slug: 'services-section',
  label: 'Services Section',
  admin: { group: 'Sections' },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    locText('sectionTitle'),
    locText('sectionSubtitle'),
    locText('startCTA'),
    ctaHrefField('startCtaHref', {
      defaultValue: '#contact-modal',
      admin: { description: 'Link for the services “start” CTA when used.' },
    }),
    locText('priceLabel'),
  ],
}
