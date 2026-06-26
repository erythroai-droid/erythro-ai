import type { Field } from 'payload'

/** Localized single-line text field. */
export const locText = (name: string, overrides: Partial<Field> = {}): Field => ({
  name,
  type: 'text',
  localized: true,
  ...(overrides as object),
})

/** Localized multi-line text field. */
export const locTextarea = (name: string, overrides: Partial<Field> = {}): Field => ({
  name,
  type: 'textarea',
  localized: true,
  ...(overrides as object),
})
