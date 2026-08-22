/**
 * Deploy Cloudflare edge rate limit for /api/contact.
 *
 * Free plan constraints (new Rate Limiting): period + mitigation = 10s only;
 * expression fields limited (Path / Verified Bot — avoid Method on Free).
 * App still enforces 5 / 60s in-memory (src/lib/contactRateLimit.ts).
 *
 * Usage:
 *   set CLOUDFLARE_API_TOKEN=...   # Zone → Zone WAF Write (+ Zone Read)
 *   set CLOUDFLARE_ZONE_ID=...     # erythro.ai Overview → Zone ID
 *   node scripts/cloudflare-contact-rate-limit.mjs
 *   node scripts/cloudflare-contact-rate-limit.mjs --dry-run
 *
 * See docs/DEPLOYMENT.md §13.3
 */

const API = 'https://api.cloudflare.com/client/v4'
const RULE_DESCRIPTION = 'Rate limit /api/contact (5/10s per IP)'
const EXPRESSION = '(http.request.uri.path eq "/api/contact")'

const ratelimit = {
  characteristics: ['cf.colo.id', 'ip.src'],
  period: 10,
  requests_per_period: 5,
  mitigation_timeout: 10,
}

function env(name) {
  const v = process.env[name]?.trim()
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

async function cf(token, method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.success) {
    const msgs = (json.errors || []).map((e) => e.message).join('; ') || res.statusText
    const err = new Error(`Cloudflare API ${method} ${path}: ${msgs}`)
    err.status = res.status
    err.payload = json
    throw err
  }
  return json.result
}

function ruleBody() {
  return {
    description: RULE_DESCRIPTION,
    expression: EXPRESSION,
    action: 'block',
    enabled: true,
    ratelimit,
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const token = env('CLOUDFLARE_API_TOKEN')
  const zoneId = env('CLOUDFLARE_ZONE_ID')

  console.log(`Zone ${zoneId}`)
  console.log(`Expression: ${EXPRESSION}`)
  console.log(`Limit: ${ratelimit.requests_per_period} / ${ratelimit.period}s, block ${ratelimit.mitigation_timeout}s`)

  if (dryRun) {
    console.log('--dry-run: would ensure http_ratelimit rule:', ruleBody())
    return
  }

  let ruleset
  try {
    ruleset = await cf(token, 'GET', `/zones/${zoneId}/rulesets/phases/http_ratelimit/entrypoint`)
  } catch (e) {
    if (e.status !== 404) throw e
    ruleset = null
  }

  if (!ruleset) {
    const created = await cf(token, 'POST', `/zones/${zoneId}/rulesets`, {
      name: 'default',
      kind: 'zone',
      phase: 'http_ratelimit',
      rules: [ruleBody()],
    })
    console.log(`Created http_ratelimit ruleset ${created.id} with rule.`)
    return
  }

  const existing = (ruleset.rules || []).find((r) => r.description === RULE_DESCRIPTION)
  if (existing) {
    await cf(token, 'PATCH', `/zones/${zoneId}/rulesets/${ruleset.id}/rules/${existing.id}`, ruleBody())
    console.log(`Updated existing rule ${existing.id}`)
    return
  }

  const created = await cf(token, 'POST', `/zones/${zoneId}/rulesets/${ruleset.id}/rules`, ruleBody())
  console.log(`Created rule ${created.id} in ruleset ${ruleset.id}`)
}

main().catch((err) => {
  console.error(err.message)
  if (err.payload) console.error(JSON.stringify(err.payload, null, 2))
  process.exit(1)
})
