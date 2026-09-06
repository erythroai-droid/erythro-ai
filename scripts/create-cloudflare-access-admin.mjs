/**
 * Create Cloudflare Access self-hosted app for erythro.ai/admin*.
 *
 * Requires env (never printed):
 *   CLOUDFLARE_API_TOKEN  — account permission: Access: Apps and Policies Edit
 *   CLOUDFLARE_ACCOUNT_ID — default: erythro.ai account
 * Optional:
 *   ACCESS_ALLOW_EMAIL    — default: erythro.ai@gmail.com
 *
 * Usage: node --env-file=.env.local scripts/create-cloudflare-access-admin.mjs
 *    or: node scripts/create-cloudflare-access-admin.mjs  (if vars already in env)
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

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
const accountId =
  process.env.CLOUDFLARE_ACCOUNT_ID?.trim() || '962f886c7b8d85646cbcf4dda43236a0'
const allowEmail =
  process.env.ACCESS_ALLOW_EMAIL?.trim() || 'erythro.ai@gmail.com'

if (!token) {
  console.error(
    'MISSING_TOKEN: set CLOUDFLARE_API_TOKEN with Access: Apps and Policies Edit',
  )
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
  return { status: r.status, ...j }
}

const list = await cf('GET', `/accounts/${accountId}/access/apps`)
if (!list.success) {
  console.error('LIST_FAILED', JSON.stringify(list.errors))
  process.exit(2)
}

const existing = (list.result || []).find(
  (a) =>
    a.name === 'erythro-admin' ||
    a.domain === 'erythro.ai/admin*' ||
    (Array.isArray(a.destinations) &&
      a.destinations.some((d) => d.uri === 'erythro.ai/admin*')),
)
if (existing) {
  console.log('ALREADY_EXISTS', existing.id, existing.domain || existing.name)
  process.exit(0)
}

let created = await cf('POST', `/accounts/${accountId}/access/apps`, {
  name: 'erythro-admin',
  type: 'self_hosted',
  domain: 'erythro.ai/admin*',
  session_duration: '24h',
  auto_redirect_to_identity: false,
  app_launcher_visible: false,
})

if (!created.success) {
  created = await cf('POST', `/accounts/${accountId}/access/apps`, {
    name: 'erythro-admin',
    type: 'self_hosted',
    destinations: [{ type: 'public', uri: 'erythro.ai/admin*' }],
    session_duration: '24h',
    auto_redirect_to_identity: false,
    app_launcher_visible: false,
  })
}

if (!created.success) {
  console.error('CREATE_APP_FAILED', JSON.stringify(created.errors))
  process.exit(3)
}

const appId = created.result.id
console.log('APP_CREATED', appId)

const pol = await cf('POST', `/accounts/${accountId}/access/apps/${appId}/policies`, {
  name: 'Allow operator email',
  decision: 'allow',
  precedence: 1,
  include: [{ email: { email: allowEmail } }],
})

if (!pol.success) {
  console.error('CREATE_POLICY_FAILED', JSON.stringify(pol.errors))
  process.exit(4)
}

console.log('POLICY_CREATED', pol.result.id)
console.log('ALLOW_EMAIL', allowEmail)
console.log('VERIFY: curl.exe -sI https://erythro.ai/admin  (expect Access challenge, not bare 200)')
