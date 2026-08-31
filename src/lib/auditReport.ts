export type AuditReportStatus = 'new' | 'in_progress' | 'report_sent' | 'failed'

export type AuditReportPublicPayload = {
  id: number
  status: AuditReportStatus
  auditScore: number | null
  reportUrl: string | null
  /** Truncated HTML for iframe srcDoc when small enough */
  htmlPreview: string | null
  website: string | null
  updatedAt: string | null
}

export const AUDIT_REPORT_HTML_PREVIEW_MAX = 200_000

type LocaleMap = { en: string; ru: string; he: string }

export const auditReportCopy = {
  title: {
    en: 'Your AI Audit report',
    ru: 'Ваш отчёт AI-аудита',
    he: 'דוח ביקורת ה-AI שלך',
  } satisfies LocaleMap,
  waiting: {
    en: 'We are preparing your report. This page updates automatically.',
    ru: 'Готовим отчёт. Страница обновляется автоматически.',
    he: 'אנחנו מכינים את הדוח. העמוד מתעדכן אוטומטית.',
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

export function tReport(map: LocaleMap, locale: string): string {
  if (locale === 'ru' || locale === 'he') return map[locale]
  return map.en
}

export function parseAuditReportId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null
  const n = Number(raw)
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
