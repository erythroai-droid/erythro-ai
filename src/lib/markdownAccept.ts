/**
 * Edge-safe Accept parsing for Markdown content negotiation.
 * Keep this module free of Payload / Node-only imports — middleware bundles it.
 */

/**
 * Parses HTTP Accept header with RFC quality values to decide if
 * Markdown should be served instead of HTML.
 */
export function shouldServeMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader || !acceptHeader.trim()) return false

  const parts = acceptHeader.split(',').map((part) => part.trim().toLowerCase())

  let markdownQ = 0
  let htmlQ = 0

  for (const part of parts) {
    const [rawMime, ...params] = part.split(';').map((s) => s.trim())
    const mime = rawMime.toLowerCase()

    let q = 1.0
    for (const param of params) {
      if (param.startsWith('q=')) {
        const parsed = parseFloat(param.slice(2))
        if (!isNaN(parsed)) q = Math.max(0, Math.min(1, parsed))
      }
    }

    if (
      mime === 'text/markdown' ||
      mime === 'text/x-markdown' ||
      mime === 'text/vnd.markdown'
    ) {
      if (q > markdownQ) markdownQ = q
    } else if (mime === 'text/html' || mime === 'application/xhtml+xml') {
      if (q > htmlQ) htmlQ = q
    }
  }

  // If text/markdown is explicitly requested and not outweighed by higher-quality HTML
  if (markdownQ > 0) {
    return markdownQ >= htmlQ
  }

  return false
}
