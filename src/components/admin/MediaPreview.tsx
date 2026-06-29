'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'

/**
 * Admin edit-view preview for the Media collection.
 *
 * Payload only renders an inline preview for image uploads; video files show a
 * generic icon. This UI field reads the upload's `url` + `mimeType` from form
 * state and renders a real preview: a <video> player for videos and an <img>
 * for images (served directly from the public Vercel Blob URL).
 */
export const MediaPreview: React.FC = () => {
  const url = useFormFields(([fields]) => fields?.url?.value as string | undefined)
  const mimeType = useFormFields(([fields]) => fields?.mimeType?.value as string | undefined)

  if (!url || typeof url !== 'string') return null

  const isVideo = typeof mimeType === 'string' && mimeType.startsWith('video/')
  const isImage = typeof mimeType === 'string' && mimeType.startsWith('image/')

  if (!isVideo && !isImage) return null

  const mediaStyle: React.CSSProperties = {
    display: 'block',
    maxWidth: '100%',
    maxHeight: 360,
    borderRadius: 8,
    border: '1px solid var(--theme-elevation-150)',
    background: '#000',
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          marginBottom: '.5rem',
          fontSize: '.8rem',
          fontWeight: 600,
          color: 'var(--theme-elevation-600)',
        }}
      >
        Preview
      </div>

      {isVideo ? (
        <video
          src={url}
          controls
          playsInline
          preload="metadata"
          style={{ ...mediaStyle, objectFit: 'contain' }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Media preview" style={{ ...mediaStyle, objectFit: 'contain' }} />
      )}
    </div>
  )
}

export default MediaPreview
