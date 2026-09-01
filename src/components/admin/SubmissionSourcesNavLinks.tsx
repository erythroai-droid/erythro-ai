'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SUBMISSION_SOURCES_IN_NAV,
  submissionListHref,
} from '@/lib/contactSubmissionSources'
import { activeSubmissionSource } from './submissionAdminLinks'

/**
 * Sidebar shortcuts: one filtered Contact Submissions list per intake channel.
 */
export const SubmissionSourcesNavLinks: React.FC = () => {
  const pathname = usePathname()
  const [activeSource, setActiveSource] = useState<string | null>(null)

  useEffect(() => {
    const onCollection = pathname?.includes('/collections/contact-submissions')
    if (!onCollection || typeof window === 'undefined') {
      setActiveSource(null)
      return
    }
    setActiveSource(activeSubmissionSource(window.location.search))
  }, [pathname])

  return (
    <>
      {SUBMISSION_SOURCES_IN_NAV.map((source) => {
        const active = activeSource === source.id
        return (
          <Link
            key={source.id}
            className={`nav__link${active ? ' active' : ''}`}
            href={submissionListHref(source.id)}
            prefetch={false}
            title={source.description}
            {...(active ? { 'aria-current': 'page' as const } : {})}
          >
            <span className="nav__link-label">{source.navLabel}</span>
          </Link>
        )
      })}
    </>
  )
}

export default SubmissionSourcesNavLinks
