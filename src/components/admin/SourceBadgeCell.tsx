'use client'

import React from 'react'
import { submissionSourceDef, type ContactSubmissionSourceId } from '@/lib/contactSubmissionSources'

type Row = {
  source?: unknown
}

const FALLBACK_LABELS: Record<ContactSubmissionSourceId, string> = {
  contact: 'Contact',
  order: 'Solution',
  audit: 'AI Audit',
}

const STYLES: Record<ContactSubmissionSourceId, { bg: string; fg: string }> = {
  contact: {
    bg: 'var(--theme-elevation-100)',
    fg: 'var(--theme-elevation-800)',
  },
  order: {
    bg: 'color-mix(in srgb, var(--theme-success-500) 18%, transparent)',
    fg: 'var(--theme-success-700, var(--theme-elevation-800))',
  },
  audit: {
    bg: 'color-mix(in srgb, var(--theme-warning-500) 22%, transparent)',
    fg: 'var(--theme-warning-700, var(--theme-elevation-800))',
  },
}

/**
 * List-view badge for contact-submissions.source.
 */
export const SourceBadgeCell: React.FC<{ rowData?: Row; cellData?: unknown }> = ({
  cellData,
}) => {
  const raw = typeof cellData === 'string' ? cellData : null
  const id =
    raw === 'contact' || raw === 'order' || raw === 'audit' ? raw : null
  if (!id) return <span>—</span>

  const def = submissionSourceDef(id)
  const label = def?.navLabel.replace(/ Orders$| Inquiries$/, '') ?? FALLBACK_LABELS[id]
  const style = STYLES[id]

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.4,
        background: style.bg,
        color: style.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

export default SourceBadgeCell
