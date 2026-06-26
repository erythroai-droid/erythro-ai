import type { GlobalConfig } from 'payload'
import { locText } from '../fields/localized'

export const ServicesIntro: GlobalConfig = {
  slug: 'services-section',
  label: 'Services Section',
  admin: { group: 'Sections' },
  fields: [
    locText('sectionTitle'),
    locText('sectionSubtitle'),
    locText('startCTA'),
    locText('priceLabel'),
  ],
}
