/**
 * Turn Payload media URLs into public Vercel Blob URLs when possible.
 * `/api/media/file/...` breaks <video> Range requests on Vercel (200 vs 206).
 */

function blobStoreId(): string | undefined {
  const fromPublic = process.env.NEXT_PUBLIC_BLOB_STORE_ID?.trim()
  if (fromPublic) return fromPublic.toLowerCase()

  const token = process.env.BLOB_READ_WRITE_TOKEN
  return token?.match(/^vercel_blob_rw_([a-z\d]+)_/i)?.[1]?.toLowerCase()
}

function encodeBlobPath(path: string): string {
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
  return `https://${storeId}.public.blob.vercel-storage.com/${encodeBlobPath(path)}`
}

/**
 * Prefer an already-public Blob URL. Rewrite Payload proxy paths when we know
 * the store id (server token or NEXT_PUBLIC_BLOB_STORE_ID).
 */
export function toPublicMediaUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (trimmed.includes('blob.vercel-storage.com')) return trimmed

  const match = trimmed.match(/\/(?:api\/)?media\/file\/(.+)$/i)
  if (match?.[1]) {
    return blobUrlFromPath(match[1]) ?? trimmed
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
  if (raw.includes('blob.vercel-storage.com')) return raw

  // Prefer rewriting the stored url (includes Blob random suffix) over
  // rebuilding from `filename`, which can 404 when names diverge.
  if (raw) {
    const rewritten = toPublicMediaUrl(raw)
    if (rewritten.includes('blob.vercel-storage.com')) return rewritten
  }

  const filename = typeof media.filename === 'string' ? media.filename.trim() : ''
  const prefix = typeof media.prefix === 'string' ? media.prefix.trim() : ''
  if (filename) {
    const fromName = blobUrlFromPath(prefix ? `${prefix.replace(/\/?$/, '/')}${filename}` : filename)
    if (fromName) return fromName
  }

  return raw || undefined
}
