/**
 * YAML 1.1 subset for portfolio briefs: maps, lists, scalars,
 * quoted strings, `|` / `>` blocks, inline `[a, b]`, comments.
 * Not a full YAML parser — enough for content/imports/<slug>/brief.yaml.
 */

type Peek = { indent: number; text: string; raw: string }

export function parseYaml(input: string): unknown {
  const physical = input
    .replace(/^\uFEFF/, '')
    .replace(/\t/g, '  ')
    .split(/\r?\n/)

  let i = 0

  const peek = (): Peek | null => {
    while (i < physical.length) {
      const raw = physical[i] ?? ''
      const trimmed = raw.trim()
      if (trimmed === '' || trimmed.startsWith('#')) {
        i += 1
        continue
      }
      const indent = raw.length - raw.trimStart().length
      const hash = unquotedHashIndex(trimmed)
      const text = hash >= 0 ? trimmed.slice(0, hash).trimEnd() : trimmed
      if (!text) {
        i += 1
        continue
      }
      return { indent, text, raw }
    }
    return null
  }

  const parseBlockString = (parentIndent: number, folded: boolean): string => {
    const chunks: string[] = []
    let minContentIndent: number | null = null
    while (i < physical.length) {
      const raw = physical[i] ?? ''
      if (raw.trim() === '') {
        chunks.push('')
        i += 1
        continue
      }
      const indent = raw.length - raw.trimStart().length
      if (indent <= parentIndent) break
      if (minContentIndent == null) minContentIndent = indent
      chunks.push(raw.slice(minContentIndent))
      i += 1
    }
    while (chunks.length && chunks[chunks.length - 1] === '') chunks.pop()
    const joined = chunks.join('\n')
    if (!folded) return joined
    return joined
      .split('\n')
      .map((line) => line.trimEnd())
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const parseMap = (parentIndent: number, first?: { key: string; rest: string; indent: number }): Record<string, unknown> => {
    const result: Record<string, unknown> = {}
    let expected: number | null = first ? first.indent : null

    const assign = (key: string, rest: string, keyIndent: number) => {
      if (rest === '|' || rest === '>') {
        result[key] = parseBlockString(keyIndent, rest === '>')
        return
      }
      if (rest === '') {
        const next = peek()
        if (!next || next.indent <= keyIndent) {
          result[key] = null
          return
        }
        result[key] = parseValue(keyIndent)
        return
      }
      result[key] = parseScalar(rest)
    }

    if (first) {
      expected = first.indent
      assign(first.key, first.rest, first.indent)
    }

    while (true) {
      const line = peek()
      if (!line) break
      if (expected == null) {
        if (line.indent <= parentIndent) break
        expected = line.indent
      }
      if (line.indent !== expected) break
      if (line.text.startsWith('-')) break
      const split = splitKey(line.text)
      if (!split) break
      i += 1
      assign(split.key, split.rest, line.indent)
    }
    return result
  }

  const parseList = (parentIndent: number): unknown[] => {
    const items: unknown[] = []
    let expected: number | null = null

    while (true) {
      const line = peek()
      if (!line) break
      if (expected == null) {
        if (line.indent <= parentIndent) break
        expected = line.indent
      }
      if (line.indent !== expected) break
      if (!line.text.startsWith('-')) break
      i += 1
      const rest = line.text.slice(1).trim()
      const itemKeyIndent = line.indent + 2

      if (rest === '|' || rest === '>') {
        items.push(parseBlockString(line.indent, rest === '>'))
        continue
      }
      if (rest === '') {
        const next = peek()
        if (!next || next.indent <= line.indent) {
          items.push(null)
          continue
        }
        items.push(parseValue(line.indent))
        continue
      }
      const split = splitKey(rest)
      if (split) {
        items.push(parseMap(line.indent, { key: split.key, rest: split.rest, indent: itemKeyIndent }))
        continue
      }
      items.push(parseScalar(rest))
    }
    return items
  }

  const parseValue = (parentIndent: number): unknown => {
    const line = peek()
    if (!line) return null
    if (line.text.startsWith('-')) return parseList(parentIndent)
    return parseMap(parentIndent)
  }

  const root = peek()
  if (!root) return null
  if (root.text.startsWith('-')) return parseList(-1)
  return parseMap(-1)
}

function splitKey(text: string): { key: string; rest: string } | null {
  if (text.startsWith('"') || text.startsWith("'")) return null
  const idx = unquotedColonIndex(text)
  if (idx <= 0) return null
  const key = text.slice(0, idx).trim()
  if (!key || /[\s[{]/.test(key)) return null
  const rest = text.slice(idx + 1).trim()
  return { key, rest }
}

function unquotedColonIndex(text: string): number {
  let quote: string | null = null
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      if (ch === '\\' && quote === '"') {
        i += 1
        continue
      }
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === ':' && (i === text.length - 1 || text[i + 1] === ' ' || text[i + 1] === '\t')) {
      return i
    }
  }
  return -1
}

function unquotedHashIndex(text: string): number {
  let quote: string | null = null
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      if (ch === '\\' && quote === '"') {
        i += 1
        continue
      }
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '#' && (i === 0 || text[i - 1] === ' ')) return i
  }
  return -1
}

function parseScalar(raw: string): unknown {
  if (raw === '~' || raw === 'null' || raw === 'Null' || raw === 'NULL') return null
  if (raw === 'true' || raw === 'True' || raw === 'TRUE') return true
  if (raw === 'false' || raw === 'False' || raw === 'FALSE') return false
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1).trim()
    if (!inner) return []
    return splitFlow(inner).map((item) => parseScalar(item))
  }
  if (
    (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) ||
    (raw.startsWith("'") && raw.endsWith("'") && raw.length >= 2)
  ) {
    const quote = raw[0]
    const inner = raw.slice(1, -1)
    if (quote === '"') {
      return inner.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    }
    return inner.replace(/''/g, "'")
  }
  if (/^-?\d+$/.test(raw)) return Number(raw)
  if (/^-?\d+\.\d+$/.test(raw)) return Number(raw)
  return raw
}

function splitFlow(inner: string): string[] {
  const out: string[] = []
  let buf = ''
  let quote: string | null = null
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i]
    if (quote) {
      buf += ch
      if (ch === '\\' && quote === '"') {
        buf += inner[i + 1] ?? ''
        i += 1
        continue
      }
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      buf += ch
      continue
    }
    if (ch === ',') {
      out.push(buf.trim())
      buf = ''
      continue
    }
    buf += ch
  }
  if (buf.trim()) out.push(buf.trim())
  return out
}
