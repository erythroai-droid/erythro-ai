/**
 * Client-facing PDF download name for audit reports.
 *
 * Pattern: Erythro_Audit_[AUD-N]_[site]_[YYYY-MM-DD]_[LANG].pdf
 * Example: Erythro_Audit_AUD-110_example_com_2026-09-10_RU.pdf
 */

export function formatAuditOrderId(id) {
  const n = typeof id === 'number' ? id : Number(id)
  if (!Number.isSafeInteger(n) || n <= 0) return `AUD-${String(id).trim()}`
  return `AUD-${n}`
}

/**
 * Hostname only, dots/symbols → underscore (example.com → example_com).
 * @param {string} targetUrl
 */
export function siteSlugFromUrl(targetUrl) {
  const raw = String(targetUrl || '').trim()
  if (!raw) return 'site'

  let host = ''
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
    host = new URL(withScheme).hostname
  } catch {
    host = raw.replace(/^https?:\/\//i, '').split('/')[0] || ''
  }

  const slug = host
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')

  return slug || 'site'
}

/**
 * @param {string | undefined} locale
 * @returns {'RU' | 'EN' | 'HE'}
 */
export function reportLangCode(locale) {
  const l = String(locale || 'en')
    .trim()
    .toLowerCase()
    .slice(0, 2)
  if (l === 'ru') return 'RU'
  if (l === 'he') return 'HE'
  return 'EN'
}

/**
 * @param {Date | string | number} [when]
 * @returns {string} YYYY-MM-DD (UTC)
 */
export function dateStamp(when = new Date()) {
  const d = when instanceof Date ? when : new Date(when)
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
  return d.toISOString().slice(0, 10)
}

/**
 * @param {{
 *   orderId: string | number,
 *   targetUrl: string,
 *   locale?: string,
 *   when?: Date | string | number,
 * }} input
 */
export function buildAuditPdfFilename(input) {
  const orderId = formatAuditOrderId(input.orderId)
  const site = siteSlugFromUrl(input.targetUrl)
  const date = dateStamp(input.when)
  const lang = reportLangCode(input.locale)
  return `Erythro_Audit_${orderId}_${site}_${date}_${lang}.pdf`
}
