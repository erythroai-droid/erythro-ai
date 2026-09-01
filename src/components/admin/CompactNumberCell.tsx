'use client'

import React from 'react'

type Props = {
  cellData?: unknown
}

/**
 * Narrow numeric column (audit score).
 */
export const CompactNumberCell: React.FC<Props> = ({ cellData }) => {
  if (cellData == null || cellData === '') return <span>—</span>

  return (
    <span
      style={{
        display: 'inline-block',
        minWidth: 28,
        maxWidth: 40,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {String(cellData)}
    </span>
  )
}

export default CompactNumberCell
