import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  FULL_SPLASH_SEEN_KEY,
  HOME_SCROLL_KEY,
  MID_PAGE_SCROLL_PX,
  MOBILE_QUICK_SPLASH_MQ,
  SPLASH_MODE_KEY,
  requestQuickSplash,
  resolveSplashNavigation,
  resolveSplashMode,
} from '@/lib/splash'

function mockMatchMedia(mobile: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => ({
      matches: mobile ? query === MOBILE_QUICK_SPLASH_MQ : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('resolveSplashNavigation', () => {
  beforeEach(() => {
    sessionStorage.clear()
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    mockMatchMedia(false)
  })

  it('uses full splash at top of home on desktop', () => {
    expect(resolveSplashNavigation('/')).toEqual({ mode: 'full', scrollY: 0 })
    expect(sessionStorage.getItem(FULL_SPLASH_SEEN_KEY)).toBe('1')
  })

  it('uses quick splash on mobile home even on first visit', () => {
    mockMatchMedia(true)
    expect(resolveSplashNavigation('/')).toEqual({ mode: 'quick', scrollY: 0 })
    expect(sessionStorage.getItem(FULL_SPLASH_SEEN_KEY)).toBeNull()
  })

  it('still allows full splash on mobile when forced by logo click', () => {
    mockMatchMedia(true)
    sessionStorage.setItem(SPLASH_MODE_KEY, 'full')
    expect(resolveSplashNavigation('/')).toEqual({ mode: 'full', scrollY: 0 })
    expect(sessionStorage.getItem(FULL_SPLASH_SEEN_KEY)).toBe('1')
  })

  it('uses quick on desktop after full was already seen this session', () => {
    sessionStorage.setItem(FULL_SPLASH_SEEN_KEY, '1')
    expect(resolveSplashNavigation('/')).toEqual({ mode: 'quick', scrollY: 0 })
  })

  it('uses quick splash and restores scroll on mid-page home reload', () => {
    sessionStorage.setItem(HOME_SCROLL_KEY, '640')
    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true })

    expect(resolveSplashNavigation('/')).toEqual({ mode: 'quick', scrollY: 640 })
    expect(sessionStorage.getItem(HOME_SCROLL_KEY)).toBeNull()
  })

  it('uses live scrollY when above threshold and nothing stored', () => {
    Object.defineProperty(window, 'scrollY', {
      value: MID_PAGE_SCROLL_PX + 1,
      configurable: true,
    })

    expect(resolveSplashNavigation('/')).toEqual({
      mode: 'quick',
      scrollY: MID_PAGE_SCROLL_PX + 1,
    })
  })

  it('forced quick from client navigation never restores previous scrollY', () => {
    requestQuickSplash()
    Object.defineProperty(window, 'scrollY', { value: 1200, configurable: true })
    sessionStorage.setItem(HOME_SCROLL_KEY, '900')

    expect(resolveSplashNavigation('/portfolio')).toEqual({ mode: 'quick', scrollY: 0 })
    expect(sessionStorage.getItem(SPLASH_MODE_KEY)).toBeNull()
  })

  it('forced quick on home also starts at top (client route change)', () => {
    requestQuickSplash()
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true })

    expect(resolveSplashNavigation('/')).toEqual({ mode: 'quick', scrollY: 0 })
  })

  it('forced full always resets to top', () => {
    sessionStorage.setItem(SPLASH_MODE_KEY, 'full')
    sessionStorage.setItem(HOME_SCROLL_KEY, '400')
    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true })

    expect(resolveSplashNavigation('/')).toEqual({ mode: 'full', scrollY: 0 })
  })

  it('inner routes default to quick at top without force flag', () => {
    Object.defineProperty(window, 'scrollY', { value: 800, configurable: true })
    expect(resolveSplashNavigation('/services/ai-automation')).toEqual({
      mode: 'quick',
      scrollY: 0,
    })
  })

  it('resolveSplashMode mirrors mode only', () => {
    expect(resolveSplashMode('/portfolio')).toBe('quick')
    expect(resolveSplashMode('/')).toBe('full')
    mockMatchMedia(true)
    sessionStorage.clear()
    expect(resolveSplashMode('/')).toBe('quick')
  })
})
