'use client'

import React, { useRef } from 'react'
import { usePathname } from 'next/navigation'
import SplashScreen from '@/components/SplashScreen'
import { requestQuickSplash } from '@/lib/splash'

/**
 * Site-wide splash host. Remounts splash on client-side route changes with a
 * quick (static logo) intro. Hard reloads resolve mode via sessionStorage.
 */
export default function SplashHost() {
  const pathname = usePathname() || '/'
  const prevPath = useRef(pathname)

  if (prevPath.current !== pathname) {
    requestQuickSplash()
    prevPath.current = pathname
  }

  return <SplashScreen key={pathname} />
}
