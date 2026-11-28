import type { GlobalConfig } from 'payload'
import { locText, locTextarea } from '../fields/localized'
import { ctaHrefField } from '../fields/ctaHref'
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
    ctaHrefField('cardCtaHref', {
      defaultValue: '/portfolio',
      admin: { description: 'Optional link for the card CTA label (if shown).' },
    }),
    locText('viewAllProjects', {
      admin: { description: 'Text link under the video banner, e.g. "View All Projects" (arrows are added in UI)' },
    }),
    ctaHrefField('viewAllHref', {
      defaultValue: '/portfolio',
      admin: { description: 'Banner + “View all projects” link. Default /portfolio.' },
    }),
    {
      name: 'banners',
      type: 'array',
      labels: { singular: 'Banner', plural: 'Video banners' },
      admin: {
        description:
          'Rotating video banners on the homepage “Our works” block. Each row needs a desktop video; add a separate mobile cut when the crop differs. The site loads only the active slide (not every file at once).',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'video',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description: 'Desktop banner video (1024px+). Prefer short muted MP4/WebM.',
          },
        },
        {
          name: 'videoMobile',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description:
              'Mobile banner video (under 1024px, ideally 9:16). Falls back to the desktop file when empty.',
          },
        },
      ],
    },
  ],
}
