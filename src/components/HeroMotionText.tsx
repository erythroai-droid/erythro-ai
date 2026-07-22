'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface HeroMotionTextProps {
  phrases: string[]
  className?: string
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

/** Four distinct letter entrances — one per phrase slot. */
function prepareEntrance(chars: HTMLElement[], style: MotionStyle) {
  switch (style) {
    case 0: // Rise from below
      gsap.set(chars, { y: 36, opacity: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' })
      break
    case 1: // Drop from above
      gsap.set(chars, { y: -36, opacity: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' })
      break
    case 2: // Soft pop / scale
      gsap.set(chars, { y: 0, opacity: 0, scale: 0.35, rotateX: 0, filter: 'blur(0px)' })
      break
    case 3: // Blur + slight 3D flip
      gsap.set(chars, { y: 12, opacity: 0, scale: 1, rotateX: 70, filter: 'blur(8px)' })
      break
  }
}

function animateEntrance(chars: HTMLElement[], style: MotionStyle): Promise<void> {
  switch (style) {
    case 0: // Cascade up
      return tweenTo(chars, {
        y: 0,
        opacity: 1,
        duration: 0.55,
        stagger: 0.03,
        ease: 'power3.out',
      })
    case 1: // Cascade down
      return tweenTo(chars, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: { each: 0.028, from: 'end' },
        ease: 'power2.out',
      })
    case 2: // Bounce pop (center-out)
      return tweenTo(chars, {
        opacity: 1,
        scale: 1,
        duration: 0.55,
        stagger: { each: 0.025, from: 'center' },
        ease: 'back.out(1.7)',
      })
    case 3: // Unblur + flip settle
      return tweenTo(chars, {
        y: 0,
        opacity: 1,
        rotateX: 0,
        filter: 'blur(0px)',
        duration: 0.65,
        stagger: 0.022,
        ease: 'power3.out',
      })
  }
}

function animateExit(chars: HTMLElement[], style: MotionStyle): Promise<void> {
  switch (style) {
    case 0:
      return tweenTo(chars, {
        y: -28,
        opacity: 0,
        duration: 0.35,
        stagger: 0.018,
        ease: 'power2.in',
      })
    case 1:
      return tweenTo(chars, {
        y: 28,
        opacity: 0,
        duration: 0.35,
        stagger: { each: 0.018, from: 'end' },
        ease: 'power2.in',
      })
    case 2:
      return tweenTo(chars, {
        scale: 0.4,
        opacity: 0,
        duration: 0.32,
        stagger: { each: 0.016, from: 'edges' },
        ease: 'power2.in',
      })
    case 3:
      return tweenTo(chars, {
        y: -10,
        opacity: 0,
        rotateX: -55,
        filter: 'blur(6px)',
        duration: 0.4,
        stagger: 0.016,
        ease: 'power2.in',
      })
  }
}

/**
 * Cycles four hero headline phrases, each with its own motion style.
 * Starts only after the brand splash overlay is gone.
 */
export default function HeroMotionText({
  phrases,
  className = '',
  holdAfterSplash = 1.8,
}: HeroMotionTextProps) {
  const textRef = useRef<HTMLSpanElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const phrasesKey = phrases.join('\u0001')

  useEffect(() => {
    const textEl = textRef.current
    const rootEl = rootRef.current
    const list = phrasesKey.split('\u0001').filter(Boolean)
    if (!textEl || list.length === 0) return

    // Perspective for rotateX styles
    if (rootEl) {
      rootEl.style.perspective = '800px'
      textEl.style.transformStyle = 'preserve-3d'
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced || list.length < 2) {
      textEl.textContent = list[0]
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

    const run = async () => {
      await waitForSplashDone()
      if (cancelled) return

      await wait(0.35 + holdAfterSplash)
      if (cancelled) return

      // First phrase is already visible as plain text — exit with style 0.
      let chars = renderChars(list[0])
      gsap.set(chars, { y: 0, opacity: 1, scale: 1, rotateX: 0, filter: 'blur(0px)' })
      await animateExit(chars, 0)
      if (cancelled) return

      index = 1
      while (!cancelled) {
        const style = styleFor(index)
        chars = renderChars(list[index])
        prepareEntrance(chars, style)
        await animateEntrance(chars, style)
        if (cancelled) break
        await wait(2.6)
        if (cancelled) break
        await animateExit(chars, style)
        index = (index + 1) % list.length
      }
    }

    void run()

    return () => {
      cancelled = true
      delayed.forEach((t) => t.kill())
      gsap.killTweensOf(textEl.querySelectorAll('.hero-motion-char'))
    }
  }, [phrasesKey, holdAfterSplash])

  return (
    <div
      ref={rootRef}
      className={`relative flex min-h-[1.15em] w-full items-center justify-center ${className}`}
      aria-live="polite"
    >
      <span ref={textRef} className="block max-w-4xl text-balance">
        {phrases[0]}
      </span>
    </div>
  )
}
