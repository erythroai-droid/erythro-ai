import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  HOME_SCROLL_KEY,
  MID_PAGE_SCROLL_PX,
  SPLASH_MODE_KEY,
  requestQuickSplash,
  resolveSplashNavigation,
  resolveSplashMode,
} from '@/lib/splash'

describe('resolveSplashNavigation', () => {
  beforeEach(() => {
    sessionStorage.clear()
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })

  it('uses full splash at top of home', () => {
    expect(resolveSplashNavigation('/')).toEqual({ mode: 'full', scrollY: 0 })
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
  })
})
