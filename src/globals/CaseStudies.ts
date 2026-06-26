import type { GlobalConfig } from 'payload'
import { locText, locTextarea } from '../fields/localized'

export const CaseStudies: GlobalConfig = {
  slug: 'case-studies',
  label: 'Case Studies Section',
  admin: { group: 'Sections' },
  fields: [
    locText('preTitle'),
    locText('subtitle'),
    locText('cardTitle'),
    locText('cardCategory'),
    locTextarea('cardDescription'),
    locText('cardCTA'),
  ],
}
