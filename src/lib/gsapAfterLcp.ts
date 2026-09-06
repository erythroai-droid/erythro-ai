/**
 * Load GSAP/ScrollTrigger only after splash + LCP + idle (PIT-061 / PIT-062).
 * Keeps section HTML in the first paint (no CLS) while deferring the heavy JS.
 */

import { waitForPostLcpMotion } from '@/lib/lcpGate'

type GsapBundle = {
  gsap: typeof import('gsap').gsap
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger
}

let bundlePromise: Promise<GsapBundle> | null = null

export function loadGsapAfterLcp(): Promise<GsapBundle> {
  if (!bundlePromise) {
    bundlePromise = (async () => {
      await waitForPostLcpMotion()
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      gsap.registerPlugin(ScrollTrigger)
      return { gsap, ScrollTrigger }
    })()
  }
  return bundlePromise
}
