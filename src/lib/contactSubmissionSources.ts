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
 * AI Audit Orders: source=audit, excluding leak calculator LP.
 * Leak rows stay source=audit for the worker, but use leadChannel=leak_calc.
 */
export function auditOrdersListHref(): string {
  return (
    `/admin/collections/${COLLECTION}` +
    `?where[and][0][source][equals]=audit` +
    `&where[and][1][leadChannel][not_equals]=leak_calc`
  )
}

/** Leak calculator LP only (revenue-leak landing → free audit). */
export function leakSubmissionsListHref(): string {
  return (
    `/admin/collections/${COLLECTION}` +
    `?where[and][0][source][equals]=audit` +
    `&where[and][1][leadChannel][equals]=leak_calc`
  )
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
    description:
      'AI Audit checkout and /audit / audit-* ads LP (source=audit, not leak calculator).',
    inNav: true,
  },
  {
    id: 'contact',
    navLabel: 'Contact Inquiries',
    description: 'Contact page and general feedback (source=contact).',
    inNav: true,
  },
]

/** Sidebar / dashboard nav entries (audit split from leak by leadChannel). */
export type SubmissionNavId = 'order' | 'audit' | 'leak' | 'contact'

export type SubmissionNavLink = {
  id: SubmissionNavId
  navLabel: string
  description: string
  href: string
}

export const SUBMISSION_NAV_LINKS: SubmissionNavLink[] = [
  {
    id: 'order',
    navLabel: 'Solution Orders',
    description: 'Checkout submissions from /order/* solution plans (source=order).',
    href: submissionListHref('order'),
  },
  {
    id: 'audit',
    navLabel: 'AI Audit Orders',
    description: 'AI Audit leads from /audit and audit-* ads LP (excludes leak calculator).',
    href: auditOrdersListHref(),
  },
  {
    id: 'leak',
    navLabel: 'Leak Calculator',
    description: 'Revenue-leak calculator LP (leak-*.erythro.ai) — free check only.',
    href: leakSubmissionsListHref(),
  },
  {
    id: 'contact',
    navLabel: 'Contact Inquiries',
    description: 'Contact page and general feedback (source=contact).',
    href: submissionListHref('contact'),
  },
]

export const SUBMISSION_SOURCES_IN_NAV = CONTACT_SUBMISSION_SOURCES.filter((s) => s.inNav)

export function submissionSourceDef(id: ContactSubmissionSourceId): ContactSubmissionSourceDef | undefined {
  return CONTACT_SUBMISSION_SOURCES.find((s) => s.id === id)
}
