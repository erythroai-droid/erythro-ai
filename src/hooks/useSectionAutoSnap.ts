'use client'

import { useEffect } from 'react'
import { waitForSplashDone } from '@/lib/splash'

const MOBILE_MQ = '(max-width: 1023px)'
const REDUCED_MQ = '(prefers-reduced-motion: reduce)'
/** Section top at or above this fraction of the viewport → ~30% visible. */
const TRIGGER_RATIO = 0.7
/** Ignore if already this close to the top (px). */
const TOP_EPSILON = 12
const SETTLE_EPS = 4
const SNAP_TIMEOUT_MS = 1200

/** Pause auto-snap while a programmatic scroll (e.g. Hero → Let’s Talk) is in flight. */
export const SNAP_SUSPEND_EVENT = 'erythro:snap-suspend'

export function suspendSectionAutoSnap(ms = 1800) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SNAP_SUSPEND_EVENT, { detail: { ms } }))
}

/**
 * Mobile-only: when scrolling down and ~30% of a section enters the viewport,
 * smoothly scroll so the section top aligns with the viewport top.
 * Disabled on desktop (GSAP pins), during splash, and with reduced motion.
 */
export function useSectionAutoSnap(sectionIds: readonly string[]) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false
    let active = false
    let snapping = false
    let suspendUntil = 0
    let lastY = window.scrollY
    let raf = 0
    let unlockTimer = 0
    const snapped = new Set<string>()

    const mobileMq = window.matchMedia(MOBILE_MQ)
    const reducedMq = window.matchMedia(REDUCED_MQ)

    const isEnabled = () =>
      mobileMq.matches &&
      !reducedMq.matches &&
      active &&
      !snapping &&
      Date.now() >= suspendUntil

    const unlock = () => {
      snapping = false
      if (unlockTimer) {
        window.clearTimeout(unlockTimer)
        unlockTimer = 0
      }
    }

    const snapTo = (id: string, el: HTMLElement) => {
      const top = el.getBoundingClientRect().top + window.scrollY
      snapping = true
      snapped.add(id)
      window.scrollTo({ top, behavior: 'smooth' })

      const onSettle = () => {
        if (cancelled) return
        if (Math.abs(window.scrollY - top) <= SETTLE_EPS) {
          window.removeEventListener('scroll', onSettle)
          unlock()
          lastY = window.scrollY
          return
        }
      }
      window.addEventListener('scroll', onSettle, { passive: true })
      unlockTimer = window.setTimeout(() => {
        window.removeEventListener('scroll', onSettle)
        unlock()
        lastY = window.scrollY
      }, SNAP_TIMEOUT_MS)
    }

    const tick = () => {
      raf = 0
      if (!isEnabled()) return

      const y = window.scrollY
      const goingDown = y > lastY + 0.5
      const goingUp = y < lastY - 0.5
      lastY = y

      const vh = window.innerHeight
      const triggerY = vh * TRIGGER_RATIO

      if (goingUp) {
        for (const id of sectionIds) {
          const el = document.getElementById(id)
          if (!el) continue
          const top = el.getBoundingClientRect().top
          // Allow re-snap next time this section approaches from below.
          if (top > triggerY) snapped.delete(id)
        }
        return
      }

      if (!goingDown) return

      for (const id of sectionIds) {
        if (snapped.has(id)) continue
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top > TOP_EPSILON && top <= triggerY) {
          snapTo(id, el)
          break
        }
      }
    }

    const onScroll = () => {
      if (raf) return
      raf = window.requestAnimationFrame(tick)
    }

    const onSuspend = (event: Event) => {
      const ms = (event as CustomEvent<{ ms?: number }>).detail?.ms ?? 1800
      suspendUntil = Date.now() + ms
      unlock()
      // Treat sections already above the trigger as visited so we don't yank back.
      const triggerY = window.innerHeight * TRIGGER_RATIO
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= triggerY) snapped.add(id)
      }
      lastY = window.scrollY
    }

    const syncActive = () => {
      // Re-evaluate after breakpoint / motion preference changes.
      if (!mobileMq.matches || reducedMq.matches) {
        unlock()
        snapped.clear()
      }
    }

    let removeListeners: (() => void) | null = null

    const start = () => {
      if (cancelled) return
      active = true
      lastY = window.scrollY
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener(SNAP_SUSPEND_EVENT, onSuspend)
      mobileMq.addEventListener('change', syncActive)
      reducedMq.addEventListener('change', syncActive)
      removeListeners = () => {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener(SNAP_SUSPEND_EVENT, onSuspend)
        mobileMq.removeEventListener('change', syncActive)
        reducedMq.removeEventListener('change', syncActive)
      }
    }

    void waitForSplashDone().then(start)

    return () => {
      cancelled = true
      active = false
      unlock()
      if (raf) window.cancelAnimationFrame(raf)
      removeListeners?.()
    }
  }, [sectionIds])
}
