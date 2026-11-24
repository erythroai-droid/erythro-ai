/**
 * Clean LinkedIn activity dump → Payload blog-posts (EN + RU/HE via Gemini).
 *
 *   node scripts/import-linkedin-blog.mjs
 *   node scripts/import-linkedin-blog.mjs --dry
 *
 * Reads: content/imports/linkedin-posts-raw.json
 * Requires: DATABASE_URL, GEMINI_API_KEY, PAYLOAD_SECRET
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const DRY = process.argv.includes('--dry')

function loadEnvLocal() {
  for (const file of ['.env', '.env.local']) {
    const p = path.join(root, file)
    if (!fs.existsSync(p)) continue
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
      if (!m || process.env[m[1]]) continue
      let v = m[2].trim()
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1)
      }
      if (v.includes('[SENSITIVE]')) continue
      process.env[m[1]] = v
    }
  }
}
loadEnvLocal()
process.env.PAYLOAD_DISABLE_PUSH = '1'

function stripUiNoise(text) {
  let t = text.replace(/\u00a0/g, ' ')
  // Drop LinkedIn chrome that leaked into some cards
  t = t.replace(/^Erythro\.ai\s*\n+\s*Запросить услуги\s*\n+\d+\s*д[нн]\.?[^\n]*\n+/i, '')
  t = t.replace(/^Erythro\.ai\s*\n+/i, '')
  t = t.replace(/\n…\s*развернуть\n?/gi, '\n')
  t = t.replace(/\nПоказать перевод\n?/gi, '\n')
  t = t.replace(/\nFree AI website audit\nFree AI website audit\n[\s\S]*$/i, '\n')
  t = t.replace(/\nai-audit-[a-z]+\.erythro\.ai\n?/gi, '\n')
  // Trailing analytics / reaction counters (zero-width spaces + impression counts)
  t = t.replace(/(?:\n[\u200b\s]*)+\d[\d\s]*\s*показов?\s*$/iu, '')
  t = t.replace(/(?:\n[\u200b\s]*\d+)+[\u200b\s]*$/g, '')
  t = t.replace(/[\u200b]+/g, '')
  // Soft LinkedIn CTAs that don't work on the blog
  t = t.replace(/\nLive demo in the first comment\.?\s*$/i, '')
  t = t.replace(/\nLink in the first comment\.?\s*$/i, '')
  t = t.replace(/\nLinks in the first comment\.?\s*$/i, '')
  t = t.replace(/\nFree AI audit, link in the first comment[^\n]*\n?/gi, '\n')
  // Unicode math / sans-serif bold letters → ASCII
  t = t.replace(/[\u{1D400}-\u{1D7FF}]/gu, (ch) => {
    const code = ch.codePointAt(0)
    const ranges = [
      [0x1d400, 65], // bold A
      [0x1d41a, 97], // bold a
      [0x1d5d4, 65], // sans-serif bold A
      [0x1d5ee, 97], // sans-serif bold a
      [0x1d56c, 65], // sans-serif bold italic A
      [0x1d586, 97],
    ]
    for (const [start, base] of ranges) {
      const off = code - start
      if (off >= 0 && off <= 25) return String.fromCharCode(base + off)
    }
    return ch
  })
  // Prefer site paths over LinkedIn short links
  t = t.replace(/https:\/\/lnkd\.in\/\S+/g, 'https://erythro.ai/audit')
  return t.replace(/\n{3,}/g, '\n\n').trim()
}

function slugify(title) {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0590-\u05ff]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
    .replace(/-+$/g, '')
  // Hebrew-only titles → fixed EN slug (ORA 60A HE post)
  if (!/[a-z0-9]/.test(base)) return 'ora-60a-premium-interactive-site'
  return base || `post-${Date.now().toString(36)}`
}

function excerptFrom(body) {
  const paras = body.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  // Skip title line
  const rest = paras.slice(1).join(' ')
  const one = (rest || paras[0] || '').replace(/\s+/g, ' ').trim()
  if (one.length <= 220) return one
  const cut = one.slice(0, 220)
  const sp = cut.lastIndexOf(' ')
  return `${(sp > 140 ? cut.slice(0, sp) : cut).trim()}…`
}

function tagsFrom(body) {
  const tags = []
  const re = /#([A-Za-z][A-Za-z0-9]+)/g
  let m
  while ((m = re.exec(body))) {
    const t = m[1]
    if (/^[0-9A-Fa-f]{3,8}$/.test(t)) continue // color hex noise
    if (!tags.includes(t) && tags.length < 8) tags.push(t)
  }
  return tags
}

function bodyWithoutHashtags(body) {
  return body
    .replace(/\n(?:#[A-Za-z\u0590-\u05FF][\w\u0590-\u05FF]+(?:\s+|$))+\s*$/gu, '')
    .replace(/\nEryh?tro\.ai#.*/gi, '')
    .trim()
}

function parseRelativeTime(label, now = new Date()) {
  const s = (label || '').replace(/\u00a0/g, ' ')
  const d = new Date(now)
  let m
  if ((m = s.match(/(\d+)\s*ч/))) d.setHours(d.getHours() - Number(m[1]))
  else if ((m = s.match(/(\d+)\s*д/))) d.setDate(d.getDate() - Number(m[1]))
  else if ((m = s.match(/(\d+)\s*нед/))) d.setDate(d.getDate() - Number(m[1]) * 7)
  else if ((m = s.match(/(\d+)\s*мес/))) d.setMonth(d.getMonth() - Number(m[1]))
  else if ((m = s.match(/(\d+)\s*мин/))) d.setMinutes(d.getMinutes() - Number(m[1]))
  else d.setDate(d.getDate() - 14)
  return d.toISOString()
}

function relatedFor(title, body) {
  const blob = `${title}\n${body}`.toLowerCase()
  const links = []
  if (/audit|pagespeed|cro|geo|visibility|revenue|leak/.test(blob)) {
    links.push({ label: { en: 'Free AI Audit', ru: 'Бесплатный AI-аудит', he: 'ביקורת AI בחינם' }, href: '/audit' })
  }
  if (/portfolio|case study|ember|ora|la scala|origin|psb|mustang|bulletproof/.test(blob)) {
    links.push({ label: { en: 'Portfolio', ru: 'Портфолио', he: 'תיק עבודות' }, href: '/portfolio' })
  }
  if (/consultant|chatbot|agent|n8n|automation/.test(blob)) {
    links.push({
      label: { en: 'AI automation', ru: 'AI-автоматизация', he: 'אוטומציה ב-AI' },
      href: '/services/ai-automation',
    })
  }
  if (!links.length) {
    links.push({ label: { en: 'About Erythro.ai', ru: 'О Erythro.ai', he: 'על Erythro.ai' }, href: '/about' })
  }
  return links.slice(0, 3)
}

function fingerprint(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, 160)
}

function cleanPosts(raw) {
  const cleaned = []
  const seen = new Set()
  for (const row of raw) {
    const text = stripUiNoise(row.text || '')
    if (text.length < 80) continue
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
    const title = lines[0].replace(/^#+\s*/, '').slice(0, 160)
    const body = bodyWithoutHashtags(text)
    const fp = fingerprint(title)
    if (seen.has(fp)) continue
    // Near-dup: same "Free AI website audit: what holds…" only once
    if (
      fp.startsWith('free ai website audit what holds') &&
      [...seen].some((s) => s.startsWith('free ai website audit what holds'))
    ) {
      continue
    }
    seen.add(fp)
    const isHe = /[\u0590-\u05FF]/.test(title)
    cleaned.push({
      sourceIndex: row.i,
      timeLabel: row.time || '',
      publishedAt: parseRelativeTime(row.time),
      titleEn: isHe ? 'Premium interactive website for your brand' : title,
      titleHe: isHe ? title : '',
      bodyEn: isHe ? '' : body,
      bodyHe: isHe ? body : '',
      tags: tagsFrom(text),
      sourceLang: isHe ? 'he' : 'en',
    })
  }
  return cleaned
}

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

async function geminiTranslate({ title, excerpt, body }, target) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY missing')
  const MODEL = process.env.TRANSLATE_MODEL || 'gemini-3.8-flash'
  const lang = target === 'ru' ? 'Russian' : 'Hebrew'
  const prompt = `You are Erythro Translater (Documentation/RFC style).
Translate this LinkedIn article into ${lang} for the Erythro.ai blog.
Rules:
- Preserve brand names (Erythro.ai, Next.js, GSAP, Lenis, PageSpeed, Awwwards, Payload CMS, WebGL, etc.).
- Preserve URLs and numbers/metrics exactly — do not invent figures.
- Keep paragraph breaks (\\n\\n).
- Return ONLY JSON: {"title":"...","excerpt":"...","body":"..."}

Source:
${JSON.stringify({ title, excerpt, body }, null, 2)}`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 400)}`)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(cleaned)
}

async function ensureUniqueSlug(payload, base, existingIds = new Set()) {
  let slug = base
  let n = 2
  for (;;) {
    const res = await payload.find({
      collection: 'blog-posts',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    })
    const hit = res.docs?.[0]
    if (!hit || existingIds.has(hit.id)) return slug
    slug = `${base}-${n++}`
  }
}

function matchExisting(existing, titleEn, baseSlug) {
  const titleFp = fingerprint(titleEn)
  const byTitle = existing.find((d) => fingerprint(d.title || '') === titleFp)
  if (byTitle) return byTitle
  const bySlug = existing.find(
    (d) =>
      d.slug === baseSlug ||
      d.slug.startsWith(baseSlug.slice(0, 48)) ||
      baseSlug.startsWith((d.slug || '').slice(0, 48)),
  )
  return bySlug || null
}

async function main() {
  const rawPath = path.join(root, 'content/imports/linkedin-posts-raw.json')
  const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'))
  const posts = cleanPosts(raw)
  console.log(`Cleaned ${posts.length} posts from ${raw.length} raw cards`)

  async function toEnglish(title, excerpt, body) {
    const key = process.env.GEMINI_API_KEY
    const MODEL = process.env.TRANSLATE_MODEL || 'gemini-3.8-flash'
    const prompt = `Translate this Hebrew LinkedIn post into English for Erythro.ai blog.
Preserve brand names and numbers. Return ONLY JSON {"title","excerpt","body"}.
${JSON.stringify({ title, excerpt, body })}`
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    })
    if (!res.ok) throw new Error(`Gemini EN ${res.status}`)
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
    return JSON.parse(text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim())
  }

  for (const p of posts) {
    if (p.sourceLang === 'he' && !p.bodyEn) {
      console.log('HE→EN', p.titleHe.slice(0, 40))
      if (!DRY) {
        const en = await toEnglish(p.titleHe, excerptFrom(p.bodyHe), p.bodyHe)
        p.titleEn = en.title || p.titleEn
        p.bodyEn = en.body || p.bodyHe
        p.excerptEn = en.excerpt || excerptFrom(p.bodyEn)
      } else {
        p.excerptEn = excerptFrom(p.bodyHe)
      }
    } else {
      p.excerptEn = excerptFrom(p.bodyEn)
    }
  }

  const preparedPath = path.join(root, 'content/imports/linkedin-posts-cleaned.json')
  fs.writeFileSync(
    preparedPath,
    JSON.stringify(
      posts.map((p) => ({
        title: p.titleEn,
        excerpt: p.excerptEn,
        publishedAt: p.publishedAt,
        tags: p.tags,
        bodyPreview: (p.bodyEn || '').slice(0, 200),
        len: (p.bodyEn || '').length,
        sourceLang: p.sourceLang,
      })),
      null,
      2,
    ),
  )
  console.log('Wrote', preparedPath)

  if (DRY) {
    console.log('Dry run — no CMS writes')
    return
  }

  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.ts')
  const payload = await getPayload({ config })

  const existingRes = await payload.find({
    collection: 'blog-posts',
    limit: 200,
    locale: 'en',
    overrideAccess: true,
    depth: 0,
  })
  const existing = existingRes.docs || []
  console.log(`CMS already has ${existing.length} blog posts`)

  let created = 0
  let updated = 0
  let skipped = 0
  for (const p of posts) {
    const baseSlug = slugify(p.titleEn)
    const hit = matchExisting(existing, p.titleEn, baseSlug)
    const slug = hit?.slug || (await ensureUniqueSlug(payload, baseSlug))
    console.log(`\n→ ${slug}${hit ? ` (id ${hit.id}, fill RU/HE)` : ' (create)'}`)

    console.log('  translating RU…')
    let ru
    try {
      ru = await geminiTranslate(
        { title: p.titleEn, excerpt: p.excerptEn, body: p.bodyEn },
        'ru',
      )
    } catch (err) {
      console.error('  RU failed:', err.message)
      ru = { title: p.titleEn, excerpt: p.excerptEn, body: p.bodyEn }
    }

    console.log('  translating HE…')
    let he
    try {
      if (p.sourceLang === 'he' && p.bodyHe) {
        he = {
          title: p.titleHe,
          excerpt: excerptFrom(p.bodyHe),
          body: p.bodyHe,
        }
      } else {
        he = await geminiTranslate(
          { title: p.titleEn, excerpt: p.excerptEn, body: p.bodyEn },
          'he',
        )
      }
    } catch (err) {
      console.error('  HE failed:', err.message)
      he = { title: p.titleEn, excerpt: p.excerptEn, body: p.bodyEn }
    }

    const relatedLinks = relatedFor(p.titleEn, p.bodyEn)

    try {
      let id = hit?.id
      if (!id) {
        const doc = await payload.create({
          collection: 'blog-posts',
          overrideAccess: true,
          locale: 'en',
          data: {
            slug,
            status: 'published',
            publishedAt: p.publishedAt,
            title: p.titleEn,
            excerpt: p.excerptEn,
            body: lexicalFromText(p.bodyEn),
            tags: p.tags.map((tag) => ({ tag })),
            relatedLinks: relatedLinks.map((l) => ({
              href: l.href,
              label: l.label.en,
            })),
            seo: {
              title: `${p.titleEn} | Erythro.ai`,
              description: p.excerptEn.slice(0, 160),
            },
          },
        })
        id = doc.id
        created++
        existing.push({ id, slug, title: p.titleEn })
      }

      await payload.update({
        collection: 'blog-posts',
        id,
        locale: 'ru',
        overrideAccess: true,
        data: {
          title: ru.title || p.titleEn,
          excerpt: ru.excerpt || p.excerptEn,
          body: lexicalFromText(ru.body || p.bodyEn),
          seo: {
            title: `${ru.title || p.titleEn} | Erythro.ai`,
            description: (ru.excerpt || p.excerptEn).slice(0, 160),
          },
          relatedLinks: relatedLinks.map((l) => ({
            href: l.href,
            label: l.label.ru,
          })),
        },
      })

      await payload.update({
        collection: 'blog-posts',
        id,
        locale: 'he',
        overrideAccess: true,
        data: {
          title: he.title || p.titleEn,
          excerpt: he.excerpt || p.excerptEn,
          body: lexicalFromText(he.body || p.bodyEn),
          seo: {
            title: `${he.title || p.titleEn} | Erythro.ai`,
            description: (he.excerpt || p.excerptEn).slice(0, 160),
          },
          relatedLinks: relatedLinks.map((l) => ({
            href: l.href,
            label: l.label.he,
          })),
        },
      })

      updated++
      console.log('  OK', id)
    } catch (err) {
      skipped++
      console.error('  FAIL', err.message)
    }
  }

  console.log(`\nDone. created=${created} localized=${updated} failed=${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
