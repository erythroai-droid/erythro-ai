/** Filtered Contact Submissions list: source = audit */
export const AUDITS_LIST_HREF =
  '/admin/collections/contact-submissions?where[source][equals]=audit'

export const AUDITS_FAILED_HREF = `${AUDITS_LIST_HREF}&where[auditStatus][equals]=failed`

export const AUDITS_ACTIVE_HREF = `${AUDITS_LIST_HREF}&where[or][0][auditStatus][equals]=new&where[or][1][auditStatus][equals]=in_progress`
