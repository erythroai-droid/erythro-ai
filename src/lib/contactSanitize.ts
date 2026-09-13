const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u2028\u2029]/g
const HTML_TAGS = /<\/?[^>]+>/g
const DANGEROUS_PROTOCOLS = /(?:javascript|vbscript|data|file|blob|about)\s*:/gi
const HTML_ENTITY = /&(?:#x[0-9a-f]+|#\d+|lt|gt|quot|amp|apos);/gi

function decodeHtmlEntities(value: string): string {
  return value.replace(HTML_ENTITY, (match) => {
    const lower = match.toLowerCase()
    if (lower === '&lt;') return '<'
    if (lower === '&gt;') return '>'
    if (lower === '&quot;') return '"'
    if (lower === '&apos;') return "'"
    if (lower === '&amp;') return '&'
    if (lower.startsWith('&#x')) {
      const n = Number.parseInt(lower.slice(3, -1), 16)
      return Number.isFinite(n) && n > 31 && n < 0x110000 ? String.fromCodePoint(n) : ''
    }
    if (lower.startsWith('&#')) {
      const n = Number.parseInt(lower.slice(2, -1), 10)
      return Number.isFinite(n) && n > 31 && n < 0x110000 ? String.fromCodePoint(n) : ''
    }
    return ''
  })
}

/** Decode entities, drop tags. Repeat so nested encodings flatten. */
function stripMarkup(value: string, stripProtocols: boolean): string {
  let out = value.replace(/\0/g, '').replace(CONTROL_CHARS, '').normalize('NFKC')
  for (let i = 0; i < 3; i++) {
    let next = decodeHtmlEntities(out).replace(HTML_TAGS, ' ')
    if (stripProtocols) next = next.replace(DANGEROUS_PROTOCOLS, '')
    next = next.replace(/\0/g, '').replace(CONTROL_CHARS, '')
    if (next === out) break
    out = next
  }
  return out.replace(/[<>]/g, '')
}

/** Strip HTML/control chars and clamp length — plain-text form fields only. */
export function sanitizePlainText(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return ''
  return stripMarkup(input, true).replace(/\s+/g, ' ').trim().slice(0, maxLen)
}

/**
 * Website field: strip tags/entities but keep the scheme so `javascript:` cannot
 * collapse into a lookalike `https://example.com`.
 */
export function sanitizeWebsiteInput(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return ''
  return stripMarkup(input, false).replace(/\s+/g, ' ').trim().slice(0, maxLen)
}

/** Multiline message: keep newlines, still strip tags/controls. */
export function sanitizeMessage(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return ''
  return stripMarkup(input, true)
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
