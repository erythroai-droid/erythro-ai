import type { Field } from 'payload'

/** Non-localized URL / hash for CTA buttons and text links. */
export const ctaHrefField = (name: string, overrides: Partial<Field> = {}): Field => ({
  name,
  type: 'text',
  admin: {
    description:
      'Link target with a leading slash: /order/audit-pro, /portfolio, #contacts, or #contact-modal. Relative paths like order/audit-pro become /audit/order/… and 404.',
  },
  ...(overrides as object),
})
