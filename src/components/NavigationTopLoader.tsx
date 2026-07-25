'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import NextTopLoader, { useTopLoader } from 'nextjs-toploader'

/** Same-origin navigations (hard or soft) can fire this to show the bar immediately. */
export const NAV_START_EVENT = 'erythro:nav-start'
export const NAV_DONE_EVENT = 'erythro:nav-done'

function TopLoaderBridge() {
  const loader = useTopLoader()
  const pathname = usePathname()
  const skipFirstPath = useRef(true)

  useEffect(() => {
    const onStart = () => {
      loader.start()
    }
    window.addEventListener(NAV_START_EVENT, onStart)
    return () => window.removeEventListener(NAV_START_EVENT, onStart)
  }, [loader])

  useEffect(() => {
    if (skipFirstPath.current) {
      skipFirstPath.current = false
      return
    }
    loader.done()
    window.dispatchEvent(new Event(NAV_DONE_EVENT))
  }, [pathname, loader])

  return null
}

/**
 * Thin brand progress bar at the top of the viewport during route changes.
 * Covers Next `<Link>` clicks; programmatic nav should use
 * `useRouter` from `nextjs-toploader/app` or dispatch `NAV_START_EVENT`.
 */
export default function NavigationTopLoader() {
  return (
    <>
      <NextTopLoader
        color="#E52421"
        height={2}
        showSpinner={false}
        crawl
        crawlSpeed={180}
        speed={200}
        easing="ease"
        shadow="0 0 10px #E52421,0 0 4px rgba(229,36,33,0.45)"
        zIndex={210}
        showForHashAnchor={false}
      />
      <TopLoaderBridge />
    </>
  )
}
