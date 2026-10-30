/**
 * Does the site answer the lab with a bot challenge instead of its pages? (PIT-149)
 *
 * Report 244 (shirielectric.co.il): from the VPS the homepage was `202` + `x-amzn-waf-action:
 * challenge` with an empty body, and the audit reported "no form, no headers, no robots.txt".
 * Only strong signals count: a vendor challenge header, or a challenge page body with a
 * blocking status. A plain 403 or an odd page is not enough.
 */
import { assertPublicHttpUrl } from './ssrf.js'

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const MAX_REDIRECTS = 5
const TIMEOUT_MS = 20_000
const BLOCKING_STATUSES = new Set([202, 403, 429, 503])

/**
 * @param {number} status
 * @param {Headers} headers
 * @param {string} body
 * @returns {string|null} protection name, or null when the answer looks like the site
 */
export function classifyChallenge(status, headers, body) {
  const h = (name) => (headers.get(name) || '').toLowerCase()
  const text = String(body || '').slice(0, 200_000).toLowerCase()

  const waf = h('x-amzn-waf-action')
  if (waf === 'challenge' || waf === 'captcha') return 'AWS WAF'
  if (h('cf-mitigated') === 'challenge') return 'Cloudflare'
  if (!BLOCKING_STATUSES.has(status)) return null

  const server = h('server')
  if (server.includes('cloudflare') && (text.includes('just a moment') || text.includes('challenge-platform') || text.includes('cf-chl'))) {
    return 'Cloudflare'
  }
  if (headers.has('x-datadome') || text.includes('captcha-delivery.com')) return 'DataDome'
  if (text.includes('_incapsula_resource') || (headers.has('x-iinfo') && text.length < 5000)) return 'Imperva'
  if (headers.has('x-sucuri-block') || text.includes('sucuri website firewall')) return 'Sucuri'
  if (server.includes('akamaighost') && text.includes('access denied')) return 'Akamai'
  if (status === 202 && text.trim().length === 0 && server.includes('cloudfront')) return 'AWS WAF'
  return null
}

/**
 * GET the homepage the way a browser would, following redirects with the SSRF guard on each hop.
 *
 * @param {string} targetUrl
 * @returns {Promise<{ blocked: boolean, protection?: string, status?: string, url?: string, error?: string }>}
 */
export async function detectBotChallenge(targetUrl) {
  let url = String(targetUrl || '').trim()
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const guard = await assertPublicHttpUrl(url)
      if (!guard.ok) return { blocked: false, error: `ssrf_${guard.reason}` }
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          'User-Agent': BROWSER_UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,he;q=0.8,ru;q=0.7',
        },
      })
      const location = res.headers.get('location')
      if (res.status >= 300 && res.status < 400 && location) {
        url = new URL(location, url).toString()
        continue
      }
      const body = await res.text().catch(() => '')
      const protection = classifyChallenge(res.status, res.headers, body)
      if (!protection) return { blocked: false, url }
      return { blocked: true, protection, status: `HTTP ${res.status}`, url }
    }
    return { blocked: false, error: 'too_many_redirects' }
  } catch (err) {
    // A network error is not a bot challenge: let the normal audit run and report it
    return { blocked: false, error: err instanceof Error ? err.message : String(err) }
  }
}
