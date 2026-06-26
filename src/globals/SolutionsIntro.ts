import type { GlobalConfig } from 'payload'
import { locText } from '../fields/localized'

export const SolutionsIntro: GlobalConfig = {
  slug: 'solutions-section',
  label: 'Solutions Section',
  admin: { group: 'Sections' },
  fields: [
    locText('sectionTitle'),
    locText('sectionSubtitle'),
    locText('ctaLabel'),
  ],
}
