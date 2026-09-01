'use client'

import React from 'react'
import Link from 'next/link'

type Props = {
  cellData?: unknown
  rowData?: { id?: unknown }
  collectionSlug?: string
  field?: { name?: string }
}

/**
 * List cell that opens the submission detail (edit) page.
 * Custom cells replace Payload's DefaultCell link wrapper — restore the link here.
 */
export const SubmissionNameCell: React.FC<Props> = ({ cellData, rowData, collectionSlug }) => {
  const id = rowData?.id
  const label = cellData == null || cellData === '' ? '—' : String(cellData)
  const slug = collectionSlug || 'contact-submissions'

  if (typeof id !== 'string' && typeof id !== 'number') {
    return (
      <span style={{ fontSize: 13, fontWeight: 600 }} title={label}>
        {label}
      </span>
    )
  }

  return (
    <Link
      href={`/admin/collections/${slug}/${encodeURIComponent(String(id))}`}
      prefetch={false}
      title={`Open ${label}`}
      style={{
        display: 'inline-block',
        maxWidth: 140,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'underline',
        textUnderlineOffset: 2,
      }}
    >
      {label}
    </Link>
  )
}

export default SubmissionNameCell
