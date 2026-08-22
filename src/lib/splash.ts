/** Shared splash lifecycle helpers for hero / motion intros. */

export type SplashMode = 'full' | 'quick'

export const HOME_SCROLL_KEY = 'erythro:home-scroll'
export const SPLASH_MODE_KEY = 'erythro:splash-mode'
/** After the first full intro this session, cold desktop home loads use quick splash. */
export const FULL_SPLASH_SEEN_KEY = 'erythro:full-splash-seen'

/** Mobile / tablet portrait: match hero `lg` breakpoint — auto splash stays quick. */
export const MOBILE_QUICK_SPLASH_MQ = '(max-width: 1023px)'

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

function markFullSplashSeen() {
  try {
    sessionStorage.setItem(FULL_SPLASH_SEEN_KEY, '1')
  } catch {
    // ignore
  }
}

function hasSeenFullSplash(): boolean {
  try {
    return sessionStorage.getItem(FULL_SPLASH_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

/** True below the `lg` breakpoint — cold loads skip the full draw (LCP). */
export function prefersMobileQuickSplash(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia(MOBILE_QUICK_SPLASH_MQ).matches
  } catch {
    return false
  }
}

/**
 * Resolve splash style + restored scroll for this navigation:
 * - `full` — animated draw (desktop first home this session, or forced by logo click)
 * - `quick` — red plate + finished logo (mobile always unless logo click; repeat desktop;
 *   mid-page reload; inner pages)
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

  // Logo click (and any forced full) — works on mobile and desktop.
  if (forced === 'full') {
    markFullSplashSeen()
    return { mode: 'full', scrollY: 0 }
  }
  // Client route changes set this flag — never carry the previous page's scrollY.
  if (forced === 'quick') return { mode: 'quick', scrollY: 0 }
  if (path !== '/') return { mode: 'quick', scrollY: 0 }
  if (scrollY > MID_PAGE_SCROLL_PX) return { mode: 'quick', scrollY }

  // Mobile: never auto-play the long draw — keeps first-visit LCP on the hero still.
  if (prefersMobileQuickSplash()) return { mode: 'quick', scrollY: 0 }

  // Desktop cold home at top: full once per session, then quick.
  if (hasSeenFullSplash()) return { mode: 'quick', scrollY: 0 }
  markFullSplashSeen()
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
