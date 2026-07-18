'use client'

import { useEffect, useState, type RefObject } from 'react'

/**
 * Samples the page backdrop under a fixed control and returns whether it is dark.
 * Used so Menu / Scroll / Top stay readable without a solid plate
 * (mix-blend fails inside fixed stacking contexts).
 */
export function useBackdropContrast(
  ref: RefObject<HTMLElement | null>,
  theme: 'light' | 'dark',
  options?: { enabled?: boolean; skipWhen?: boolean },
): boolean {
  const enabled = options?.enabled !== false
  const skipWhen = Boolean(options?.skipWhen)
  const [overDarkBg, setOverDarkBg] = useState(theme === 'dark')

  useEffect(() => {
    if (!enabled) {
      setOverDarkBg(theme === 'dark')
      return
    }

    const parseRgb = (color: string) => {
      const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (!m) return null
      return {
        r: Number(m[1]) / 255,
        g: Number(m[2]) / 255,
        b: Number(m[3]) / 255,
        a: m[4] === undefined ? 1 : Number(m[4]),
      }
    }

    const luminance = (r: number, g: number, b: number) =>
      0.2126 * r + 0.7152 * g + 0.0722 * b

    const isDarkAtPoint = (x: number, y: number) => {
      const stack = document.elementsFromPoint(x, y)
      for (const el of stack) {
        if (!(el instanceof Element)) continue
        if (el.closest('header')) continue
        if (el.closest('[data-contrast-ignore]')) continue

        const tag = el.tagName
        if (tag === 'IMG' || tag === 'VIDEO' || tag === 'CANVAS') return true

        let node: Element | null = el
        while (node && node !== document.documentElement) {
          if (node instanceof HTMLElement && node.dataset.menuContrast) {
            return node.dataset.menuContrast === 'dark'
          }
          const style = getComputedStyle(node)
          const bg = parseRgb(style.backgroundColor)
          if (bg && bg.a >= 0.15) return luminance(bg.r, bg.g, bg.b) < 0.55
          if (style.backgroundImage && style.backgroundImage !== 'none') return true
          node = node.parentElement
        }
      }
      return theme === 'dark'
    }

    let raf = 0
    const update = () => {
      raf = 0
      if (skipWhen) {
        setOverDarkBg(true)
        return
      }
      const el = ref.current
      if (!el) {
        setOverDarkBg(theme === 'dark')
        return
      }
      const rect = el.getBoundingClientRect()
      const x = Math.min(window.innerWidth - 2, Math.max(1, rect.left + rect.width / 2))
      const y = Math.min(window.innerHeight - 2, Math.max(1, rect.top + rect.height / 2))
      setOverDarkBg(isDarkAtPoint(x, y))
    }

    const schedule = () => {
      if (raf) return
      raf = window.requestAnimationFrame(update)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [enabled, skipWhen, theme, ref])

  return overDarkBg
}
