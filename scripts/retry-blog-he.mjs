/**
 * Re-translate HE for posts that still have EN titles in he locale.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const file of ['.env', '.env.local']) {
  const p = path.join(root, file)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!m || process.env[m[1]]) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (v.includes('[SENSITIVE]')) continue
    process.env[m[1]] = v
  }
}
process.env.PAYLOAD_DISABLE_PUSH = '1'

function lexicalFromText(text) {
  const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  const children = (paragraphs.length ? paragraphs : ['']).map((line) => ({
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: line
      ? [{ type: 'text', text: line, format: 0, mode: 'normal', style: '', detail: 0, version: 1 }]
      : [],
    direction: null,
    textFormat: 0,
  }))
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: null,
    },
  }
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

async function geminiTranslate({ title, excerpt, body }) {
  const key = process.env.GEMINI_API_KEY
  const models = [
    process.env.TRANSLATE_MODEL || 'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ]
  const prompt = `You are Erythro Translater (Documentation/RFC style).
Translate this blog article into Hebrew.
Preserve brand names and numbers. Keep paragraph breaks.
Return ONLY JSON: {"title":"...","excerpt":"...","body":"..."}
${JSON.stringify({ title, excerpt, body }, null, 2)}`
  let lastErr
  for (const MODEL of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
        return JSON.parse(text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim())
      }
      const t = await res.text()
      lastErr = new Error(`Gemini ${MODEL} ${res.status}: ${t.slice(0, 200)}`)
      console.warn(`  ${MODEL} attempt ${attempt}: ${res.status}`)
      if (res.status === 503 || res.status === 429) await sleep(2500 * attempt)
      else break
    }
  }
  throw lastErr
}

const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config.ts')
const payload = await getPayload({ config })

const ids = process.argv.slice(2).map(Number).filter(Boolean)
if (!ids.length) {
  console.error('Usage: tsx scripts/retry-blog-he.mjs 6 17')
  process.exit(1)
}

for (const id of ids) {
  const en = await payload.findByID({
    collection: 'blog-posts',
    id,
    locale: 'en',
    overrideAccess: true,
    depth: 0,
  })
  console.log(`HE retry #${id}: ${en.title}`)
  const he = await geminiTranslate({
    title: en.title,
    excerpt: en.excerpt,
    body:
      typeof en.body === 'object'
        ? (en.body?.root?.children || [])
            .map((n) => (n.children || []).map((c) => c.text || '').join(''))
            .filter(Boolean)
            .join('\n\n')
        : String(en.body || ''),
  })
  await payload.update({
    collection: 'blog-posts',
    id,
    locale: 'he',
    overrideAccess: true,
    data: {
      title: he.title,
      excerpt: he.excerpt,
      body: lexicalFromText(he.body),
      seo: {
        title: `${he.title} | Erythro.ai`,
        description: (he.excerpt || '').slice(0, 160),
      },
    },
  })
  console.log('  OK', he.title.slice(0, 60))
}
process.exit(0)
