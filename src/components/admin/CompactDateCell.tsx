'use client'

import React from 'react'

type Props = {
  cellData?: unknown
}

function formatDate(value: unknown): string {
  if (value == null || value === '') return '—'
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Short created/updated timestamp for compact list rows.
 */
export const CompactDateCell: React.FC<Props> = ({ cellData }) => {
  const text = formatDate(cellData)

  return (
    <span
      title={text === '—' ? undefined : text}
      style={{
        display: 'inline-block',
        maxWidth: 108,
        fontSize: 12,
        lineHeight: 1.35,
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {text}
    </span>
  )
}

export default CompactDateCell
