/**
 * Reusable AI consultant backend (Gemini Flash + a host-supplied knowledge base).
 *
 * The module owns the conversation rules, the tool surface, the anti-abuse
 * primitives and the SSE protocol. It imports no CMS, no ORM and no Next.js
 * server helpers — every side effect is injected, so a second project copies
 * this folder plus `components/consultant` and writes its own assembler.
 *
 * @example
 * ```ts
 * // src/app/api/consult/route.ts
 * const handler = createConsultHandler({
 *   getKnowledge: assembleConsultantKnowledge,   // your CMS / DB
 *   getRules: fetchConsultantRules,
 *   resolveIdentity: resolveConsultIdentity,
 *   translate: translateViaService,
 *   identifyClient, persistSession, escalateTech, submitBrief,
 * })
 *
 * export async function POST(request: Request) {
 *   // host owns transport concerns: captcha, IP limits, cookies
 *   return handler.respond({ locale, messages, identity, otpEnabled })
 * }
 * ```
 *
 * Extension points reserved but disabled in v1: `ConsultPart` already allows
 * `file` / `audio`, and `ConsultRole` already allows `engineer`, so voice,
 * attachments and a human hand-off will not require a transcript migration.
 */

export { createConsultHandler, type ConsultRespondInput } from './handler'

export {
  CONSULT_MODEL,
  consultLocale,
  consultModel,
  geminiApiKey,
  isConsultantConfigured,
  isOtpEnabled,
  isProductionRuntime,
  otpPepper,
  readPositiveInt,
} from './config'

export {
  CONSULT_STREAM_HEADERS,
  consultNoticeResponse,
  createConsultStream,
  readConsultStream,
  type ConsultAction,
  type ConsultEscalationTarget,
  type ConsultEvent,
  type ConsultNoticeCode,
} from './stream'

export {
  advanceVerifiedCookie,
  canResend,
  createOtpChallenge,
  createVerifiedCookie,
  dayBucket,
  generateOtpCode,
  isRoleMailbox,
  normalizeEmail,
  OTP_CHALLENGE_COOKIE,
  OTP_LIMITS,
  OTP_VERIFIED_COOKIE,
  readVerifiedCookie,
  verifyOtpChallenge,
  type VerifiedState,
} from './otp'

export {
  ANON_COOKIE,
  anonIpQuotaConfig,
  consultRateLimitConfig,
  consumeRateLimit,
  getRequestIp,
  hashIp,
  otpIpQuotaConfig,
  readAnonCookie,
  writeAnonCookie,
  type RateLimitResult,
} from './quota'

export { clearConsultCookie, serializeConsultCookie } from './cookies'

export { isTranslaterConfigured, translateUrl, translateViaService } from './translate'
export { isPromptCacheEnabled } from './cache'

export { IT_GLOSSARY, glossaryForPrompt, isGlossaryTerm } from './glossary'

export {
  escapeHtml,
  hasUrl,
  sanitizeBriefMarkdown,
  sanitizeHeaderValue,
  sanitizeText,
  stripUrls,
} from './sanitize'

export { buildSystemPrompt } from './prompt'
export { detectReplyLocale } from './replyLocale'

export type {
  BriefSlot,
  ConsultantKnowledge,
  ConsultantRules,
  ConsultHandlerDeps,
  ConsultHandoff,
  ConsultIdentity,
  ConsultLocale,
  ConsultMessage,
  ConsultPart,
  ConsultRole,
  EscalateTechInput,
  EscalateTechResult,
  IdentifyClientInput,
  SubmitBriefInput,
  SubmitBriefResult,
  TranslateResult,
  TranslateStyle,
} from './types'
