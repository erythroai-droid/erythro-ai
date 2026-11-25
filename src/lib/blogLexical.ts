import type { LexicalDoc } from '@/lib/lexical'
import { isLexicalDoc } from '@/lib/lexical'

function textNode(text: string, format = 0) {
  return {
    type: 'text',
    text,
    format,
    mode: 'normal',
    style: '',
    detail: 0,
    version: 1,
  }
}

/** Payload Lexical custom link node (richtext-lexical). */
function linkNode(url: string, text: string, newTab = false) {
  return {
    type: 'link',
    version: 3,
    fields: {
      linkType: 'custom' as const,
      url,
      newTab,
    },
    format: '',
    indent: 0,
    direction: null,
    children: [textNode(text)],
  }
}

/**
 * Allow internal paths and http(s) URLs. Reject javascript:/data:/etc.
 */
export function normalizeBlogHref(raw: string): string | null {
  const href = raw.trim()
  if (!href) return null
  const lower = href.toLowerCase()
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return null
  }
  if (href.startsWith('/')) {
    if (href.startsWith('//')) return null
    return href
  }
  if (/^https?:\/\//i.test(href)) return href
  // Bare domain → https
  if (/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}([/?#].*)?$/i.test(href)) {
    return `https://${href}`
  }
  return null
}

function inlineChildren(src: string): unknown[] {
  // [label](url) — markdown links
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g
  const out: unknown[] = []
  let last = 0
  for (const m of src.matchAll(re)) {
    const idx = m.index ?? 0
    if (idx > last) out.push(textNode(src.slice(last, idx)))
    const label = m[1]?.trim() || m[2] || ''
    const href = normalizeBlogHref(m[2] || '')
    if (href && label) {
      out.push(linkNode(href, label, /^https?:\/\//i.test(href)))
    } else {
      out.push(textNode(m[0]))
    }
    last = idx + m[0].length
  }
  if (last < src.length) out.push(textNode(src.slice(last)))
  return out.length ? out : [textNode('')]
}

function paragraphFromLine(line: string) {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: inlineChildren(line),
    direction: null,
    textFormat: 0,
  }
}

/**
 * Plain text → Lexical for blog API.
 * Blank lines split paragraphs; `[label](url)` becomes clickable links.
 */
export function blogLexicalFromText(text: string): LexicalDoc {
  const lines = text.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: (lines.length ? lines : ['']).map(paragraphFromLine),
      direction: null,
    },
  }
}

export function blogBodyToLexical(raw: unknown): LexicalDoc | undefined {
  if (isLexicalDoc(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) return blogLexicalFromText(raw.trim())
  return undefined
}
