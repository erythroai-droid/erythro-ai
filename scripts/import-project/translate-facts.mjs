/**
 * Translate RU portfolio fact strings → EN / HE via Gemini
 * (same engine the Translater worker uses; style ≈ Documentation/RFC).
 *
 * Usage:
 *   node scripts/import-project/translate-facts.mjs content/imports/<slug>/facts.ru.json
 *
 * Writes facts.en.json and facts.he.json next to the source.
 * Requires GEMINI_API_KEY in .env.local / env.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

function loadEnvLocal() {
  const p = path.join(root, '.env.local')
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!m) continue
    if (process.env[m[1]]) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    process.env[m[1]] = v
  }
}

loadEnvLocal()

const srcPath = process.argv[2]
if (!srcPath) {
  console.error('Usage: node scripts/import-project/translate-facts.mjs <facts.ru.json>')
  process.exit(1)
}
const abs = path.resolve(srcPath)
const ru = JSON.parse(fs.readFileSync(abs, 'utf8'))
const key = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_AI_CHAT
if (!key) {
  console.error('GEMINI_API_KEY missing')
  process.exit(1)
}

const MODEL = process.env.TRANSLATE_MODEL || 'gemini-3.8-flash'

async function translateAll(target) {
  const prompt = `You are Erythro Translater (Documentation/RFC style).
Translate every string value in this JSON object from Russian to ${target === 'en' ? 'English' : 'Hebrew'}.
Rules:
- Keep JSON keys identical.
- Preserve markdown **bold**, \`code\`, URLs, brand names (PSB, ORIGIN, Next.js, GSAP, Lenis, Vercel, Erythro.ai).
- Do not invent metrics, prices, or lab scores.
- Keep technical terms accurate (ScrollTrigger, App Router, WebP, RTL).
- Return ONLY valid JSON, no markdown fence.

Source JSON:
${JSON.stringify(ru, null, 2)}`

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
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 500)}`)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(cleaned)
}

const dir = path.dirname(abs)
for (const target of ['en', 'he']) {
  process.stdout.write(`translating → ${target}… `)
  const out = await translateAll(target)
  const outPath = path.join(dir, `facts.${target}.json`)
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8')
  console.log(`wrote ${path.relative(root, outPath)}`)
}
