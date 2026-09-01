import type { ContactFormSource } from '@/lib/contactNotification'

/** Payload `contact-submissions.source` values (extend when adding new intake channels). */
export type ContactSubmissionSourceId = ContactFormSource

export type ContactSubmissionSourceDef = {
  id: ContactSubmissionSourceId
  /** Sidebar + dashboard label (English admin UI). */
  navLabel: string
  description: string
  /** Show a dedicated filtered list in the admin sidebar. */
  inNav: boolean
}

const COLLECTION = 'contact-submissions'

/** Build Payload admin list URL with a source filter. */
export function submissionListHref(source: ContactSubmissionSourceId): string {
  return `/admin/collections/${COLLECTION}?where[source][equals]=${source}`
}

/**
 * Registered intake channels for Contact Submissions.
 * Add a row here + a select option on the collection when shipping a new service.
 */
export const CONTACT_SUBMISSION_SOURCES: ContactSubmissionSourceDef[] = [
  {
    id: 'order',
    navLabel: 'Solution Orders',
    description: 'Checkout submissions from /order/* solution plans (source=order).',
    inNav: true,
  },
  {
    id: 'audit',
    navLabel: 'AI Audit Orders',
    description: 'AI Audit checkout and /audit form leads (source=audit).',
    inNav: true,
  },
  {
    id: 'contact',
    navLabel: 'Contact Inquiries',
    description: 'Contact page and general feedback (source=contact).',
    inNav: true,
  },
]

export const SUBMISSION_SOURCES_IN_NAV = CONTACT_SUBMISSION_SOURCES.filter((s) => s.inNav)

export function submissionSourceDef(id: ContactSubmissionSourceId): ContactSubmissionSourceDef | undefined {
  return CONTACT_SUBMISSION_SOURCES.find((s) => s.id === id)
}
