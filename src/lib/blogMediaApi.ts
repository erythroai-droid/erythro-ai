import type { Payload } from 'payload'
import { mediaDocUrl } from '@/lib/publicMediaUrl'

/** Vercel request body soft limit is 4.5 MB — keep multipart under that. */
export const BLOG_MEDIA_MULTIPART_MAX_BYTES = 4 * 1024 * 1024
/** URL fetch can be larger; still capped for function memory. */
export const BLOG_MEDIA_URL_MAX_BYTES = 12 * 1024 * 1024

const IMAGE_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

const VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

const EXT_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
}

export function isAllowedBlogMediaMime(mime: string): boolean {
  const m = mime.trim().toLowerCase()
  return IMAGE_MIME.has(m) || VIDEO_MIME.has(m)
}

export function mimeFromFilename(name: string): string | undefined {
  const lower = name.trim().toLowerCase()
  const dot = lower.lastIndexOf('.')
  if (dot < 0) return undefined
  return EXT_MIME[lower.slice(dot)]
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'upload'
  return base.slice(0, 180)
}

/** Block obvious SSRF targets before fetch. */
export function assertSafePublicMediaUrl(raw: string): { ok: true; url: URL } | { ok: false; error: string } {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return { ok: false, error: 'Invalid url' }
  }
  if (url.protocol !== 'https:') {
    return { ok: false, error: 'Only https:// URLs are allowed' }
  }
  const host = url.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === 'metadata.google.internal' ||
    host === '169.254.169.254'
  ) {
    return { ok: false, error: 'URL host is not allowed' }
  }
  // Literal private / link-local IPv4
  if (/^(10\.|127\.|192\.168\.|169\.254\.|0\.)/.test(host)) {
    return { ok: false, error: 'URL host is not allowed' }
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
    return { ok: false, error: 'URL host is not allowed' }
  }
  return { ok: true, url }
}

export type BlogMediaFile = {
  data: Buffer
  mimetype: string
  name: string
  size: number
}

export async function createBlogMedia(
  payload: Payload,
  opts: { file: BlogMediaFile; alt: string },
): Promise<{ id: number | string; url: string | null; mimeType: string; alt: string; filename: string }> {
  const alt = opts.alt.trim()
  if (!alt) throw Object.assign(new Error('alt is required'), { status: 400 })

  const mime = opts.file.mimetype.trim().toLowerCase()
  if (!isAllowedBlogMediaMime(mime)) {
    throw Object.assign(
      new Error('Unsupported media type. Allowed: jpeg/png/webp/gif/avif, mp4/webm/mov'),
      { status: 400 },
    )
  }
  if (!opts.file.data.length) {
    throw Object.assign(new Error('Empty file'), { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await (payload as any).create({
    collection: 'media',
    data: { alt },
    file: {
      data: opts.file.data,
      mimetype: mime,
      name: sanitizeFilename(opts.file.name),
      size: opts.file.size || opts.file.data.length,
    },
    depth: 0,
    overrideAccess: true,
  })

  const url =
    mediaDocUrl(doc) || (typeof doc?.url === 'string' ? doc.url : null)

  return {
    id: doc.id,
    url,
    mimeType: typeof doc.mimeType === 'string' ? doc.mimeType : mime,
    alt,
    filename: typeof doc.filename === 'string' ? doc.filename : sanitizeFilename(opts.file.name),
  }
}

export async function fetchBlogMediaFromUrl(
  rawUrl: string,
  opts?: { maxBytes?: number; filenameHint?: string },
): Promise<BlogMediaFile> {
  const guard = assertSafePublicMediaUrl(rawUrl)
  if (!guard.ok) throw Object.assign(new Error(guard.error), { status: 400 })

  const maxBytes = opts?.maxBytes ?? BLOG_MEDIA_URL_MAX_BYTES
  const res = await fetch(guard.url.toString(), {
    redirect: 'follow',
    signal: AbortSignal.timeout(25_000),
    headers: { Accept: 'image/*,video/*,*/*' },
  })
  if (!res.ok) {
    throw Object.assign(new Error(`Failed to fetch media (${res.status})`), { status: 400 })
  }

  const contentLength = Number(res.headers.get('content-length') || 0)
  if (contentLength > maxBytes) {
    throw Object.assign(
      new Error(`File too large (max ${maxBytes} bytes via URL)`),
      { status: 413 },
    )
  }

  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length > maxBytes) {
    throw Object.assign(
      new Error(`File too large (max ${maxBytes} bytes via URL)`),
      { status: 413 },
    )
  }

  const headerMime = (res.headers.get('content-type') || '').split(';')[0]?.trim().toLowerCase() || ''
  const pathName = guard.url.pathname
  const fromPath = mimeFromFilename(pathName)
  const fromHint = opts?.filenameHint ? mimeFromFilename(opts.filenameHint) : undefined
  const mimetype = isAllowedBlogMediaMime(headerMime)
    ? headerMime
    : fromHint || fromPath || ''

  if (!isAllowedBlogMediaMime(mimetype)) {
    throw Object.assign(
      new Error('Fetched file is not an allowed image/video type'),
      { status: 400 },
    )
  }

  const name =
    (opts?.filenameHint && sanitizeFilename(opts.filenameHint)) ||
    sanitizeFilename(pathName.split('/').pop() || `upload.${mimetype.split('/')[1] || 'bin'}`)

  return { data: buf, mimetype, name, size: buf.length }
}

export async function resolveCoverInput(
  payload: Payload,
  cover: unknown,
): Promise<number | string | null | undefined> {
  if (cover === undefined) return undefined
  if (cover === null) return null
  if (typeof cover === 'number' || typeof cover === 'string') return cover

  if (!cover || typeof cover !== 'object' || Array.isArray(cover)) {
    throw Object.assign(new Error('cover must be a media id, null, or { url, alt } / { id }'), {
      status: 400,
    })
  }

  const o = cover as Record<string, unknown>
  if (typeof o.id === 'number' || typeof o.id === 'string') return o.id
  if (typeof o.mediaId === 'number' || typeof o.mediaId === 'string') return o.mediaId

  const url = typeof o.url === 'string' ? o.url.trim() : ''
  if (!url) {
    throw Object.assign(new Error('cover.url is required when cover is an object'), { status: 400 })
  }
  const alt =
    (typeof o.alt === 'string' && o.alt.trim()) ||
    (typeof o.filename === 'string' && o.filename.trim()) ||
    'Blog cover'
  const filenameHint = typeof o.filename === 'string' ? o.filename : undefined
  const file = await fetchBlogMediaFromUrl(url, { filenameHint })
  const media = await createBlogMedia(payload, { file, alt })
  return media.id
}
