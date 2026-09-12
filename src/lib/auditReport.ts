export type AuditReportStatus = 'new' | 'in_progress' | 'report_sent' | 'failed'

export type AuditReportPublicPayload = {
  id: number
  /** Client-facing order id for support, e.g. AUD-88 */
  orderId: string
  status: AuditReportStatus
  auditScore: number | null
  reportUrl: string | null
  /** @deprecated Report opens as full page via readyHtmlUrl; kept null for older clients */
  htmlPreview: string | null
  /** Path to standalone HTML document when status is report_sent */
  readyHtmlUrl: string | null
  website: string | null
  updatedAt: string | null
  /** Submission start time — used for the waiting-page progress estimate */
  createdAt: string | null
}

type LocaleMap = { en: string; ru: string; he: string }

/** Public order id shown in email / UI; maps 1:1 to contact-submissions.id */
export function formatAuditOrderId(id: number | string): string {
  if (typeof id === 'number') {
    if (!Number.isSafeInteger(id) || id <= 0) return `AUD-${String(id)}`
    return `AUD-${id}`
  }
  const parsed = parseAuditReportId(id)
  if (parsed) return `AUD-${parsed}`
  return `AUD-${id.trim()}`
}

export const auditReportCopy = {
  title: {
    en: 'Your AI Audit report',
    ru: 'Ваш отчёт AI-аудита',
    he: 'דוח ביקורת ה-AI שלך',
  } satisfies LocaleMap,
  orderId: {
    en: 'Order ID',
    ru: 'ID заказа',
    he: 'מספר הזמנה',
  } satisfies LocaleMap,
  orderIdHint: {
    en: 'Save this Order ID. If something goes wrong, send it to support.',
    ru: 'Сохраните ID заказа. Если отчёт не придёт или возникнет ошибка — укажите его в обращении в поддержку.',
    he: 'שמרו את מספר ההזמנה. אם משהו לא עובד — שלחו אותו לתמיכה.',
  } satisfies LocaleMap,
  waiting: {
    en: 'We are preparing your report. This page updates automatically.',
    ru: 'Готовим отчёт. Страница обновляется автоматически.',
    he: 'אנחנו מכינים את הדוח. העמוד מתעדכן אוטומטית.',
  } satisfies LocaleMap,
  progressLabel: {
    en: 'Report progress',
    ru: 'Готовность отчёта',
    he: 'התקדמות הדוח',
  } satisfies LocaleMap,
  etaTypical: {
    en: 'Usually 5–12 minutes.',
    ru: 'Обычно 5–12 минут.',
    he: 'בדרך כלל 5–12 דקות.',
  } satisfies LocaleMap,
  remaining: {
    en: 'About {n} min left',
    ru: 'Осталось около {n} мин',
    he: 'נותרו כ-{n} דק׳',
  } satisfies LocaleMap,
  finishing: {
    en: 'Almost done — finishing the report…',
    ru: 'Почти готово — завершаем отчёт…',
    he: 'כמעט מוכן — מסיימים את הדוח…',
  } satisfies LocaleMap,
  emailNotice: {
    en: 'The finished report will be sent to the email you provided. You can close this window or keep waiting here.',
    ru: 'Готовый отчёт придёт на указанный email. Можно закрыть окно или продолжить ожидание.',
    he: 'הדוח המוכן יישלח לאימייל שהזנתם. אפשר לסגור את החלון או להמשיך להמתין כאן.',
  } satisfies LocaleMap,
  inProgress: {
    en: 'Audit in progress…',
    ru: 'Аудит выполняется…',
    he: 'הביקורת בתהליך…',
  } satisfies LocaleMap,
  queued: {
    en: 'Queued',
    ru: 'В очереди',
    he: 'בתור',
  } satisfies LocaleMap,
  ready: {
    en: 'Report ready',
    ru: 'Отчёт готов',
    he: 'הדוח מוכן',
  } satisfies LocaleMap,
  failed: {
    en: 'Something went wrong while generating the report. Our team will follow up.',
    ru: 'Не удалось сформировать отчёт. Команда свяжется с вами.',
    he: 'אירעה שגיאה ביצירת הדוח. הצוות ייצור קשר.',
  } satisfies LocaleMap,
  openExternal: {
    en: 'Open full report',
    ru: 'Открыть полный отчёт',
    he: 'פתח דוח מלא',
  } satisfies LocaleMap,
  score: {
    en: 'Score',
    ru: 'Оценка',
    he: 'ציון',
  } satisfies LocaleMap,
  notFound: {
    en: 'Report not found',
    ru: 'Отчёт не найден',
    he: 'הדוח לא נמצא',
  } satisfies LocaleMap,
  invalidId: {
    en: 'Invalid report link',
    ru: 'Некорректная ссылка на отчёт',
    he: 'קישור דוח לא תקין',
  } satisfies LocaleMap,
}

export const AUDIT_REPORT_POLL_MS = 8000

/** Delay before the next waiting-page status poll. Honors Retry-After on 429. */
export function nextAuditPollDelayMs(
  status: number,
  retryAfterHeader: string | null,
  defaultMs = AUDIT_REPORT_POLL_MS,
): number {
  if (status !== 429) return defaultMs
  const sec = Number(retryAfterHeader)
  if (Number.isFinite(sec) && sec > 0) {
    return Math.min(Math.max(Math.ceil(sec), 1) * 1000, 60_000)
  }
  return Math.min(defaultMs * 2, 30_000)
}

export function tReport(map: LocaleMap, locale: string): string {
  if (locale === 'ru' || locale === 'he') return map[locale]
  return map.en
}

export function tReportFill(
  map: LocaleMap,
  locale: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    tReport(map, locale),
  )
}

/** Typical lab run (PageSpeed ×2 + crawl). Worker timeout is 15 min. */
export const AUDIT_PROGRESS_EXPECTED_MS = 8 * 60 * 1000
const AUDIT_PROGRESS_QUEUED_MIN = 4
const AUDIT_PROGRESS_QUEUED_MAX = 18
const AUDIT_PROGRESS_RUNNING_MIN = 22
const AUDIT_PROGRESS_RUNNING_MAX = 92

function easeOutQuad(t: number): number {
  return t * (2 - t)
}

export function parseAuditTimestampMs(raw: string | null | undefined): number | null {
  if (!raw) return null
  const ms = Date.parse(raw)
  return Number.isFinite(ms) ? ms : null
}

/**
 * Estimated completion percent for the waiting UI.
 * Caps below 100% until status is report_sent so a long run never looks finished.
 */
export function estimateAuditProgressPercent(args: {
  status: AuditReportStatus | null
  createdAtMs: number | null
  nowMs: number
}): number {
  if (args.status === 'report_sent') return 100
  if (args.status === 'failed') return 0

  const start = args.createdAtMs ?? args.nowMs
  const elapsed = Math.max(0, args.nowMs - start)
  const t = Math.min(1, elapsed / AUDIT_PROGRESS_EXPECTED_MS)
  const eased = easeOutQuad(t)

  if (args.status === 'in_progress') {
    const pct = AUDIT_PROGRESS_RUNNING_MIN + eased * (AUDIT_PROGRESS_RUNNING_MAX - AUDIT_PROGRESS_RUNNING_MIN)
    return Math.min(AUDIT_PROGRESS_RUNNING_MAX, Math.max(AUDIT_PROGRESS_RUNNING_MIN, pct))
  }

  const queued =
    AUDIT_PROGRESS_QUEUED_MIN + eased * (AUDIT_PROGRESS_QUEUED_MAX - AUDIT_PROGRESS_QUEUED_MIN)
  return Math.min(AUDIT_PROGRESS_QUEUED_MAX, Math.max(AUDIT_PROGRESS_QUEUED_MIN, queued))
}

/** Whole minutes remaining against the typical window; 0 means “finishing”. */
export function estimateAuditRemainingMinutes(createdAtMs: number | null, nowMs: number): number {
  const start = createdAtMs ?? nowMs
  const left = AUDIT_PROGRESS_EXPECTED_MS - (nowMs - start)
  if (left <= 0) return 0
  return Math.max(1, Math.ceil(left / 60_000))
}

/** Accepts numeric id or AUD-123 / aud-123 */
export function parseAuditReportId(raw: string): number | null {
  const trimmed = raw.trim()
  const m = /^AUD-(\d+)$/i.exec(trimmed)
  const digits = m ? m[1] : trimmed
  if (!/^\d+$/.test(digits)) return null
  const n = Number(digits)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

/** Private S3/R2 API endpoints are not openable in the browser without signed URLs. */
export function isPublicReportUrl(url: string | null | undefined): boolean {
  if (!url || !/^https?:\/\//i.test(url)) return false
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.endsWith('.r2.cloudflarestorage.com')) return false
    if (host.endsWith('.amazonaws.com')) return false
    return true
  } catch {
    return false
  }
}

