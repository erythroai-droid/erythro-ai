import { lookup as dnsLookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { isAuditWebsiteFormat, normalizeAuditWebsite } from '@/lib/auditFormValidation'

export type WebsiteCheckReason = 'format' | 'blocked' | 'dns'

export type WebsiteCheckResult =
  | { ok: true; hostname: string }
  | { ok: false; reason: WebsiteCheckReason }

export type WebsiteLookup = (hostname: string) => Promise<Array<{ address: string }>>

const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal', 'kubernetes.default'])

function hostnameBlocked(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '')
  if (!host) return true
  if (BLOCKED_HOSTS.has(host)) return true
  if (host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true
  if (isIP(host)) return true
  return false
}

/** Public internet only — reject loopback, RFC1918, link-local, IPv6 ULA. */
export function isPrivateOrReservedIp(address: string): boolean {
  const ip = address.trim().toLowerCase()
  if (!isIP(ip)) return true

  if (ip.includes(':')) {
    if (ip === '::1' || ip === '::') return true
    if (ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true
    if (ip.startsWith('::ffff:')) {
      const v4 = ip.slice('::ffff:'.length)
      return isPrivateOrReservedIp(v4)
    }
    return false
  }

  const parts = ip.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [a, b] = parts
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a >= 224) return true
  return false
}

function parsePublicHostname(raw: string): string | null {
  if (!isAuditWebsiteFormat(raw)) return null
  try {
    const hostname = new URL(normalizeAuditWebsite(raw)).hostname.toLowerCase()
    if (!hostname || hostnameBlocked(hostname)) return null
    return hostname
  } catch {
    return null
  }
}

/**
 * Confirms the URL is a real public hostname (DNS A/AAAA to a public IP).
 * Does not require HTTP 200 — many sites block bots.
 */
export async function checkWebsiteReachable(
  raw: string,
  lookup: WebsiteLookup = defaultLookup,
): Promise<WebsiteCheckResult> {
  const hostname = parsePublicHostname(raw)
  if (!hostname) {
    const formatOk = isAuditWebsiteFormat(raw)
    return { ok: false, reason: formatOk ? 'blocked' : 'format' }
  }

  let records: Array<{ address: string }>
  try {
    records = await lookup(hostname)
  } catch {
    return { ok: false, reason: 'dns' }
  }

  const publicAddresses = records.filter((row) => row.address && !isPrivateOrReservedIp(row.address))
  if (!publicAddresses.length) return { ok: false, reason: 'dns' }
  return { ok: true, hostname }
}

async function defaultLookup(hostname: string): Promise<Array<{ address: string }>> {
  const rows = await dnsLookup(hostname, { all: true, verbatim: true })
  return rows.map((row) => ({ address: row.address }))
}
