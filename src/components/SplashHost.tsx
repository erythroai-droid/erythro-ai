'use client'

import React, { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import SplashScreen from '@/components/SplashScreen'
import { auditLpLocaleFromHost, auditLpLocaleFromPathname } from '@/lib/auditLp'
import { markSplashDone, requestQuickSplash } from '@/lib/splash'

function isAuditLpSurface(pathname: string): boolean {
  if (auditLpLocaleFromPathname(pathname)) return true
  if (typeof window === 'undefined') return false
  return auditLpLocaleFromHost(window.location.hostname) != null
}

/**
 * Site-wide splash host. Remounts splash on client-side route changes with a
 * quick (static logo) intro. Hard reloads resolve mode via sessionStorage.
 * Ads audit LPs skip splash entirely (Final URL must show the form immediately).
 */
export default function SplashHost() {
  const pathname = usePathname() || '/'
  const prevPath = useRef(pathname)
  const skipSplash = isAuditLpSurface(pathname)

  if (prevPath.current !== pathname) {
    if (!skipSplash) requestQuickSplash()
    prevPath.current = pathname
  }

  useEffect(() => {
    if (skipSplash) markSplashDone()
  }, [skipSplash])

  if (skipSplash) return null

  return <SplashScreen key={pathname} />
}
