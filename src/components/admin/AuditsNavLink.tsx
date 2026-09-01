'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AUDITS_LIST_HREF } from './auditAdminLinks'

/**
 * Sidebar shortcut to AI Audit submissions (filtered contact-submissions).
 */
export const AuditsNavLink: React.FC = () => {
  const pathname = usePathname()
  const [active, setActive] = useState(false)

  useEffect(() => {
    const onCollection = pathname?.includes('/collections/contact-submissions')
    const filtered =
      onCollection &&
      typeof window !== 'undefined' &&
      window.location.search.includes('where[source][equals]=audit')
    setActive(Boolean(filtered))
  }, [pathname])

  return (
    <Link
      className={`nav__link${active ? ' active' : ''}`}
      href={AUDITS_LIST_HREF}
      prefetch={false}
      {...(active ? { 'aria-current': 'page' as const } : {})}
    >
      <span className="nav__link-label">AI Audits</span>
    </Link>
  )
}

export default AuditsNavLink
