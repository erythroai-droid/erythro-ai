import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CONTACT_MODAL_HREF,
  isContactModalHref,
  navigateCtaHref,
} from '@/lib/ctaNav'

describe('isContactModalHref', () => {
  it('recognizes modal targets', () => {
    expect(isContactModalHref(CONTACT_MODAL_HREF)).toBe(true)
    expect(isContactModalHref(' #Contact-Modal ')).toBe(true)
    expect(isContactModalHref('contact-modal')).toBe(true)
    expect(isContactModalHref('modal')).toBe(true)
  })

  it('rejects normal hrefs', () => {
    expect(isContactModalHref('#contacts')).toBe(false)
    expect(isContactModalHref('/portfolio')).toBe(false)
    expect(isContactModalHref(null)).toBe(false)
    expect(isContactModalHref('')).toBe(false)
  })
})

describe('navigateCtaHref', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('returns false for empty hrefs', () => {
    expect(navigateCtaHref('')).toBe(false)
    expect(navigateCtaHref('#')).toBe(false)
    expect(navigateCtaHref('   ')).toBe(false)
  })

  it('opens contact modal for modal hrefs', () => {
    const openContact = vi.fn()
    expect(navigateCtaHref('#contact-modal', { openContact })).toBe(true)
    expect(openContact).toHaveBeenCalledOnce()
  })

  it('delegates hash targets to onHash', () => {
    const onHash = vi.fn()
    expect(navigateCtaHref('#contacts', { onHash })).toBe(true)
    expect(onHash).toHaveBeenCalledWith('#contacts')
  })

  it('scrolls to in-page hash when element exists', () => {
    const el = document.createElement('div')
    el.id = 'contacts'
    el.scrollIntoView = vi.fn()
    document.body.appendChild(el)

    expect(navigateCtaHref('#contacts')).toBe(true)
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('returns false for missing hash targets', () => {
    expect(navigateCtaHref('#missing-section')).toBe(false)
  })

  it('signals nav start and assigns internal paths', () => {
    const assign = vi.fn()
    const onNavStart = vi.fn()
    window.addEventListener('erythro:nav-start', onNavStart)

    vi.stubGlobal('location', { ...window.location, assign })

    expect(navigateCtaHref('/portfolio')).toBe(true)
    expect(onNavStart).toHaveBeenCalledOnce()
    expect(assign).toHaveBeenCalledWith('/portfolio')

    expect(navigateCtaHref('services/ai-automation')).toBe(true)
    expect(assign).toHaveBeenCalledWith('/services/ai-automation')

    window.removeEventListener('erythro:nav-start', onNavStart)
  })

  it('assigns absolute and mail/tel links after signaling start', () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })

    expect(navigateCtaHref('https://example.com/x')).toBe(true)
    expect(assign).toHaveBeenCalledWith('https://example.com/x')

    expect(navigateCtaHref('mailto:hi@erythro.ai')).toBe(true)
    expect(assign).toHaveBeenCalledWith('mailto:hi@erythro.ai')
  })
})
