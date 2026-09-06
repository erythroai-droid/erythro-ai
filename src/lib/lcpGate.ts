import { waitForSplashDone } from '@/lib/splash'

/**
 * Lab/CWV gate: do not start heavy hero motion (GSAP / HeroMotionText chunk)
 * until LCP has had a chance to paint (PIT-059).
 */

export function waitForLcp(timeoutMs = 4000): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  try {
    const entries = performance.getEntriesByType(
      'largest-contentful-paint',
    ) as PerformanceEntry[]
    if (entries.length > 0) return Promise.resolve()
  } catch {
    /* ignore */
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      try {
        observer?.disconnect()
      } catch {
        /* ignore */
      }
      window.clearTimeout(timer)
      resolve()
    }

    let observer: PerformanceObserver | null = null
    try {
      observer = new PerformanceObserver((list) => {
        if (list.getEntries().length > 0) finish()
      })
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {
      finish()
      return
    }

    const timer = window.setTimeout(finish, timeoutMs)
  })
}

export function waitForIdle(timeoutMs = 1200): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  return new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      resolve()
    }
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => done(), { timeout: timeoutMs })
      return
    }
    window.setTimeout(done, Math.min(200, timeoutMs))
  })
}

/** Splash gone → LCP observed (or timeout) → short idle. */
export async function waitForPostLcpMotion(): Promise<void> {
  await waitForSplashDone()
  await waitForLcp(4000)
  await waitForIdle(1200)
}
