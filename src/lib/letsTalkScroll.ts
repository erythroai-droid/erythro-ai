import { getSectionElement } from '@/lib/domSection'

/** Desktop Services pin listens for this to scrub to a fully revealed Let’s Talk. */
export const LETS_TALK_SCROLL_EVENT = 'erythro:scroll-to-lets-talk'

export type LetsTalkScrollDetail = {
  behavior?: ScrollBehavior
}

/**
 * Scroll to the Let’s Talk / contacts block.
 * Mobile uses the flow section; desktop asks the services pin to land with
 * the overlay fully open and copy settled.
 */
export function scrollToLetsTalk(opts?: LetsTalkScrollDetail): boolean {
  if (typeof window === 'undefined') return false

  const behavior = opts?.behavior ?? 'smooth'
  const isMobile = window.innerWidth < 1024

  if (isMobile) {
    const el = getSectionElement('contacts')
    if (!el) return false
    el.scrollIntoView({ behavior })
    return true
  }

  window.dispatchEvent(
    new CustomEvent<LetsTalkScrollDetail>(LETS_TALK_SCROLL_EVENT, {
      detail: { behavior },
    }),
  )
  return true
}
