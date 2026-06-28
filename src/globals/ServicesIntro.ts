import type { GlobalConfig } from 'payload'
import { locText } from '../fields/localized'
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
    locText('priceLabel'),
  ],
}
