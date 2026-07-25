import type { GlobalConfig } from 'payload'
import { locText } from '../fields/localized'
import { ctaHrefField } from '../fields/ctaHref'
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
    ctaHrefField('ctaHref', {
      admin: {
        description:
          'Optional override for all plan buttons. Leave empty to use each plan’s own link (or /order/{slug}).',
      },
    }),
  ],
}
