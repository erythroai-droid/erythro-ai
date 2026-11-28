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
          'Rotating 1920×1080 (16:9) video banners on the homepage “Our works” block. Optional lighter mobile file per slide; the site loads only the active slide.',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'video',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description: 'Desktop banner — 1920×1080 (16:9), short muted MP4/WebM.',
          },
        },
        {
          name: 'videoMobile',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description:
              'Mobile banner — same 16:9 crop, lighter/smaller file preferred. Falls back to desktop when empty.',
          },
        },
      ],
    },
  ],
}
