/**
 * Build brief.yaml from facts.{ru,en,he}.json + static meta in meta.json
 * Usage: node scripts/import-project/assemble-brief.mjs content/imports/<slug>
 */
import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve(process.argv[2] || '')
if (!dir || !fs.existsSync(dir)) {
  console.error('Usage: node scripts/import-project/assemble-brief.mjs content/imports/<slug>')
  process.exit(1)
}

const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'))
const locales = Object.fromEntries(
  ['en', 'ru', 'he'].map((l) => {
    const p = path.join(dir, `facts.${l}.json`)
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'))
    const facts = {}
    for (const [k, v] of Object.entries(raw)) {
      if (Array.isArray(v)) facts[k] = v.map((x) => String(x).trim()).filter(Boolean).join('\n')
      else facts[k] = String(v ?? '').trim()
    }
    return [l, facts]
  }),
)

function yamlEscape(s) {
  if (s == null) return '""'
  const str = String(s)
  if (/[:#\n"'{}[\],&*?|<>=!%@`]/.test(str) || str !== str.trim()) {
    return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
  }
  return str
}

function dumpFacts(obj, indent = 4) {
  const pad = ' '.repeat(indent)
  let out = ''
  for (const [k, v] of Object.entries(obj)) {
    if (String(v).includes('\n')) {
      out += `${pad}${k}: |\n`
      for (const line of String(v).split('\n')) out += `${pad}  ${line}\n`
    } else {
      out += `${pad}${k}: ${yamlEscape(v)}\n`
    }
  }
  return out
}

let yaml = `# Auto-assembled from facts.*.json — do not invent metrics.
slug: ${meta.slug}
category: ${meta.category}
date: ${JSON.stringify(meta.date)}
client: ${yamlEscape(meta.client)}
link: ${meta.link}
stack:
${meta.stack.map((s) => `  - ${s}`).join('\n')}
tags:
${meta.tags.map((t) => `  - ${t}`).join('\n')}

media:
  card: card.webp
  hero: hero.webp
  heroMobile: hero-mobile.webp

bodyImages:
  frontend:
${meta.bodyFrontend.map((f) => `    - body/frontend/${f}`).join('\n')}

highlights:
`

for (const h of meta.highlights) {
  yaml += `  - label:\n`
  for (const l of ['en', 'ru', 'he']) yaml += `      ${l}: ${yamlEscape(h.label[l])}\n`
  yaml += `    detail:\n`
  for (const l of ['en', 'ru', 'he']) yaml += `      ${l}: ${yamlEscape(h.detail[l])}\n`
}

yaml += `\nfacts:\n`
for (const l of ['en', 'ru', 'he']) {
  yaml += `  ${l}:\n`
  yaml += dumpFacts(locales[l], 4)
}

fs.writeFileSync(path.join(dir, 'brief.yaml'), yaml, 'utf8')
console.log('wrote', path.join(dir, 'brief.yaml'))
