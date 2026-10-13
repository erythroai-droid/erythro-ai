import type { Payload } from 'payload'

export const FREE_AUDIT_COOLDOWN_DAYS = 7
export const FREE_AUDIT_COOLDOWN_MS = FREE_AUDIT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000

/**
 * When true (and AUDIT_SKIP_COOLDOWN is unset), skip free-audit cooldown and the
 * IP window on `/api/contact`. Override: `AUDIT_SKIP_COOLDOWN=0|1` on Vercel.
 */
export const AUDIT_INTAKE_LIMITS_OPEN_FOR_QA = false

export function isAuditIntakeLimitsDisabled(): boolean {
  const v = process.env.AUDIT_SKIP_COOLDOWN?.trim().toLowerCase()
  if (v === '0' || v === 'false' || v === 'off') return false
  if (v === '1' || v === 'true' || v === 'on') return true
  return AUDIT_INTAKE_LIMITS_OPEN_FOR_QA
}

export type AuditRateLimitLang = 'en' | 'ru' | 'he'

function resolveLang(locale?: string): AuditRateLimitLang {
  return locale === 'he' ? 'he' : locale === 'ru' ? 'ru' : 'en'
}

function ruPlural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return many
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}

/**
 * Human-readable remaining cooldown: days, hours, and minutes (zero units omitted).
 */
export function formatFreeAuditRemaining(remainingMs: number, locale?: string): string {
  const lang = resolveLang(locale)
  // Whole minutes (ceil) so the UI never shows bare seconds.
  const totalMin = Math.max(1, Math.ceil(Math.max(0, remainingMs) / 60_000))
  const days = Math.floor(totalMin / (24 * 60))
  const hours = Math.floor((totalMin % (24 * 60)) / 60)
  const mins = totalMin % 60
  const parts: string[] = []

  if (lang === 'ru') {
    if (days > 0) parts.push(`${days} ${ruPlural(days, 'день', 'дня', 'дней')}`)
    if (hours > 0) parts.push(`${hours} ${ruPlural(hours, 'час', 'часа', 'часов')}`)
    if (mins > 0 || parts.length === 0) {
      parts.push(`${mins || 1} ${ruPlural(mins || 1, 'минута', 'минуты', 'минут')}`)
    }
    return parts.join(' ')
  }

  if (lang === 'he') {
    if (days > 0) parts.push(days === 1 ? 'יום אחד' : `${days} ימים`)
    if (hours > 0) parts.push(hours === 1 ? 'שעה אחת' : `${hours} שעות`)
    if (mins > 0 || parts.length === 0) {
      const m = mins || 1
      parts.push(m === 1 ? 'דקה אחת' : `${m} דקות`)
    }
    return parts.join(' ')
  }

  if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`)
  if (mins > 0 || parts.length === 0) {
    const m = mins || 1
    parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`)
  }
  return parts.join(' ')
}

const COOLDOWN_MESSAGE_TEMPLATES = {
  domainRecent: {
    en: 'This website was recently audited. The next free check is available in {remaining}.',
    ru: 'Этот сайт уже анализировался недавно. Следующая бесплатная проверка возможна через {remaining}.',
    he: 'אתר זה נבדק לאחרונה. הבדיקה החינמית הבאה אפשרית בעוד {remaining}.',
  },
  userRecent: {
    en: 'You already used a free audit. The next free check is available in {remaining}. Or choose a comprehensive audit plan.',
    ru: 'Вы уже использовали бесплатный аудит. Следующая бесплатная проверка возможна через {remaining}. Или выберите расширенный аудит.',
    he: 'כבר השתמשת בבדיקה חינמית. הבדיקה החינמית הבאה אפשרית בעוד {remaining}. או בחר/י בבדיקה מורחבת.',
  },
} as const

/** Static fallbacks (tests / docs); live responses always inject `{remaining}`. */
export const AUDIT_RATE_LIMIT_MESSAGES = {
  domainRecent: {
    en: COOLDOWN_MESSAGE_TEMPLATES.domainRecent.en.replace(
      '{remaining}',
      `${FREE_AUDIT_COOLDOWN_DAYS} days`,
    ),
    ru: COOLDOWN_MESSAGE_TEMPLATES.domainRecent.ru.replace(
      '{remaining}',
      `${FREE_AUDIT_COOLDOWN_DAYS} дней`,
    ),
    he: COOLDOWN_MESSAGE_TEMPLATES.domainRecent.he.replace(
      '{remaining}',
      `${FREE_AUDIT_COOLDOWN_DAYS} ימים`,
    ),
  },
  userRecent: {
    en: COOLDOWN_MESSAGE_TEMPLATES.userRecent.en.replace(
      '{remaining}',
      `${FREE_AUDIT_COOLDOWN_DAYS} days`,
    ),
    ru: COOLDOWN_MESSAGE_TEMPLATES.userRecent.ru.replace(
      '{remaining}',
      `${FREE_AUDIT_COOLDOWN_DAYS} дней`,
    ),
    he: COOLDOWN_MESSAGE_TEMPLATES.userRecent.he.replace(
      '{remaining}',
      `${FREE_AUDIT_COOLDOWN_DAYS} ימים`,
    ),
  },
} as const

function buildCooldownMessage(
  reason: 'domain_recent' | 'user_recent',
  remainingLabel: string,
  lang: AuditRateLimitLang,
): string {
  const key = reason === 'domain_recent' ? 'domainRecent' : 'userRecent'
  return COOLDOWN_MESSAGE_TEMPLATES[key][lang].replace('{remaining}', remainingLabel)
}

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
      retryAfterLabel: string
    }

export type CheckFreeAuditCooldownOptions = {
  website: string
  email: string
  ip: string
  locale?: string
  now?: number
}

/**
 * Checks if a Free Audit request is allowed based on the 7-day cooldown rule:
 * 1. Checks if the target domain was already audited (or in progress) in the last 7 days.
 * 2. Checks if the user (by IP or email) has already submitted a free audit in the last 7 days.
 */
export async function checkFreeAuditCooldown(
  payload: Payload,
  options: CheckFreeAuditCooldownOptions,
): Promise<FreeAuditCooldownResult> {
  if (isAuditIntakeLimitsDisabled()) {
    return { allowed: true }
  }

  const now = options.now ?? Date.now()
  const currentDomain = extractAuditDomain(options.website)
  const currentEmail = options.email.trim().toLowerCase()
  const currentIp = options.ip.trim()
  const lang = resolveLang(options.locale)

  if (!currentDomain) {
    return { allowed: true }
  }

  const cutoffDate = new Date(now - FREE_AUDIT_COOLDOWN_MS)
  const cutoffIso = cutoffDate.toISOString()

  // Query recent audit submissions within the cooldown window (excluding failed ones)
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
    const retryAfterLabel = formatFreeAuditRemaining(remainingMs, lang)

    const docDomain = doc.website ? extractAuditDomain(doc.website) : ''
    const docEmail = typeof doc.email === 'string' ? doc.email.trim().toLowerCase() : ''
    const docIp = typeof (doc as { ip?: string }).ip === 'string' ? (doc as { ip?: string }).ip?.trim() : ''

    // 1. Same domain cooldown
    if (docDomain && docDomain === currentDomain) {
      return {
        allowed: false,
        reason: 'domain_recent',
        message: buildCooldownMessage('domain_recent', retryAfterLabel, lang),
        retryAfterSec,
        retryAfterLabel,
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
        message: buildCooldownMessage('user_recent', retryAfterLabel, lang),
        retryAfterSec,
        retryAfterLabel,
      }
    }
  }

  return { allowed: true }
}
