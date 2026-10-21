'use client'

import React, { useState } from 'react'
import { FieldLabel, useField } from '@payloadcms/ui'
import type { TextareaFieldClientComponent } from 'payload'

function formatSize(chars: number): string {
  if (chars <= 0) return 'empty'
  if (chars < 1024) return `${chars} chars`
  if (chars < 1024 * 1024) return `${(chars / 1024).toFixed(chars < 10_240 ? 1 : 0)} KB`
  return `${(chars / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Html Result can be hundreds of KB — keep the edit form usable by
 * collapsing the body until staff expand it.
 */
export const HtmlResultField: TextareaFieldClientComponent = ({ field, path, readOnly }) => {
  const { value } = useField<string | null | undefined>({ path })
  const [open, setOpen] = useState(false)

  const html = typeof value === 'string' ? value : ''
  const sizeLabel = formatSize(html.length)
  const description =
    field.admin && 'description' in field.admin && typeof field.admin.description === 'string'
      ? field.admin.description
      : undefined

  const label =
    typeof field.label === 'string'
      ? field.label
      : field.label && typeof field.label === 'object' && 'en' in field.label
        ? String((field.label as { en?: string }).en || 'Html Result')
        : 'Html Result'

  return (
    <div className="field-type textarea">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <FieldLabel label={label} path={path} required={Boolean(field.required)} />
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          disabled={!html}
          style={{
            appearance: 'none',
            cursor: html ? 'pointer' : 'not-allowed',
            border: '1px solid var(--theme-elevation-250)',
            background: 'var(--theme-elevation-50)',
            color: 'var(--theme-text)',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 600,
            opacity: html ? 1 : 0.55,
          }}
        >
          {open ? 'Collapse' : 'Expand'} · {sizeLabel}
        </button>
      </div>
      {description ? <div className="field-description">{description}</div> : null}

      {!html ? (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 6,
            color: 'var(--theme-elevation-600)',
            fontSize: 13,
          }}
        >
          No inline HTML stored (report may live in R2 only).
        </div>
      ) : open ? (
        <textarea
          className="textarea"
          readOnly={readOnly !== false}
          value={html}
          rows={16}
          style={{
            marginTop: 8,
            width: '100%',
            maxHeight: 'min(70vh, 640px)',
            resize: 'vertical',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: 12,
            lineHeight: 1.45,
          }}
        />
      ) : (
        <div
          style={{
            marginTop: 8,
            padding: '10px 12px',
            border: '1px dashed var(--theme-elevation-200)',
            borderRadius: 6,
            color: 'var(--theme-elevation-600)',
            fontSize: 13,
          }}
        >
          Collapsed — click Expand to view the full HTML report source.
        </div>
      )}
    </div>
  )
}

export default HtmlResultField
