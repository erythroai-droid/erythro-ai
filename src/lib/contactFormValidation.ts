export type ContactFormValues = {
  name: string
  email: string
  phone: string
  message: string
}

export type ContactField = keyof ContactFormValues
export type ContactFieldError = 'required' | 'invalid'
export type ContactFieldErrors = Partial<Record<ContactField, ContactFieldError>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Client-side checks aligned with `/api/contact` required fields. */
export function validateContactForm(values: ContactFormValues): ContactFieldErrors {
  const errors: ContactFieldErrors = {}

  if (!values.name.trim()) errors.name = 'required'
  if (!values.email.trim()) errors.email = 'required'
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'invalid'
  if (!values.message.trim()) errors.message = 'required'

  return errors
}

export function hasContactFieldErrors(errors: ContactFieldErrors): boolean {
  return Object.keys(errors).length > 0
}
