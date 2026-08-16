const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const HTML_TAGS = /<\/?[^>]+>/g
const DANGEROUS_PROTOCOLS = /(?:javascript|vbscript|data)\s*:/gi

/** Strip HTML/control chars and clamp length — plain-text form fields only. */
export function sanitizePlainText(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/\0/g, '')
    .replace(HTML_TAGS, ' ')
    .replace(DANGEROUS_PROTOCOLS, '')
    .replace(CONTROL_CHARS, '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
}

/** Multiline message: keep newlines, still strip tags/controls. */
export function sanitizeMessage(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/\0/g, '')
    .replace(HTML_TAGS, ' ')
    .replace(DANGEROUS_PROTOCOLS, '')
    .replace(CONTROL_CHARS, '')
    .normalize('NFKC')
    .replace(/\r\n/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLen)
}

export function sanitizeEmail(input: unknown): string {
  const value = sanitizePlainText(input, 254).toLowerCase()
  // Keep only typical email charset after sanitize.
  return value.replace(/[^\w.+@-]/g, '')
}

export function sanitizePhone(input: unknown): string {
  const value = sanitizePlainText(input, 40)
  return value.replace(/[^\d+\-\s().]/g, '').trim().slice(0, 40)
}

export function sanitizeLocale(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined
  const locale = input.trim().toLowerCase().slice(0, 8)
  if (locale === 'en' || locale === 'ru' || locale === 'he') return locale
  return undefined
}
