'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

/**
 * Brand intro overlay.
 *
 * 1. On a red "Let's talk" backdrop the standalone "e" mark from the logo is
 *    drawn (stroke reveal + fill).
 * 2. The "e" then recedes back into its natural position while the rest of the
 *    erythro.ai wordmark draws in around it.
 * 3. The overlay fades away to reveal the page.
 *
 * The whole sequence is driven by a single GSAP timeline. The enlarge/recede
 * motion is a CSS transform on the SVG wrapper (origin pinned to the "e"
 * centre) so nothing gets clipped by the wide, short SVG viewBox.
 */
export default function SplashScreen() {
  const [done, setDone] = useState(false)

  const overlayRef = useRef<HTMLDivElement | null>(null)
  const logoWrapRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const eRef = useRef<SVGPathElement | null>(null)
  const lettersRef = useRef<(SVGPathElement | null)[]>([])
  const boxRef = useRef<SVGPathElement | null>(null)
  const textRef = useRef<(SVGPathElement | null)[]>([])

  useLayoutEffect(() => {
    // Show the brand intro at most once per browsing session. On repeat
    // navigations within the session we resolve `done` synchronously here —
    // inside useLayoutEffect, before the browser paints — so the opaque overlay
    // never flashes. This also stops the intro from blocking LCP/Speed Index on
    // every page view. (Cold loads, e.g. Lighthouse, still play it once.)
    // Skip the brand intro entirely on mobile/tablet (<1024px). The GSAP timeline
    // (path measuring + the ~4.8s opaque overlay) is the biggest drag on mobile
    // LCP/Speed Index, and the small viewport gains the least from it. Resolved
    // here in useLayoutEffect, before paint, so the overlay never flashes. This
    // mirrors the hero's own desktop-only (>=1024px) animation gate.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setDone(true)
      return
    }

    const SEEN_KEY = 'erythro:splashSeen'
    let alreadySeen = false
    try {
      alreadySeen = sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {
      // sessionStorage can throw in privacy modes — fall back to showing it.
    }
    if (alreadySeen) {
      setDone(true)
      return
    }
    const markSeen = () => {
      try {
        sessionStorage.setItem(SEEN_KEY, '1')
      } catch {
        // ignore storage failures
      }
    }

    const overlay = overlayRef.current
    const wrap = logoWrapRef.current
    const svg = svgRef.current
    const ePath = eRef.current
    if (!overlay || !wrap || !svg || !ePath) return

    // Lock scrolling while the intro plays. Hiding overflow removes the page's
    // vertical scrollbar, which would otherwise widen the layout when the lock
    // is applied and snap it back (a horizontal-scroll flash / jerk) when it is
    // released. We reserve the scrollbar's width on <html> so the content width
    // never changes between locked and unlocked states.
    const root = document.documentElement
    const scrollbarW = window.innerWidth - root.clientWidth
    const prevBodyOverflow = document.body.style.overflow
    const prevRootOverflow = root.style.overflow
    const prevRootPadRight = root.style.paddingRight

    root.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    if (scrollbarW > 0) root.style.paddingRight = `${scrollbarW}px`

    const restoreScroll = () => {
      document.body.style.overflow = prevBodyOverflow
      root.style.overflow = prevRootOverflow
      root.style.paddingRight = prevRootPadRight
    }

    const letters = lettersRef.current.filter(Boolean) as SVGPathElement[]
    const restFills = [boxRef.current, ...textRef.current].filter(Boolean) as SVGPathElement[]

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const finish = () => {
      restoreScroll()
      markSeen()
      setDone(true)
    }

    // ---- Geometry: centre of the "e" within the logo (viewBox 138 x 30) ----
    const VB_W = 138
    const VB_H = 30
    const bbox = ePath.getBBox()
    const eCxFrac = (bbox.x + bbox.width / 2) / VB_W
    const eCyFrac = (bbox.y + bbox.height / 2) / VB_H

    // Measure the SVG itself (not the wrapper): the wrapper carries horizontal
    // padding (px-6) which would otherwise offset the transform origin from the
    // glyph centre and push the enlarged "e" sideways — very noticeable on
    // narrow mobile widths where the padding is a large fraction of the box.
    const svgRect = svg.getBoundingClientRect()
    const wrapW = svgRect.width || 1
    const wrapH = svgRect.height || wrapW * (VB_H / VB_W)
    const SCALE = 4.2
    // Translation that brings the e-centre to the SVG centre (= viewport centre,
    // since the SVG is symmetrically centred in the viewport).
    const tx1 = (0.5 - eCxFrac) * wrapW
    const ty1 = (0.5 - eCyFrac) * wrapH

    gsap.set(wrap, { opacity: 1 })
    gsap.set(svg, {
      transformOrigin: `${eCxFrac * 100}% ${eCyFrac * 100}%`,
      x: tx1,
      y: ty1,
      scale: SCALE,
    })

    const applyRecede = (p: number) => {
      const s = SCALE + (1 - SCALE) * p
      gsap.set(svg, { x: tx1 * (1 - p), y: ty1 * (1 - p), scale: s })
    }

    // ---- Prepare every path for a "draw" (stroke reveal) ----
    // Each path is clipped to its own shape, so only the *inner* half of the
    // (centred) stroke is visible — an inside outline that never spills past the
    // silhouette or jumps when the fill arrives. The width is doubled so the
    // visible inner half equals the intended line thickness. The stroke is
    // removed entirely once a glyph has filled, keeping the final logo crisp.
    const STROKE_W = 0.55
    const prep = (el: SVGPathElement, stroke: string, hidden: boolean) => {
      const len = el.getTotalLength()
      gsap.set(el, {
        fillOpacity: 0,
        // Keep the path fully hidden until its own draw begins so stray
        // start-caps of not-yet-drawn glyphs don't flash on screen.
        opacity: hidden ? 0 : 1,
        stroke,
        strokeWidth: STROKE_W * 2,
        strokeDasharray: len,
        strokeDashoffset: len,
      })
    }

    prep(ePath, '#FFFFFF', false)
    letters.forEach((el) => prep(el, '#FFFFFF', true))
    if (boxRef.current) prep(boxRef.current, '#FFFFFF', true)
    textRef.current.forEach((el) => el && prep(el, '#E52421', true))

    if (reduceMotion) {
      gsap.set([ePath, ...letters, ...restFills], {
        opacity: 1,
        fillOpacity: 1,
        strokeWidth: 0,
        strokeDashoffset: 0,
      })
      gsap.set(svg, { x: 0, y: 0, scale: 1 })
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.4,
        delay: 0.6,
        // Restore the scrollbar while the overlay is still opaque so the
        // layout change is hidden, then dissolve to a stable page.
        onStart: restoreScroll,
        onComplete: finish,
      })
      return restoreScroll
    }

    const proxy = { p: 0 }

    const tl = gsap.timeline()

    // Phase 1 — trace the big "e" outline first, hold, then fill it.
    tl.to(ePath, { strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut' })
      .to({}, { duration: 0.15 })
      .to(ePath, { fillOpacity: 1, duration: 0.45, ease: 'power1.out' })
      .to({}, { duration: 0.25 })

    // Phase 2 — "e" recedes into place while the wordmark draws in
    tl.add('recede')
      .to(proxy, {
        p: 1,
        duration: 1.3,
        ease: 'power3.inOut',
        onUpdate: () => applyRecede(proxy.p),
      }, 'recede')
      .set(letters, { opacity: 1 }, 'recede+=0.25')
      .to(letters, {
        strokeDashoffset: 0,
        duration: 0.9,
        stagger: 0.07,
        ease: 'power2.out',
      }, 'recede+=0.25')
      .to(letters, {
        fillOpacity: 1,
        duration: 0.5,
        stagger: 0.07,
        ease: 'power1.out',
      }, 'recede+=0.6')
      .set(restFills, { opacity: 1 }, 'recede+=0.65')
      .to(restFills, {
        strokeDashoffset: 0,
        duration: 0.7,
        ease: 'power2.out',
      }, 'recede+=0.65')
      .to(restFills, {
        fillOpacity: 1,
        duration: 0.45,
        ease: 'power1.out',
      }, 'recede+=1.0')
      // Drop the stroke once everything is filled so no thin outline lingers.
      .set([ePath, ...letters, ...restFills], { strokeWidth: 0 }, 'recede+=1.45')

    // Outro — unlock scroll while the overlay is still fully opaque so the
    // returning scrollbar can't shift / jerk the revealed page.
    tl.to(overlay, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut',
      onStart: restoreScroll,
      onComplete: finish,
    }, '+=0.5')

    return () => {
      tl.kill()
      restoreScroll()
    }
  }, [])

  if (done) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
      style={{
        background:
          'url("/images/lets-talk-bg.webp") 50% / cover no-repeat, radial-gradient(298.86% 50% at 50% 50.08%, var(--erythro-500, #E52421) 0%, var(--erythro-900, #600F0E) 100%)',
        backgroundBlendMode: 'overlay, normal',
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none" />

      <div
        ref={logoWrapRef}
        className="relative z-10 w-full max-w-[280px] sm:max-w-[420px] lg:max-w-[640px] px-6"
        style={{ opacity: 0 }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 138 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]"
          aria-label="Erythro.ai"
        >
          <defs>
            <clipPath id="cp-l0"><use href="#sp-l0" /></clipPath>
            <clipPath id="cp-l1"><use href="#sp-l1" /></clipPath>
            <clipPath id="cp-l2"><use href="#sp-l2" /></clipPath>
            <clipPath id="cp-l3"><use href="#sp-l3" /></clipPath>
            <clipPath id="cp-l4"><use href="#sp-l4" /></clipPath>
            <clipPath id="cp-l5"><use href="#sp-l5" /></clipPath>
            <clipPath id="cp-e"><use href="#sp-e" /></clipPath>
            <clipPath id="cp-box"><use href="#sp-box" /></clipPath>
            <clipPath id="cp-t0"><use href="#sp-t0" /></clipPath>
            <clipPath id="cp-t1"><use href="#sp-t1" /></clipPath>
          </defs>

          {/* rythro letters (white) */}
          <path id="sp-l0" clipPath="url(#cp-l0)" ref={(el) => { lettersRef.current[0] = el }} fill="#FFFFFF" d="M20.1534 23.5004V6.96576H25.3641V9.89976H25.433C25.7501 8.84407 26.2188 8.06258 26.8804 7.58272C27.5283 7.10286 28.3968 6.86979 29.4582 6.86979C30.5196 6.86979 29.9958 6.86979 30.2439 6.8835C30.4921 6.8835 30.7126 6.91092 30.9332 6.92463V11.3805C30.7264 11.3668 30.4093 11.3393 29.9958 11.3119C29.5823 11.2982 29.1825 11.2845 28.8103 11.2845C28.1624 11.2845 27.5972 11.4353 27.101 11.7232C26.6047 12.0112 26.2188 12.4225 25.9431 12.9572C25.6674 13.4919 25.5295 14.1362 25.5295 14.904V23.5004H20.1534Z" />
          <path id="sp-l1" clipPath="url(#cp-l1)" ref={(el) => { lettersRef.current[1] = el }} fill="#FFFFFF" d="M34.1037 29.8757L34.3656 25.79L36.2955 25.8311C36.7366 25.8586 37.0812 25.8311 37.3707 25.7352C37.6464 25.6392 37.8669 25.461 38.0324 25.2142C38.1978 24.9674 38.3218 24.6383 38.4183 24.227L38.6389 23.4867L32.2841 6.96576H37.9083L40.3758 14.6984C40.6928 15.7541 40.9961 16.8098 41.2718 17.8792C41.5475 18.9486 41.8232 20.0317 42.0989 21.1285H40.6653C40.941 20.0317 41.2167 18.9349 41.4924 17.8655C41.7818 16.796 42.0851 15.7404 42.4297 14.6984L44.9661 6.96576H50.5352L43.4085 25.694C43.05 26.6675 42.6089 27.4627 42.0989 28.1071C41.5889 28.7514 40.9685 29.2176 40.2517 29.5329C39.5349 29.8483 38.6665 29.9991 37.6602 29.9991C36.6539 29.9991 36.4471 29.9991 35.8406 29.9717C35.2203 29.9442 34.6413 29.9168 34.1037 29.8757Z" />
          <path id="sp-l2" clipPath="url(#cp-l2)" ref={(el) => { lettersRef.current[2] = el }} fill="#FFFFFF" d="M63.1759 6.96576V11.0651H51.8034V6.96576H63.1759ZM54.4915 2.59217H59.8675V18.0574C59.8675 18.5647 59.9778 18.9211 60.1846 19.1131C60.3914 19.3187 60.7911 19.4147 61.3563 19.4147C61.9215 19.4147 61.9215 19.4147 62.3075 19.4147C62.6934 19.4147 62.9691 19.4147 63.1346 19.3873L63.2862 23.4455C62.9278 23.4455 62.4729 23.5141 61.9077 23.5278C61.3425 23.5415 60.7636 23.5552 60.1846 23.5552C58.2409 23.5552 56.8211 23.1713 55.8837 22.4036C54.9601 21.6358 54.4915 20.4567 54.4915 18.8526V2.59217Z" />
          <path id="sp-l3" clipPath="url(#cp-l3)" ref={(el) => { lettersRef.current[3] = el }} fill="#FFFFFF" d="M71.2125 14.4242V23.5141H65.8364V0.480784H71.1849V11.3393H70.4405C70.9368 9.91347 71.6536 8.77552 72.6047 7.92548C73.5559 7.07544 74.8103 6.63671 76.368 6.63671C77.9257 6.63671 78.6011 6.89721 79.442 7.40449C80.2967 7.92548 80.9446 8.65213 81.4132 9.62556C81.8681 10.5853 82.1025 11.7369 82.1025 13.0806V23.5004H76.7264V14.1637C76.7264 13.1902 76.4921 12.4499 76.0234 11.9426C75.5547 11.4216 74.893 11.1748 74.0246 11.1748C73.1561 11.1748 72.9631 11.2982 72.5358 11.5313C72.1085 11.7644 71.7914 12.1208 71.5571 12.6007C71.3227 13.0806 71.2125 13.6838 71.2125 14.4105V14.4242Z" />
          <path id="sp-l4" clipPath="url(#cp-l4)" ref={(el) => { lettersRef.current[4] = el }} fill="#FFFFFF" d="M85.5211 23.5004V6.96576H90.7318V9.89976H90.7869C91.104 8.84407 91.5727 8.06258 92.2343 7.58272C92.8822 7.10286 93.7507 6.86979 94.8121 6.86979C95.8735 6.86979 95.3497 6.86979 95.5978 6.8835C95.846 6.8835 96.0665 6.91092 96.2871 6.92463V11.3805C96.0803 11.3668 95.7633 11.3393 95.3497 11.3119C94.9362 11.2982 94.5364 11.2845 94.1642 11.2845C93.5163 11.2845 92.9512 11.4353 92.4549 11.7232C91.9586 12.0112 91.5727 12.4225 91.297 12.9572C91.0213 13.4919 90.8834 14.1362 90.8834 14.904V23.5004H85.5073H85.5211Z" />
          <path id="sp-l5" clipPath="url(#cp-l5)" ref={(el) => { lettersRef.current[5] = el }} fill="#FFFFFF" d="M106.295 23.8569C104.558 23.8569 103.028 23.5004 101.732 22.7875C100.436 22.0745 99.43 21.0737 98.7132 19.7849C97.9964 18.4961 97.638 16.988 97.638 15.2468C97.638 13.5056 97.9964 12.0112 98.7132 10.7224C99.43 9.43361 100.436 8.43276 101.732 7.70612C103.028 6.97947 104.558 6.623 106.295 6.623C108.032 6.623 109.548 6.97947 110.844 7.70612C112.14 8.43276 113.146 9.43361 113.863 10.7224C114.58 12.0112 114.938 13.5193 114.938 15.2468C114.938 16.9743 114.58 18.4961 113.863 19.7849C113.146 21.0737 112.14 22.0745 110.844 22.7875C109.548 23.5004 108.032 23.8569 106.295 23.8569ZM106.295 19.6615C106.929 19.6615 107.48 19.4833 107.963 19.1405C108.445 18.784 108.818 18.2905 109.093 17.6324C109.369 16.9743 109.493 16.1791 109.493 15.2742C109.493 14.3693 109.355 13.5467 109.093 12.8886C108.818 12.2442 108.445 11.7369 107.963 11.3942C107.48 11.0377 106.929 10.8732 106.295 10.8732C105.661 10.8732 105.082 11.0514 104.599 11.3942C104.117 11.7369 103.731 12.2442 103.469 12.8886C103.207 13.5467 103.069 14.3419 103.069 15.2742C103.069 16.2065 103.207 16.988 103.469 17.6461C103.731 18.3042 104.103 18.7978 104.599 19.1542C105.082 19.5107 105.647 19.6752 106.295 19.6752V19.6615Z" />

          {/* e mark (white, drawn first) */}
          <path id="sp-e" clipPath="url(#cp-e)" ref={eRef} fill="#FFFFFF" d="M9.16691 19.7986C7.3611 19.4147 6.01019 18.4824 5.72071 16.6041H17.3689C17.4792 15.9734 17.5481 15.1234 17.5481 14.3967C17.5481 9.09086 14.4465 6.41735 9.20827 6.41735C9.19449 6.41735 9.16692 6.41735 9.15313 6.41735V9.96832C9.20827 9.96832 9.26341 9.96832 9.31855 9.96832C11.4414 9.96832 12.5304 11.0514 12.5993 13.2039H9.15313H5.70692H0.510037C0.385974 13.8758 0.31705 14.6024 0.31705 15.3839C0.31705 21.0188 3.8184 23.7472 9.16691 24.0899V19.8123V19.7986Z" />

          {/* .ai box (white) */}
          <path id="sp-box" clipPath="url(#cp-box)" ref={boxRef} fill="#FFFFFF" d="M136.043 6.623H122.63C121.549 6.623 120.672 7.49464 120.672 8.56987V21.91C120.672 22.9852 121.549 23.8569 122.63 23.8569H136.043C137.124 23.8569 138 22.9852 138 21.91V8.56987C138 7.49464 137.124 6.623 136.043 6.623Z" />

          {/* .ai text (red inside the white box) */}
          <path id="sp-t0" clipPath="url(#cp-t0)" ref={(el) => { textRef.current[0] = el }} fill="#E52421" d="M126.214 19.7301C125.745 19.7301 125.332 19.6615 124.973 19.5107C124.615 19.3599 124.339 19.1268 124.132 18.8252C123.926 18.5235 123.829 18.1397 123.829 17.6735C123.829 17.2074 123.898 16.9606 124.036 16.6864C124.174 16.4122 124.367 16.1928 124.601 16.0146C124.835 15.8363 125.125 15.7129 125.456 15.617C125.787 15.521 126.131 15.4661 126.503 15.4387C126.917 15.4113 127.234 15.3702 127.482 15.329C127.73 15.2879 127.91 15.2194 128.02 15.1371C128.13 15.0548 128.185 14.9589 128.185 14.8218V14.7943C128.185 14.6847 128.158 14.6024 128.089 14.5201C128.02 14.4379 127.937 14.383 127.813 14.3419C127.689 14.3008 127.551 14.2734 127.386 14.2734C127.22 14.2734 127.069 14.3008 126.945 14.3419C126.821 14.383 126.71 14.4653 126.641 14.5613C126.572 14.6572 126.517 14.7669 126.49 14.9177L124.091 14.8629C124.146 14.3693 124.298 13.9306 124.56 13.5741C124.822 13.2177 125.208 12.9435 125.69 12.7515C126.173 12.5596 126.779 12.4636 127.482 12.4636C128.185 12.4636 128.488 12.5184 128.902 12.6281C129.316 12.7378 129.66 12.9023 129.95 13.108C130.239 13.3136 130.446 13.5741 130.598 13.8758C130.749 14.1774 130.818 14.5201 130.818 14.904V19.6204H128.268V18.6332H128.24C128.089 18.9074 127.91 19.1268 127.717 19.2913C127.524 19.4558 127.289 19.5655 127.041 19.6341C126.793 19.7026 126.517 19.7438 126.214 19.7438V19.7301ZM127.082 18.0848C127.275 18.0848 127.455 18.0437 127.634 17.9751C127.813 17.9066 127.951 17.7969 128.075 17.6461C128.199 17.4953 128.24 17.3308 128.24 17.1114V16.5493C128.171 16.5767 128.102 16.6041 128.034 16.6178C127.965 16.6315 127.882 16.6589 127.799 16.6864C127.717 16.7138 127.62 16.7275 127.524 16.7412C127.427 16.7549 127.317 16.7823 127.193 16.8098C127.013 16.8372 126.848 16.892 126.724 16.9469C126.6 17.0017 126.49 17.084 126.421 17.1799C126.352 17.2759 126.324 17.3856 126.324 17.4953C126.324 17.605 126.352 17.7283 126.421 17.8106C126.49 17.8929 126.572 17.9614 126.696 18.0163C126.821 18.0711 126.945 18.0848 127.096 18.0848H127.082Z" />
          <path id="sp-t1" clipPath="url(#cp-t1)" ref={(el) => { textRef.current[1] = el }} fill="#E52421" d="M133.451 12.066C133.051 12.066 132.72 11.9426 132.459 11.7095C132.197 11.4765 132.073 11.1748 132.073 10.8184C132.073 10.4619 132.197 10.1603 132.459 9.92719C132.72 9.69411 133.051 9.57072 133.451 9.57072C133.851 9.57072 134.182 9.69411 134.444 9.92719C134.705 10.1603 134.829 10.4619 134.829 10.8184C134.829 11.1748 134.705 11.4765 134.444 11.7095C134.182 11.9426 133.851 12.066 133.451 12.066ZM132.141 19.6067V12.6007H134.774V19.6067H132.141Z" />
        </svg>
      </div>
    </div>
  )
}
