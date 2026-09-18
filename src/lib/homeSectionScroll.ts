import { getSectionElement } from '@/lib/domSection'
import { loadGsapAfterLcp } from '@/lib/gsapAfterLcp'
import { skipLetsTalkSettle } from '@/lib/letsTalkScroll'

const PIN_IDS: Record<string, string> = {
  cases: 'cases-pin',
  services: 'services-pin',
  solutions: 'solutions-pin',
}

type PinScrollTrigger = {
  getById: (id: string) => { start: number } | undefined
  refresh: () => void
}

function onHomePage(): boolean {
  const path = window.location.pathname
  return path === '/' || path === ''
}

function scrollIntoSection(sectionId: string, behavior: ScrollBehavior): void {
  const el = getSectionElement(sectionId) || document.getElementById(sectionId)
  el?.scrollIntoView({ behavior })
}

function scrollPinnedSection(
  ScrollTrigger: PinScrollTrigger,
  pinId: string,
  sectionId: string,
  behavior: ScrollBehavior,
  tries: number,
): void {
  const st = ScrollTrigger.getById(pinId)
  if (st) {
    window.scrollTo({ top: st.start, behavior })
    return
  }
  if (tries > 0) {
    requestAnimationFrame(() =>
      scrollPinnedSection(ScrollTrigger, pinId, sectionId, behavior, tries - 1),
    )
    return
  }
  scrollIntoSection(sectionId, behavior)
}

/**
 * Scroll to a home-page section the same way the navbar does.
 * Native `#solutions` hash jumps land in Let’s Talk because Solutions is
 * GSAP-pinned with `pinSpacing: false` — use the pin’s `start` instead.
 */
export function scrollToHomeSection(
  sectionId: string,
  behavior: ScrollBehavior = 'smooth',
): void {
  if (typeof window === 'undefined') return

  if (!onHomePage()) {
    window.dispatchEvent(new Event('erythro:nav-start'))
    window.location.assign(`/#${sectionId}`)
    return
  }

  history.replaceState(null, '', `/#${sectionId}`)

  const pinId = PIN_IDS[sectionId]
  if (pinId) {
    void loadGsapAfterLcp().then(({ ScrollTrigger }) => {
      // Body lock (`position:fixed`) stale-ifies pin start; refresh after unlock.
      ScrollTrigger.refresh()
      // Services pin clamps scroll at Let’s Talk until settle completes — skip
      // that gate or jumps to Solutions snap back to the red overlay.
      if (pinId === 'solutions-pin' && window.innerWidth >= 1024) {
        skipLetsTalkSettle()
      }
      requestAnimationFrame(() => {
        scrollPinnedSection(ScrollTrigger, pinId, sectionId, behavior, 24)
      })
    })
    return
  }

  scrollIntoSection(sectionId, behavior)
}

/** Overlay `useLockBodyScroll` restores `scrollY` on unlock — wait that out. */
export function scrollToHomeSectionAfterOverlay(
  sectionId: string,
  behavior: ScrollBehavior = 'auto',
): void {
  if (typeof window === 'undefined') return
  const started = performance.now()
  const tick = () => {
    const locked = document.documentElement.classList.contains('modal-open')
    if (!locked || performance.now() - started > 500) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToHomeSection(sectionId, behavior))
      })
      return
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
