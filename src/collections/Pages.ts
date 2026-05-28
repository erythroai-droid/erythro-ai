import type { CollectionConfig, Block } from 'payload'

const HeroBlock: Block = {
  slug: 'heroBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'ctaText',
      type: 'text',
      defaultValue: "LET'S TALK...",
      localized: true,
    },
  ],
}

const WordStackBlock: Block = {
  slug: 'wordStackBlock',
  fields: [
    {
      name: 'words',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'word',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      unique: true,
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [HeroBlock, WordStackBlock],
    },
  ],
}
