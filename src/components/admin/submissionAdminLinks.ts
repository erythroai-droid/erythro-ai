import {
  auditOrdersListHref,
  leakSubmissionsListHref,
  submissionListHref,
  type SubmissionNavId,
} from '@/lib/contactSubmissionSources'

/** @deprecated Use auditOrdersListHref() */
export const AUDITS_LIST_HREF = auditOrdersListHref()

export const AUDITS_FAILED_HREF = `${AUDITS_LIST_HREF}&where[and][2][auditStatus][equals]=failed`

export const AUDITS_ACTIVE_HREF =
  `${AUDITS_LIST_HREF}` +
  `&where[and][2][or][0][auditStatus][equals]=new` +
  `&where[and][2][or][1][auditStatus][equals]=in_progress`

export const SOLUTION_ORDERS_LIST_HREF = submissionListHref('order')

export const CONTACT_INQUIRIES_LIST_HREF = submissionListHref('contact')

export const LEAK_CALCULATOR_LIST_HREF = leakSubmissionsListHref()

/** Detect active filtered list from the current URL search string. */
export function activeSubmissionSource(search: string): SubmissionNavId | null {
  if (search.includes('where[source][equals]=order')) return 'order'
  if (search.includes('where[source][equals]=contact')) return 'contact'
  if (search.includes('leadChannel][equals]=leak_calc')) return 'leak'
  if (search.includes('where[source][equals]=audit') || search.includes('[source][equals]=audit')) {
    return 'audit'
  }
  return null
}
