/**
 * Lexical builders for portfolio body paragraphs (pro-interior / ORA scheme).
 * Inline markup in strings: **bold**, `code`.
 */

export type Locale = 'en' | 'ru' | 'he'
export const RICH_LOCALES: Locale[] = ['en', 'ru', 'he']

export type RichBlock =
  | string
  | { bold: string }
  | { ul: string[] }
  | { table: string[][] }

export type RichSection = {
  id?: string
  heading: string
  /** Each row becomes one `paragraphs[]` entry in the CMS. */
  rows: RichBlock[][]
}

export type RichBodySpec = {
  slug: string
  /** Section index (0-based) → index of the current CMS section whose images move there. */
  images?: Record<number, number>
  /** Section id → image paths relative to the import folder (used by import-project). */
  sectionImages?: Record<string, string[]>
  locales: Record<Locale, RichSection[]>
}

function textNode(text: string, format: number) {
  return { mode: 'normal', text, type: 'text', style: '', detail: 0, format, version: 1 }
}

export function inlineNodes(src: string, baseFormat = 0) {
  const out: ReturnType<typeof textNode>[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  for (const m of src.matchAll(re)) {
    if (m.index! > last) out.push(textNode(src.slice(last, m.index), baseFormat))
    const tok = m[0]
    if (tok.startsWith('**')) out.push(textNode(tok.slice(2, -2), baseFormat | 1))
    else out.push(textNode(tok.slice(1, -1), baseFormat | 16))
    last = m.index! + tok.length
  }
  if (last < src.length) out.push(textNode(src.slice(last), baseFormat))
  return out
}

function paragraph(src: string, baseFormat = 0) {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: inlineNodes(src, baseFormat),
    direction: null,
    textStyle: '',
    textFormat: baseFormat,
  }
}

export function richBlockToLexical(b: RichBlock): Record<string, unknown> {
  if (typeof b === 'string') return paragraph(b)
  if ('bold' in b) return paragraph(b.bold, 1)
  if ('ul' in b) {
    return {
      tag: 'ul',
      type: 'list',
      listType: 'bullet',
      start: 1,
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: b.ul.map((item, i) => ({
        type: 'listitem',
        value: i + 1,
        format: '',
        indent: 0,
        version: 1,
        direction: null,
        children: inlineNodes(item),
      })),
    }
  }
  return {
    type: 'table',
    format: '',
    indent: 0,
    version: 1,
    direction: null,
    children: b.table.map((row, r) => ({
      type: 'tablerow',
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: row.map((cell) => ({
        type: 'tablecell',
        format: '',
        indent: 0,
        colSpan: 1,
        rowSpan: 1,
        version: 1,
        direction: null,
        headerState: r === 0 ? 1 : 0,
        backgroundColor: null,
        children: [paragraph(cell, r === 0 ? 1 : 0)],
      })),
    })),
  }
}

export function richBlocksToDoc(blocks: RichBlock[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: blocks.map(richBlockToLexical),
    },
  }
}

export function shapeOfSections(sections: RichSection[]): string {
  return JSON.stringify(
    sections.map((s) =>
      s.rows.map((row) =>
        row.map((b) =>
          typeof b === 'string'
            ? 'p'
            : 'bold' in b
              ? 'b'
              : 'ul' in b
                ? `ul${b.ul.length}`
                : `t${b.table.length}x${b.table[0]?.length ?? 0}`,
        ),
      ),
    ),
  )
}

export function assertSameShape(locales: Record<Locale, RichSection[]>): void {
  const shapes = RICH_LOCALES.map((l) => shapeOfSections(locales[l]))
  if (new Set(shapes).size !== 1) {
    RICH_LOCALES.forEach((l, i) => console.error(`${l}: ${shapes[i]}`))
    throw new Error('EN/RU/HE body sections must have the same shape (rows and block types).')
  }
}

/** Split a multiline fact into bullet items (drop empty lines). */
export function linesToItems(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•]\s+/, '').trim())
    .filter(Boolean)
}

/** Build `**Label:** value` list items; skips empty values. */
export function labeledItems(
  rows: [label: string, value: string | undefined][],
): string[] {
  return rows
    .map(([label, value]) => {
      const v = value?.trim()
      if (!v) return null
      return `**${label}:** ${v}`
    })
    .filter((item): item is string => Boolean(item))
}
