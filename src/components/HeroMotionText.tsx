'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface HeroMotionTextProps {
  phrases: string[]
  className?: string
  theme?: 'light' | 'dark'
  /** How long the first phrase stays after splash ends. */
  holdAfterSplash?: number
}

declare global {
  interface Window {
    __erythroSplashDone?: boolean
  }
}

/** Resolves when the brand splash is gone (event, DOM, or flag). */
function waitForSplashDone(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.__erythroSplashDone) return Promise.resolve()
  if (!document.querySelector('.splash-bg')) {
    window.__erythroSplashDone = true
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.__erythroSplashDone = true
      window.removeEventListener('erythro:splash-done', finish)
      observer.disconnect()
      window.clearTimeout(fallback)
      resolve()
    }

    window.addEventListener('erythro:splash-done', finish)

    const observer = new MutationObserver(() => {
      if (!document.querySelector('.splash-bg')) finish()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const fallback = window.setTimeout(finish, 10000)
  })
}

function tweenTo(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
): Promise<void> {
  return new Promise((resolve) => {
    gsap.to(targets, {
      ...vars,
      onComplete: resolve,
    })
  })
}

type MotionStyle = 0 | 1 | 2 | 3

type PlateMetrics = {
  textLeft: number
  textWidth: number
  textRight: number
  viewLeft: number
  viewRight: number
}

function resetPlateLayout(plate: HTMLElement) {
  plate.style.left = ''
  plate.style.right = ''
  plate.style.width = ''
}

function getPlateMetrics(root: HTMLElement, textEl: HTMLElement): PlateMetrics {
  const rootRect = root.getBoundingClientRect()
  const textRect = textEl.getBoundingClientRect()
  const padX = window.matchMedia('(min-width: 1024px)').matches
    ? 40
    : window.matchMedia('(min-width: 768px)').matches
      ? 32
      : window.matchMedia('(min-width: 640px)').matches
        ? 20
        : 12
  const textLeft = textRect.left - rootRect.left - padX
  const textRight = textRect.right - rootRect.left + padX
  return {
    textLeft,
    textRight,
    textWidth: textRight - textLeft,
    viewLeft: -rootRect.left,
    viewRight: -rootRect.left + window.innerWidth,
  }
}

function preparePlate(
  plate: HTMLElement,
  style: MotionStyle,
  metrics?: PlateMetrics,
) {
  switch (style) {
    case 0: // Expand from center (text-width plate)
      resetPlateLayout(plate)
      gsap.set(plate, {
        x: 0,
        scaleX: 0,
        scaleY: 1,
        opacity: 1,
        transformOrigin: '50% 50%',
      })
      break
    case 1: // From left: leading edge first, trailing catches up
      if (!metrics) break
      gsap.set(plate, {
        x: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        left: metrics.viewLeft,
        width: 0,
        right: 'auto',
      })
      break
    case 2: // Grow vertically
      resetPlateLayout(plate)
      gsap.set(plate, {
        x: 0,
        scaleX: 1,
        scaleY: 0,
        opacity: 1,
        transformOrigin: '50% 50%',
      })
      break
    case 3: // From right: leading edge first, trailing catches up
      if (!metrics) break
      gsap.set(plate, {
        x: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        left: metrics.viewRight,
        width: 0,
        right: 'auto',
      })
      break
  }
}

async function animatePlateIn(
  plate: HTMLElement,
  style: MotionStyle,
  metrics?: PlateMetrics,
): Promise<void> {
  switch (style) {
    case 0:
      await tweenTo(plate, {
        scaleX: 1,
        duration: 0.55,
        ease: 'power3.inOut',
      })
      return
    case 1:
      if (!metrics) return
      // 1) Leading (right) edge stretches to the end of the text
      await tweenTo(plate, {
        width: metrics.textRight - metrics.viewLeft,
        duration: 0.5,
        ease: 'power3.out',
      })
      // 2) Trailing (left) edge pulls in under the text
      await tweenTo(plate, {
        left: metrics.textLeft,
        width: metrics.textWidth,
        duration: 0.4,
        ease: 'power2.inOut',
      })
      return
    case 2:
      await tweenTo(plate, {
        scaleY: 1,
        duration: 0.45,
        ease: 'power3.out',
      })
      return
    case 3:
      if (!metrics) return
      // 1) Leading (left) edge stretches to the start of the text
      await tweenTo(plate, {
        left: metrics.textLeft,
        width: metrics.viewRight - metrics.textLeft,
        duration: 0.5,
        ease: 'power3.out',
      })
      // 2) Trailing (right) edge pulls in under the text
      await tweenTo(plate, {
        width: metrics.textWidth,
        duration: 0.4,
        ease: 'power2.inOut',
      })
      return
  }
}

async function animatePlateOut(
  plate: HTMLElement,
  style: MotionStyle,
  metrics?: PlateMetrics,
): Promise<void> {
  switch (style) {
    case 0:
      await tweenTo(plate, {
        scaleX: 0,
        duration: 0.4,
        ease: 'power2.in',
      })
      return
    case 1:
      if (!metrics) return
      // Exit toward the opposite (right) side
      await tweenTo(plate, {
        width: metrics.viewRight - metrics.textLeft,
        duration: 0.35,
        ease: 'power2.inOut',
      })
      await tweenTo(plate, {
        left: metrics.viewRight,
        width: 0,
        duration: 0.4,
        ease: 'power2.in',
      })
      return
    case 2:
      await tweenTo(plate, {
        scaleY: 0,
        duration: 0.35,
        ease: 'power2.in',
      })
      return
    case 3:
      if (!metrics) return
      // Exit toward the opposite (left) side
      await tweenTo(plate, {
        left: metrics.viewLeft,
        width: metrics.textRight - metrics.viewLeft,
        duration: 0.35,
        ease: 'power2.inOut',
      })
      await tweenTo(plate, {
        width: 0,
        duration: 0.4,
        ease: 'power2.in',
      })
      return
  }
}

function prepareEntrance(chars: HTMLElement[], style: MotionStyle) {
  switch (style) {
    case 0:
      gsap.set(chars, { y: 28, opacity: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' })
      break
    case 1:
      gsap.set(chars, { y: -28, opacity: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' })
      break
    case 2:
      gsap.set(chars, { y: 0, opacity: 0, scale: 0.4, rotateX: 0, filter: 'blur(0px)' })
      break
    case 3:
      gsap.set(chars, { y: 10, opacity: 0, scale: 1, rotateX: 55, filter: 'blur(6px)' })
      break
  }
}

function animateEntrance(chars: HTMLElement[], style: MotionStyle): Promise<void> {
  switch (style) {
    case 0:
      return tweenTo(chars, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.028,
        ease: 'power3.out',
      })
    case 1:
      return tweenTo(chars, {
        y: 0,
        opacity: 1,
        duration: 0.48,
        stagger: { each: 0.026, from: 'end' },
        ease: 'power2.out',
      })
    case 2:
      return tweenTo(chars, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: { each: 0.022, from: 'center' },
        ease: 'back.out(1.6)',
      })
    case 3:
      return tweenTo(chars, {
        y: 0,
        opacity: 1,
        rotateX: 0,
        filter: 'blur(0px)',
        duration: 0.58,
        stagger: 0.02,
        ease: 'power3.out',
      })
  }
}

function animateExit(chars: HTMLElement[], style: MotionStyle): Promise<void> {
  switch (style) {
    case 0:
      return tweenTo(chars, {
        y: -20,
        opacity: 0,
        duration: 0.32,
        stagger: 0.016,
        ease: 'power2.in',
      })
    case 1:
      return tweenTo(chars, {
        y: 20,
        opacity: 0,
        duration: 0.32,
        stagger: { each: 0.016, from: 'end' },
        ease: 'power2.in',
      })
    case 2:
      return tweenTo(chars, {
        scale: 0.45,
        opacity: 0,
        duration: 0.3,
        stagger: { each: 0.014, from: 'edges' },
        ease: 'power2.in',
      })
    case 3:
      return tweenTo(chars, {
        y: -8,
        opacity: 0,
        rotateX: -40,
        filter: 'blur(5px)',
        duration: 0.36,
        stagger: 0.014,
        ease: 'power2.in',
      })
  }
}

/**
 * Cycles hero phrases: plate reveals first, then text appears on it.
 */
export default function HeroMotionText({
  phrases,
  className = '',
  theme = 'dark',
  holdAfterSplash = 1.8,
}: HeroMotionTextProps) {
  const textRef = useRef<HTMLSpanElement>(null)
  const plateRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const phrasesKey = phrases.join('\u0001')
  const isLight = theme === 'light'

  useEffect(() => {
    const textEl = textRef.current
    const plateEl = plateRef.current
    const rootEl = rootRef.current
    const list = phrasesKey.split('\u0001').filter(Boolean)
    if (!textEl || !plateEl || list.length === 0) return

    if (rootEl) {
      rootEl.style.perspective = '800px'
      textEl.style.transformStyle = 'preserve-3d'
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced || list.length < 2) {
      textEl.textContent = list[0]
      gsap.set(plateEl, { scaleX: 1, scaleY: 1, opacity: 1 })
      return
    }

    let cancelled = false
    let index = 0
    const delayed: gsap.core.Tween[] = []

    const wait = (seconds: number) =>
      new Promise<void>((resolve) => {
        const tween = gsap.delayedCall(seconds, resolve)
        delayed.push(tween)
      })

    const renderChars = (phrase: string) => {
      textEl.replaceChildren()
      const frag = document.createDocumentFragment()
      for (const char of phrase) {
        const span = document.createElement('span')
        span.className = 'hero-motion-char inline-block will-change-transform'
        span.style.whiteSpace = 'pre'
        span.style.transformOrigin = '50% 50%'
        span.textContent = char === ' ' ? '\u00A0' : char
        frag.appendChild(span)
      }
      textEl.appendChild(frag)
      return Array.from(textEl.querySelectorAll<HTMLElement>('.hero-motion-char'))
    }

    const styleFor = (i: number): MotionStyle => (i % 4) as MotionStyle

    const showPhrase = async (phraseIndex: number) => {
      const style = styleFor(phraseIndex)
      const chars = renderChars(list[phraseIndex])
      // Force layout so metrics match the new phrase width
      void textEl.offsetWidth
      const metrics = getPlateMetrics(rootEl, textEl)
      preparePlate(plateEl, style, metrics)
      prepareEntrance(chars, style)
      await animatePlateIn(plateEl, style, metrics)
      if (cancelled) return
      await animateEntrance(chars, style)
    }

    const hidePhrase = async (phraseIndex: number, chars: HTMLElement[]) => {
      const style = styleFor(phraseIndex)
      const metrics = getPlateMetrics(rootEl, textEl)
      await animateExit(chars, style)
      if (cancelled) return
      await animatePlateOut(plateEl, style, metrics)
      resetPlateLayout(plateEl)
    }

    const run = async () => {
      await waitForSplashDone()
      if (cancelled) return

      // First phrase already visible with plate — hold, then cycle.
      gsap.set(plateEl, {
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        transformOrigin: '50% 50%',
      })
      let chars = renderChars(list[0])
      gsap.set(chars, { y: 0, opacity: 1, scale: 1, rotateX: 0, filter: 'blur(0px)' })

      await wait(0.35 + holdAfterSplash)
      if (cancelled) return

      await hidePhrase(0, chars)
      if (cancelled) return

      index = 1
      while (!cancelled) {
        await showPhrase(index)
        if (cancelled) break
        await wait(2.5)
        if (cancelled) break
        chars = Array.from(textEl.querySelectorAll<HTMLElement>('.hero-motion-char'))
        await hidePhrase(index, chars)
        index = (index + 1) % list.length
      }
    }

    void run()

    return () => {
      cancelled = true
      delayed.forEach((t) => t.kill())
      gsap.killTweensOf(plateEl)
      gsap.killTweensOf(textEl.querySelectorAll('.hero-motion-char'))
    }
  }, [phrasesKey, holdAfterSplash])

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex max-w-full items-center justify-center ${className}`}
      aria-live="polite"
    >
      <div
        ref={plateRef}
        className={`hero-motion-plate pointer-events-none absolute inset-y-0 -inset-x-3 z-0 rounded-[2px] sm:-inset-x-5 md:-inset-x-8 lg:-inset-x-10 ${
          isLight ? 'bg-erythro-500' : 'bg-coal-900/80'
        }`}
        aria-hidden
      />
      <span
        ref={textRef}
        className="relative z-10 block w-full px-1 py-[0.12em] lg:whitespace-nowrap"
      >
        {phrases[0]}
      </span>
    </div>
  )
}
