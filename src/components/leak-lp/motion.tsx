'use client'

import React, { useEffect, useRef, useState } from 'react'

/** True once the element has scrolled into view (one-shot). */
export function useInView<T extends Element>(rootMargin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, rootMargin])
  return [ref, inView] as const
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduced
}

/**
 * Plain wrapper. Blocks used to fade and rise on first view; that scroll animation was removed (20.11.2026),
 * so content is shown as is. `delay` is kept for call-site compatibility and ignored.
 */
export function Reveal({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'header'
}) {
  return React.createElement(Tag, { className: className || undefined }, children)
}

/** Animated number that counts up once visible. */
export function CountUp({
  to,
  format,
  duration = 1400,
  start = true,
}: {
  to: number
  format: (n: number) => string
  duration?: number
  start?: boolean
}) {
  const [val, setVal] = useState(0)
  const reduced = usePrefersReducedMotion()
  useEffect(() => {
    if (!start) return
    if (reduced) {
      setVal(to)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 4)
      setVal(to * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to, duration, start, reduced])
  return <span className="tabular-nums">{format(val)}</span>
}
