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
  ],
}
