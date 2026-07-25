/** Shared splash lifecycle helpers for hero / motion intros. */

export type SplashMode = 'full' | 'quick'

export const HOME_SCROLL_KEY = 'erythro:home-scroll'
export const SPLASH_MODE_KEY = 'erythro:splash-mode'

/** Above this, a home reload is treated as mid-page. */
export const MID_PAGE_SCROLL_PX = 80

declare global {
  interface Window {
    __erythroSplashDone?: boolean
  }
}

export function readSavedScrollY(): number {
  let stored = 0
  try {
    const raw = sessionStorage.getItem(HOME_SCROLL_KEY)
    if (raw != null) {
      sessionStorage.removeItem(HOME_SCROLL_KEY)
      const n = Number(raw)
      if (Number.isFinite(n) && n > 0) stored = n
    }
  } catch {
    // ignore quota / private mode
  }
  if (typeof window === 'undefined') return stored
  return Math.max(window.scrollY, stored)
}

export function persistHomeScrollY() {
  try {
    sessionStorage.setItem(HOME_SCROLL_KEY, String(window.scrollY))
  } catch {
    // ignore
  }
}

/** Logo click: hard reload home at top with the full draw animation. */
export function navigateHomeWithFullSplash() {
  try {
    sessionStorage.setItem(SPLASH_MODE_KEY, 'full')
    sessionStorage.setItem(HOME_SCROLL_KEY, '0')
  } catch {
    // ignore
  }
  window.location.assign('/')
}

/**
 * Resolve splash style + restored scroll for this navigation:
 * - `full` — animated draw (home at top, or forced by logo click)
 * - `quick` — red plate + finished logo (mid-page reload, inner pages)
 */
export function resolveSplashNavigation(pathname: string): {
  mode: SplashMode
  scrollY: number
} {
  let forced: SplashMode | null = null
  try {
    const raw = sessionStorage.getItem(SPLASH_MODE_KEY)
    if (raw === 'full' || raw === 'quick') {
      sessionStorage.removeItem(SPLASH_MODE_KEY)
      forced = raw
    }
  } catch {
    // ignore
  }

  const scrollY = readSavedScrollY()
  const path = pathname.split('?')[0] || '/'

  if (forced === 'full') return { mode: 'full', scrollY: 0 }
  if (forced === 'quick') return { mode: 'quick', scrollY }
  if (path !== '/') return { mode: 'quick', scrollY: 0 }
  if (scrollY > MID_PAGE_SCROLL_PX) return { mode: 'quick', scrollY }
  return { mode: 'full', scrollY: 0 }
}

/** @deprecated Prefer resolveSplashNavigation */
export function resolveSplashMode(pathname: string): SplashMode {
  return resolveSplashNavigation(pathname).mode
}

/** Request a quick splash on the next client-side route change. */
export function requestQuickSplash() {
  try {
    sessionStorage.setItem(SPLASH_MODE_KEY, 'quick')
  } catch {
    // ignore
  }
}

export function markSplashDone() {
  if (typeof window === 'undefined') return
  window.__erythroSplashDone = true
  window.dispatchEvent(new Event('erythro:splash-done'))
}

export function resetSplashDone() {
  if (typeof window === 'undefined') return
  window.__erythroSplashDone = false
}

/** Resolves when the brand splash is gone (event, DOM, or flag). */
export function waitForSplashDone(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.__erythroSplashDone) return Promise.resolve()

  const splashVisible = () => Boolean(document.querySelector('.splash-bg'))

  if (splashVisible()) {
    return new Promise((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        window.__erythroSplashDone = true
        window.removeEventListener('erythro:splash-done', finish)
        observer.disconnect()
        window.clearTimeout(fallback)
        resolve()
      }

      window.addEventListener('erythro:splash-done', finish)

      const observer = new MutationObserver(() => {
        if (!splashVisible()) finish()
      })
      observer.observe(document.body, { childList: true, subtree: true })

      const fallback = window.setTimeout(finish, 10000)
    })
  }

  // Splash may not have committed yet (child useEffect vs parent layout).
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      if (window.__erythroSplashDone) {
        resolve()
        return
      }
      if (splashVisible()) {
        void waitForSplashDone().then(resolve)
        return
      }
      window.__erythroSplashDone = true
      resolve()
    })
  })
}
