'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

/**
 * Injects compact table layout for Contact Submissions list views.
 */
export const SubmissionsListStyles: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()
  const isSubmissionsList = pathname?.includes('/collections/contact-submissions')

  return (
    <>
      {isSubmissionsList ? (
        <style>{`
          .collection-list table,
          .collection-list__tables table {
            table-layout: fixed;
            width: 100%;
          }

          .collection-list th,
          .collection-list td,
          .collection-list__tables th,
          .collection-list__tables td {
            padding-inline: 8px;
            vertical-align: middle;
          }
        `}</style>
      ) : null}
      {children}
    </>
  )
}

export default SubmissionsListStyles
