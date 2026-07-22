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
    locText('viewAllProjects', {
      admin: { description: 'Text link under the video banner, e.g. "View All Projects" (arrows are added in UI)' },
    }),
    {
      name: 'bannerVideo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Desktop banner video (1024px+). Shown instead of the static default when set.',
      },
    },
    {
      name: 'bannerVideoMobile',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Mobile banner video (under 1024px). Falls back to the desktop video when empty.',
      },
    },
  ],
}
