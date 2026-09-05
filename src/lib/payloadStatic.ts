import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Payload Local API for static / ISR routes.
 *
 * Never call `cookies()` / `headers()` from `next/headers` before or inside
 * this helper — that opts the whole App Router segment into Dynamic Rendering
 * and forces `Cache-Control: private, no-store` (no CDN HIT).
 *
 * Local API defaults to `overrideAccess: true`, so public reads work without a
 * request user. Prefer explicit `overrideAccess: true` on finds for clarity.
 */
export async function getPayloadLocal() {
  return getPayload({ config })
}
