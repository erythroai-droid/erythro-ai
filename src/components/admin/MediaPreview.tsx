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

type MediaRow = {
  url?: unknown
  mimeType?: unknown
  filename?: unknown
}

/**
 * List-view cell for the Media "Preview" column. Renders a small first-frame
 * <video> thumbnail for video uploads and an <img> for images, using the row's
 * own data (the list view has no form state, so we read from `rowData`).
 */
export const MediaPreviewCell: React.FC<{ rowData?: MediaRow }> = ({ rowData }) => {
  const url = typeof rowData?.url === 'string' ? rowData.url : undefined
  const mimeType = typeof rowData?.mimeType === 'string' ? rowData.mimeType : undefined

  if (!url) return <span>—</span>

  const isVideo = mimeType?.startsWith('video/')
  const isImage = mimeType?.startsWith('image/')

  if (!isVideo && !isImage) return <span>—</span>

  const thumbStyle: React.CSSProperties = {
    display: 'block',
    height: 48,
    width: 'auto',
    maxWidth: 96,
    objectFit: 'cover',
    borderRadius: 4,
    border: '1px solid var(--theme-elevation-150)',
    background: '#000',
  }

  return isVideo ? (
    // The `#t=0.1` media fragment nudges the browser to paint an early frame as
    // the thumbnail instead of a blank black box.
    <video src={`${url}#t=0.1`} muted playsInline preload="metadata" style={thumbStyle} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" style={thumbStyle} />
  )
}

export default MediaPreview
