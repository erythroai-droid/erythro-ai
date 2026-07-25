/** Shared splash lifecycle helpers for hero / motion intros. */

declare global {
  interface Window {
    __erythroSplashDone?: boolean
  }
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
  // Wait a frame before treating “no splash node” as “splash already skipped”.
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
