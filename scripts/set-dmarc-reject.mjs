/**
 * Raise _dmarc.erythro.ai from quarantine to reject (run ~7 days after quarantine).
 *
 * Requires:
 *   CLOUDFLARE_API_TOKEN — Zone.DNS Edit on erythro.ai
 * Optional:
 *   CLOUDFLARE_ZONE_ID
 *
 * Usage (after checking order@ DMARC aggregate reports look clean):
 *   node --env-file=.env.local scripts/set-dmarc-reject.mjs
 *
 * Dry-run (no write):
 *   node --env-file=.env.local scripts/set-dmarc-reject.mjs --dry-run
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const TARGET =
  'v=DMARC1; p=reject; rua=mailto:order@erythro.ai; pct=100;'
const dryRun = process.argv.includes('--dry-run')

function loadDotEnvFiles() {
  for (const name of ['.env.local', '.env']) {
    const p = resolve(process.cwd(), name)
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i < 1) continue
      const key = t.slice(0, i).trim()
      let val = t.slice(i + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = val
    }
  }
}

loadDotEnvFiles()

const token = process.env.CLOUDFLARE_API_TOKEN?.trim()
if (!token) {
  console.error('MISSING_TOKEN: set CLOUDFLARE_API_TOKEN with Zone DNS Edit')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

async function cf(method, path, body) {
  const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const j = await r.json()
  return { http: r.status, ...j }
}

let zoneId = process.env.CLOUDFLARE_ZONE_ID?.trim()
if (!zoneId) {
  const z = await cf('GET', '/zones?name=erythro.ai')
  if (!z.success || !z.result?.[0]) {
    console.error('ZONE_LOOKUP_FAILED', JSON.stringify(z.errors))
    process.exit(2)
  }
  zoneId = z.result[0].id
}

const list = await cf(
  'GET',
  `/zones/${zoneId}/dns_records?type=TXT&name=_dmarc.erythro.ai`,
)
if (!list.success || !list.result?.[0]) {
  console.error('RECORD_LOOKUP_FAILED', JSON.stringify(list.errors || list))
  process.exit(3)
}

const rec = list.result[0]
const current = String(rec.content || '').replace(/^"|"$/g, '')
console.log('CURRENT', current)
console.log('TARGET ', TARGET)

if (current.includes('p=reject')) {
  console.log('ALREADY_REJECT')
  process.exit(0)
}

if (dryRun) {
  console.log('DRY_RUN_OK (no write)')
  process.exit(0)
}

const patch = await cf('PUT', `/zones/${zoneId}/dns_records/${rec.id}`, {
  type: 'TXT',
  name: '_dmarc',
  content: TARGET,
  ttl: 1,
})

if (!patch.success) {
  console.error('UPDATE_FAILED', JSON.stringify(patch.errors))
  process.exit(4)
}

console.log('UPDATED', TARGET)
console.log('VERIFY: dig/curl DNS TXT _dmarc.erythro.ai should show p=reject')
