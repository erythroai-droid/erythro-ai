'use client'

import React from 'react'

type FieldLike = { name?: string }

type Props = {
  cellData?: unknown
  field?: FieldLike
}

const MAX_WIDTH: Record<string, number> = {
  name: 108,
  email: 132,
  website: 128,
  planSlug: 88,
  planTotal: 72,
  locale: 48,
}

const compactStyle = (maxWidth: number): React.CSSProperties => ({
  display: 'block',
  maxWidth,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 12,
  lineHeight: 1.35,
})

function formatWebsite(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    const path = url.pathname !== '/' ? url.pathname.replace(/\/$/, '') : ''
    return `${url.hostname}${path}`
  } catch {
    return trimmed
  }
}

function formatText(value: unknown, fieldName?: string): string {
  if (value == null || value === '') return '—'
  if (fieldName === 'website' && typeof value === 'string') return formatWebsite(value)
  return String(value)
}

/**
 * Truncated list cell for long text fields in Contact Submissions.
 */
export const CompactTextCell: React.FC<Props> = ({ cellData, field }) => {
  const fieldName = field?.name
  const text = formatText(cellData, fieldName)
  const maxWidth = fieldName ? (MAX_WIDTH[fieldName] ?? 120) : 120

  return (
    <span title={text === '—' ? undefined : text} style={compactStyle(maxWidth)}>
      {text}
    </span>
  )
}

export default CompactTextCell
