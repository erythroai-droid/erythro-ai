import type { GlobalConfig } from 'payload'
import { locText, locTextarea } from '../fields/localized'
import { revalidateGlobal } from '../lib/revalidate'

export const CaseStudies: GlobalConfig = {
  slug: 'case-studies',
  label: 'Case Studies Section',
  admin: { group: 'Sections' },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    locText('preTitle'),
    locText('subtitle'),
    locText('cardTitle'),
    locText('cardCategory'),
    locTextarea('cardDescription'),
    locText('cardCTA'),
    {
      name: 'bannerVideo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Case Studies banner video (mp4). Shown instead of the static default when set.',
      },
    },
  ],
}
