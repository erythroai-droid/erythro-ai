/** Opens the site contact modal instead of navigating. */
export const CONTACT_MODAL_HREF = '#contact-modal'

export function isContactModalHref(href: string | null | undefined): boolean {
  const v = (href || '').trim().toLowerCase()
  return v === CONTACT_MODAL_HREF || v === 'contact-modal' || v === 'modal'
}

function signalNavStart() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('erythro:nav-start'))
}

/**
 * Navigate to a CTA href (hash scroll on the home page, otherwise full navigation).
 * Returns true if handled.
 */
export function navigateCtaHref(
  href: string,
  opts?: {
    openContact?: () => void
    /** Scroll/pin helpers for in-page anchors (navbar-style). */
    onHash?: (hash: string) => void
  },
): boolean {
  const raw = (href || '').trim()
  if (!raw || raw === '#') return false

  if (isContactModalHref(raw)) {
    opts?.openContact?.()
    return true
  }

  if (raw.startsWith('#')) {
    if (opts?.onHash) {
      opts.onHash(raw)
      return true
    }
    const id = raw.slice(1)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      return true
    }
    return false
  }

  if (/^https?:\/\//i.test(raw) || raw.startsWith('mailto:') || raw.startsWith('tel:')) {
    signalNavStart()
    window.location.assign(raw)
    return true
  }

  signalNavStart()
  window.location.assign(raw.startsWith('/') ? raw : `/${raw}`)
  return true
}
