import { createHash } from 'node:crypto'

/**
 * Gemini explicit context cache for the consultant system prompt.
 *
 * The prompt is rebuilt on every message and carries the hard rules, the IT
 * glossary, the brief checklist and the whole knowledge base — a few thousand
 * input tokens that are identical for every visitor on a given locale. Caching
 * it upstream means Gemini bills the prefix once per cache instead of once per
 * message.
 *
 * Only `systemInstruction` goes into the cache. Tool declarations stay in the
 * request, so editing a tool never invalidates the cache and the request keeps
 * a single source of truth for what the model may call.
 *
 * Everything here is best-effort: any failure returns `null` and the caller
 * sends the plain prompt.
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/cachedContents'

/** Long enough to cover a browsing session, short enough to bound storage cost. */
const TTL_SECONDS = 3600

/** Re-create a little before expiry so a request never races the deadline. */
const RENEW_MARGIN_MS = 120_000

/** Gemini refuses prompts below its minimum cacheable size — stop asking for a while. */
const REFUSAL_COOLDOWN_MS = 15 * 60_000

const REQUEST_TIMEOUT_MS = 8_000

type CacheEntry = { name: string; expiresAt: number }

declare global {
  // Survives warm serverless invocations inside one isolate.
  var __erythroConsultPromptCache: Map<string, CacheEntry> | undefined
  var __erythroConsultPromptCacheRefusals: Map<string, number> | undefined
}

function entries(): Map<string, CacheEntry> {
  if (!globalThis.__erythroConsultPromptCache) {
    globalThis.__erythroConsultPromptCache = new Map()
  }
  return globalThis.__erythroConsultPromptCache
}

function refusals(): Map<string, number> {
  if (!globalThis.__erythroConsultPromptCacheRefusals) {
    globalThis.__erythroConsultPromptCacheRefusals = new Map()
  }
  return globalThis.__erythroConsultPromptCacheRefusals
}

/** Kill switch for incidents: `CONSULT_PROMPT_CACHE=0` sends the plain prompt. */
export function isPromptCacheEnabled(): boolean {
  const raw = process.env.CONSULT_PROMPT_CACHE?.trim()
  if (!raw) return true
  return raw !== '0' && raw.toLowerCase() !== 'false'
}

/**
 * Identifies one exact prompt on one exact model. A CMS edit changes the
 * knowledge base, which changes the fingerprint, which creates a new cache —
 * so stale prices can never be served from an old prefix.
 */
function fingerprint(model: string, system: string): string {
  return createHash('sha256').update(`${model}\n${system}`).digest('hex').slice(0, 32)
}

function isFresh(entry: CacheEntry | undefined): entry is CacheEntry {
  return Boolean(entry && entry.expiresAt - RENEW_MARGIN_MS > Date.now())
}

async function findExisting(
  apiKey: string,
  model: string,
  displayName: string,
): Promise<CacheEntry | null> {
  // One LIST per cold start keeps restarts from piling up duplicate caches,
  // each of which would be billed for storage until its TTL runs out.
  const url = `${API_BASE}?key=${encodeURIComponent(apiKey)}&pageSize=100`
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!res.ok) return null

  const body = (await res.json()) as {
    cachedContents?: Array<{
      name?: string
      displayName?: string
      model?: string
      expireTime?: string
    }>
  }

  for (const item of body.cachedContents ?? []) {
    if (item.displayName !== displayName || !item.name) continue
    if (item.model && !item.model.endsWith(model)) continue
    const expiresAt = Date.parse(item.expireTime ?? '')
    if (!Number.isFinite(expiresAt)) continue
    const entry = { name: item.name, expiresAt }
    if (isFresh(entry)) return entry
  }
  return null
}

async function create(
  apiKey: string,
  model: string,
  system: string,
  displayName: string,
): Promise<CacheEntry | null> {
  const res = await fetch(`${API_BASE}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      model: `models/${model}`,
      displayName,
      ttl: `${TTL_SECONDS}s`,
      systemInstruction: { parts: [{ text: system }] },
    }),
  })

  if (!res.ok) {
    // 400 here normally means "prompt shorter than the model's cache minimum".
    // That is a property of the prompt, not a transient fault, so back off.
    refusals().set(displayName, Date.now())
    return null
  }

  const body = (await res.json()) as { name?: string; expireTime?: string }
  if (!body.name) return null
  const expiresAt = Date.parse(body.expireTime ?? '')
  return {
    name: body.name,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + TTL_SECONDS * 1000,
  }
}

/**
 * Resource name of a cache holding this exact system prompt, or `null` when the
 * caller should send the prompt inline.
 *
 * A returned name must be paired with *omitting* `system` from the request:
 * Gemini rejects a call that carries both `cachedContent` and
 * `systemInstruction`.
 */
export async function getCachedSystemPrompt(input: {
  apiKey: string
  model: string
  system: string
}): Promise<string | null> {
  if (!isPromptCacheEnabled()) return null

  const { apiKey, model, system } = input
  const key = fingerprint(model, system)
  const displayName = `consult-${key}`

  const known = entries().get(key)
  if (isFresh(known)) return known.name

  const refusedAt = refusals().get(displayName)
  if (refusedAt && Date.now() - refusedAt < REFUSAL_COOLDOWN_MS) return null

  try {
    const found = (await findExisting(apiKey, model, displayName)) ?? (await create(apiKey, model, system, displayName))
    if (!found) return null
    entries().set(key, found)
    return found.name
  } catch (err) {
    console.error(
      '[consult] prompt cache unavailable:',
      err instanceof Error ? err.message : String(err),
    )
    return null
  }
}

/**
 * Drops a cache the model itself rejected, so the next request rebuilds it
 * instead of failing again.
 */
export function forgetCachedSystemPrompt(model: string, system: string): void {
  const key = fingerprint(model, system)
  entries().delete(key)
  refusals().set(`consult-${key}`, Date.now())
}
