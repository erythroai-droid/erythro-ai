'use client'

import React, { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import SplashScreen from '@/components/SplashScreen'
import { markSplashDone, requestQuickSplash, shouldSkipSplashSurface } from '@/lib/splash'

export { shouldSkipSplashSurface }

/**
 * Site-wide splash host. Remounts splash on client-side route changes with a
 * quick (static logo) intro. Hard reloads resolve mode via sessionStorage.
 * Ads audit LPs, /audit, /order/* and paid ad clicks skip splash entirely so
 * mobile in-app browsers (Facebook/Instagram/Google Ads) show content immediately.
 */
export default function SplashHost() {
  const pathname = usePathname() || '/'
  const prevPath = useRef(pathname)
  const skipSplash = shouldSkipSplashSurface(pathname)

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
