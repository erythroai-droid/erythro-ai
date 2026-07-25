'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { waitForSplashDone } from '@/lib/splash'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface MotionPhrase {
  text: string
  outline: string
}

interface HeroMotionTextProps {
  phrases: MotionPhrase[]
  className?: string
}

function tweenTo(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
): Promise<void> {
  return new Promise((resolve) => {
    gsap.to(targets, {
      ...vars,
      onComplete: resolve,
      // Resolve when scroll-away kills the tween so await chains don't hang
      onInterrupt: resolve,
    })
  })
}

function wait(seconds: number, bag: gsap.core.Tween[]): Promise<void> {
  return new Promise((resolve) => {
    bag.push(gsap.delayedCall(seconds, resolve))
  })
}

/** Max width for motion headlines (viewport minus side padding). */
function motionMaxTextWidth(extraPad = 0): number {
  return Math.max(120, window.innerWidth - 40 - extraPad)
}

/** Mobile headline band: 20px inset from each screen edge. */
function motionMobileMaxWidth(): number {
  return Math.max(120, window.innerWidth - 40)
}

/** Desktop cinematic layer (outline + multi-shot frames). Phones stay simple. */
function isMotionDesktop(): boolean {
  return window.matchMedia('(min-width: 1024px)').matches
}

/**
 * Keep outline type size in a shared band across frames. Without this, short
 * Hebrew phrases expand to maxH and dwarf longer ones (EN/RU lengths are closer).
 */
function clampOutlineFontPx(px: number): number {
  const byH = window.innerHeight * 0.22
  const byW = window.innerWidth * 0.1
  return Math.max(28, Math.min(Math.round(px), byH, byW, 280))
}

/** Page is Hebrew (or other RTL) — outline entrances mirror LTR. */
function isMotionRtl(): boolean {
  return document.documentElement.getAttribute('dir') === 'rtl'
}

function containsRtlScript(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text)
}

function longestWord(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .reduce((a, b) => (b.length > a.length ? b : a), '')
}

/**
 * Outline word fly-in starts.
 * frame1 LTR: first from left, second from right
 * frame3 LTR: first from right, second from left
 * RTL: mirrored pair
 */
function outlineEntranceX(
  fromX: number,
  pattern: 'frame1' | 'frame3',
  rtl: boolean,
): { first: number; second: number } {
  const base =
    pattern === 'frame1'
      ? { first: -fromX, second: fromX }
      : { first: fromX, second: -fromX }
  if (!rtl) return base
  return { first: -base.first, second: -base.second }
}

/**
 * GSAP `x` distance that parks a host fully past the viewport edge.
 * `min(55vw, 720)` was too small for wide outline words — they peeked in.
 */
function outlineClearanceX(host: HTMLElement, outlineScale: number): number {
  const scale = Math.max(outlineScale, 0.01)
  const w = host.getBoundingClientRect().width / scale
  const margin = Math.max(64, window.innerWidth * 0.1)
  return window.innerWidth * 0.5 + w * 0.5 + margin
}

/** Headline size: mobile wraps (up to ~2 lines) as large as possible; desktop fits one line. */
function motionHeadlineFontPx(opts: {
  text: string
  basePx: number
  maxWidth: number
  fontFamily: string
  fontWeight: string
  letterSpacing: string
  minPx?: number
}): number {
  if (!isMotionDesktop()) {
    // Prefer a bold mobile size; only shrink so the longest word fits the
    // 20px-inset band (wrapping handles the rest — typically 1–2 lines).
    const preferred = Math.round(Math.min(window.innerWidth * 0.11, 48))
    const word = longestWord(opts.text) || opts.text
    return fitFontPx({
      ...opts,
      text: word,
      maxWidth: Math.min(opts.maxWidth, motionMobileMaxWidth()),
      basePx: preferred,
      minPx: opts.minPx ?? 22,
    })
  }
  return fitFontPx(opts)
}

function measurePhraseWidth(
  text: string,
  fontPx: number,
  fontFamily: string,
  fontWeight: string,
  letterSpacing: string,
): number {
  const el = document.createElement('span')
  el.style.cssText = [
    'position:absolute',
    'left:-99999px',
    'top:0',
    'visibility:hidden',
    'white-space:nowrap',
    'text-transform:uppercase',
    'line-height:1',
    `font-family:${fontFamily}`,
    `font-weight:${fontWeight}`,
    `font-size:${fontPx}px`,
    `letter-spacing:${letterSpacing}`,
  ].join(';')
  el.textContent = text
  document.body.appendChild(el)
  const w = el.getBoundingClientRect().width
  el.remove()
  return w
}

/** Shrink headline font so the phrase fits the viewport on small screens. */
function fitFontPx(opts: {
  text: string
  basePx: number
  maxWidth: number
  fontFamily: string
  fontWeight: string
  letterSpacing: string
  minPx?: number
}): number {
  const minPx = opts.minPx ?? 14
  const base = Math.max(minPx, Math.round(opts.basePx))
  if (!opts.text || opts.maxWidth <= 0) return base
  if (
    measurePhraseWidth(
      opts.text,
      base,
      opts.fontFamily,
      opts.fontWeight,
      opts.letterSpacing,
    ) <= opts.maxWidth
  ) {
    return base
  }

  let lo = minPx
  let hi = base
  let best = minPx
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const w = measurePhraseWidth(
      opts.text,
      mid,
      opts.fontFamily,
      opts.fontWeight,
      opts.letterSpacing,
    )
    if (w <= opts.maxWidth) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return best
}

/** Outline stroke — always `gold-900` (#6B6254), same in light and dark. */
function getOutlineStrokeColor(): string {
  const root = getComputedStyle(document.documentElement)
  const fromVar =
    root.getPropertyValue('--gold-900').trim() ||
    root.getPropertyValue('--color-gold-900').trim()
  if (fromVar) return fromVar

  const probe = document.createElement('span')
  probe.className = 'text-gold-900'
  probe.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden'
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()
  return computed && computed !== 'rgba(0, 0, 0, 0)' ? computed : '#6B6254'
}

/** Design-token fill: Tailwind `gold-500` (#FFE9C7). */
function getGold500Color(): string {
  const root = getComputedStyle(document.documentElement)
  const fromVar =
    root.getPropertyValue('--gold-500').trim() ||
    root.getPropertyValue('--color-gold-500').trim()
  if (fromVar) return fromVar

  const probe = document.createElement('span')
  probe.className = 'text-gold-500'
  probe.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden'
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()
  return computed && computed !== 'rgba(0, 0, 0, 0)' ? computed : '#FFE9C7'
}

/**
 * Per-glyph spans for kinetic slam, grouped into words so lines wrap on
 * word boundaries (not mid-word letter wraps from flex/inline-block chars).
 */
function renderChars(host: HTMLElement, phrase: string): HTMLElement[] {
  host.replaceChildren()
  const frag = document.createDocumentFragment()
  const words = phrase.trim().split(/\s+/).filter(Boolean)

  words.forEach((word, wordIndex) => {
    const wordEl = document.createElement('span')
    wordEl.className = 'hero-motion-word'
    wordEl.style.cssText = [
      'display:inline-block',
      'white-space:nowrap',
      'vertical-align:baseline',
      wordIndex < words.length - 1 ? 'margin-inline-end:0.28em' : '',
    ]
      .filter(Boolean)
      .join(';')

    for (const char of word) {
      const span = document.createElement('span')
      span.className = 'hero-motion-char inline-block'
      span.style.whiteSpace = 'pre'
      span.style.transformOrigin = '50% 50%'
      span.textContent = char
      wordEl.appendChild(span)
    }
    frag.appendChild(wordEl)
  })

  host.appendChild(frag)
  return Array.from(host.querySelectorAll<HTMLElement>('.hero-motion-char'))
}

/** Kinetic slam-in (current Envato-like entrance). */
async function kineticSlamIn(chars: HTMLElement[]): Promise<void> {
  const travel = isMotionDesktop() ? 120 : 36
  const skew = isMotionDesktop() ? 18 : 8
  const blur = isMotionDesktop() ? 18 : 8
  chars.forEach((el, i) => {
    gsap.set(el, {
      x: i % 2 === 0 ? -travel : travel,
      opacity: 0,
      scale: 1.12,
      skewX: i % 2 === 0 ? skew : -skew,
      filter: `blur(${blur}px)`,
    })
  })
  await tweenTo(chars, {
    x: 0,
    opacity: 1,
    scale: 1,
    skewX: 0,
    filter: 'blur(0px)',
    duration: 0.45,
    stagger: { each: 0.018, from: 'center' },
    ease: 'power4.out',
    onComplete: () => {
      chars.forEach((el) => {
        el.style.filter = 'none'
      })
    },
  })
}

/** Current-style exit for foreground. */
async function kineticSlamOut(chars: HTMLElement[]): Promise<void> {
  if (!chars.length) return
  const travel = isMotionDesktop() ? 100 : 28
  const skew = isMotionDesktop() ? 14 : 6
  const blur = isMotionDesktop() ? 16 : 8
  await tweenTo(chars, {
    x: (i) => (i % 2 === 0 ? travel : -travel),
    opacity: 0,
    skewX: (i) => (i % 2 === 0 ? -skew : skew),
    filter: `blur(${blur}px)`,
    duration: 0.38,
    stagger: { each: 0.016, from: 'edges' },
    ease: 'power3.in',
  })
}

/**
 * Frontal-plane letter “turn”: collapse → recolor → open (scaleX).
 * Rotating HTML glyphs (rotateZ) always AA-sparkles; scaleX keeps text axis-aligned
 * except for a brief edge-on frame, so edges stay clean and nothing jerks.
 */
function waitAnimationFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left <= 0) {
        resolve()
        return
      }
      requestAnimationFrame(() => step(left - 1))
    }
    requestAnimationFrame(() => step(count - 1))
  })
}

async function spinCharsFrontal(
  chars: HTMLElement[],
  fromColor: string,
  toColor: string,
): Promise<void> {
  if (!chars.length) return

  for (const el of chars) {
    el.style.display = 'inline-block'
    el.style.transformOrigin = '50% 50%'
    el.style.color = fromColor
    el.style.removeProperty('-webkit-text-stroke')
    el.style.removeProperty('paint-order')
    el.style.removeProperty('will-change')
  }

  gsap.set(chars, {
    color: fromColor,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    x: 0,
    y: 0,
    z: 0,
    transformOrigin: '50% 50%',
    force3D: false,
    filter: 'none',
  })
  await waitAnimationFrames(1)

  await new Promise<void>((resolve) => {
    const tl = gsap.timeline({
      onComplete: resolve,
      onInterrupt: resolve,
    })
    chars.forEach((el, i) => {
      const at = i * 0.024
      tl.to(
        el,
        {
          scaleX: 0,
          duration: 0.13,
          ease: 'power2.in',
          force3D: false,
        },
        at,
      )
      tl.set(el, { color: toColor }, at + 0.13)
      tl.to(
        el,
        {
          scaleX: 1,
          duration: 0.15,
          ease: 'power2.out',
          force3D: false,
        },
        at + 0.13,
      )
    })
  })

  gsap.set(chars, {
    color: toColor,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    force3D: false,
    filter: 'none',
  })
}

/** Split a text node/span into per-glyph spans for kinetic exit. */
function explodeToChars(el: HTMLElement): HTMLElement[] {
  const text = el.textContent ?? ''
  if (!text) return []
  const cs = getComputedStyle(el)
  // Only copy type styles — never parent padding/position (causes letter gaps + jerk)
  const charCss = [
    `font-family:${cs.fontFamily}`,
    `font-weight:${cs.fontWeight}`,
    `font-size:${cs.fontSize}`,
    `letter-spacing:${cs.letterSpacing}`,
    'text-transform:uppercase',
    `color:${cs.color}`,
    'display:inline-block',
    'transform-origin:50% 50%',
    'line-height:1',
    'white-space:pre',
    'padding:0',
    'margin:0',
    'position:static',
  ].join(';')
  el.textContent = ''
  el.style.padding = '0'
  const chars: HTMLElement[] = []
  for (const char of text) {
    const span = document.createElement('span')
    span.className = 'hero-motion-char'
    span.style.cssText = charCss
    span.textContent = char === ' ' ? '\u00A0' : char
    el.appendChild(span)
    chars.push(span)
  }
  return chars
}

/** Soft blur exit for a whole phrase (no skew / sideways slam). */
async function exitPhraseBlur(chars: HTMLElement[]): Promise<void> {
  if (!chars.length) return
  gsap.set(chars, { force3D: false, x: 0, y: 0, skewX: 0 })
  await tweenTo(chars, {
    opacity: 0,
    filter: 'blur(14px)',
    duration: 0.42,
    stagger: { each: 0.01, from: 'center' },
    ease: 'power2.in',
    force3D: false,
  })
}

/** Blur exit for a solid block (red plate) — avoids clipping inside overflow:hidden. */
async function exitBlockBlur(el: HTMLElement, dir: 1 | -1 = 1): Promise<void> {
  await tweenTo(el, {
    opacity: 0,
    x: 72 * dir,
    skewX: -12 * dir,
    filter: 'blur(16px)',
    duration: 0.38,
    ease: 'power3.in',
  })
}

/**
 * Frame 1:
 * 1) Huge FG (~144vh) appears instantly (no entrance tween), above all layers
 * 2) Smooth settle into normal slot size/position (no overshoot)
 * 3) After FG has settled — outline words fly in (1st from left, 2nd from right)
 * 4) Hold
 * 5) Outline exits to the right; FG exits as current slam-out
 */
async function playFrame1(opts: {
  phrase: MotionPhrase
  stageEl: HTMLElement
  fgEl: HTMLElement
  outlineEl: HTMLElement
  slotEl: HTMLElement
  inlineEl: HTMLElement
  delayed: gsap.core.Tween[]
  cancelled: () => boolean
  /** Matches hero content scroll-fade (1 = fully visible). */
  getScrollFade: () => number
}): Promise<void> {
  const {
    phrase,
    stageEl,
    fgEl,
    outlineEl,
    slotEl,
    inlineEl,
    delayed,
    cancelled,
    getScrollFade,
  } = opts
  const mainText = phrase.text
  const outlineText = phrase.outline || phrase.text
  const { left: outlineLeft, right: outlineRight } = splitTwoPartPhrase(outlineText)

  const slotRect = slotEl.getBoundingClientRect()
  const slotStyles = getComputedStyle(slotEl)
  const headingEl = (slotEl.closest('.hero-heading') as HTMLElement | null) ?? slotEl
  const headingStyles = getComputedStyle(headingEl)
  const baseFontPx =
    Number.parseFloat(headingStyles.fontSize) ||
    Number.parseFloat(slotStyles.fontSize) ||
    48
  const fontFamily = headingStyles.fontFamily || slotStyles.fontFamily
  const fontWeight = headingStyles.fontWeight || slotStyles.fontWeight
  const letterSpacing = headingStyles.letterSpacing || slotStyles.letterSpacing
  const normalFontPx = motionHeadlineFontPx({
    text: mainText,
    basePx: baseFontPx,
    maxWidth: motionMaxTextWidth(),
    fontFamily,
    fontWeight,
    letterSpacing,
  })
  // 4× original huge size (~36vh → ~144vh); softer on mobile
  const hugeFontPx = Math.round(window.innerHeight * (isMotionDesktop() ? 1.44 : 0.55))
  const textColor = getGold500Color()
  const outlineStroke = getOutlineStrokeColor()
  const showOutline = isMotionDesktop()

  const applyStageFade = () => {
    const fade = getScrollFade()
    if (fade >= 0.995) {
      gsap.set(stageEl, {
        opacity: 1,
        clearProps: 'transform',
        color: textColor,
      })
      return
    }
    // Opacity only — y/scale on reverse reads as copy sliding down into place
    gsap.set(stageEl, {
      opacity: fade,
      y: 0,
      scale: 1,
      color: textColor,
    })
  }

  // Cinematic stage above everything — keep invisible until hosts are parked
  // fully off-screen (otherwise wide outline glyphs flash at the edges).
  stageEl.style.display = 'block'
  gsap.set(stageEl, { opacity: 0 })
  gsap.set(inlineEl, { opacity: 0 })

  // Target: normal slot center (needed for outline prep before entrance)
  const targetX = slotRect.left + slotRect.width / 2 - window.innerWidth / 2
  const targetY = slotRect.top + slotRect.height / 2 - window.innerHeight / 2

  // --- Prep outline: two word hosts (fly in from opposite sides); desktop only ---
  outlineEl.replaceChildren()
  let leftHost: HTMLElement | null = null
  let rightHost: HTMLElement | null = null
  let fromX = 0
  let flyFirst = 0
  let flySecond = 0

  if (showOutline) {
    const padX = window.innerWidth * 0.04
    const padY = window.innerHeight * 0.06
    const slotCenterY = slotRect.top + slotRect.height / 2
    const maxOutlineW = window.innerWidth - padX * 2
    const maxOutlineH =
      2 * Math.max(40, Math.min(slotCenterY - padY, window.innerHeight - slotCenterY - padY))
    const outlineRow = document.createElement('div')
    const rtl = isMotionRtl()
    outlineRow.style.cssText = `display:inline-flex;align-items:baseline;justify-content:center;gap:0.28em;white-space:nowrap;line-height:normal;direction:${rtl ? 'rtl' : 'ltr'};`

    leftHost = document.createElement('div')
    leftHost.style.cssText = 'flex:0 0 auto;overflow:visible;'
    outlineRow.appendChild(leftHost)

    rightHost = document.createElement('div')
    rightHost.style.cssText = 'flex:0 0 auto;overflow:visible;'
    if (outlineRight) outlineRow.appendChild(rightHost)

    outlineEl.appendChild(outlineRow)

    const probeHost = document.createElement('div')
    probeHost.style.cssText =
      'position:absolute;left:0;top:0;opacity:0;pointer-events:none;z-index:-1;'
    outlineEl.appendChild(probeHost)
    const { fontPx: sharedOutlineFontPx } = buildMaskedOutline({
      host: probeHost,
      text: outlineText,
      fontFamily,
      fontWeight,
      letterSpacing,
      outlineStroke,
      maxW: maxOutlineW,
      maxH: maxOutlineH,
      asLetters: false,
    })
    probeHost.remove()

    buildMaskedOutline({
      host: leftHost,
      text: outlineLeft || outlineText,
      fontFamily,
      fontWeight,
      letterSpacing,
      outlineStroke,
      maxW: maxOutlineW,
      maxH: maxOutlineH,
      asLetters: false,
      fontPx: sharedOutlineFontPx,
    })
    if (outlineRight) {
      buildMaskedOutline({
        host: rightHost,
        text: outlineRight,
        fontFamily,
        fontWeight,
        letterSpacing,
        outlineStroke,
        maxW: maxOutlineW,
        maxH: maxOutlineH,
        asLetters: false,
        fontPx: sharedOutlineFontPx,
      })
    }

    // Invisible while measuring — avoids a one-frame center/edge flash on reload.
    gsap.set(outlineEl, {
      left: '50%',
      top: '50%',
      xPercent: -50,
      yPercent: -50,
      x: targetX,
      y: targetY,
      scale: 1,
      autoAlpha: 0,
      zIndex: 1,
      overflow: 'visible',
      lineHeight: 'normal',
      color: 'transparent',
      WebkitTextStroke: '0 transparent',
      textShadow: 'none',
    })
    gsap.set(leftHost, { autoAlpha: 0 })
    if (outlineRight) gsap.set(rightHost, { autoAlpha: 0 })

    let outlineScale = 1
    {
      const rect = outlineEl.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        const fitW = (window.innerWidth - padX * 2) / rect.width
        const fitH = (window.innerHeight - padY * 2) / rect.height
        outlineScale = Math.min(1, fitW, fitH)
        gsap.set(outlineEl, { scale: outlineScale })
      }
    }

    fromX = Math.max(
      outlineClearanceX(leftHost, outlineScale),
      outlineRight && rightHost ? outlineClearanceX(rightHost, outlineScale) : 0,
    )
    const fly = outlineEntranceX(fromX, 'frame1', rtl)
    flyFirst = fly.first
    flySecond = fly.second
    gsap.set(leftHost, { x: flyFirst, y: 0 })
    if (outlineRight) gsap.set(rightHost, { x: flySecond, y: 0 })
    gsap.set(outlineEl, { autoAlpha: 1 })
  }

  applyStageFade()

  // --- Foreground: instantly huge & centered, then settle via fontSize (not scale)
  // so glyphs stay sharp — transform scale on huge type causes jagged edges.
  // Stage is dir=ltr for transform math; Hebrew needs rtl on the text host or
  // per-glyph spans paint in reverse visual order.
  const mobileWrap = !isMotionDesktop()
  const rtlText = containsRtlScript(mainText)
  const fgFont = rtlText ? resolveHeeboStack(fontFamily) : fontFamily
  fgEl.textContent = ''
  gsap.set(fgEl, {
    fontSize: hugeFontPx,
    fontFamily: fgFont,
    fontWeight,
    letterSpacing,
    color: textColor,
    left: '50%',
    top: '50%',
    xPercent: -50,
    yPercent: -50,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    skewX: 0,
    skewY: 0,
    transformOrigin: '50% 50%',
    opacity: 1,
    zIndex: 2,
    force3D: false,
    whiteSpace: mobileWrap ? 'normal' : 'nowrap',
    textAlign: 'center',
    maxWidth: mobileWrap ? motionMaxTextWidth() : 'none',
    direction: rtlText ? 'rtl' : 'ltr',
  })
  fgEl.style.unicodeBidi = 'isolate'
  const fgChars = renderChars(fgEl, mainText)
  gsap.set(fgChars, {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    skewX: 0,
    filter: 'none',
    force3D: false,
  })

  // 1) FG settles into the headline slot
  await tweenTo(fgEl, {
    x: targetX,
    y: targetY,
    fontSize: normalFontPx,
    scale: 1,
    rotation: 0,
    duration: 0.9,
    ease: 'power1.in',
    force3D: false,
  })
  if (cancelled()) return
  fgEl.style.fontSize = `${normalFontPx}px`

  // 2) Outline words: first from left, second from right (desktop)
  if (showOutline && leftHost) {
    gsap.set(leftHost, { autoAlpha: 1 })
    if (outlineRight && rightHost) gsap.set(rightHost, { autoAlpha: 1 })
    await Promise.all([
      tweenTo(leftHost, { x: 0, duration: 0.85, ease: 'power3.out' }),
      outlineRight && rightHost
        ? tweenTo(rightHost, { x: 0, duration: 0.85, ease: 'power3.out' })
        : Promise.resolve(),
    ])
    if (cancelled()) return
  }

  // Sync inline text to match settled FG, then keep FG visible until exit
  inlineEl.replaceChildren()
  const inlineChars = renderChars(inlineEl, mainText)
  gsap.set(inlineChars, { opacity: 1, x: 0, y: 0, scale: 1, skewX: 0, filter: 'none' })

  // Hold after everything is on screen
  await wait(1.7, delayed)
  if (cancelled()) return

  // Outline words exit back to their sides; FG exits as slam-out
  const liveFgChars = Array.from(fgEl.querySelectorAll<HTMLElement>('.hero-motion-char'))
  await Promise.all([
    showOutline && leftHost
      ? tweenTo(leftHost, { x: flyFirst, duration: 0.55, ease: 'power3.in' })
      : Promise.resolve(),
    showOutline && outlineRight && rightHost
      ? tweenTo(rightHost, { x: flySecond, duration: 0.55, ease: 'power3.in' })
      : Promise.resolve(),
    kineticSlamOut(liveFgChars.length ? liveFgChars : inlineChars),
  ])
  if (cancelled()) return

  gsap.set(inlineEl, { opacity: 0 })
  stageEl.style.display = 'none'
  gsap.set(fgEl, { scale: 1, x: 0, y: 0, opacity: 1, maxWidth: '', whiteSpace: '' })
  gsap.set(outlineEl, { scale: 1, x: 0, y: 0, opacity: 1 })
  fgEl.replaceChildren()
  outlineEl.replaceChildren()
  outlineEl.textContent = ''
}

function splitTwoPartPhrase(text: string): { left: string; right: string } {
  const parts = text.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return { left: text.trim(), right: '' }
  return { left: parts[0], right: parts.slice(1).join(' ') }
}

function resolveHeeboStack(baseFamily: string): string {
  const probe = document.createElement('span')
  probe.lang = 'he'
  probe.dir = 'rtl'
  probe.textContent = 'אבגדהו'
  probe.style.cssText =
    'position:absolute;left:-99999px;top:0;visibility:hidden;font-family:var(--font-heebo),var(--font-sans),sans-serif;font-size:48px;font-weight:700;'
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).fontFamily
  probe.remove()
  if (computed && computed !== 'serif' && computed !== 'sans-serif') {
    return computed
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-heebo')
    .trim()
  return [raw || 'Heebo', baseFamily].filter(Boolean).join(', ')
}

/** Masked SVG outline (stroke ring, no fill, no inner crossings). */
function buildMaskedOutline(opts: {
  host: HTMLElement
  text: string
  fontFamily: string
  fontWeight: string
  letterSpacing: string
  outlineStroke: string
  maxW: number
  maxH: number
  /** Split into tspans for letter-by-letter reveals */
  asLetters?: boolean
  /** Lock font size (same size for multi-word outlines). */
  fontPx?: number
}): { letterEls: SVGTSpanElement[]; fontPx: number } {
  const {
    host,
    text,
    fontFamily,
    fontWeight,
    letterSpacing,
    outlineStroke,
    maxW,
    maxH,
    asLetters = false,
    fontPx: lockedFontPx,
  } = opts

  const rtlText = containsRtlScript(text)
  // Inter has no hebrew glyphs — Heebo. Keep SVG direction LTR so bidi + getBBox
  // / mask align like English (rtl on <text> pushed ink outside the viewBox).
  const fontStack = rtlText ? resolveHeeboStack(fontFamily) : fontFamily

  host.replaceChildren()
  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('overflow', 'visible')
  svg.style.cssText = 'display:block;overflow:visible;max-width:none;'

  const maskId = `hero-ol-mask-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const fontCss = (fontPx: number) =>
    [
      `font-family:${fontStack}`,
      `font-weight:${fontWeight}`,
      `font-size:${fontPx}px`,
      `letter-spacing:${letterSpacing}`,
      'text-transform:uppercase',
      'white-space:pre',
    ].join(';')

  const makeTextEl = (fontPx: number, fill: string, withStroke: boolean, strokeW: number) => {
    const t = document.createElementNS(svgNS, 'text')
    t.setAttribute('x', '0')
    t.setAttribute('y', '0')
    t.setAttribute('dominant-baseline', 'alphabetic')
    t.setAttribute('fill', fill)
    if (withStroke) {
      t.setAttribute('stroke', outlineStroke)
      t.setAttribute('stroke-width', String(strokeW))
      t.setAttribute('stroke-linejoin', 'round')
      t.setAttribute('stroke-linecap', 'round')
    } else {
      t.setAttribute('stroke', 'none')
    }
    t.style.cssText = fontCss(fontPx)
    return t
  }

  let outlineFontPx =
    lockedFontPx ?? clampOutlineFontPx(Math.min(Math.round(maxW * 0.11), 640))
  let strokeW = Math.max(2, outlineFontPx * 0.016)

  const strokeText = makeTextEl(outlineFontPx, 'none', true, strokeW)
  const letterEls: SVGTSpanElement[] = []
  if (asLetters) {
    for (const char of text) {
      const tspan = document.createElementNS(svgNS, 'tspan')
      tspan.textContent = char === ' ' ? '\u00A0' : char
      strokeText.appendChild(tspan)
      letterEls.push(tspan)
    }
  } else {
    strokeText.textContent = text
  }
  svg.appendChild(strokeText)
  host.appendChild(svg)

  const fallbackBBox = (fontPx: number) => {
    const w = measurePhraseWidth(text, fontPx, fontStack, fontWeight, letterSpacing)
    return {
      x: 0,
      y: -fontPx * 0.85,
      width: Math.max(w, 8),
      height: Math.max(fontPx * 1.25, 8),
    }
  }

  let bbox = { x: 0, y: 0, width: 1, height: 1 }
  if (lockedFontPx == null) {
    for (let i = 0; i < 48; i++) {
      strokeW = Math.max(2, outlineFontPx * 0.016)
      strokeText.style.fontSize = `${outlineFontPx}px`
      strokeText.setAttribute('stroke-width', String(strokeW))
      try {
        bbox = strokeText.getBBox()
        if (bbox.width < 2 || bbox.height < 2) {
          bbox = fallbackBBox(outlineFontPx)
        }
        const inkW = bbox.width + strokeW
        const inkH = bbox.height + strokeW
        const scaleW = maxW / Math.max(inkW, 1)
        const scaleH = maxH / Math.max(inkH, 1)
        const next = clampOutlineFontPx(outlineFontPx * Math.min(scaleW, scaleH) * 0.98)
        if (Math.abs(next - outlineFontPx) < 1) {
          outlineFontPx = next
          break
        }
        outlineFontPx = next
      } catch {
        bbox = fallbackBBox(outlineFontPx)
        break
      }
    }
  } else {
    outlineFontPx = clampOutlineFontPx(lockedFontPx)
  }
  strokeW = Math.max(2, outlineFontPx * 0.016)
  strokeText.style.fontSize = `${outlineFontPx}px`
  strokeText.setAttribute('stroke-width', String(strokeW))
  try {
    bbox = strokeText.getBBox()
    if (bbox.width < 2 || bbox.height < 2) {
      bbox = fallbackBBox(outlineFontPx)
    }
  } catch {
    bbox = fallbackBBox(outlineFontPx)
  }

  // RTL scripts in LTR SVG often sit at negative x. Chrome then fails
  // userSpaceOnUse masks with a negative origin and the stroke disappears
  // (frames 1/3/4 word hosts). Re-anchor via x= so ink starts at 0 —
  // do NOT use transform: maskContentUnits are SVG-root space and would
  // desync from a transformed stroke.
  const shiftX = -bbox.x
  if (Math.abs(shiftX) > 0.01) {
    const prevX = Number.parseFloat(strokeText.getAttribute('x') || '0') || 0
    strokeText.setAttribute('x', String(prevX + shiftX))
    try {
      bbox = strokeText.getBBox()
      if (bbox.width < 2 || bbox.height < 2) {
        bbox = { x: 0, y: bbox.y, width: Math.max(bbox.width, 8), height: bbox.height }
      }
    } catch {
      bbox = { x: 0, y: bbox.y, width: bbox.width, height: bbox.height }
    }
  }

  const pad = strokeW + 24
  const vbX = bbox.x - pad
  const vbY = bbox.y - pad
  const vbW = bbox.width + pad * 2
  const vbH = bbox.height + pad * 2

  const defs = document.createElementNS(svgNS, 'defs')
  const mask = document.createElementNS(svgNS, 'mask')
  mask.setAttribute('id', maskId)
  mask.setAttribute('maskUnits', 'userSpaceOnUse')
  mask.setAttribute('maskContentUnits', 'userSpaceOnUse')
  mask.setAttribute('x', String(vbX))
  mask.setAttribute('y', String(vbY))
  mask.setAttribute('width', String(vbW))
  mask.setAttribute('height', String(vbH))
  mask.setAttribute('style', 'mask-type:luminance')

  const maskBg = document.createElementNS(svgNS, 'rect')
  maskBg.setAttribute('x', String(vbX))
  maskBg.setAttribute('y', String(vbY))
  maskBg.setAttribute('width', String(vbW))
  maskBg.setAttribute('height', String(vbH))
  maskBg.setAttribute('fill', '#ffffff')

  const maskPunch = makeTextEl(outlineFontPx, '#000000', false, 0)
  maskPunch.textContent = text
  maskPunch.setAttribute('x', strokeText.getAttribute('x') || '0')
  mask.appendChild(maskBg)
  mask.appendChild(maskPunch)
  defs.appendChild(mask)
  svg.insertBefore(defs, strokeText)
  strokeText.setAttribute('mask', `url(#${maskId})`)

  svg.setAttribute('width', String(Math.ceil(vbW)))
  svg.setAttribute('height', String(Math.ceil(vbH)))
  svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`)

  return { letterEls, fontPx: outlineFontPx }
}

/**
 * Frame 2 — "AI AUTOMATION" (first word + rest):
 * 1) Left word grows in at centre, then the row shifts as the right side opens
 * 2) 2px red line grows to word height, then expands right into a red plate;
 *    white right-word appears on the plate
 * 3) Plate folds right; second word fills red top → bottom in sync; then its
 *    letters flip in-plane (scaleX) → gold-500. First word stays put.
 * 4) Background outline fades in
 * 5) Hold → exit
 */
async function playFrame2(opts: {
  phrase: MotionPhrase
  stageEl: HTMLElement
  fgEl: HTMLElement
  outlineEl: HTMLElement
  slotEl: HTMLElement
  inlineEl: HTMLElement
  delayed: gsap.core.Tween[]
  cancelled: () => boolean
  getScrollFade: () => number
}): Promise<void> {
  const {
    phrase,
    stageEl,
    fgEl,
    outlineEl,
    slotEl,
    inlineEl,
    delayed,
    cancelled,
    getScrollFade,
  } = opts

  const { left: aiText, right: autoText } = splitTwoPartPhrase(phrase.text)
  const outlineText = phrase.outline || phrase.text
  if (!aiText) return

  const headingEl = (slotEl.closest('.hero-heading') as HTMLElement | null) ?? slotEl
  const headingStyles = getComputedStyle(headingEl)
  const baseFontPx = Number.parseFloat(headingStyles.fontSize) || 48
  const fontFamily = headingStyles.fontFamily
  const fontWeight = headingStyles.fontWeight
  const letterSpacing = headingStyles.letterSpacing
  const fontPx = motionHeadlineFontPx({
    text: phrase.text,
    basePx: baseFontPx,
    maxWidth: motionMaxTextWidth(8),
    fontFamily,
    fontWeight,
    letterSpacing,
  })
  const textColor = getGold500Color()
  const outlineStroke = getOutlineStrokeColor()
  const red =
    getComputedStyle(document.documentElement).getPropertyValue('--erythro-500').trim() || '#E52421'
  const finalTextColor = getGold500Color()
  const showOutline = isMotionDesktop()
  const mobileWrap = !showOutline

  const applyStageFade = () => {
    const fade = getScrollFade()
    if (fade >= 0.995) {
      gsap.set(stageEl, {
        opacity: 1,
        clearProps: 'transform',
        color: textColor,
      })
      return
    }
    // Opacity only — y/scale on reverse reads as copy sliding down into place
    gsap.set(stageEl, {
      opacity: fade,
      y: 0,
      scale: 1,
      color: textColor,
    })
  }

  stageEl.style.display = 'block'
  gsap.set(inlineEl, { opacity: 0 })
  applyStageFade()

  const rtlText = containsRtlScript(phrase.text)
  const fgFont = rtlText ? resolveHeeboStack(fontFamily) : fontFamily

  // Reset Frame 1 leftovers: huge fontSize on fgEl made the box enormous so
  // yPercent centering parked the visible text at the bottom of the screen.
  fgEl.replaceChildren()
  outlineEl.replaceChildren()
  outlineEl.textContent = ''
  gsap.set(fgEl, {
    fontSize: `${fontPx}px`,
    fontFamily: fgFont,
    fontWeight,
    letterSpacing,
    lineHeight: 1,
    width: 'auto',
    height: 'auto',
    scale: 1,
    rotation: 0,
    skewX: 0,
    skewY: 0,
    x: 0,
    y: 0,
    xPercent: -50,
    yPercent: -50,
    left: '50%',
    top: '50%',
    opacity: 1,
    zIndex: 2,
    direction: rtlText ? 'rtl' : 'ltr',
  })
  gsap.set(outlineEl, {
    fontSize: '',
    lineHeight: 'normal',
    scale: 1,
    x: 0,
    y: 0,
    xPercent: -50,
    yPercent: -50,
    left: '50%',
    top: '50%',
    opacity: 1,
    zIndex: 1,
  })

  const liveSlot = headingEl.getBoundingClientRect()
  const posX = liveSlot.left + liveSlot.width / 2 - window.innerWidth / 2
  const posY = liveSlot.top + liveSlot.height / 2 - window.innerHeight / 2

  // --- Foreground: AI + (red plate behind second word) ---
  const row = document.createElement('div')
  row.style.cssText = mobileWrap
    ? `display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:0.18em 0.28em;max-width:${motionMaxTextWidth()}px;white-space:normal;line-height:1.12;text-align:center;direction:${rtlText ? 'rtl' : 'ltr'};`
    : `display:inline-flex;align-items:stretch;justify-content:center;gap:0.18em;white-space:nowrap;line-height:1;direction:${rtlText ? 'rtl' : 'ltr'};`

  const wordStyle = (color: string, extra = '') =>
    [
      `font-family:${fgFont}`,
      `font-weight:${fontWeight}`,
      `font-size:${fontPx}px`,
      `letter-spacing:${letterSpacing}`,
      'text-transform:uppercase',
      `color:${color}`,
      'display:inline-block',
      'transform-origin:50% 50%',
      'line-height:1',
      'white-space:pre',
      extra,
    ]
      .filter(Boolean)
      .join(';')

  const aiEl = document.createElement('span')
  aiEl.textContent = aiText
  aiEl.style.cssText = wordStyle(textColor, 'padding:0.08em 0')

  const plateWrap = document.createElement('span')
  plateWrap.style.cssText =
    'position:relative;display:inline-flex;align-items:center;flex:0 0 auto;line-height:1;overflow:visible;'

  const barEl = document.createElement('span')
  // LTR: grows from left → right; RTL: mirror from right → left (away from first word)
  barEl.style.cssText = [
    `background:${red}`,
    'position:absolute',
    'top:0',
    'z-index:0',
    'box-sizing:border-box',
    'pointer-events:none',
    rtlText ? 'right:0;left:auto' : 'left:0;right:auto',
    `transform-origin:${rtlText ? 'right' : 'left'} center`,
  ].join(';')

  const autoEl = document.createElement('span')
  autoEl.style.cssText = wordStyle(
    '#ffffff',
    'position:relative;z-index:1;padding:0.08em 0.28em',
  )
  // Glyphs exist from the start — splitting later caused a layout jerk before the flip
  const flipChars: HTMLElement[] = []
  if (autoText) {
    for (const char of autoText) {
      const span = document.createElement('span')
      span.className = 'hero-motion-char'
      span.style.cssText =
        'display:inline-block;white-space:pre;transform-origin:50% 50%;line-height:1;letter-spacing:normal;'
      span.style.color = '#ffffff'
      span.textContent = char === ' ' ? '\u00A0' : char
      autoEl.appendChild(span)
      flipChars.push(span)
    }
  }

  plateWrap.appendChild(barEl)
  plateWrap.appendChild(autoEl)
  row.appendChild(aiEl)
  if (autoText) row.appendChild(plateWrap)
  fgEl.appendChild(row)

  gsap.set(fgEl, { x: posX, y: posY, scale: 1, opacity: 1 })

  gsap.set(aiEl, { scale: 1, opacity: 1 })
  gsap.set(autoEl, { opacity: 1 })
  const aiH = Math.max(aiEl.getBoundingClientRect().height, fontPx)
  const plateBox = plateWrap.getBoundingClientRect()
  const barTargetW = Math.max(plateBox.width, 8)
  const barTargetH = Math.max(plateBox.height, aiH)

  gsap.set(plateWrap, { width: barTargetW, height: barTargetH })
  gsap.set(aiEl, { scale: 0, opacity: 1 })
  gsap.set(barEl, {
    width: 2,
    height: 0,
    opacity: 1,
    left: rtlText ? 'auto' : 0,
    right: rtlText ? 0 : 'auto',
    x: 0,
  })
  gsap.set(autoEl, { opacity: 0 })

  // --- Outline (desktop only) ---
  if (showOutline) {
    const padX = window.innerWidth * 0.04
    const padY = window.innerHeight * 0.06
    const slotCenterY = liveSlot.top + liveSlot.height / 2
    const maxOutlineW = window.innerWidth - padX * 2
    const maxOutlineH =
      2 * Math.max(40, Math.min(slotCenterY - padY, window.innerHeight - slotCenterY - padY))

    buildMaskedOutline({
      host: outlineEl,
      text: outlineText,
      fontFamily,
      fontWeight,
      letterSpacing,
      outlineStroke,
      maxW: maxOutlineW,
      maxH: maxOutlineH,
      asLetters: false,
    })

    gsap.set(outlineEl, {
      x: posX,
      y: posY,
      scale: 0.92,
      opacity: 0,
      zIndex: 1,
      overflow: 'visible',
      color: 'transparent',
      WebkitTextStroke: '0 transparent',
      textShadow: 'none',
    })
  } else {
    outlineEl.replaceChildren()
    gsap.set(outlineEl, { opacity: 0 })
  }

  await tweenTo(aiEl, { scale: 1, duration: 0.55, ease: 'power3.out' })
  if (cancelled()) return

  if (autoText) {
    await tweenTo(barEl, { height: barTargetH, duration: 0.35, ease: 'power2.out' })
    if (cancelled()) return

    await Promise.all([
      tweenTo(barEl, { width: barTargetW, duration: 0.55, ease: 'power3.inOut' }),
      tweenTo(autoEl, { opacity: 1, duration: 0.4, delay: 0.18, ease: 'power2.out' }),
    ])
    if (cancelled()) return

    // Plate folds right; second word fills red top → bottom (AI stays put).
    // Prep under an identical white glyph cover so nothing flashes before the fold.
    await wait(0.35, delayed)
    if (cancelled()) return

    const whiteCover = document.createElement('span')
    whiteCover.style.cssText = [
      `font-family:${fgFont}`,
      `font-weight:${fontWeight}`,
      `font-size:${fontPx}px`,
      `letter-spacing:${letterSpacing}`,
      'text-transform:uppercase',
      'position:absolute',
      'left:0',
      'top:0',
      'z-index:2',
      'padding:0.08em 0.28em',
      'box-sizing:border-box',
      'line-height:1',
      'white-space:pre',
      'pointer-events:none',
      'display:inline-block',
    ].join(';')
    for (const char of autoText) {
      const span = document.createElement('span')
      span.style.cssText =
        'display:inline-block;white-space:pre;transform-origin:50% 50%;line-height:1;letter-spacing:normal;color:#ffffff;'
      span.textContent = char === ' ' ? '\u00A0' : char
      whiteCover.appendChild(span)
    }
    plateWrap.appendChild(whiteCover)
    gsap.set(whiteCover, { clipPath: 'inset(0% 0 0% 0)' })
    // Base is fully covered — safe to go red with no visible change
    gsap.set(flipChars, { color: red })
    autoEl.style.color = red

    // Fold toward the outer edge (LTR → right, RTL → left) without swapping anchors
    gsap.set(barEl, {
      transformOrigin: rtlText ? 'left center' : 'right center',
      force3D: false,
    })
    await Promise.all([
      tweenTo(barEl, {
        scaleX: 0,
        duration: 0.5,
        ease: 'power3.inOut',
        force3D: false,
      }),
      tweenTo(whiteCover, {
        clipPath: 'inset(100% 0 0% 0)',
        duration: 0.2,
        ease: 'power3.inOut',
        force3D: false,
      }),
    ])
    if (cancelled()) return

    whiteCover.remove()
    gsap.set(flipChars, { color: red, scaleX: 1, x: 0, y: 0, rotation: 0 })

    await tweenTo(barEl, { opacity: 0, duration: 0.12, ease: 'power1.in' })
    if (cancelled()) return
    barEl.remove()

    // Only AUTOMATION letters flip → gold-500; AI untouched (no DOM rebuild)
    await spinCharsFrontal(flipChars, red, finalTextColor)
    if (cancelled()) return
  }

  if (showOutline) {
    await tweenTo(outlineEl, {
      opacity: 1,
      scale: 1,
      duration: 1.15,
      ease: 'sine.out',
    })
    if (cancelled()) return
  }

  inlineEl.replaceChildren()
  const inlineChars = renderChars(inlineEl, phrase.text)
  gsap.set(inlineChars, { opacity: 1, x: 0, y: 0, scale: 1, skewX: 0, filter: 'none' })

  // Full phrase holds without the plate, then exits with blur (no glyph split — avoids pre-exit jerk)
  await wait(1.5, delayed)
  if (cancelled()) return

  gsap.set(row, { force3D: false, x: 0, y: 0, skewX: 0 })
  await Promise.all([
    showOutline
      ? tweenTo(outlineEl, { opacity: 0, scale: 1.04, duration: 0.45, ease: 'power2.in' })
      : Promise.resolve(),
    tweenTo(row, {
      opacity: 0,
      filter: 'blur(14px)',
      duration: 0.42,
      ease: 'power2.in',
      force3D: false,
    }),
  ])
  if (cancelled()) return

  gsap.set(inlineEl, { opacity: 0 })
  stageEl.style.display = 'none'
  gsap.set(fgEl, { fontSize: '', scale: 1, x: 0, y: 0, opacity: 1 })
  gsap.set(outlineEl, { scale: 1, x: 0, y: 0, opacity: 1 })
  fgEl.replaceChildren()
  outlineEl.replaceChildren()
  outlineEl.textContent = ''
}

/**
 * Frame 3 — "SCALABLE SYSTEMS" (first word + rest):
 * 1) First letter flies from afar toward the camera (3× peak + perspective),
 *    then rebounds into the headline slot; rest of first word wipes in to the right
 * 2) Second word rises as a bottom→top wipe (single growth reveal)
 * 3) Background outline: first word from the right, second from the left
 *    (mirror of Frame 1)
 * 4) Hold → exit
 */
async function playFrame3(opts: {
  phrase: MotionPhrase
  stageEl: HTMLElement
  fgEl: HTMLElement
  outlineEl: HTMLElement
  slotEl: HTMLElement
  inlineEl: HTMLElement
  delayed: gsap.core.Tween[]
  cancelled: () => boolean
  getScrollFade: () => number
}): Promise<void> {
  const {
    phrase,
    stageEl,
    fgEl,
    outlineEl,
    slotEl,
    inlineEl,
    delayed,
    cancelled,
    getScrollFade,
  } = opts

  const { left: firstWord, right: secondWord } = splitTwoPartPhrase(phrase.text)
  const outlineText = phrase.outline || phrase.text
  if (!firstWord) return

  const headingEl = (slotEl.closest('.hero-heading') as HTMLElement | null) ?? slotEl
  const headingStyles = getComputedStyle(headingEl)
  const baseFontPx = Number.parseFloat(headingStyles.fontSize) || 48
  const fontFamily = headingStyles.fontFamily
  const fontWeight = headingStyles.fontWeight
  const letterSpacing = headingStyles.letterSpacing
  const fontPx = motionHeadlineFontPx({
    text: phrase.text,
    basePx: baseFontPx,
    maxWidth: motionMaxTextWidth(),
    fontFamily,
    fontWeight,
    letterSpacing,
  })
  const textColor = getGold500Color()
  const outlineStroke = getOutlineStrokeColor()
  const showOutline = isMotionDesktop()
  const mobileWrap = !showOutline

  const applyStageFade = () => {
    const fade = getScrollFade()
    if (fade >= 0.995) {
      gsap.set(stageEl, {
        opacity: 1,
        clearProps: 'transform',
        color: textColor,
      })
      return
    }
    // Opacity only — y/scale on reverse reads as copy sliding down into place
    gsap.set(stageEl, {
      opacity: fade,
      y: 0,
      scale: 1,
      color: textColor,
    })
  }

  const rtlText = containsRtlScript(phrase.text)
  const fgFont = rtlText ? resolveHeeboStack(fontFamily) : fontFamily

  const charStyle = [
    `font-family:${fgFont}`,
    `font-weight:${fontWeight}`,
    `font-size:${fontPx}px`,
    `letter-spacing:${letterSpacing}`,
    'text-transform:uppercase',
    `color:${textColor}`,
    'display:inline-block',
    'transform-origin:50% 50%',
    'line-height:1',
    'white-space:pre',
  ].join(';')

  const makeChar = (char: string) => {
    const span = document.createElement('span')
    span.className = 'hero-motion-char'
    span.style.cssText = charStyle
    span.textContent = char === ' ' ? '\u00A0' : char
    return span
  }

  stageEl.style.display = 'block'
  gsap.set(inlineEl, { opacity: 0 })
  applyStageFade()

  fgEl.replaceChildren()
  outlineEl.replaceChildren()
  outlineEl.textContent = ''
  gsap.set(fgEl, {
    fontSize: `${fontPx}px`,
    fontFamily: fgFont,
    fontWeight,
    letterSpacing,
    lineHeight: mobileWrap ? 1.12 : 1,
    width: 'auto',
    height: 'auto',
    scale: 1,
    rotation: 0,
    skewX: 0,
    skewY: 0,
    x: 0,
    y: 0,
    xPercent: -50,
    yPercent: -50,
    left: '50%',
    top: '50%',
    opacity: 1,
    zIndex: 2,
    maxWidth: mobileWrap ? motionMaxTextWidth() : 'none',
    whiteSpace: mobileWrap ? 'normal' : 'nowrap',
    textAlign: 'center',
    direction: rtlText ? 'rtl' : 'ltr',
  })
  gsap.set(outlineEl, {
    fontSize: '',
    lineHeight: 'normal',
    scale: 1,
    x: 0,
    y: 0,
    xPercent: -50,
    yPercent: -50,
    left: '50%',
    top: '50%',
    opacity: showOutline ? 1 : 0,
    zIndex: 1,
  })

  const liveSlot = headingEl.getBoundingClientRect()
  const posX = liveSlot.left + liveSlot.width / 2 - window.innerWidth / 2
  const posY = liveSlot.top + liveSlot.height / 2 - window.innerHeight / 2

  const row = document.createElement('div')
  row.style.cssText = mobileWrap
    ? `display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;max-width:${motionMaxTextWidth()}px;white-space:normal;line-height:1.12;text-align:center;gap:0 0.25em;direction:${rtlText ? 'rtl' : 'ltr'};`
    : `display:inline-flex;align-items:baseline;justify-content:flex-start;white-space:nowrap;line-height:1;direction:${rtlText ? 'rtl' : 'ltr'};`

  const word1El = document.createElement('span')
  word1El.style.cssText = 'display:inline-flex;align-items:baseline;line-height:1;'
  const word2El = document.createElement('span')
  word2El.style.cssText = 'display:inline-flex;align-items:baseline;line-height:1;'
  const gapEl = document.createElement('span')
  gapEl.style.cssText = charStyle
  gapEl.textContent = '\u00A0'

  const firstLetter = makeChar(firstWord[0])
  const restFirst = firstWord.slice(1).split('').map(makeChar)
  word1El.appendChild(firstLetter)

  row.appendChild(word1El)
  fgEl.appendChild(row)
  gsap.set(fgEl, { x: posX, y: posY, scale: 1, opacity: 1 })

  // Measure final phrase width so we can park the first letter on the left of a centred line
  const measure = document.createElement('div')
  measure.style.cssText = [
    'position:absolute',
    'left:-99999px',
    'top:0',
    'visibility:hidden',
    'display:inline-flex',
    'white-space:nowrap',
    'line-height:1',
    `font-family:${fgFont}`,
    `font-weight:${fontWeight}`,
    `font-size:${fontPx}px`,
    `letter-spacing:${letterSpacing}`,
    'text-transform:uppercase',
    `direction:${rtlText ? 'rtl' : 'ltr'}`,
  ].join(';')
  measure.textContent = secondWord ? `${firstWord} ${secondWord}` : firstWord
  document.body.appendChild(measure)
  const fullW = measure.getBoundingClientRect().width
  measure.remove()

  const targetCenterX = window.innerWidth / 2 + posX
  const targetLeft = targetCenterX - fullW / 2
  const targetRight = targetCenterX + fullW / 2
  // LTR: letter parks on the left and the word grows right.
  // RTL: mirror — letter parks on the right and the word grows left.
  const spinDir = rtlText ? -1 : 1

  // 1) First letter: far → flies at camera (3× peak + perspective, decelerates) → settles back
  // Use scale (not fontSize) for the fly so layout/baseline stay centred — no vertical drift.
  const peakPx = Math.min(
    Math.round(window.innerHeight * 0.5 * 3),
    Math.round(window.innerWidth * 0.72 * 3),
  )
  const startPx = Math.max(10, Math.round(fontPx * 0.08))
  const peakScale = peakPx / Math.max(fontPx, 1)
  const startScale = startPx / Math.max(fontPx, 1)

  gsap.set(fgEl, {
    transformPerspective: 1200,
    transformStyle: 'preserve-3d',
    x: posX,
    y: posY,
    xPercent: -50,
    yPercent: -50,
  })
  gsap.set(firstLetter, {
    fontSize: fontPx,
    scale: startScale,
    z: -1600,
    x: 0,
    y: 0,
    rotationX: 20,
    rotationY: 0,
    rotation: 36 * spinDir,
    opacity: 1,
    transformOrigin: '50% 50%',
    force3D: true,
    filter: 'none',
  })

  // Approach: decelerate into the near plane (ease-out)
  await tweenTo(firstLetter, {
    scale: peakScale,
    z: 360,
    rotationX: 0,
    rotation: 8 * spinDir,
    x: 0,
    y: 0,
    duration: 1.15,
    ease: 'power3.out',
    force3D: true,
  })
  if (cancelled()) return

  // Rebound into place — soft ease-out, no spring overshoot
  await tweenTo(firstLetter, {
    scale: 1,
    z: 0,
    rotationX: 0,
    rotationY: 0,
    rotation: 0,
    x: 0,
    y: 0,
    duration: 0.65,
    ease: 'power3.out',
    force3D: true,
  })
  if (cancelled()) return

  // Keep identity transforms — clearProps here caused a 1-frame jerk before the side slide
  gsap.set(firstLetter, {
    scale: 1,
    x: 0,
    y: 0,
    z: 0,
    rotation: 0,
    rotationX: 0,
    rotationY: 0,
    force3D: true,
  })

  // Seamless handoff: lock the current on-screen box, then slide to the phrase edge
  {
    const rect = fgEl.getBoundingClientRect()
    const parkX = rtlText
      ? targetRight - rect.width - window.innerWidth / 2
      : targetLeft - window.innerWidth / 2
    gsap.set(fgEl, {
      transformPerspective: 0,
      transformStyle: 'flat',
      xPercent: 0,
      yPercent: -50,
      x: rect.left - window.innerWidth / 2,
      y: posY,
    })
    await tweenTo(fgEl, {
      x: parkX,
      y: posY,
      duration: 0.5,
      ease: 'power2.inOut',
    })
  }
  if (cancelled()) return
  gsap.set(firstLetter, { force3D: false })

  // Rest of first word: LTR wipe right / RTL wipe left (edge by the first letter stays put)
  if (restFirst.length) {
    const restHost = document.createElement('span')
    restHost.style.cssText =
      'display:inline-block;overflow:hidden;vertical-align:baseline;white-space:nowrap;line-height:1;'
    for (const el of restFirst) {
      gsap.set(el, { opacity: 1, y: 0, scale: 1, x: 0 })
      restHost.appendChild(el)
    }
    word1El.appendChild(restHost)

    const restW = restHost.scrollWidth
    gsap.set(restHost, { width: 0 })
    if (rtlText) {
      // Width growth is left-anchored in the box model — shift fg left in sync so the
      // letter's right edge (phrase start in RTL) stays fixed while the word opens left.
      const startX = Number(gsap.getProperty(fgEl, 'x')) || 0
      await Promise.all([
        tweenTo(restHost, {
          width: restW,
          duration: 0.55,
          ease: 'power3.inOut',
        }),
        tweenTo(fgEl, {
          x: startX - restW,
          duration: 0.55,
          ease: 'power3.inOut',
        }),
      ])
    } else {
      await tweenTo(restHost, {
        width: restW,
        duration: 0.55,
        ease: 'power3.inOut',
      })
    }
    if (cancelled()) return
    gsap.set(restHost, { overflow: 'visible' })
  }
  if (cancelled()) return

  // Second word: rises as a single bottom→top wipe (growth reveal)
  if (secondWord) {
    row.appendChild(gapEl)
    row.appendChild(word2El)

    const riseHost = document.createElement('span')
    riseHost.style.cssText =
      'display:inline-block;overflow:hidden;vertical-align:baseline;white-space:nowrap;line-height:1;'
    const riseInner = document.createElement('span')
    riseInner.style.cssText = 'display:inline-flex;align-items:baseline;line-height:1;'

    const secondChars = secondWord.split('').map((char) => {
      const el = makeChar(char)
      riseInner.appendChild(el)
      return el
    })
    gsap.set(secondChars, { opacity: 1, y: 0, x: 0, scale: 1 })
    riseHost.appendChild(riseInner)
    word2El.appendChild(riseHost)

    // RTL flex places the new word to the left, but the transform is left-anchored —
    // shift x so the phrase's right edge (start) stays put and the block stays centred.
    if (rtlText) {
      const extra = gapEl.getBoundingClientRect().width + word2El.getBoundingClientRect().width
      const curX = Number(gsap.getProperty(fgEl, 'x')) || 0
      gsap.set(fgEl, { x: curX - extra })
    }

    gsap.set(riseHost, { clipPath: 'inset(100% 0 0 0)' })
    await tweenTo(riseHost, {
      clipPath: 'inset(0% 0 0 0)',
      duration: 0.7,
      ease: 'power2.out',
      force3D: false,
    })
    if (cancelled()) return
    gsap.set(riseHost, { overflow: 'visible', clipPath: 'none' })
  }
  if (cancelled()) return

  // RTL only: left-anchored box growth drifts the phrase; snap back to slot centre.
  // LTR is already parked on targetLeft — recentring here causes a visible left jerk.
  if (rtlText) {
    const rect = fgEl.getBoundingClientRect()
    gsap.set(fgEl, {
      xPercent: -50,
      yPercent: -50,
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: posY,
    })
    gsap.set(fgEl, { x: posX, y: posY })
  }
  // 3) Outline words (desktop only): first from right, second from left (mirrored in RTL)
  let leftHost: HTMLElement | null = null
  let rightHost: HTMLElement | null = null
  let fromX = 0
  let flyFirst = 0
  let flySecond = 0
  const { left: outlineLeft, right: outlineRight } = splitTwoPartPhrase(outlineText)

  if (showOutline) {
    const padX = window.innerWidth * 0.04
    const padY = window.innerHeight * 0.06
    const slotCenterY = liveSlot.top + liveSlot.height / 2
    const maxOutlineW = window.innerWidth - padX * 2
    const maxOutlineH =
      2 * Math.max(40, Math.min(slotCenterY - padY, window.innerHeight - slotCenterY - padY))

    outlineEl.replaceChildren()

    const outlineRow = document.createElement('div')
    const rtl = isMotionRtl()
    outlineRow.style.cssText = `display:inline-flex;align-items:baseline;justify-content:center;gap:0.28em;white-space:nowrap;line-height:normal;direction:${rtl ? 'rtl' : 'ltr'};`

    leftHost = document.createElement('div')
    leftHost.style.cssText = 'flex:0 0 auto;overflow:visible;'
    outlineRow.appendChild(leftHost)

    rightHost = document.createElement('div')
    rightHost.style.cssText = 'flex:0 0 auto;overflow:visible;'
    if (outlineRight) outlineRow.appendChild(rightHost)

    outlineEl.appendChild(outlineRow)

    const probeHost = document.createElement('div')
    probeHost.style.cssText =
      'position:absolute;left:0;top:0;opacity:0;pointer-events:none;z-index:-1;'
    outlineEl.appendChild(probeHost)
    const { fontPx: sharedOutlineFontPx } = buildMaskedOutline({
      host: probeHost,
      text: outlineText,
      fontFamily,
      fontWeight,
      letterSpacing,
      outlineStroke,
      maxW: maxOutlineW,
      maxH: maxOutlineH,
      asLetters: false,
    })
    probeHost.remove()

    buildMaskedOutline({
      host: leftHost,
      text: outlineLeft || outlineText,
      fontFamily,
      fontWeight,
      letterSpacing,
      outlineStroke,
      maxW: maxOutlineW,
      maxH: maxOutlineH,
      asLetters: false,
      fontPx: sharedOutlineFontPx,
    })
    if (outlineRight) {
      buildMaskedOutline({
        host: rightHost,
        text: outlineRight,
        fontFamily,
        fontWeight,
        letterSpacing,
        outlineStroke,
        maxW: maxOutlineW,
        maxH: maxOutlineH,
        asLetters: false,
        fontPx: sharedOutlineFontPx,
      })
    }

    let outlineScale = 1
    gsap.set(outlineEl, {
      left: '50%',
      top: '50%',
      xPercent: -50,
      yPercent: -50,
      x: posX,
      y: posY,
      scale: 1,
      autoAlpha: 0,
      zIndex: 1,
      overflow: 'visible',
      lineHeight: 'normal',
      color: 'transparent',
      WebkitTextStroke: '0 transparent',
      textShadow: 'none',
    })
    gsap.set(leftHost, { autoAlpha: 0 })
    if (outlineRight) gsap.set(rightHost, { autoAlpha: 0 })
    {
      const rect = outlineEl.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        const fitW = (window.innerWidth - padX * 2) / rect.width
        const fitH = (window.innerHeight - padY * 2) / rect.height
        outlineScale = Math.min(1, fitW, fitH)
        gsap.set(outlineEl, { scale: outlineScale })
      }
    }

    fromX = Math.max(
      outlineClearanceX(leftHost, outlineScale),
      outlineRight && rightHost ? outlineClearanceX(rightHost, outlineScale) : 0,
    )
    const fly = outlineEntranceX(fromX, 'frame3', rtl)
    flyFirst = fly.first
    flySecond = fly.second
    gsap.set(leftHost, { x: flyFirst, y: 0 })
    if (outlineRight) gsap.set(rightHost, { x: flySecond, y: 0 })
    gsap.set(outlineEl, { autoAlpha: 1 })
    gsap.set(leftHost, { autoAlpha: 1 })
    if (outlineRight && rightHost) gsap.set(rightHost, { autoAlpha: 1 })

    await Promise.all([
      tweenTo(leftHost, { x: 0, duration: 0.85, ease: 'power3.out' }),
      outlineRight && rightHost
        ? tweenTo(rightHost, { x: 0, duration: 0.85, ease: 'power3.out' })
        : Promise.resolve(),
    ])
    if (cancelled()) return
  }

  inlineEl.replaceChildren()
  const inlineChars = renderChars(inlineEl, phrase.text)
  gsap.set(inlineChars, { opacity: 1, x: 0, y: 0, scale: 1, skewX: 0, filter: 'none' })

  await wait(1.7, delayed)
  if (cancelled()) return

  const liveFgChars = Array.from(fgEl.querySelectorAll<HTMLElement>('.hero-motion-char'))
  await Promise.all([
    showOutline && leftHost
      ? tweenTo(leftHost, { x: flyFirst, duration: 0.55, ease: 'power3.in' })
      : Promise.resolve(),
    showOutline && outlineRight && rightHost
      ? tweenTo(rightHost, { x: flySecond, duration: 0.55, ease: 'power3.in' })
      : Promise.resolve(),
    kineticSlamOut(liveFgChars),
  ])
  if (cancelled()) return

  gsap.set(inlineEl, { opacity: 0 })
  stageEl.style.display = 'none'
  gsap.set(fgEl, { fontSize: '', scale: 1, x: 0, y: 0, xPercent: -50, opacity: 1, maxWidth: '', whiteSpace: '' })
  gsap.set(outlineEl, { scale: 1, x: 0, y: 0, opacity: 1 })
  fgEl.replaceChildren()
  outlineEl.replaceChildren()
  outlineEl.textContent = ''
}

/**
 * Frame 4 — full phrase in a red frame:
 * 1) Red 3px border stretches from centre to full text width; fill + white text
 *    reveal top → bottom
 * 2) Short hold → red plate retracts top → bottom; text fills red top → bottom;
 *    then each letter flips in-plane (scaleX) and turns gold-500; border fades
 * 3) Outline split mid-height: top half from the right, bottom from the left
 * 4) Hold → exit
 */
async function playFrame4(opts: {
  phrase: MotionPhrase
  stageEl: HTMLElement
  fgEl: HTMLElement
  outlineEl: HTMLElement
  slotEl: HTMLElement
  inlineEl: HTMLElement
  delayed: gsap.core.Tween[]
  cancelled: () => boolean
  getScrollFade: () => number
}): Promise<void> {
  const {
    phrase,
    stageEl,
    fgEl,
    outlineEl,
    slotEl,
    inlineEl,
    delayed,
    cancelled,
    getScrollFade,
  } = opts

  const mainText = phrase.text.trim()
  const outlineText = phrase.outline || phrase.text
  if (!mainText) return

  const headingEl = (slotEl.closest('.hero-heading') as HTMLElement | null) ?? slotEl
  const headingStyles = getComputedStyle(headingEl)
  const baseFontPx = Number.parseFloat(headingStyles.fontSize) || 48
  const fontFamily = headingStyles.fontFamily
  const fontWeight = headingStyles.fontWeight
  const letterSpacing = headingStyles.letterSpacing
  // Frame padding + 3px border each side
  const fontPx = motionHeadlineFontPx({
    text: mainText,
    basePx: baseFontPx,
    maxWidth: motionMaxTextWidth(20),
    fontFamily,
    fontWeight,
    letterSpacing,
  })
  const textColor = getGold500Color()
  const outlineStroke = getOutlineStrokeColor()
  const red =
    getComputedStyle(document.documentElement).getPropertyValue('--erythro-500').trim() || '#E52421'
  const finalTextColor = getGold500Color()
  const showOutline = isMotionDesktop()
  const mobileWrap = !showOutline

  const applyStageFade = () => {
    const fade = getScrollFade()
    if (fade >= 0.995) {
      gsap.set(stageEl, {
        opacity: 1,
        clearProps: 'transform',
        color: textColor,
      })
      return
    }
    // Opacity only — y/scale on reverse reads as copy sliding down into place
    gsap.set(stageEl, {
      opacity: fade,
      y: 0,
      scale: 1,
      color: textColor,
    })
  }

  stageEl.style.display = 'block'
  gsap.set(inlineEl, { opacity: 0 })
  applyStageFade()

  fgEl.replaceChildren()
  outlineEl.replaceChildren()
  outlineEl.textContent = ''
  gsap.set(fgEl, {
    fontSize: `${fontPx}px`,
    fontFamily,
    fontWeight,
    letterSpacing,
    lineHeight: 1,
    width: 'auto',
    height: 'auto',
    scale: 1,
    rotation: 0,
    skewX: 0,
    skewY: 0,
    x: 0,
    y: 0,
    xPercent: -50,
    yPercent: -50,
    left: '50%',
    top: '50%',
    opacity: 1,
    zIndex: 2,
  })
  gsap.set(outlineEl, {
    fontSize: '',
    lineHeight: 'normal',
    scale: 1,
    x: 0,
    y: 0,
    xPercent: -50,
    yPercent: -50,
    left: '50%',
    top: '50%',
    opacity: 1,
    zIndex: 1,
  })

  const liveSlot = headingEl.getBoundingClientRect()
  const posX = liveSlot.left + liveSlot.width / 2 - window.innerWidth / 2
  const posY = liveSlot.top + liveSlot.height / 2 - window.innerHeight / 2

  const box = document.createElement('div')
  box.style.cssText = [
    `border:3px solid ${red}`,
    'background:transparent',
    'display:block',
    'box-sizing:border-box',
    'overflow:hidden',
    'flex:0 0 auto',
    'transform-origin:50% 50%',
    'position:relative',
  ].join(';')

  // Measure with a temporary text node, then move text inside the fill clip.
  // Glyph spans exist from the start — splitting later (esp. Cyrillic) jerks layout.
  const rtlText = containsRtlScript(mainText)
  const fgFont = rtlText ? resolveHeeboStack(fontFamily) : fontFamily
  const textEl = document.createElement('span')
  textEl.style.cssText = [
    `font-family:${fgFont}`,
    `font-weight:${fontWeight}`,
    `font-size:${fontPx}px`,
    `letter-spacing:${letterSpacing}`,
    'text-transform:uppercase',
    'color:#ffffff',
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    mobileWrap ? 'flex-wrap:wrap' : 'flex-wrap:nowrap',
    'line-height:1.12',
    mobileWrap ? 'white-space:normal' : 'white-space:nowrap',
    mobileWrap ? `max-width:${motionMaxTextWidth(24)}px` : '',
    'text-align:center',
    'padding:0.1em 0.32em',
    'box-sizing:border-box',
    `direction:${rtlText ? 'rtl' : 'ltr'}`,
  ]
    .filter(Boolean)
    .join(';')

  const flipChars: HTMLElement[] = []
  for (const char of mainText) {
    const span = document.createElement('span')
    span.className = 'hero-motion-char'
    span.style.cssText =
      'display:inline-block;white-space:pre;transform-origin:50% 50%;line-height:1;letter-spacing:normal;color:#ffffff;'
    span.textContent = char === ' ' ? '\u00A0' : char
    textEl.appendChild(span)
    flipChars.push(span)
  }

  box.appendChild(textEl)
  fgEl.appendChild(box)
  gsap.set(fgEl, { x: posX, y: posY, scale: 1, opacity: 1 })

  const boxRect = box.getBoundingClientRect()
  const targetW = Math.max(boxRect.width, 8)
  const targetH = Math.max(boxRect.height, fontPx)

  const fillEl = document.createElement('div')
  fillEl.style.cssText = [
    'position:absolute',
    'left:0',
    'top:0',
    'width:100%',
    'height:0%',
    `background:${red}`,
    'overflow:hidden',
    'pointer-events:none',
    'z-index:1',
  ].join(';')

  // Full-size text locked to the box; fill height clips it top → bottom with the red
  textEl.style.cssText += [
    'position:absolute',
    'left:0',
    'top:0',
    `width:${targetW}px`,
    `height:${targetH}px`,
  ].join(';')

  fillEl.appendChild(textEl)
  box.appendChild(fillEl)

  gsap.set(box, {
    width: 0,
    height: targetH,
    backgroundColor: 'transparent',
  })

  // 1) Border rectangle stretches from centre to full text width
  await tweenTo(box, {
    width: targetW,
    duration: 0.48,
    ease: 'power3.inOut',
  })
  if (cancelled()) return

  // Fill + text reveal together (text only visible where red has covered)
  await wait(0.18, delayed)
  if (cancelled()) return

  await tweenTo(fillEl, {
    height: '100%',
    duration: 0.35,
    ease: 'power2.inOut',
  })
  if (cancelled()) return

  // Plate leaves top → bottom; text fills red top → bottom.
  // Base turns red first; white cover retracts — avoids white AA fringe on red glyphs.
  await wait(0.18, delayed)
  if (cancelled()) return

  box.appendChild(textEl)
  textEl.style.zIndex = '2'
  gsap.set(flipChars, { color: red, textShadow: 'none' })

  const whiteCover = textEl.cloneNode(true) as HTMLElement
  whiteCover.style.zIndex = '3'
  whiteCover.style.pointerEvents = 'none'
  whiteCover.querySelectorAll<HTMLElement>('.hero-motion-char').forEach((el) => {
    el.style.color = '#ffffff'
    el.style.textShadow = 'none'
  })
  box.appendChild(whiteCover)

  gsap.set(fillEl, {
    top: 'auto',
    bottom: 0,
    height: '100%',
    zIndex: 1,
    force3D: false,
  })
  gsap.set(whiteCover, { clipPath: 'inset(0% 0 0% 0)' })

  await Promise.all([
    tweenTo(fillEl, {
      height: '0%',
      duration: 0.35,
      ease: 'power3.inOut',
      force3D: false,
    }),
    tweenTo(whiteCover, {
      clipPath: 'inset(100% 0 0% 0)',
      duration: 0.2,
      ease: 'power3.inOut',
      force3D: false,
    }),
    tweenTo(box, {
      borderColor: 'transparent',
      duration: 0.28,
      ease: 'power2.inOut',
    }),
  ])
  if (cancelled()) return

  whiteCover.remove()
  fillEl.remove()
  gsap.set(flipChars, { color: red, scaleX: 1, x: 0, y: 0, filter: 'none' })

  // Flip on existing glyphs — no DOM rebuild (that jerked Cyrillic)
  await spinCharsFrontal(flipChars, red, finalTextColor)
  if (cancelled()) return

  // 3) Outline (desktop only): top half from right, bottom from left (mirrored in RTL)
  let topHalf: HTMLElement | null = null
  let botHalf: HTMLElement | null = null
  let outlineScale = 1
  let fromX = Math.min(window.innerWidth * 0.55, 720)
  const rtl = isMotionRtl()
  // LTR: top ← right (+), bottom ← left (−); RTL mirrors
  let topFromX = rtl ? -fromX : fromX
  let botFromX = rtl ? fromX : -fromX

  if (showOutline) {
    const padX = window.innerWidth * 0.04
    const padY = window.innerHeight * 0.06
    const slotCenterY = liveSlot.top + liveSlot.height / 2
    const maxOutlineW = window.innerWidth - padX * 2
    const maxOutlineH =
      2 * Math.max(40, Math.min(slotCenterY - padY, window.innerHeight - slotCenterY - padY))

    const probe = document.createElement('div')
    probe.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;'
    document.body.appendChild(probe)
    const { fontPx: sharedOutlineFontPx } = buildMaskedOutline({
      host: probe,
      text: outlineText,
      fontFamily,
      fontWeight,
      letterSpacing,
      outlineStroke,
      maxW: maxOutlineW,
      maxH: maxOutlineH,
      asLetters: false,
    })
    probe.remove()

    outlineEl.replaceChildren()
    outlineEl.style.overflow = 'visible'

    // Build fresh SVGs per half (avoid innerHTML mask-id clones — broken for HE).
    // Size each host from its SVG so the box center matches glyph ink (a taller
    // empty host top-aligns the SVG and reads as outline shifted up).
    const makeHalf = (clip: string) => {
      const host = document.createElement('div')
      host.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;'
      buildMaskedOutline({
        host,
        text: outlineText,
        fontFamily,
        fontWeight,
        letterSpacing,
        outlineStroke,
        maxW: maxOutlineW,
        maxH: maxOutlineH,
        asLetters: false,
        fontPx: sharedOutlineFontPx,
      })
      const svg = host.querySelector('svg')
      const w = Math.max(8, Number(svg?.getAttribute('width') || 1))
      const h = Math.max(8, Number(svg?.getAttribute('height') || 1))
      host.style.width = `${w}px`
      host.style.height = `${h}px`
      host.style.clipPath = clip
      host.style.setProperty('-webkit-clip-path', clip)
      return { host, w, h }
    }

    const top = makeHalf('inset(0px 0px 50% 0px)')
    const bot = makeHalf('inset(50% 0px 0px 0px)')
    topHalf = top.host
    botHalf = bot.host
    const outlineW = Math.max(top.w, bot.w)
    const outlineH = Math.max(top.h, bot.h)
    outlineEl.style.width = `${outlineW}px`
    outlineEl.style.height = `${outlineH}px`
    outlineEl.appendChild(topHalf)
    outlineEl.appendChild(botHalf)

    outlineScale = Math.min(
      1,
      (window.innerWidth - padX * 2) / Math.max(outlineW, 1),
      (window.innerHeight - padY * 2) / Math.max(outlineH, 1),
    )
    fromX = Math.max(
      outlineClearanceX(topHalf, outlineScale),
      outlineClearanceX(botHalf, outlineScale),
    )
    topFromX = (rtl ? -fromX : fromX) / Math.max(outlineScale, 0.01)
    botFromX = (rtl ? fromX : -fromX) / Math.max(outlineScale, 0.01)

    // Align outline glyph center to FG glyph center (box centers diverge:
    // SVG alphabetic bbox vs HTML line-box + padding/border).
    let outlineY = posY
    {
      gsap.set(outlineEl, {
        x: posX,
        y: posY,
        scale: outlineScale,
        opacity: 1,
        zIndex: 1,
        overflow: 'visible',
        color: 'transparent',
        WebkitTextStroke: '0 transparent',
        textShadow: 'none',
      })
      const stroke = outlineEl.querySelector('svg text[fill="none"]') as SVGTextElement | null
      const svg = stroke?.ownerSVGElement
      const ctm = stroke?.getScreenCTM()
      if (stroke && svg && ctm) {
        try {
          const b = stroke.getBBox()
          const mid = svg.createSVGPoint()
          mid.x = b.x + b.width / 2
          mid.y = b.y + b.height / 2
          const screen = mid.matrixTransform(ctm)
          const chars = fgEl.querySelectorAll<HTMLElement>('.hero-motion-char')
          let fgTop = Infinity
          let fgBot = -Infinity
          chars.forEach((c) => {
            const r = c.getBoundingClientRect()
            fgTop = Math.min(fgTop, r.top)
            fgBot = Math.max(fgBot, r.bottom)
          })
          if (Number.isFinite(fgTop) && Number.isFinite(fgBot) && fgBot > fgTop) {
            const fgCy = (fgTop + fgBot) / 2
            const dyScreen = fgCy - screen.y
            outlineY = posY + dyScreen / Math.max(outlineScale, 0.01)
            gsap.set(outlineEl, { y: outlineY })
          }
        } catch {
          /* keep posY */
        }
      }
    }

    gsap.set(topHalf, { x: topFromX, y: 0, opacity: 1 })
    gsap.set(botHalf, { x: botFromX, y: 0, opacity: 1 })

    await Promise.all([
      tweenTo(topHalf, { x: 0, duration: 0.9, ease: 'power3.out' }),
      tweenTo(botHalf, { x: 0, duration: 0.9, ease: 'power3.out' }),
    ])
    if (cancelled()) return
  }

  inlineEl.replaceChildren()
  const inlineChars = renderChars(inlineEl, mainText)
  gsap.set(inlineChars, { opacity: 1, x: 0, y: 0, scale: 1, skewX: 0, filter: 'none' })

  await wait(1.7, delayed)
  if (cancelled()) return

  // Whole red frame exits with blur — char slam inside overflow looked broken
  await Promise.all([
    showOutline && topHalf
      ? tweenTo(topHalf, { x: topFromX, duration: 0.5, ease: 'power2.in' })
      : Promise.resolve(),
    showOutline && botHalf
      ? tweenTo(botHalf, { x: botFromX, duration: 0.5, ease: 'power2.in' })
      : Promise.resolve(),
    exitBlockBlur(box, -1),
  ])
  if (cancelled()) return

  gsap.set(inlineEl, { opacity: 0 })
  stageEl.style.display = 'none'
  gsap.set(fgEl, { fontSize: '', scale: 1, x: 0, y: 0, opacity: 1 })
  gsap.set(outlineEl, { scale: 1, x: 0, y: 0, opacity: 1, width: '', height: '' })
  fgEl.replaceChildren()
  outlineEl.replaceChildren()
  outlineEl.textContent = ''
}

/** Shared mobile headline size so phrase swaps don't resize the hero stack. */
function resolveSharedMobileFontPx(
  texts: string[],
  opts: {
    basePx: number
    fontFamily: string
    fontWeight: string
    letterSpacing: string
    minPx?: number
  },
): number {
  const maxWidth = motionMobileMaxWidth()
  let shared = Number.POSITIVE_INFINITY
  for (const text of texts) {
    if (!text.trim()) continue
    shared = Math.min(
      shared,
      motionHeadlineFontPx({
        text,
        maxWidth,
        basePx: opts.basePx,
        fontFamily: opts.fontFamily,
        fontWeight: opts.fontWeight,
        letterSpacing: opts.letterSpacing,
        minPx: opts.minPx ?? 22,
      }),
    )
  }
  return Number.isFinite(shared) ? shared : Math.round(Math.min(window.innerWidth * 0.11, 48))
}

/** Approximate wrapped phrase height at a given size (plain text ≈ char-word layout). */
function measureWrappedPhraseHeight(
  text: string,
  fontPx: number,
  maxWidth: number,
  fontFamily: string,
  fontWeight: string,
  letterSpacing: string,
): number {
  const el = document.createElement('div')
  el.style.cssText = [
    'position:absolute',
    'left:-99999px',
    'top:0',
    'visibility:hidden',
    `width:${maxWidth}px`,
    'text-align:center',
    'text-transform:uppercase',
    'line-height:1.12',
    'white-space:normal',
    `font-family:${fontFamily}`,
    `font-weight:${fontWeight}`,
    `font-size:${fontPx}px`,
    `letter-spacing:${letterSpacing}`,
  ].join(';')
  el.textContent = text
  document.body.appendChild(el)
  const h = el.getBoundingClientRect().height
  el.remove()
  return h
}

/** Placeholder frames 5+ until designed shot-by-shot. */
async function playPlaceholderFrame(opts: {
  phrase: MotionPhrase
  inlineEl: HTMLElement
  slotEl: HTMLElement
  delayed: gsap.core.Tween[]
  cancelled: () => boolean
  /** Locked size for the whole cycle — avoids subtitle jump on phrase swap. */
  fontPx?: number
}): Promise<void> {
  const { phrase, inlineEl, delayed, cancelled, fontPx } = opts
  gsap.set(inlineEl, {
    opacity: 1,
    ...(fontPx != null
      ? { fontSize: fontPx, maxWidth: motionMobileMaxWidth(), width: '100%' }
      : {}),
  })
  const chars = renderChars(inlineEl, phrase.text)
  await kineticSlamIn(chars)
  if (cancelled()) return
  await wait(2, delayed)
  if (cancelled()) return
  await kineticSlamOut(chars)
  gsap.set(inlineEl, { opacity: 0 })
}

/**
 * Hero motion headlines — frame-by-frame cinematic cycle.
 * Frames 1–4 fully specified; later frames are temporary placeholders.
 */
export default function HeroMotionText({ phrases, className = '' }: HeroMotionTextProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLSpanElement>(null)
  const inlineRef = useRef<HTMLSpanElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<HTMLDivElement>(null)
  const outlineRef = useRef<HTMLDivElement>(null)
  const phrasesKey = phrases.map((p) => `${p.text}\u0002${p.outline}`).join('\u0001')
  // Portal only after mount so SSR HTML matches the first client render.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const slotEl = slotRef.current
    const inlineEl = inlineRef.current
    const stageEl = stageRef.current
    const fgEl = fgRef.current
    const outlineEl = outlineRef.current
    const list = phrases.filter((p) => p.text.trim())
    if (!slotEl || !inlineEl || !stageEl || !fgEl || !outlineEl || !list.length) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const lockMobileHeadlineLayout = (texts: string[]) => {
      if (isMotionDesktop()) return null
      const headingEl = (slotEl.closest('.hero-heading') as HTMLElement | null) ?? slotEl
      const headingStyles = getComputedStyle(headingEl)
      const baseFontPx = Number.parseFloat(headingStyles.fontSize) || 36
      const maxWidth = motionMobileMaxWidth()
      const fontPx = resolveSharedMobileFontPx(texts, {
        basePx: baseFontPx,
        fontFamily: headingStyles.fontFamily,
        fontWeight: headingStyles.fontWeight,
        letterSpacing: headingStyles.letterSpacing,
        minPx: 22,
      })
      let maxH = 0
      for (const text of texts) {
        if (!text.trim()) continue
        maxH = Math.max(
          maxH,
          measureWrappedPhraseHeight(
            text,
            fontPx,
            maxWidth,
            headingStyles.fontFamily,
            headingStyles.fontWeight,
            headingStyles.letterSpacing,
          ),
        )
      }
      gsap.set([inlineEl, slotEl], {
        fontSize: fontPx,
        maxWidth,
        height: maxH > 0 ? maxH : '',
        minHeight: maxH > 0 ? maxH : '',
      })
      // Lock the heading box itself so pre/subtitles don't shift when motion paints.
      gsap.set(headingEl, {
        fontSize: fontPx,
        height: maxH > 0 ? maxH : '',
        minHeight: maxH > 0 ? maxH : '',
      })
      return fontPx
    }

    if (reduced || list.length < 2) {
      lockMobileHeadlineLayout(list.map((p) => p.text))
      inlineEl.textContent = list[0]?.text ?? ''
      gsap.set(inlineEl, { opacity: 1 })
      return
    }

    // Lock mobile type size ASAP so HeroSection intro doesn't later jump when
    // motion starts. Re-measured after fonts.ready (still under splash).
    let mobileFontPx = lockMobileHeadlineLayout(list.map((p) => p.text))

    let runId = 0
    let running = false
    const delayed: gsap.core.Tween[] = []
    // Mirrors HeroAnimation content fade (power1.inOut over the 220vh scrub).
    let scrollFade = 1
    const fadeEase = gsap.parseEase('power1.inOut')
    const getScrollFade = () => scrollFade

    const applyStageScrollFade = () => {
      if (stageEl.style.display === 'none') return
      if (scrollFade >= 0.995) {
        gsap.set(stageEl, { opacity: 1, clearProps: 'transform' })
        return
      }
      // Opacity only — matching HeroAnimation (no y/scale settle on scroll-back)
      gsap.set(stageEl, {
        opacity: scrollFade < 0.04 ? 0 : scrollFade,
        y: 0,
        scale: 1,
      })
    }

    const killMotionTweens = () => {
      delayed.forEach((t) => t.kill())
      delayed.length = 0
      gsap.killTweensOf([inlineEl, fgEl, outlineEl])
      gsap.killTweensOf(inlineEl.querySelectorAll('.hero-motion-char'))
      gsap.killTweensOf(fgEl.querySelectorAll('.hero-motion-char'))
      gsap.killTweensOf(fgEl.querySelectorAll('span'))
      gsap.killTweensOf(outlineEl.querySelectorAll('.hero-motion-outline-char'))
      gsap.killTweensOf(outlineEl.querySelectorAll('tspan'))
    }

    const hideStage = () => {
      stageEl.style.display = 'none'
      gsap.set(stageEl, { opacity: 0, scale: 1, y: 0 })
      fgEl.replaceChildren()
      outlineEl.replaceChildren()
      outlineEl.textContent = ''
      outlineEl.style.width = ''
      outlineEl.style.height = ''
      outlineEl.style.overflow = ''
      // Drop mid-frame transforms so the next locale/cycle starts clean
      // (locale switch otherwise inherits xPercent/fontSize/width from HE/EN).
      gsap.set(fgEl, {
        x: 0,
        y: 0,
        xPercent: -50,
        yPercent: -50,
        left: '50%',
        top: '50%',
        scale: 1,
        rotation: 0,
        rotationX: 0,
        rotationY: 0,
        skewX: 0,
        skewY: 0,
        z: 0,
        opacity: 1,
        fontSize: '',
        width: 'auto',
        height: 'auto',
        maxWidth: '',
        whiteSpace: '',
        filter: 'none',
        transformPerspective: 0,
        transformStyle: 'flat',
        zIndex: 2,
      })
      gsap.set(outlineEl, {
        x: 0,
        y: 0,
        xPercent: -50,
        yPercent: -50,
        left: '50%',
        top: '50%',
        scale: 1,
        opacity: 1,
        width: '',
        height: '',
        filter: 'none',
        zIndex: 1,
        color: 'transparent',
        WebkitTextStroke: '0 transparent',
        textShadow: 'none',
      })
    }

    const showStaticPhrase = () => {
      lockMobileHeadlineLayout(list.map((p) => p.text))
      const chars = renderChars(inlineEl, list[0].text)
      gsap.set(inlineEl, { opacity: 1 })
      gsap.set(chars, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        skewX: 0,
        rotation: 0,
        filter: 'none',
      })
    }

    const stopMotion = () => {
      runId += 1
      running = false
      killMotionTweens()
      hideStage()
      showStaticPhrase()
    }

    const startMotion = () => {
      if (running) return
      running = true
      const myId = ++runId
      const isCancelled = () => myId !== runId

      gsap.set(inlineEl, { opacity: 0 })

      const run = async () => {
        // Wait for locale fonts (Heebo/Inter) so slot + outline measure correctly
        try {
          if (document.fonts?.ready) await document.fonts.ready
        } catch {
          /* ignore */
        }
        if (isCancelled()) return
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })
        if (isCancelled()) return

        // Re-lock after fonts while splash still covers the hero — applying this
        // after splash (when subtitles are visible) was causing the first-frame jump.
        if (!isMotionDesktop()) {
          mobileFontPx = lockMobileHeadlineLayout(list.map((p) => p.text))
        }

        await waitForSplashDone()
        if (isCancelled()) return

        const heading = rootRef.current?.closest('.hero-heading') as HTMLElement | null
        if (heading) gsap.set(heading, { opacity: 1, y: 0 })

        let index = 0
        while (!isCancelled()) {
          const phrase = list[index]
          // Phones: simple inline slam only — no portal/outline/cinematic shots
          // (those overflow horizontally and break wrapping layouts).
          if (!isMotionDesktop()) {
            hideStage()
            await playPlaceholderFrame({
              phrase,
              inlineEl,
              slotEl,
              delayed,
              cancelled: isCancelled,
              fontPx: mobileFontPx ?? 28,
            })
          } else if (index === 0) {
            await playFrame1({
              phrase,
              stageEl,
              fgEl,
              outlineEl,
              slotEl,
              inlineEl,
              delayed,
              cancelled: isCancelled,
              getScrollFade,
            })
          } else if (index === 1) {
            await playFrame2({
              phrase,
              stageEl,
              fgEl,
              outlineEl,
              slotEl,
              inlineEl,
              delayed,
              cancelled: isCancelled,
              getScrollFade,
            })
          } else if (index === 2) {
            await playFrame3({
              phrase,
              stageEl,
              fgEl,
              outlineEl,
              slotEl,
              inlineEl,
              delayed,
              cancelled: isCancelled,
              getScrollFade,
            })
          } else if (index === 3) {
            await playFrame4({
              phrase,
              stageEl,
              fgEl,
              outlineEl,
              slotEl,
              inlineEl,
              delayed,
              cancelled: isCancelled,
              getScrollFade,
            })
          } else {
            await playPlaceholderFrame({
              phrase,
              inlineEl,
              slotEl,
              delayed,
              cancelled: isCancelled,
            })
          }
          if (isCancelled()) break
          index = (index + 1) % list.length
        }

        if (myId === runId) running = false
      }

      void run()
    }

    // Observe the scroll wrapper (220vh on desktop / sticky h-screen on mobile),
    // NOT the inner lg:fixed layer — that stays in the viewport forever.
    const heroSection =
      (rootRef.current?.closest('[data-hero-scroll-root]') as HTMLElement | null) ||
      (rootRef.current?.closest('[class*="220vh"]') as HTMLElement | null) ||
      (rootRef.current?.closest('.sticky.top-0') as HTMLElement | null) ||
      rootRef.current

    // Same scrub fade as HeroAnimation content — desktop + mobile (fixed portal
    // otherwise stays visible over later sections while sticky hero sticks).
    const mm = gsap.matchMedia()
    const bindScrollFade = (query: string, end: string) => {
      mm.add(query, () => {
        if (!heroSection) return
        const st = ScrollTrigger.create({
          trigger: heroSection,
          start: 'top top',
          end,
          scrub: true,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          onUpdate: (self) => {
            scrollFade = self.progress <= 0 ? 1 : 1 - fadeEase(self.progress)
            applyStageScrollFade()
            if (scrollFade < 0.04 && stageEl.style.display !== 'none') {
              gsap.set(stageEl, { opacity: 0 })
            }
          },
          onLeaveBack: () => {
            scrollFade = 1
            applyStageScrollFade()
          },
        })
        return () => st.kill()
      })
    }
    bindScrollFade('(min-width: 1024px)', 'bottom bottom')
    // Mobile sticky hero: fade across one viewport of document scroll
    bindScrollFade('(max-width: 1023px)', 'bottom top')

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) startMotion()
        else stopMotion()
      },
      {
        threshold: 0,
        // Mobile sticky can stay "intersecting" — rely on scroll fade + this
        // larger bottom margin so leave fires earlier when possible.
        rootMargin: '0px 0px -35% 0px',
      },
    )
    if (heroSection) {
      io.observe(heroSection)
      // Mid-page reload skips splash and must NOT start the fixed cinematic
      // portal (outline flash over Lets Talk / FAQ). Only run while the hero
      // scroll root actually intersects the viewport.
      const rect = heroSection.getBoundingClientRect()
      const vh = window.innerHeight
      const visiblyInHero = rect.bottom > vh * 0.35 && rect.top < vh * 0.65
      if (visiblyInHero) startMotion()
      else hideStage()
    } else {
      startMotion()
    }
    return () => {
      mm.revert()
      io.disconnect()
      stopMotion()
      const headingEl = slotEl.closest('.hero-heading') as HTMLElement | null
      gsap.set([inlineEl, slotEl], { minHeight: '', height: '', fontSize: '', maxWidth: '' })
      if (headingEl) gsap.set(headingEl, { minHeight: '', height: '', fontSize: '' })
    }
  }, [phrasesKey, mounted])

  const stage = (
    <div
      ref={stageRef}
      className="pointer-events-none fixed inset-0 z-[100] hidden overflow-hidden"
      style={{ contain: 'paint', opacity: 0 }}
      dir="ltr"
      aria-hidden
    >
      <div
        ref={outlineRef}
        className="absolute overflow-visible whitespace-nowrap font-bold uppercase tracking-tight"
        style={{ color: 'transparent', lineHeight: 'normal' }}
      />
      <div
        ref={fgRef}
        className="absolute whitespace-normal text-center font-bold uppercase tracking-tight lg:whitespace-nowrap lg:text-left"
        style={{ lineHeight: 1.12, maxWidth: 'calc(100% - 2rem)' }}
      />
    </div>
  )

  // Slot sized to the longest phrase so shorter ones don't clip longer cycles.
  const slotPhrase =
    phrases.reduce((longest, p) => (p.text.length > longest.length ? p.text : longest), '') ||
    '—'

  return (
    <>
      <div
        ref={rootRef}
        className={`relative inline-flex min-w-0 w-full max-w-full items-center justify-center overflow-visible lg:w-auto ${className}`}
      >
        {/* Layout slot — measures normal size/position for the bounce target */}
        <span
          ref={slotRef}
          aria-hidden
          className="invisible block w-full max-w-full whitespace-normal py-[0.12em] text-center lg:w-auto lg:max-w-[min(100%,calc(100%-2rem))] lg:whitespace-nowrap"
        >
          {slotPhrase}
        </span>

        <span
          ref={inlineRef}
          className="absolute inset-0 flex w-full flex-wrap content-center items-center justify-center whitespace-normal py-[0.12em] text-center opacity-0 lg:w-auto lg:flex-nowrap lg:whitespace-nowrap"
          style={{ transformStyle: 'preserve-3d' }}
          aria-live="polite"
        />
      </div>

      {/* Portal after mount only — avoids SSR/client HTML mismatch */}
      {mounted ? createPortal(stage, document.body) : null}
    </>
  )
}
