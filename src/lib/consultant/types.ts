/**
 * Portable consultant contracts. No Payload / Next / Erythro imports here —
 * the host app supplies every side effect through `ConsultHandlerDeps`.
 */

export type ConsultLocale = 'en' | 'ru' | 'he'

/** Text is the only part kind shipped in v1; `file` / `audio` are reserved so
 * that stored transcripts and the widget never assume `message === string`. */
export type ConsultPart =
  | { type: 'text'; text: string }
  | { type: 'file'; name: string; mediaType: string; ref: string }
  | { type: 'audio'; ref: string; durationMs?: number }

/** `engineer` is unused in v1 (tech answers go out by email) but kept in the
 * contract so a human hand-off does not require a transcript migration. */
export type ConsultRole = 'user' | 'assistant' | 'engineer'

export type ConsultMessage = {
  role: ConsultRole
  parts: ConsultPart[]
}

export type ConsultHandoff = 'bot' | 'queued' | 'human'

/** Knowledge handed to the model verbatim. `live: false` means the CMS failed
 * and the static snapshot is in use — the model must hedge on prices. */
export type ConsultantKnowledge = {
  markdown: string
  live: boolean
}

export type BriefSlot = {
  id: string
  question: string
  hint?: string
}

export type ConsultantRules = {
  /** Editor-owned guardrails appended to the system prompt. */
  botRules: string
  briefSlots: BriefSlot[]
  /** Shown before contacts are requested (chat will be stored). */
  savePolicyNotice: string
  anonMessageLimit: number
  verifiedMessageLimit: number
}

/** Per-request identity derived from signed cookies, never from model output. */
export type ConsultIdentity = {
  verifiedEmail: string | null
  sessionId: number | null
  phone: string | null
}

export type TranslateStyle = 'UI/Microcopy' | 'Documentation/RFC'

export type TranslateResult = {
  text: string
  /** `skipped` when the VPS pipeline was unreachable — copy stays as authored. */
  status: 'translated' | 'skipped'
}

export type SubmitBriefInput = {
  locale: ConsultLocale
  email: string
  phone: string
  name?: string
  company?: string
  briefMarkdown: string
  sessionId: number | null
  /** 'skipped' means the Translater was unreachable — the wording needs review. */
  translaterStatus: 'translated' | 'skipped'
}

export type SubmitBriefResult = {
  projectNumber: string
  crmStatus: 'created' | 'pending'
  emailed: boolean
}

export type EscalateTechInput = {
  locale: ConsultLocale
  email: string
  question: string
  excerpt: string
  sessionId: number | null
}

export type EscalateTechResult = {
  ticketId: string
}

export type IdentifyClientInput = {
  locale: ConsultLocale
  email: string
  phone: string
  messages: ConsultMessage[]
}

export type ConsultHandlerDeps = {
  getKnowledge: (locale: ConsultLocale) => Promise<ConsultantKnowledge>
  getRules: (locale: ConsultLocale) => Promise<ConsultantRules>
  /**
   * Authoritative phone / session lookup for an already verified email.
   * Identity is never read back from the client: the verified email comes from
   * a signed cookie and everything else is resolved server-side from it.
   */
  resolveIdentity: (email: string) => Promise<{ sessionId: number | null; phone: string | null }>
  /** Resolves disputed IT terminology through the Translater service. */
  translate?: (input: {
    text: string
    locale: ConsultLocale
    style: TranslateStyle
  }) => Promise<TranslateResult>
  identifyClient: (input: IdentifyClientInput) => Promise<{ sessionId: number | null }>
  persistSession: (input: {
    sessionId: number
    messages: ConsultMessage[]
  }) => Promise<void>
  escalateTech: (input: EscalateTechInput) => Promise<EscalateTechResult>
  submitBrief: (input: SubmitBriefInput) => Promise<SubmitBriefResult>
  /** Overrides the pinned model. Emergency use only. */
  model?: string
}
