import type { Field } from 'payload'

/** Non-localized URL / hash for CTA buttons and text links. */
export const ctaHrefField = (name: string, overrides: Partial<Field> = {}): Field => ({
  name,
  type: 'text',
  admin: {
    description:
      'Link target: /portfolio, #contacts, #services, or #contact-modal (opens the contact form).',
  },
  ...(overrides as object),
})
