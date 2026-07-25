import type { GlobalConfig } from 'payload'
import { locText, locTextarea } from '../fields/localized'
import { ctaHrefField } from '../fields/ctaHref'
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
    ctaHrefField('ctaHref', {
      admin: {
        description:
          'Find out more link. Default #contacts (mobile → contacts, desktop → Let’s Talk scroll). Use #contact-modal for the form, or any URL/path.',
      },
    }),
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
          'Rotating hero headlines on the home page. Each phrase has a solid main line and an optional large background outline. Edit per locale (en / ru / he). Need at least 2 phrases.',
      },
      fields: [
        locText('word', {
          required: true,
          label: 'Main text',
          admin: {
            description: 'Solid foreground headline (the text that settles into the hero title).',
          },
        }),
        locText('outline', {
          label: 'Background outline',
          admin: {
            description:
              'Large outline text behind the main headline. Leave empty to reuse the main text.',
          },
        }),
      ],
    },
  ],
}
