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

/** Fade + rise on first view. `delay` in ms. */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'header'
}) {
  const [ref, inView] = useInView<HTMLDivElement>()
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      data-in={inView ? '' : undefined}
      className={`lk-reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
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
