/**
 * CRM contract for the consultant. One function, one adapter per CRM.
 *
 * A failure here must never lose the brief: `POST /api/consult` stores
 * `project-briefs` and sends the `order@` email first, then calls this and
 * records `crmStatus=pending` on any error.
 *
 * The board URL is staff-only — it is never returned to the chat (links are
 * forbidden in the brief and in the email).
 */
export type CrmProjectInput = {
  projectNumber: string
  briefMarkdown: string
  contact: {
    name?: string
    company?: string
    email: string
    phone: string
    locale: string
  }
}

export type CrmProjectResult = {
  status: 'created' | 'pending'
  itemId?: string
  reason?: string
}

export type CrmAdapter = (input: CrmProjectInput) => Promise<CrmProjectResult>
