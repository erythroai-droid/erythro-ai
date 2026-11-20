'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useBackdropContrast } from '@/hooks/useBackdropContrast'
import CookieConsent from '@/components/CookieConsent'
import { SiteContentProvider, useSiteContent } from '@/components/SiteContentProvider'
import { CalcCopyProvider, CalcCtaVisualProvider, CalcPaletteProvider, CalcResult, type CalcPalette } from '@/components/audit/CalcReport'
import { leakResultCopy } from '@/lib/leakResultCopy'
import { displayDomain } from '@/components/audit/AuditCalcFlow'
import LeakCalcPanel from '@/components/leak-lp/LeakCalcPanel'
import LeakPromoSlider from '@/components/leak-lp/LeakPromoSlider'
import LeakFinalCta, { LeakFixVisual, leakFixTitle } from '@/components/leak-lp/LeakFinalCta'
import LeakToolsGraph from '@/components/leak-lp/LeakToolsGraph'
import { useLeakCalcFlow } from '@/components/leak-lp/useLeakCalcFlow'
import { Reveal, usePrefersReducedMotion } from '@/components/leak-lp/motion'
import type { SiteContent } from '@/lib/defaultContent'
import type { AuditPageContent } from '@/lib/auditPage'
import { buildLeakLpSampleReportUrl, mainSiteUrl, type AuditLpLocale } from '@/lib/auditLp'
import { tCalc, type Localized } from '@/lib/auditCalcCopy'
import { leakLpCopy as c } from '@/lib/leakLpCopy'
import { bindLeakLpClickTracking, trackLeakLp } from '@/lib/leakLpAnalytics'
import './leakLp.css'

// Result screen is black / white / gray. Colour is added back one accent at a time.
const LK_REPORT_PALETTE: CalcPalette = {
  lilac: { deep: '#1e1e1e', base: '#1e1e1e', mid: '#1e1e1e', soft: '#f0f0f0', wash: '#f7f7f7', ring: '#d6d6d6' },
  coral: '#1e1e1e',
  signedLoss: false,
}

const ENGINES = ['ChatGPT', 'Perplexity', 'Gemini', 'Google']
const WINDOW_ID = 'lk-window'

function Letters({ word }: { word: string }) {
  return (
    <>
      {Array.from(word).map((ch, k) => (
        <span key={k} className="lk-engine-ch">
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </>
  )
}

/** Engine name in the red pill: letters of the old name roll up and out, the new name rolls in from below (GSAP, staggered). */
function EngineSwap() {
  const reduced = usePrefersReducedMotion()
  // `prev` is the name rolling out (null before the first swap).
  const [{ i, prev }, setSwap] = useState<{ i: number; prev: number | null }>({ i: 0, prev: null })
  const inRef = useRef<HTMLSpanElement>(null)
  const outRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setSwap((s) => ({ prev: s.i, i: (s.i + 1) % ENGINES.length })), 3200)
    return () => clearInterval(id)
  }, [reduced])

  useLayoutEffect(() => {
    if (prev === null || reduced) return
    const ctx = gsap.context(() => {
      const out = outRef.current?.children
      const inn = inRef.current?.children
      // Letter by letter: each one leaves and lands on its own beat (clear stagger + a small overshoot on landing).
      if (out?.length) gsap.fromTo(out, { yPercent: 0, opacity: 1 }, { yPercent: -120, opacity: 0, duration: 0.38, ease: 'power2.in', stagger: 0.05 })
      if (inn?.length) gsap.fromTo(inn, { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.07, delay: 0.18 })
    })
    return () => ctx.revert()
  }, [i, prev, reduced])

  const outgoing = prev !== null && prev !== i ? ENGINES[prev] : null
  // Invisible copies of every name share the grid cell, so the pill keeps the longest name's width: the sentence never reflows.
  return (
    <span className="lk-engine" dir="ltr">
      {ENGINES.map((name) => (
        <span key={name} className="lk-engine-sizer" aria-hidden="true">
          {name}
        </span>
      ))}
      {outgoing ? (
        <span key={`out-${outgoing}-${i}`} ref={outRef} className="lk-engine-roll" aria-hidden="true">
          <Letters word={outgoing} />
        </span>
      ) : null}
      <span key={`in-${i}`} ref={inRef} className="lk-engine-roll" aria-label={ENGINES[i]}>
        <Letters word={ENGINES[i]} />
      </span>
    </span>
  )
}

/**
 * Scroll so a section lands exactly under the sticky header. Its position is computed from the flow:
 * main top + heights and margins of the sections before it.
 */
function scrollToStack(target: Element | null) {
  if (!target) return
  const main = target.parentElement
  if (!main) return
  let y = main.getBoundingClientRect().top + window.scrollY
  for (const el of Array.from(main.querySelectorAll<HTMLElement>(':scope > [data-stack]'))) {
    if (el === target) break
    y += el.offsetHeight + parseFloat(getComputedStyle(el).marginBottom || '0')
  }
  const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lk-head')) || 72
  window.scrollTo({ top: Math.max(0, Math.round(y - head)), behavior: 'smooth' })
  history.replaceState(null, '', target.id ? `#${target.id}` : window.location.pathname + window.location.search)
}

// Same wording as the main site's side scroll control.
const SIDE_COPY = {
  top: { en: 'Top', ru: 'Наверх', he: 'למעלה' },
  down: { en: 'Scroll', ru: 'Вниз', he: 'למטה' },
  topAria: { en: 'Back to top', ru: 'Наверх', he: 'חזרה לראש העמוד' },
  downAria: { en: 'Scroll, next section', ru: 'Вниз, следующий раздел', he: 'למטה, למדור הבא' },
} satisfies Record<string, Localized>

/**
 * "There is more below" aids, styled like the main site's side control:
 * desktop — fixed on the right: Top · 01 | track with a red beacon | 06 · Scroll (next section);
 * phones/tablets — a thin "Scroll" cue with the same track at the bottom of the first screen, hidden once scrolling starts.
 * Section positions are computed from the flow (main top + heights + margins).
 */
function ScrollAids({ locale }: { locale: string }) {
  const [active, setActive] = useState(0)
  const [count, setCount] = useState(0)
  const [atTop, setAtTop] = useState(true)
  const tops = useRef<number[]>([])
  const sideRef = useRef<HTMLDivElement>(null)
  const overDark = useBackdropContrast(sideRef, 'light')

  useEffect(() => {
    const els = () => Array.from(document.querySelectorAll<HTMLElement>('.lk-root main [data-stack]'))
    const measure = () => {
      const list = els()
      const main = list[0]?.parentElement
      if (!main) return
      let y = main.getBoundingClientRect().top + window.scrollY
      tops.current = list.map((el) => {
        const top = y
        y += el.offsetHeight + parseFloat(getComputedStyle(el).marginBottom || '0')
        return top
      })
      setCount(list.length)
    }
    const onScroll = () => {
      const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lk-head')) || 72
      const y = window.scrollY + head + window.innerHeight * 0.3
      let i = 0
      tops.current.forEach((t, k) => {
        if (t <= y) i = k
      })
      setActive(i)
      setAtTop(window.scrollY < 40)
    }
    measure()
    onScroll()
    const ro = new ResizeObserver(() => {
      measure()
      onScroll()
    })
    els().forEach((el) => ro.observe(el))
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
    }
  }, [])

  const go = (i: number) => {
    const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lk-head')) || 72
    window.scrollTo({ top: Math.max(0, (tops.current[i] ?? 0) - head), behavior: 'smooth' })
  }

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const last = active >= count - 1
  // Same visual language as the main site's side control: 9px tracked caps, a 1px track with a red beacon.
  return (
    <>
      <div ref={sideRef} data-contrast-ignore="" data-dark={overDark ? '' : undefined} className="lk-side fixed end-[44px] top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-2.5 lg:flex">
        <button type="button" onClick={() => go(0)} className="lk-side-word" aria-label={tCalc(SIDE_COPY.topAria, locale)}>
          {tCalc(SIDE_COPY.top, locale)}
        </button>
        <div className="flex items-center gap-2" aria-label={`${pad2(active + 1)} / ${pad2(count)}`}>
          <span className="lk-side-num">{pad2(active + 1)}</span>
          <span className="lk-side-track" aria-hidden="true">
            <span className="lk-side-beacon" />
          </span>
          <span className="lk-side-num lk-side-num-muted">{pad2(count)}</span>
        </div>
        <button type="button" onClick={() => go(last ? 0 : active + 1)} className="lk-side-word" aria-label={tCalc(SIDE_COPY.downAria, locale)}>
          {tCalc(SIDE_COPY.down, locale)}
        </button>
      </div>
      {/* Phones/tablets: a thin cue at the bottom of the first screen, gone once scrolling starts. */}
      <button type="button" onClick={() => go(1)} className="lk-scroll-hint fixed bottom-5 left-1/2 z-30 lg:hidden" data-hide={atTop ? undefined : ''} aria-label={tCalc(SIDE_COPY.downAria, locale)}>
        <span className="lk-side-word lk-side-word-h">{tCalc(SIDE_COPY.down, locale)}</span>
        <span className="lk-side-track" aria-hidden="true">
          <span className="lk-side-beacon" />
        </span>
      </button>
    </>
  )
}

function SectionHead({ kicker, title, sub, center = false }: { kicker: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={`flex flex-col gap-3 ${center ? 'items-center text-center' : 'items-start text-start'}`}>
      <span className="lk-label">{kicker}</span>
      <h2 className="lk-h2 lk-bar m-0 text-[34px] leading-[1.12] sm:text-[48px]">{title}</h2>
      {sub ? <p className="m-0 text-base ps-[30px] leading-[1.5] text-[var(--lk-muted)]">{sub}</p> : null}
    </div>
  )
}

function LeakLpInner({ locale, page }: { locale: AuditLpLocale; page: AuditPageContent }) {
  const t = (f: Localized) => tCalc(f, locale)
  const flow = useLeakCalcFlow()
  const phone = useSiteContent().siteSettings.phone || ''
  const [waText, setWaText] = useState('')
  const waNumber = phone.replace(/[^0-9]/g, '')
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}` : ''
  const sampleHref = buildLeakLpSampleReportUrl(locale)

  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const { stage, report, pillars } = flow
  const stripDomain =
    stage.name !== 'form' && 'submitted' in stage && stage.submitted.website
      ? displayDomain(stage.submitted.website)
      : ''

  // Sections ([data-stack]) scroll in normal flow; the sticky header height is published as --lk-head for anchors and scroll aids.
  const headRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const html = document.documentElement
    const publishHead = () => {
      const head = Math.round(headRef.current?.offsetHeight ?? 72)
      html.style.setProperty('--lk-head', `${head}px`)
    }
    if (stage.name !== 'form') {
      publishHead()
      window.addEventListener('resize', publishHead)
      return () => {
        window.removeEventListener('resize', publishHead)
        html.style.removeProperty('--lk-head')
      }
    }
    const fit = () => {
      publishHead()
      html.style.scrollPaddingTop = `${Math.round(headRef.current?.offsetHeight ?? 72)}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (headRef.current) ro.observe(headRef.current)
    window.addEventListener('resize', fit)
    // Opened with #checks / #how / #faq: land that section right under the sticky header.
    if (window.location.hash.length > 1) {
      try {
        const target = document.querySelector(window.location.hash)
        if (target?.hasAttribute('data-stack')) window.setTimeout(() => scrollToStack(target), 150)
      } catch {
        // Not a valid selector: leave the browser's default behaviour.
      }
    }
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', fit)
      html.style.scrollPaddingTop = ''
      html.style.removeProperty('--lk-head')
    }
  }, [stage.name])
  const inFunnel = stage.name !== 'form' || flow.formStep === 2

  // GA4 funnel: one lp_step per step (form → details → waiting → ready / failed). Dev ?preview= is not reported.
  const gaStep = stage.name === 'form' ? (flow.formStep === 2 ? 'details' : 'form') : stage.name === 'opening' ? '' : stage.name
  const gaReportId = 'submitted' in stage && stage.submitted ? String(stage.submitted.id ?? '') : ''
  useEffect(() => {
    if (!gaStep || new URLSearchParams(window.location.search).has('preview')) return
    trackLeakLp('lp_step', { step: gaStep, report_id: gaStep === 'form' || gaStep === 'details' ? undefined : gaReportId })
  }, [gaStep, gaReportId])

  // GA4: first typing in the form, and clicks on WhatsApp / report links / CTAs anywhere on the landing.
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.lk-root')
    if (!root) return
    const unbind = bindLeakLpClickTracking(root, sampleHref)
    let started = false
    // First typing, not focus: the website field can be focused on load.
    const onInput = (e: Event) => {
      if (started || !(e.target as Element | null)?.closest?.(`#${WINDOW_ID} input, #${WINDOW_ID} textarea`)) return
      started = true
      trackLeakLp('form_start')
    }
    root.addEventListener('input', onInput)
    return () => {
      unbind()
      root.removeEventListener('input', onInput)
    }
  }, [sampleHref])

  // Final CTA: smooth scroll back up to the form, then put the cursor in the first field.
  const toForm = () => {
    trackLeakLp('lp_cta_click', { cta: 'to_form' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // First visible field (skips the hidden anti-spam trap input).
    window.setTimeout(() => {
      const field = Array.from(document.querySelectorAll<HTMLInputElement>(`#${WINDOW_ID} input`)).find((i) => i.offsetParent !== null && i.type !== 'hidden' && !i.name.startsWith('hp_'))
      field?.focus({ preventScroll: true })
    }, 700)
  }

  const header = (
    <header ref={headRef} className="sticky top-0 z-40 border-b border-[var(--lk-line)] bg-[var(--lk-bg)]/85 backdrop-blur-md">
      {/* Black strip: form teaser, or on result — site + “audit report · 230+ checks” (moved up from the hero). */}
      {stage.name === 'form' || stripDomain || stage.name === 'ready' ? (
        <div className="bg-[var(--lk-dark)]">
          <div className="mx-auto flex h-8 max-w-[1200px] items-center justify-center overflow-hidden whitespace-nowrap px-4 text-center text-[11px] leading-none text-white/70 sm:text-[12px]">
            {stage.name === 'form' ? (
              <span className="inline-flex items-center gap-2">
                <span className="relative flex size-1.5">
                  <span className="lk-ping absolute inline-flex size-full rounded-full bg-[var(--lk-green)] opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[var(--lk-green)]" />
                </span>
                {t(c.strip)}
              </span>
            ) : (
              <span className="inline-flex max-w-full items-center gap-2 overflow-hidden">
                {stripDomain ? (
                  <>
                    <svg className="size-3.5 shrink-0 text-white/55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <bdi className="truncate text-white/90">{stripDomain}</bdi>
                    <span className="shrink-0 text-white/35" aria-hidden>
                      ·
                    </span>
                  </>
                ) : null}
                <span className="truncate">{tCalc(leakResultCopy.step4MetaReport, locale)}</span>
              </span>
            )}
          </div>
        </div>
      ) : null}
      <div className="relative mx-auto flex h-[72px] max-w-none items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <a href={mainSiteUrl('/')} aria-label="Erythro.ai" dir="ltr" className="flex shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo/Logo_digital-on-light.svg" alt="Erythro.ai" width={235} height={74} className="h-11 w-auto sm:h-14" />
        </a>
        {stage.name === 'form' ? (
          <nav aria-label="Sections" className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-4 md:flex lg:gap-8">
            {[
              { h: '#checks', l: c.navChecks },
              { h: '#how', l: c.navHow },
              { h: '#faq', l: c.navFaq },
            ].map((n) => (
              <a key={n.h} href={n.h} onClick={(e) => {
                  e.preventDefault()
                  scrollToStack(document.querySelector(n.h))
                }} className="rounded-[6px] px-3 py-1.5 text-sm font-medium text-[var(--lk-muted)] no-underline transition-colors hover:bg-[var(--lk-stone-100)] hover:text-[var(--lk-ink)]">
                {t(n.l)}
              </a>
            ))}
          </nav>
        ) : null}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* No language switch: each locale has its own subdomain (ai-audit-{en,ru,he}). */}
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="lk-header-wa hidden h-9 max-w-[min(100%,14rem)] items-center gap-1.5 truncate rounded-[3px] bg-[#25D366] px-2.5 text-[11px] font-semibold leading-none text-white no-underline transition-opacity hover:opacity-90 sm:inline-flex sm:max-w-none sm:px-3 sm:text-xs"
            >
              <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="truncate">{t(c.headerWaCta)}</span>
            </a>
          ) : null}
        </div>
      </div>
    </header>
  )

  // Phones: WhatsApp moves out of the header into a round button fixed at the bottom right.
  // Rendered outside the header: its backdrop-filter would make it the containing block of a fixed child.
  const waFab = waHref ? (
    <a
      href={waHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t(c.headerWaCta)}
      className="lk-header-wa lk-wa-fab fixed bottom-5 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white no-underline shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)] transition-opacity hover:opacity-90 sm:hidden"
    >
      <svg className="size-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  ) : null

  if (stage.name === 'ready' && report && pillars) {
    return (
      <>
        {header}
        {waFab}
        <main className="lk-result mx-auto w-full max-w-[1440px] px-4 pb-14 pt-6 sm:px-8 lg:px-12">
          <CalcResult
            locale={locale}
            domain={displayDomain(stage.submitted.website)}
            websiteUrl={stage.submitted.website}
            pillars={pillars}
            pagespeed={report.pagespeed}
            revenue={flow.revenue}
            clients={flow.clients}
            approximate={report.pillars == null}
            reportHref={stage.submitted.reportHref || report.readyHtmlUrl}
            waHref={waHref}
            onWaText={setWaText}
          />
        </main>
      </>
    )
  }

  return (
    <>
      {header}
      {waFab}
      {stage.name === 'form' ? <ScrollAids locale={locale} /> : null}

      <main>
        {/* ================= HERO + PRODUCT WINDOW ================= */}
        {/* Hero stays put while the next block slides over it (as on the main site). Sticks once its bottom reaches the viewport bottom, so a hero taller than the screen is fully seen first. */}
        <section data-stack="" className="lk-stack overflow-clip">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-10 px-4 pb-12 pt-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:gap-14 lg:pb-10 lg:pt-16 max-sm:pt-9">
            <div
              className={`flex flex-col items-start gap-6 text-start ${
                stage.name === 'waiting' || stage.name === 'opening' ? 'lg:self-stretch' : ''
              }`}
            >
              <span className="lk-rise lk-badge-dark" style={{ animationDelay: '0ms' }}>
                <span className="size-1.5 rounded-full bg-[var(--lk-red)]" />
                {t(c.heroKicker)}
              </span>
              <h1
                className={`lk-display lk-rise m-0 leading-[1.05] ${
                  stage.name === 'waiting' || stage.name === 'opening'
                    ? 'text-[30px] sm:text-[36px] lg:text-[40px]'
                    : 'text-[38px] sm:text-[52px] lg:text-[60px]'
                }`}
                style={{ animationDelay: '80ms' }}
              >
                {t(c.heroL1)} <span className="text-[var(--lk-faint)]">{t(c.heroL2)}</span>
              </h1>
              {stage.name === 'waiting' || stage.name === 'opening' ? (
                // While the audit runs: promo videos (16:9) instead of the sub-heading and proof line.
                // On lg the column stretches to the progress card, so the video ends level with its bottom.
                <div className="lk-rise lk-promo-wrap w-full" style={{ animationDelay: '160ms' }}>
                  <LeakPromoSlider locale={locale} />
                </div>
              ) : (
                <>
                  <p className="lk-rise m-0 max-w-[540px] text-[17px] leading-[1.5] text-[var(--lk-muted)]" style={{ animationDelay: '160ms' }}>
                    {t(c.heroSub)} <EngineSwap /> {t(c.heroSubTail)}
                  </p>
                  <p className="lk-rise m-0 text-[13px] leading-[1.5] text-[var(--lk-faint)]" style={{ animationDelay: '320ms' }}>
                    {t(c.heroProof)}
                  </p>
                </>
              )}
            </div>

            {/* Product window */}
            <div id={WINDOW_ID} className="lk-rise w-full scroll-mt-24" style={{ animationDelay: '200ms' }}>
              <div className="overflow-hidden rounded-[10px] border border-[var(--lk-line-2)] border-t-[3px] border-t-[var(--lk-red)] bg-white shadow-[0_24px_48px_-36px_rgba(0,0,0,0.22)]">
                <LeakCalcPanel locale={locale} page={page} flow={flow} waHref={waHref} sampleHref={sampleHref} />

                <div className="flex items-center justify-center gap-1.5 border-t border-[var(--lk-line)] bg-[var(--lk-stone-50)] px-4 py-2 text-xs text-[var(--lk-faint)]">
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3.5">
                    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  {t(c.windowSecure)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {stage.name === 'form' ? (
          <>
            {/* ================= MEASURED WITH ================= */}
            {/* Full-bleed white band; the heading and graph stay centred at 1200px. */}
            <section data-stack="" className="lk-stack border-y border-[var(--lk-line)] !bg-[var(--lk-stone-50)]">
              {/* Same side padding as the hero, so the heading lines up with the hero H1 on desktop. */}
              <Reveal className="mx-auto flex max-w-[1200px] flex-col items-start gap-10 px-4 pb-12 pt-14 sm:px-6 lg:pb-10 lg:pt-16">
                <h2 className="lk-h2 lk-bar m-0 w-fit text-start text-[32px] leading-[1.15] sm:text-[44px]">{t(c.measuredTitle)}</h2>
                <LeakToolsGraph locale={locale} searchLabel={t(c.measuredSearch)} perfLabel={t(c.measuredPerf)} />
              </Reveal>
            </section>

            {/* ================= BENTO ================= */}
            <section id="checks" data-stack="" className="lk-stack scroll-mt-20 bg-[var(--lk-bg)]">
              <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 pb-12 pt-14 sm:px-6 lg:gap-6 lg:pb-4 lg:pt-16">
                <Reveal>
                  <SectionHead kicker={t(c.bentoKicker)} title={t(c.bentoTitle)} sub={t(c.bentoSub)} />
                </Reveal>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
                  <Reveal className="lg:col-span-4">
                    <article className="lk-grad-dark flex h-full flex-col gap-5 rounded-[10px] bg-[var(--lk-dark)] p-7 text-white sm:p-10">
                      <span className="lk-label inline-flex items-center gap-2 !text-white/60"><span className="size-1.5 rounded-full bg-[var(--lk-red)]" aria-hidden="true" />{t(c.bLossLabel)}</span>
                      <h3 className="m-0 text-2xl leading-[1.2] sm:text-[28px]">{t(c.bLossTitle)}</h3>
                      <p className="m-0 max-w-[560px] text-[15px] leading-[1.5] text-white/70">{t(c.bLossBody)}</p>
                      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                        {c.bLossPoints.map((p, i) => (
                          <li key={i} className="whitespace-nowrap rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[13px] font-medium">
                            {t(p)}
                          </li>
                        ))}
                      </ul>
                    </article>
                  </Reveal>
                  {[
                    { l: c.bSpeedLabel, ti: c.bSpeedTitle, b: c.bSpeedBody },
                    { l: c.bFormsLabel, ti: c.bFormsTitle, b: c.bFormsBody },
                    { l: c.bAiLabel, ti: c.bAiTitle, b: c.bAiBody },
                  ].map((card, i) => (
                    <Reveal key={i} delay={80 * (i + 1)} className={i === 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
                      <article className="lk-card flex h-full flex-col gap-3 p-7 sm:p-9 lg:p-8">
                        <span className="lk-label">{t(card.l)}</span>
                        <h3 className="m-0 text-xl leading-[1.25]">{t(card.ti)}</h3>
                        <p className="m-0 text-[15px] leading-[1.5] text-[var(--lk-muted)]">{t(card.b)}</p>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>

            {/* ================= HOW (DARK) ================= */}
            <section id="how" data-stack="" className="lk-stack lk-grad-dark scroll-mt-20 text-white">
              <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 pb-12 pt-14 sm:px-6 lg:gap-10 lg:pb-10 lg:pt-16">
                <Reveal>
                  <div className="flex flex-col items-start gap-3 text-start">
                    <span className="lk-label !text-white/60">{t(c.howKicker)}</span>
                    <h2 className="lk-h2 lk-bar m-0 text-[34px] leading-[1.12] sm:text-[48px]">{t(c.howTitle)}</h2>
                  </div>
                </Reveal>
                <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
                  {c.howSteps.map((s, i) => {
                    const last = i === c.howSteps.length - 1
                    // Horizontal link to the next card's number: every step on 4 columns, only 1→2 and 3→4 on 2 columns.
                    const across = last ? '' : i % 2 === 0 ? 'hidden sm:block' : 'hidden lg:block'
                    return (
                    <Reveal as="li" key={i} delay={80 * i}>
                      <div className="relative flex h-full flex-col gap-3 rounded-[10px] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
                        <div className="flex items-center gap-2">
                          <span className={`relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-medium tabular-nums ${last ? 'border-[var(--lk-red)] bg-[var(--lk-red)] text-white' : 'border-white/25 bg-[var(--lk-dark)]'}`}>{i + 1}</span>
                          {across ? (
                            // Spans the card padding, the grid gap and the next card's padding, stopping just short of its number.
                            <span aria-hidden="true" className={`lk-step-link relative h-px flex-1 -me-16 ${across}`}>
                              <span className="lk-step-run" style={{ animationDelay: `${i * 0.7}s` }} />
                              <svg viewBox="0 0 8 8" className="absolute end-0 top-1/2 size-2 -translate-y-1/2 text-white/45 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M2 1l4 3-4 3" />
                              </svg>
                            </span>
                          ) : null}
                        </div>
                        {last ? null : (
                          // One column: vertical link from this number down to the next card's number.
                          <span aria-hidden="true" className="lk-step-link lk-step-link-v absolute start-[37px] top-[60px] -bottom-8 w-px sm:hidden">
                            <span className="lk-step-run" style={{ animationDelay: `${i * 0.7}s` }} />
                            <svg viewBox="0 0 8 8" className="absolute bottom-0 start-1/2 size-2 -translate-x-1/2 text-white/45 rtl:translate-x-1/2" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M1 2l3 4 3-4" />
                            </svg>
                          </span>
                        )}
                        <h3 className="m-0 text-lg leading-[1.3]">{t(s.t)}</h3>
                        <p className="m-0 text-sm leading-[1.5] text-white/65">{t(s.d)}</p>
                      </div>
                    </Reveal>
                    )
                  })}
                </ol>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-white/10 bg-white/10 lg:grid-cols-4">
                  {c.stats.map((s) => (
                    <div key={s.v} className="flex flex-col items-center gap-1 bg-[var(--lk-dark)] px-5 py-8 text-center sm:py-10">
                      <span className="text-[36px] font-medium leading-none tracking-[-0.03em]" dir="ltr">{s.v}</span>
                      <span className="text-sm leading-[1.5] text-white/60">{t(s.l)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ================= FAQ ================= */}
            <section id="faq" data-stack="" className="lk-stack scroll-mt-20 bg-[var(--lk-bg)]">
              <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-4 pb-12 pt-14 sm:px-6 lg:pb-10 lg:pt-16">
                <Reveal>
                  <SectionHead kicker={t(c.faqKicker)} title={t(c.faqTitle)} sub={t(c.faqSub)} />
                </Reveal>
                <div className="flex flex-col divide-y divide-[var(--lk-line)] border-y border-[var(--lk-line)]">
                  {c.faq.map((f, i) => {
                    const open = openFaq === i
                    return (
                      <div key={i}>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setOpenFaq(open ? null : i)}
                          className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-start text-base font-medium text-[var(--lk-ink)]"
                        >
                          {t(f.q)}
                          <span aria-hidden="true" className={`text-lg text-[var(--lk-faint)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'rotate-45' : ''}`}>+</span>
                        </button>
                        {/* Smooth open/close: the row animates 0fr → 1fr, the text fades in. */}
                        <div className="lk-acc" data-open={open ? '' : undefined} aria-hidden={!open}>
                          <div className="overflow-hidden">
                            <p className="m-0 pb-5 text-[15px] leading-[1.5] text-[var(--lk-muted)]">{t(f.a)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {waNumber ? (
                  <a href={`https://wa.me/${waNumber}?text=${encodeURIComponent(t(c.faqWaText))}`} target="_blank" rel="noopener noreferrer" className="lk-btn-outline inline-flex h-12 w-fit items-center gap-2.5 px-6 no-underline">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]" fill="currentColor">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.38-1.99-1.22-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.22-.16-.47-.29Z" />
                    </svg>
                    {t(c.faqWaCta)}
                  </a>
                ) : null}
              </div>
            </section>

            {/* ================= FINAL CTA ================= */}
            <section data-stack="" className="lk-stack bg-[var(--lk-bg)]">
              <Reveal className="mx-auto max-w-[1200px] px-4 pb-12 pt-0 sm:px-6 sm:pt-14 lg:pb-10 lg:pt-16">
                <LeakFinalCta
                  locale={locale}
                  title={t(c.finalTitle)}
                  sub={t(c.finalSub)}
                  cta={t(c.finalCta)}
                  onCta={toForm}
                />
              </Reveal>
            </section>
          </>
        ) : null}
      <footer className="relative z-10 bg-[var(--lk-dark)]">
        <div className="mx-auto flex h-8 max-w-none items-center justify-between gap-4 whitespace-nowrap px-4 text-[11px] leading-none text-white/55 sm:px-6 sm:text-[12px] lg:px-10">
          <span className="min-w-0 truncate">{t(c.footerNote)}</span>
          <span className="flex shrink-0 items-center gap-4">
            <a href={mainSiteUrl('/privacy')} className="text-white/75 no-underline transition-colors hover:text-white">{t(c.footerPrivacy)}</a>
            <a href={mainSiteUrl('/')} className="text-white/75 no-underline transition-colors hover:text-white" dir="ltr">{t(c.footerMain)}</a>
          </span>
        </div>
      </footer>
      </main>
    </>
  )
}

export default function LeakLpClient({
  locale,
  content,
  auditPageContent,
}: {
  locale: AuditLpLocale
  content: SiteContent
  auditPageContent: AuditPageContent
}) {
  const isHebrew = locale === 'he'
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = isHebrew ? 'rtl' : 'ltr'
  }, [locale, isHebrew])

  // Marks <html> while this landing is open, for report elements portalled to <body> (outside .lk-root).
  useEffect(() => {
    document.documentElement.setAttribute('data-lk', '')
    return () => document.documentElement.removeAttribute('data-lk')
  }, [])

  const font = isHebrew
    ? 'var(--font-heebo), "Heebo", system-ui, sans-serif'
    : 'var(--font-inter), var(--font-inter-cyrillic), "Inter", system-ui, sans-serif'

  return (
    <SiteContentProvider value={content}>
      <div
        dir={isHebrew ? 'rtl' : 'ltr'}
        lang={locale}
        className="lk-root relative isolate min-h-screen "
        style={{ fontFamily: font, ['--font-sans' as string]: font }}
      >
        {/* Audit wording for the shared report (result + waiting screens) on this landing only. */}
        <CalcCopyProvider value={leakResultCopy}>
          <CalcPaletteProvider value={LK_REPORT_PALETTE}>
            <CalcCtaVisualProvider value={{ visual: <LeakFixVisual locale={locale} />, title: leakFixTitle(locale) }}>
              <LeakLpInner locale={locale} page={auditPageContent} />
            </CalcCtaVisualProvider>
          </CalcPaletteProvider>
        </CalcCopyProvider>
        <CookieConsent locale={locale} theme="light" privacyHref={mainSiteUrl('/privacy')} />
      </div>
    </SiteContentProvider>
  )
}
