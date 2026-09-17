/** Minimal Lexical helpers for service rich-text fields. */

export type LexicalDoc = {
  root: {
    type: 'root'
    format: string
    indent: number
    version: number
    children: unknown[]
    direction: 'ltr' | 'rtl' | null
  }
}

export type LocaleLexicalMap = Record<string, LexicalDoc | string | null | undefined>

function textNode(text: string) {
  return {
    type: 'text',
    text,
    format: 0,
    mode: 'normal',
    style: '',
    detail: 0,
    version: 1,
  }
}

function paragraphNode(text: string) {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: text ? [textNode(text)] : [],
    direction: null,
    textFormat: 0,
  }
}

/** Build a Lexical document from one or more plain paragraphs. */
export function lexicalFromParagraphs(paragraphs: string[]): LexicalDoc {
  const lines = paragraphs.map((p) => p.trim()).filter(Boolean)
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: (lines.length ? lines : ['']).map(paragraphNode),
      direction: null,
    },
  }
}

export function lexicalFromText(text: string): LexicalDoc {
  return lexicalFromParagraphs(text.split(/\n+/))
}

/** True if value looks like a Lexical editor state. */
export function isLexicalDoc(value: unknown): value is LexicalDoc {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'root' in value &&
      (value as LexicalDoc).root &&
      typeof (value as LexicalDoc).root === 'object' &&
      Array.isArray((value as LexicalDoc).root.children),
  )
}

/** Flatten Lexical (or plain string) to a single text line for SEO/metadata. */
export function lexicalToPlain(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  if (!isLexicalDoc(value)) return ''
  const walk = (nodes: unknown[]): string[] => {
    const out: string[] = []
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const n = node as { type?: string; text?: string; children?: unknown[] }
      if (typeof n.text === 'string') out.push(n.text)
      if (Array.isArray(n.children)) out.push(...walk(n.children))
    }
    return out
  }
  return walk(value.root.children).join(' ').replace(/\s+/g, ' ').trim()
}

/** True when a Lexical doc has text and/or media (e.g. inline uploads). */
export function lexicalHasContent(value: unknown): boolean {
  if (!value) return false
  if (typeof value === 'string') return Boolean(value.trim())
  if (!isLexicalDoc(value)) return false
  if (lexicalToPlain(value)) return true
  const walk = (nodes: unknown[]): boolean => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const n = node as { type?: string; children?: unknown[] }
      if (n.type === 'upload' || n.type === 'block' || n.type === 'relationship') return true
      if (Array.isArray(n.children) && walk(n.children)) return true
    }
    return false
  }
  return walk(value.root.children)
}

const LEXICAL_LOCALES = ['en', 'ru', 'he'] as const

function localeRowHasContent(row: unknown): boolean {
  if (typeof row === 'string') return Boolean(row.trim())
  return lexicalHasContent(row)
}

/**
 * Payload `locale: 'all'` rich text is `{ en, ru, he }` but may also carry a
 * sibling empty `root`, which makes `isLexicalDoc(value)` true and used to
 * hide per-locale “what's included” docs.
 */
export function pickLocalizedLexical(value: unknown, locale: string): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const rec = value as Record<string, unknown>
  const hasLocaleDocs = LEXICAL_LOCALES.some((loc) => localeRowHasContent(rec[loc]))
  if (!hasLocaleDocs) {
    if (isLexicalDoc(value) && !lexicalHasContent(value)) return null
    return value
  }
  const preferred = rec[locale] ?? rec.en
  if (localeRowHasContent(preferred)) return preferred
  for (const loc of LEXICAL_LOCALES) {
    if (localeRowHasContent(rec[loc])) return rec[loc]
  }
  return preferred
}

function coerceLexical(pick: unknown): LexicalDoc | null {
  if (isLexicalDoc(pick) && lexicalHasContent(pick)) return pick
  if (typeof pick === 'string' && pick.trim()) return lexicalFromText(pick)
  if (Array.isArray(pick) && pick.length) {
    const paragraphs = pick
      .map((row) =>
        typeof row === 'string'
          ? row
          : row && typeof row === 'object' && 'text' in row
            ? String((row as { text?: unknown }).text ?? '')
            : '',
      )
      .filter(Boolean)
    if (paragraphs.length) return lexicalFromParagraphs(paragraphs)
  }
  return null
}

/**
 * Normalize CMS / fallback content into a Lexical doc for a locale.
 * Accepts: Lexical JSON, plain string, or legacy `{ text }[]` paragraph arrays.
 * Empty Lexical shells fall through to `fallback` instead of hiding UI.
 */
export function resolveLexical(
  value: unknown,
  locale: string,
  fallback?: LexicalDoc | string | string[] | null,
): LexicalDoc | null {
  const picked = pickLocalizedLexical(value, locale)
  const pick =
    picked && typeof picked === 'object' && !Array.isArray(picked) && !isLexicalDoc(picked)
      ? (picked as Record<string, unknown>)[locale] ??
        (picked as Record<string, unknown>).en ??
        picked
      : picked

  return coerceLexical(pick) ?? coerceLexical(fallback)
}
