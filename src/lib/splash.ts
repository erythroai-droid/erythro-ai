import { auditLpLocaleFromHost } from '@/lib/auditLp'

/** Shared splash lifecycle helpers for hero / motion intros. */

export type SplashMode = 'full' | 'quick'

export const HOME_SCROLL_KEY = 'erythro:home-scroll'
export const SPLASH_MODE_KEY = 'erythro:splash-mode'
/** Set when a forced full intro runs (logo click). Cold home no longer auto-plays full. */
export const FULL_SPLASH_SEEN_KEY = 'erythro:full-splash-seen'

/** Mobile / tablet portrait: match hero `lg` breakpoint (tests / callers). */
export const MOBILE_QUICK_SPLASH_MQ = '(max-width: 1023px)'

/** Above this, a home reload is treated as mid-page. */
export const MID_PAGE_SCROLL_PX = 80

declare global {
  interface Window {
    __erythroSplashDone?: boolean
  }
}

/** `<html data-…>` set by {@link SPLASH_SKIP_BOOTSTRAP_SCRIPT} before paint (PIT-117 / PIT-126). */
export const SPLASH_SKIP_HTML_ATTR = 'data-erythro-skip-splash'

/**
 * Inline bootstrap: hide / mark splash done before first paint when splash must
 * not show. Covers: any non-home path, paid-ad clicks, conversion/LP surfaces.
 * The layout shell is ISR-static and cannot see `?fbclid=` at SSR — without this,
 * React hydrates `skip=true` over an SSR splash plate and can orphan `.splash-bg`
 * on `<body>` (solid red forever). Path skips also run here so cold loads of
 * inner pages never flash the plate before hydration.
 */
export const SPLASH_SKIP_BOOTSTRAP_SCRIPT = `(function(){try{var path=(location.pathname||'/').split('?')[0]||'/';var host=(location.hostname||'').toLowerCase();var q=location.search||'';var paid=/[?&](fbclid|gclid|gbraid|wbraid|utm_source|utm_campaign|utm_medium)=/.test(q);var conv=path==='/audit'||path.indexOf('/audit/')===0||path.indexOf('/order/')===0;var lp=path.indexOf('/lp/audit/')===0||/^audit-[a-z0-9-]+\\.erythro\\.ai$/.test(host);var inner=path!=='/';if(!(paid||conv||lp||inner))return;document.documentElement.setAttribute('${SPLASH_SKIP_HTML_ATTR}','1');window.__erythroSplashDone=true}catch(e){}})();`

/**
 * Returns true when the full-screen brand splash should be skipped entirely:
 * - Any path other than `/` (home keeps splash; inner pages open content immediately)
 * - `/lp/audit/*` and `audit-*.erythro.ai` (also covered by non-home, host covers `/`)
 * - `/audit` and `/order/*` conversion pages
 * - Any landing URL with paid ad click parameters (`fbclid`, `gclid`, `gbraid`, `wbraid`, `utm_*`)
 */
export function shouldSkipSplashSurface(
  pathname: string,
  search?: string,
  hostname?: string,
): boolean {
  const cleanPath = (pathname || '/').split('?')[0] || '/'
  // Home only — brand intro. All other routes skip for LCP / mobile speed.
  if (cleanPath !== '/') return true
  const host = hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '')
  if (host && auditLpLocaleFromHost(host) != null) return true

  // Prefer the explicit search argument (SplashHost + useSearchParams). Fall back
  // to window only when the caller omitted it — never treat `''` as “unknown”.
  const rawSearch =
    search !== undefined
      ? search
      : typeof window !== 'undefined'
        ? window.location.search
        : ''
  if (rawSearch) {
    try {
      const sp = new URLSearchParams(
        rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch,
      )
      if (
        sp.has('fbclid') ||
        sp.has('gclid') ||
        sp.has('gbraid') ||
        sp.has('wbraid') ||
        sp.has('utm_source') ||
        sp.has('utm_campaign') ||
        sp.has('utm_medium')
      ) {
        return true
      }
    } catch {
      // ignore URLSearchParams parse errors
    }
  }
  return false
}

/** Remove any leftover SSR splash plates (hydration mismatch orphans). */
export function sweepOrphanedSplashPlates() {
  if (typeof document === 'undefined') return
  document.querySelectorAll('.splash-bg').forEach((el) => {
    el.remove()
  })
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

/** True below the `lg` breakpoint. */
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
 * - `full` — animated draw only when forced by logo click (`navigateHomeWithFullSplash`)
 * - `quick` — red plate + finished logo (default cold home, mid-page reload, client nav).
 *   Inner pages skip splash in SplashHost — this helper is only consulted when
 *   SplashScreen mounts (home).
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
  // Defensive: SplashHost skips non-home; if mounted anyway, stay quick.
  if (path !== '/') return { mode: 'quick', scrollY: 0 }
  if (scrollY > MID_PAGE_SCROLL_PX) return { mode: 'quick', scrollY }

  // Cold home at top: always quick (mobile + desktop). Full only via logo force above.
  return { mode: 'quick', scrollY: 0 }
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
