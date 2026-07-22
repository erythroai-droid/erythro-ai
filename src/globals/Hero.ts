import type { GlobalConfig } from 'payload'
import { locText, locTextarea } from '../fields/localized'
import { revalidateGlobal } from '../lib/revalidate'

export const Hero: GlobalConfig = {
  slug: 'hero',
  label: 'Hero Section',
  admin: { group: 'Sections' },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    locText('preHeading'),
    locText('mainHeading'),
    locTextarea('subtext'),
    locText('ctaFind', { admin: { description: '"Find out more" button label' } }),
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional hero background image' },
    },
    {
      name: 'words',
      type: 'array',
      labels: { singular: 'Phrase', plural: 'Motion Headings' },
      admin: {
        description:
          'Rotating hero headlines shown on the home page. Edit per locale (en / ru / he). Need at least 2 phrases.',
      },
      fields: [locText('word', { required: true })],
    },
  ],
}
