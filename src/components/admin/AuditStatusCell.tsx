'use client'

import React from 'react'

type Row = {
  source?: unknown
  auditStatus?: unknown
}

const STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  new: { bg: 'var(--theme-elevation-100)', fg: 'var(--theme-elevation-800)', label: 'New' },
  in_progress: {
    bg: 'color-mix(in srgb, var(--theme-warning-500) 22%, transparent)',
    fg: 'var(--theme-warning-700, var(--theme-elevation-800))',
    label: 'In progress',
  },
  report_sent: {
    bg: 'color-mix(in srgb, var(--theme-success-500) 22%, transparent)',
    fg: 'var(--theme-success-700, var(--theme-elevation-800))',
    label: 'Report sent',
  },
  failed: {
    bg: 'color-mix(in srgb, var(--theme-error-500) 22%, transparent)',
    fg: 'var(--theme-error-500)',
    label: 'Failed',
  },
}

/**
 * List-view badge for auditStatus (AI Audit rows only).
 */
export const AuditStatusCell: React.FC<{ rowData?: Row; cellData?: unknown }> = ({
  rowData,
  cellData,
}) => {
  if (rowData?.source !== 'audit') return <span>—</span>

  const status = typeof cellData === 'string' ? cellData : String(rowData?.auditStatus || '')
  const style = STYLES[status]
  if (!style) return <span>{status || '—'}</span>

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
      {style.label}
    </span>
  )
}

export default AuditStatusCell
