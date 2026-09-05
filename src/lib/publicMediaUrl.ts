/**
 * Turn Payload media URLs into public CDN URLs when possible.
 * `/api/media/file/...` breaks <video> Range requests on Vercel (200 vs 206).
 *
 * Supports Cloudflare R2 public base (`R2_MEDIA_PUBLIC_BASE_URL`) and legacy
 * Vercel Blob store URLs during / after migration.
 */

function blobStoreId(): string | undefined {
  const fromPublic = process.env.NEXT_PUBLIC_BLOB_STORE_ID?.trim()
  if (fromPublic) return fromPublic.toLowerCase()

  const token = process.env.BLOB_READ_WRITE_TOKEN
  return token?.match(/^vercel_blob_rw_([a-z\d]+)_/i)?.[1]?.toLowerCase()
}

function r2MediaPublicBase(): string | undefined {
  const base = process.env.R2_MEDIA_PUBLIC_BASE_URL?.trim() || process.env.NEXT_PUBLIC_R2_MEDIA_BASE_URL?.trim()
  return base ? base.replace(/\/+$/, '') : undefined
}

function encodeObjectPath(path: string): string {
  return path
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => {
      try {
        return encodeURIComponent(decodeURIComponent(part))
      } catch {
        return encodeURIComponent(part)
      }
    })
    .join('/')
}

/** Build `https://<store>.public.blob.vercel-storage.com/<path>`. */
export function blobUrlFromPath(path: string): string | undefined {
  const storeId = blobStoreId()
  if (!storeId || !path.trim()) return undefined
  return `https://${storeId}.public.blob.vercel-storage.com/${encodeObjectPath(path)}`
}

export function r2MediaUrlFromPath(path: string): string | undefined {
  const base = r2MediaPublicBase()
  if (!base || !path.trim()) return undefined
  return `${base}/${encodeObjectPath(path)}`
}

function isPublicMediaHost(url: string): boolean {
  return (
    url.includes('blob.vercel-storage.com') ||
    url.includes('.r2.dev') ||
    Boolean(r2MediaPublicBase() && url.startsWith(r2MediaPublicBase()!))
  )
}

/**
 * Prefer an already-public CDN URL. Rewrite Payload proxy paths when we know
 * the R2 public base or Blob store id.
 */
export function toPublicMediaUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (isPublicMediaHost(trimmed)) return trimmed

  const match = trimmed.match(/\/(?:api\/)?media\/file\/(.+)$/i)
  if (match?.[1]) {
    return r2MediaUrlFromPath(match[1]) ?? blobUrlFromPath(match[1]) ?? trimmed
  }

  return trimmed
}

/** Resolve a Media doc / upload field value to a playable public URL. */
export function mediaDocUrl(media: {
  url?: unknown
  filename?: unknown
  prefix?: unknown
} | string | null | undefined): string | undefined {
  if (typeof media === 'string' && media.trim()) return toPublicMediaUrl(media.trim())
  if (!media || typeof media !== 'object') return undefined

  const raw = typeof media.url === 'string' ? media.url.trim() : ''
  if (isPublicMediaHost(raw)) return raw

  // Prefer rewriting the stored url (includes CDN random suffix) over
  // rebuilding from `filename`, which can 404 when names diverge.
  if (raw) {
    const rewritten = toPublicMediaUrl(raw)
    if (isPublicMediaHost(rewritten)) return rewritten
  }

  const filename = typeof media.filename === 'string' ? media.filename.trim() : ''
  const prefix = typeof media.prefix === 'string' ? media.prefix.trim() : ''
  if (filename) {
    const objectPath = prefix ? `${prefix.replace(/\/?$/, '/')}${filename}` : filename
    const fromR2 = r2MediaUrlFromPath(objectPath)
    if (fromR2) return fromR2
    const fromBlob = blobUrlFromPath(objectPath)
    if (fromBlob) return fromBlob
  }

  return raw || undefined
}
