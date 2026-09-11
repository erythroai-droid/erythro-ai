import { useEffect } from 'react'

/**
 * Lock document scroll while a modal is open (iOS-safe).
 * `overflow: hidden` on body alone still rubber-bands; position:fixed + restore scrollY.
 */
export function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) return

    const html = document.documentElement
    const body = document.body
    const scrollY = window.scrollY
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
    }

    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    html.classList.add('modal-open')

    const onTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('[data-modal-scroll]')) return
      e.preventDefault()
    }
    document.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      document.removeEventListener('touchmove', onTouchMove)
      html.style.overflow = prev.htmlOverflow
      html.style.overscrollBehavior = prev.htmlOverscroll
      body.style.overflow = prev.bodyOverflow
      body.style.position = prev.bodyPosition
      body.style.top = prev.bodyTop
      body.style.left = prev.bodyLeft
      body.style.right = prev.bodyRight
      body.style.width = prev.bodyWidth
      html.classList.remove('modal-open')
      window.scrollTo(0, scrollY)
    }
  }, [locked])
}
