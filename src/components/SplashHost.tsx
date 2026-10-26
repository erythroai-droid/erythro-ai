'use client'

import React, { Suspense, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import SplashScreen from '@/components/SplashScreen'
import {
  markSplashDone,
  requestQuickSplash,
  shouldSkipSplashSurface,
  sweepOrphanedSplashPlates,
} from '@/lib/splash'

export { shouldSkipSplashSurface }

/**
 * Site-wide splash host. Quick brand splash on home (all viewports) and on
 * organic inner routes on **desktop**. Mobile inner routes skip for LCP.
 * Ads LPs, /audit, /order/* and paid ad clicks always skip.
 *
 * Must pass `useSearchParams()` into {@link shouldSkipSplashSurface}: the layout
 * shell is ISR-static and SSR cannot see `?fbclid=`. Skipping only on the client
 * without matching SSR used to orphan `.splash-bg` on `<body>` (PIT-126).
 */
function SplashHostInner() {
  const pathname = usePathname() || '/'
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const prevPath = useRef(pathname)
  const skipSplash = shouldSkipSplashSurface(pathname, search ? `?${search}` : '')

  if (prevPath.current !== pathname) {
    if (!skipSplash) requestQuickSplash()
    prevPath.current = pathname
  }

  useEffect(() => {
    if (!skipSplash) return
    markSplashDone()
    sweepOrphanedSplashPlates()
  }, [skipSplash])

  if (skipSplash) return null

  return <SplashScreen key={pathname} />
}

export default function SplashHost() {
  return (
    <Suspense fallback={null}>
      <SplashHostInner />
    </Suspense>
  )
}
