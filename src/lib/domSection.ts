/**
 * Resolve a section by id, preferring the currently visible element.
 * Home uses `contacts` (desktop) + `contacts-mobile` (mobile) to avoid duplicate ids.
 */
export function getSectionElement(id: string): HTMLElement | null {
  const candidates = [document.getElementById(id), document.getElementById(`${id}-mobile`)]

  const isVisible = (el: HTMLElement | null): el is HTMLElement => {
    if (!el) return false
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    return el.getClientRects().length > 0
  }

  for (const el of candidates) {
    if (isVisible(el)) return el
  }
  return candidates.find((el): el is HTMLElement => el != null) ?? null
}
