import type { GlobalConfig } from 'payload'
import { locText } from '../fields/localized'
import { revalidateGlobal } from '../lib/revalidate'

export const SolutionsIntro: GlobalConfig = {
  slug: 'solutions-section',
  label: 'Solutions Section',
  admin: { group: 'Sections' },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    locText('sectionTitle'),
    locText('sectionSubtitle'),
    locText('ctaLabel'),
  ],
}
