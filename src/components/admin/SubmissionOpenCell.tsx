'use client'

import React from 'react'
import Link from 'next/link'

type Props = {
  rowData?: { id?: unknown }
  collectionSlug?: string
}

/**
 * Explicit "Open" action column for submission list rows.
 */
export const SubmissionOpenCell: React.FC<Props> = ({ rowData, collectionSlug }) => {
  const id = rowData?.id
  const slug = collectionSlug || 'contact-submissions'

  if (typeof id !== 'string' && typeof id !== 'number') return <span>—</span>

  return (
    <Link
      href={`/admin/collections/${slug}/${encodeURIComponent(String(id))}`}
      prefetch={false}
      style={{
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        textDecoration: 'underline',
        textUnderlineOffset: 2,
      }}
    >
      Open
    </Link>
  )
}

/** UI field placeholder — list uses Cell only. */
export const SubmissionOpenField: React.FC = () => null

export default SubmissionOpenCell
