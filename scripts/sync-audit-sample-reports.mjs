/**
 * Copy lab A44 HTML (Free / Diagnostic / Pro × EN/RU/HE) into public samples
 * and rewrite filesystem-relative figma asset paths to the site root.
 *
 * Usage: node scripts/sync-audit-sample-reports.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DEFAULT_SOURCE = 'C:\\agents\\website-auditor\\erythro-ai\\QA_Auditor\\reports'
const SOURCE = process.env.AUDIT_SAMPLE_SOURCE || DEFAULT_SOURCE
const DEST = path.join(ROOT, 'public', 'samples', 'audit')

const TIERS = ['free', 'diagnostic', 'pro']
const LOCALES = ['en', 'ru', 'he']

function rewriteAssetUrls(html) {
  return html
    .replace(/(?:\.\.\/)+templates\/figma-assets\//g, '/templates/figma-assets/')
    .replace(/\/api\/audit\/templates\/figma-assets\//g, '/templates/figma-assets/')
    .replace(/\/api\/audit\/assets\/figma-assets\//g, '/templates/figma-assets/')
}

async function main() {
  await fs.mkdir(DEST, { recursive: true })
  const written = []

  for (const tier of TIERS) {
    for (const locale of LOCALES) {
      const src = path.join(SOURCE, tier, `audit-report_${locale}.html`)
      try {
        await fs.access(src)
      } catch {
        throw new Error(`Missing sample report: ${src}`)
      }
      const html = rewriteAssetUrls(await fs.readFile(src, 'utf8'))
      if (html.includes('../../templates/figma-assets/')) {
        throw new Error(`Asset rewrite failed for ${tier}/${locale}`)
      }
      const dest = path.join(DEST, `${tier}-${locale}.html`)
      await fs.writeFile(dest, html, 'utf8')
      written.push(path.relative(ROOT, dest).replaceAll('\\', '/'))
    }
  }

  console.log(`Wrote ${written.length} sample reports:`)
  for (const file of written) console.log(`  ${file}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
