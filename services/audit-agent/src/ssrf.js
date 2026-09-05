import { lookup as dnsLookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal', 'kubernetes.default'])

function hostnameBlocked(hostname) {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '')
  if (!host) return true
  if (BLOCKED_HOSTS.has(host)) return true
  if (host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true
  }
  if (isIP(host)) return true
  return false
}

/** Public internet only — reject loopback, RFC1918, link-local, IPv6 ULA. */
export function isPrivateOrReservedIp(address) {
  const ip = address.trim().toLowerCase()
  if (!isIP(ip)) return true

  if (ip.includes(':')) {
    if (ip === '::1' || ip === '::') return true
    if (ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true
    if (ip.startsWith('::ffff:')) {
      return isPrivateOrReservedIp(ip.slice('::ffff:'.length))
    }
    return false
  }

  const parts = ip.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true
  }
  const [a, b] = parts
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a >= 224) return true
  return false
}

/**
 * Reject SSRF targets before Playwright navigates.
 * @returns {{ ok: true, hostname: string } | { ok: false, reason: string }}
 */
export async function assertPublicHttpUrl(raw) {
  let url
  try {
    url = new URL(String(raw || '').trim())
  } catch {
    return { ok: false, reason: 'format' }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'protocol' }
  }

  const hostname = url.hostname.toLowerCase()
  if (!hostname || hostnameBlocked(hostname)) {
    return { ok: false, reason: 'blocked' }
  }

  let records
  try {
    records = await dnsLookup(hostname, { all: true })
  } catch {
    return { ok: false, reason: 'dns' }
  }

  if (!records?.length) return { ok: false, reason: 'dns' }
  if (records.every((r) => isPrivateOrReservedIp(r.address))) {
    return { ok: false, reason: 'private' }
  }

  return { ok: true, hostname }
}
