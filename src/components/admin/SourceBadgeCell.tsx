'use client'

import React from 'react'
import { submissionSourceDef, type ContactSubmissionSourceId } from '@/lib/contactSubmissionSources'

type Row = {
  source?: unknown
  leadChannel?: unknown
}

const FALLBACK_LABELS: Record<ContactSubmissionSourceId, string> = {
  contact: 'Contact',
  order: 'Solution',
  audit: 'AI Audit',
}

const STYLES: Record<ContactSubmissionSourceId | 'leak', { bg: string; fg: string }> = {
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
  leak: {
    bg: 'color-mix(in srgb, var(--theme-error-500, #e52421) 18%, transparent)',
    fg: 'var(--theme-error-700, #9f1239)',
  },
}

/**
 * List-view badge for contact-submissions.source (leak_calc → “Leak”).
 */
export const SourceBadgeCell: React.FC<{ rowData?: Row; cellData?: unknown }> = ({
  rowData,
  cellData,
}) => {
  const raw = typeof cellData === 'string' ? cellData : null
  const id =
    raw === 'contact' || raw === 'order' || raw === 'audit' ? raw : null
  if (!id) return <span>—</span>

  const isLeak = id === 'audit' && rowData?.leadChannel === 'leak_calc'
  const def = submissionSourceDef(id)
  const label = isLeak
    ? 'Leak'
    : (def?.navLabel.replace(/ Orders$| Inquiries$/, '') ?? FALLBACK_LABELS[id])
  const style = STYLES[isLeak ? 'leak' : id]

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
