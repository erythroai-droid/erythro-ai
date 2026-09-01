import type { Payload } from 'payload'

export const FREE_AUDIT_COOLDOWN_DAYS = 5
export const FREE_AUDIT_COOLDOWN_MS = FREE_AUDIT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000

export const AUDIT_RATE_LIMIT_MESSAGES = {
  domainRecent: {
    en: 'This website was recently audited. Free audit for a domain is available once every 5 days.',
    ru: 'Этот сайт уже анализировался недавно. Бесплатный аудит для одного домена доступен 1 раз в 5 дней.',
    he: 'אתר זה נבדק לאחרונה. בדיקה חינמית לדומיין זמינה פעם ב-5 ימים.',
  },
  userRecent: {
    en: 'You have reached the free audit limit (1 audit every 5 days). Please try again later or choose a comprehensive audit plan.',
    ru: 'Вы исчерпали лимит бесплатных аудитов (1 раз в 5 дней). Попробуйте позже или выберите расширенный аудит.',
    he: 'הגעת למגבלת הבדיקות החינמיות (בדיקה 1 בכל 5 ימים). נסה שוב מאוחר יותר או בחר בבדיקה מורחבת.',
  },
} as const

/**
 * Extracts and canonicalizes the domain/hostname from any URL or domain string.
 * Example inputs:
 *   "https://www.example.com/foo/bar?q=1#hash" -> "example.com"
 *   "http://sub.domain.co.il:8080"             -> "sub.domain.co.il"
 *   "WWW.My-Site.Com/"                         -> "my-site.com"
 *   "foo.bar.org"                              -> "foo.bar.org"
 */
export function extractAuditDomain(raw: string): string {
  if (!raw || typeof raw !== 'string') return ''
  let cleaned = raw.trim().toLowerCase()
  if (!cleaned) return ''

  // Prepend protocol if missing so URL parser works reliably
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`
  }

  try {
    const parsed = new URL(cleaned)
    let hostname = parsed.hostname.toLowerCase()
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4)
    }
    return hostname
  } catch {
    // Fallback regex if URL parsing fails
    const match = cleaned.replace(/^https?:\/\//i, '').split(/[/:]/)[0]
    return match ? match.replace(/^www\./i, '').toLowerCase() : ''
  }
}

export type FreeAuditCooldownResult =
  | { allowed: true }
  | {
      allowed: false
      reason: 'domain_recent' | 'user_recent'
      message: string
      retryAfterSec: number
    }

export type CheckFreeAuditCooldownOptions = {
  website: string
  email: string
  ip: string
  locale?: string
  now?: number
}

/**
 * Checks if a Free Audit request is allowed based on the 5-day cooldown rule:
 * 1. Checks if the target domain was already audited (or in progress) in the last 5 days.
 * 2. Checks if the user (by IP or email) has already submitted a free audit in the last 5 days.
 */
export async function checkFreeAuditCooldown(
  payload: Payload,
  options: CheckFreeAuditCooldownOptions,
): Promise<FreeAuditCooldownResult> {
  const now = options.now ?? Date.now()
  const currentDomain = extractAuditDomain(options.website)
  const currentEmail = options.email.trim().toLowerCase()
  const currentIp = options.ip.trim()
  const lang = (options.locale === 'he' ? 'he' : options.locale === 'ru' ? 'ru' : 'en') as
    | 'en'
    | 'ru'
    | 'he'

  if (!currentDomain) {
    return { allowed: true }
  }

  const cutoffDate = new Date(now - FREE_AUDIT_COOLDOWN_MS)
  const cutoffIso = cutoffDate.toISOString()

  // Query recent audit submissions within the last 5 days (excluding failed ones)
  const recentSubmissions = await payload.find({
    collection: 'contact-submissions',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    where: {
      and: [
        { source: { equals: 'audit' } },
        {
          or: [
            { planSlug: { equals: 'audit-free' } },
            { planSlug: { exists: false } },
            { planSlug: { equals: '' } },
          ],
        },
        {
          auditStatus: { not_equals: 'failed' },
        },
        {
          createdAt: { greater_than_equal: cutoffIso },
        },
      ],
    },
    sort: '-createdAt',
  })

  for (const doc of recentSubmissions.docs) {
    const docCreatedAt = doc.createdAt ? new Date(doc.createdAt).getTime() : now
    const elapsedMs = now - docCreatedAt
    if (elapsedMs >= FREE_AUDIT_COOLDOWN_MS) {
      continue
    }
    const remainingMs = Math.max(0, FREE_AUDIT_COOLDOWN_MS - elapsedMs)
    const retryAfterSec = Math.max(1, Math.ceil(remainingMs / 1000))

    const docDomain = doc.website ? extractAuditDomain(doc.website) : ''
    const docEmail = typeof doc.email === 'string' ? doc.email.trim().toLowerCase() : ''
    const docIp = typeof (doc as { ip?: string }).ip === 'string' ? (doc as { ip?: string }).ip?.trim() : ''

    // 1. Same domain cooldown
    if (docDomain && docDomain === currentDomain) {
      return {
        allowed: false,
        reason: 'domain_recent',
        message: AUDIT_RATE_LIMIT_MESSAGES.domainRecent[lang],
        retryAfterSec,
      }
    }

    // 2. Same user cooldown (by IP or by Email)
    const matchesEmail = Boolean(currentEmail && docEmail && docEmail === currentEmail)
    const matchesIp = Boolean(
      currentIp &&
        currentIp !== 'unknown' &&
        currentIp !== '127.0.0.1' &&
        currentIp !== '::1' &&
        docIp &&
        docIp === currentIp,
    )

    if (matchesEmail || matchesIp) {
      return {
        allowed: false,
        reason: 'user_recent',
        message: AUDIT_RATE_LIMIT_MESSAGES.userRecent[lang],
        retryAfterSec,
      }
    }
  }

  return { allowed: true }
}
