'use client'

/** Pause auto-snap while a programmatic scroll (e.g. Hero → Let’s Talk) is in flight. */
export const SNAP_SUSPEND_EVENT = 'erythro:snap-suspend'

export function suspendSectionAutoSnap(ms = 1800) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SNAP_SUSPEND_EVENT, { detail: { ms } }))
}

/**
 * Formerly snapped mobile scroll to section tops. Disabled — free native scroll on mobile.
 * Hook kept as a no-op so call sites / tests can stay without churn.
 */
export function useSectionAutoSnap(_sectionIds: readonly string[]) {
  // no-op
}
