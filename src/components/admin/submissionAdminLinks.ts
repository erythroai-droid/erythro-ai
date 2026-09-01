import { submissionListHref, type ContactSubmissionSourceId } from '@/lib/contactSubmissionSources'

/** @deprecated Use submissionListHref('audit') */
export const AUDITS_LIST_HREF = submissionListHref('audit')

export const AUDITS_FAILED_HREF = `${AUDITS_LIST_HREF}&where[auditStatus][equals]=failed`

export const AUDITS_ACTIVE_HREF = `${AUDITS_LIST_HREF}&where[or][0][auditStatus][equals]=new&where[or][1][auditStatus][equals]=in_progress`

export const SOLUTION_ORDERS_LIST_HREF = submissionListHref('order')

export const CONTACT_INQUIRIES_LIST_HREF = submissionListHref('contact')

/** Detect active filtered list from the current URL search string. */
export function activeSubmissionSource(search: string): ContactSubmissionSourceId | null {
  if (search.includes('where[source][equals]=order')) return 'order'
  if (search.includes('where[source][equals]=audit')) return 'audit'
  if (search.includes('where[source][equals]=contact')) return 'contact'
  return null
}
