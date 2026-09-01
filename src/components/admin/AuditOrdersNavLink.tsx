'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Filtered Plans list: kind = audit */
export const AUDIT_ORDERS_LIST_HREF =
  '/admin/collections/solution-plans?where[kind][equals]=audit'

/**
 * Sidebar shortcut to AI Audit order plans (solution-plans with kind=audit).
 */
export const AuditOrdersNavLink: React.FC = () => {
  const pathname = usePathname()
  const [active, setActive] = useState(false)

  useEffect(() => {
    const onCollection = pathname?.includes('/collections/solution-plans')
    const filtered =
      onCollection &&
      typeof window !== 'undefined' &&
      window.location.search.includes('where[kind][equals]=audit')
    setActive(Boolean(filtered))
  }, [pathname])

  return (
    <Link
      className={`nav__link${active ? ' active' : ''}`}
      href={AUDIT_ORDERS_LIST_HREF}
      prefetch={false}
      {...(active ? { 'aria-current': 'page' as const } : {})}
    >
      <span className="nav__link-label">Audit Orders</span>
    </Link>
  )
}

export default AuditOrdersNavLink
