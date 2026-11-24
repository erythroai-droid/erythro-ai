import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { blogApiAuthorized, blogApiTokenConfigured } from '@/lib/blogApiAuth'
import {
  BLOG_MEDIA_MULTIPART_MAX_BYTES,
  createBlogMedia,
  fetchBlogMediaFromUrl,
  isAllowedBlogMediaMime,
  mimeFromFilename,
} from '@/lib/blogMediaApi'

export const runtime = 'nodejs'
export const maxDuration = 60

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function notConfigured() {
  return NextResponse.json(
    { error: 'BLOG_API_TOKEN is not configured' },
    { status: 503 },
  )
}

/**
 * Upload blog media (image or video) into Payload Media → R2.
 *
 * Auth: same as `/api/blog` (`BLOG_API_TOKEN`).
 *
 * 1) multipart/form-data:
 *    - `file` (required)
 *    - `alt` (required)
 *
 * 2) application/json:
 *    - `{ "url": "https://...", "alt": "...", "filename": "optional.mp4" }`
 *
 * Limits: multipart ≤ 4 MB (Vercel body); URL fetch ≤ 12 MB.
 * Allowed: jpeg/png/webp/gif/avif, mp4/webm/mov.
 */
export async function POST(request: NextRequest) {
  if (!blogApiTokenConfigured()) return notConfigured()
  if (!blogApiAuthorized(request.headers)) return unauthorized()

  const contentType = request.headers.get('content-type') || ''

  try {
    const payload = await getPayload({ config })

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file')
      const altRaw = form.get('alt')
      const alt = typeof altRaw === 'string' ? altRaw.trim() : ''

      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'file field is required' }, { status: 400 })
      }
      if (!alt) {
        return NextResponse.json({ error: 'alt is required' }, { status: 400 })
      }
      if (file.size > BLOG_MEDIA_MULTIPART_MAX_BYTES) {
        return NextResponse.json(
          {
            error: `File too large for multipart (max ${BLOG_MEDIA_MULTIPART_MAX_BYTES} bytes). Use JSON { url, alt } for larger files up to 12 MB.`,
          },
          { status: 413 },
        )
      }

      const buf = Buffer.from(await file.arrayBuffer())
      const headerMime = (file.type || '').split(';')[0]?.trim().toLowerCase() || ''
      const mimetype = isAllowedBlogMediaMime(headerMime)
        ? headerMime
        : mimeFromFilename(file.name) || ''

      const media = await createBlogMedia(payload, {
        file: {
          data: buf,
          mimetype,
          name: file.name || 'upload',
          size: buf.length,
        },
        alt,
      })

      return NextResponse.json({ ok: true, media }, { status: 201 })
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Expected multipart/form-data or JSON { url, alt }' },
        { status: 400 },
      )
    }

    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
    }
    const body = json as Record<string, unknown>
    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const alt = typeof body.alt === 'string' ? body.alt.trim() : ''
    const filename = typeof body.filename === 'string' ? body.filename : undefined

    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })
    if (!alt) return NextResponse.json({ error: 'alt is required' }, { status: 400 })

    const file = await fetchBlogMediaFromUrl(url, { filenameHint: filename })
    const media = await createBlogMedia(payload, { file, alt })
    return NextResponse.json({ ok: true, media }, { status: 201 })
  } catch (err) {
    const status =
      typeof (err as { status?: number })?.status === 'number'
        ? (err as { status: number }).status
        : 500
    const message = err instanceof Error ? err.message : 'Upload failed'
    if (status >= 500) console.error('[api/blog/media] POST failed:', err)
    return NextResponse.json({ error: message }, { status })
  }
}
