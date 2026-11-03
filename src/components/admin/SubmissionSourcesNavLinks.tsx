'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SUBMISSION_NAV_LINKS, type SubmissionNavId } from '@/lib/contactSubmissionSources'
import { activeSubmissionSource } from './submissionAdminLinks'

/**
 * Sidebar shortcuts: filtered Contact Submissions lists (audit vs leak split by leadChannel).
 */
export const SubmissionSourcesNavLinks: React.FC = () => {
  const pathname = usePathname()
  const [activeSource, setActiveSource] = useState<SubmissionNavId | null>(null)

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
      {SUBMISSION_NAV_LINKS.map((link) => {
        const active = activeSource === link.id
        return (
          <Link
            key={link.id}
            className={`nav__link${active ? ' active' : ''}`}
            href={link.href}
            prefetch={false}
            title={link.description}
            {...(active ? { 'aria-current': 'page' as const } : {})}
          >
            <span className="nav__link-label">{link.navLabel}</span>
          </Link>
        )
      })}
    </>
  )
}

export default SubmissionSourcesNavLinks
