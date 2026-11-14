import React from 'react'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import { mediaDocUrl } from '@/lib/publicMediaUrl'

type UploadDoc = {
  alt?: string | null
  filename?: string | null
  height?: number | null
  mimeType?: string | null
  sizes?: Record<string, unknown> | null
  url?: string | null
  width?: number | null
}

function isVideoUpload(mime: unknown, url?: string): boolean {
  if (typeof mime === 'string' && mime.startsWith('video/')) return true
  if (url && /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)) return true
  return false
}

/**
 * Payload's default Upload JSX converter renders non-images as a bare
 * filename link. Portfolio (and other) case studies need a real <video>
 * player, and public CDN URLs so Range requests work (PIT-003 / PIT-167).
 */
export const richTextConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  upload: (args) => {
    const node = args.node as {
      fields?: { alt?: string | null }
      value?: UploadDoc | number | string | null
    }
    const uploadDoc = typeof node.value === 'object' && node.value ? node.value : null
    if (!uploadDoc) {
      const fallback = defaultConverters.upload
      return typeof fallback === 'function' ? fallback(args) : fallback ?? null
    }

    const url = mediaDocUrl(uploadDoc) || (typeof uploadDoc.url === 'string' ? uploadDoc.url : '')
    if (!url) return null

    if (isVideoUpload(uploadDoc.mimeType, url)) {
      const alt =
        (typeof node.fields?.alt === 'string' && node.fields.alt.trim()) ||
        (typeof uploadDoc.alt === 'string' && uploadDoc.alt.trim()) ||
        ''
      return (
        <video
          src={url}
          controls
          playsInline
          preload="metadata"
          title={alt || undefined}
          aria-label={alt || undefined}
        />
      )
    }

    // Prefer public CDN URL for images too (legacy /api/media/file/... paths).
    if (url !== uploadDoc.url) {
      const fallback = defaultConverters.upload
      if (typeof fallback === 'function') {
        return fallback({
          ...args,
          node: {
            ...node,
            value: { ...uploadDoc, url },
          },
        })
      }
      return fallback ?? null
    }

    const fallback = defaultConverters.upload
    return typeof fallback === 'function' ? fallback(args) : fallback ?? null
  },
})
