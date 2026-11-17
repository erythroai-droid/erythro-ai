'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import CookieConsent from '@/components/CookieConsent'
import WhatsAppButton from '@/components/WhatsAppButton'
import { SiteContentProvider, useSiteContent } from '@/components/SiteContentProvider'
import { CalcResult } from '@/components/audit/CalcReport'
import { displayDomain } from '@/components/audit/AuditCalcFlow'
import LeakCalcPanel from '@/components/leak-lp/LeakCalcPanel'
import LeakShowcase, { SHOWCASE_TABS, SHOWCASE_TAB_LABEL, type ShowcaseTab } from '@/components/leak-lp/LeakShowcase'
import { useLeakCalcFlow } from '@/components/leak-lp/useLeakCalcFlow'
import { Reveal, useInView, usePrefersReducedMotion } from '@/components/leak-lp/motion'
import type { SiteContent } from '@/lib/defaultContent'
import type { AuditPageContent } from '@/lib/auditPage'
import { AUDIT_LP_LOCALES, buildLeakCalcSampleReportUrl, mainSiteUrl, type AuditLpLocale } from '@/lib/auditLp'
import { formatIls, tCalc, type Localized } from '@/lib/auditCalcCopy'
import { leakLpCopy as c } from '@/lib/leakLpCopy'
import '@/components/leak-lp/leakLp.css'

const ENGINES = ['ChatGPT', 'Perplexity', 'Gemini', 'Claude']
const TAB_MS = 6500
const LEAK_PATH = (l: AuditLpLocale) => `/lp/audit/leak/${l}`

const FONT_LATIN = 'var(--font-inter), var(--font-inter-cyrillic), "Inter", system-ui, sans-serif'
const FONT_HE = 'var(--font-heebo), "Heebo", system-ui, sans-serif'

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                 */
/* ------------------------------------------------------------------ */

function Kicker({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 text-[13px] font-medium leading-[1.5] ${dark ? 'text-white/60' : 'text-[var(--lk-muted)]'}`}
    >
      <span className="size-1.5 rounded-[1px] bg-[var(--lk-red)]" aria-hidden="true" />
      {children}
    </span>
  )
}

function ArrowIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={`${className} rtl:-scale-x-100`}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3.5 rtl:-scale-x-100">
      <path d="M5 3.5h7.5V11M12.5 3.5 3.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Section wrapper with the architectural dashed side rails (desktop). */
function Frame({ children, className = '', rails = true }: { children: React.ReactNode; className?: string; rails?: boolean }) {
  return (
    <div className={`relative mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-10 ${className}`}>
      {rails ? (
        <>
          <span aria-hidden="true" className="lk-dashed-v pointer-events-none absolute inset-y-0 start-4 hidden lg:start-10 lg:block" />
          <span aria-hidden="true" className="lk-dashed-v pointer-events-none absolute inset-y-0 end-4 hidden lg:end-10 lg:block" />
        </>
      ) : null}
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hero rotating engine                                                */
/* ------------------------------------------------------------------ */

function RotatingEngine() {
  const [i, setI] = useState(0)
  const reduced = usePrefersReducedMotion()
  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setI((n) => (n + 1) % ENGINES.length), 2200)
    return () => clearInterval(id)
  }, [reduced])
  return (
    <span className="relative inline-flex overflow-hidden align-bottom" dir="ltr">
      <span key={i} className="lk-swap inline-block font-medium text-[var(--lk-ink)]">
        {ENGINES[i]}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Product window: calc panel + auto-rotating showcase                 */
/* ------------------------------------------------------------------ */

function ProductWindow({
  locale,
  page,
  flow,
  waHref,
  sampleHref,
}: {
  locale: AuditLpLocale
  page: AuditPageContent
  flow: ReturnType<typeof useLeakCalcFlow>
  waHref: string
  sampleHref: string
}) {
  const t = (f: Localized) => tCalc(f, locale)
  const [tab, setTab] = useState<ShowcaseTab>('loss')
  const [paused, setPaused] = useState(false)
  const [manual, setManual] = useState(false)
  const reduced = usePrefersReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>('0px')
  const autoplay = inView && !paused && !manual && !reduced

  useEffect(() => {
    if (!autoplay) return
    const id = setTimeout(() => {
      setTab((cur) => SHOWCASE_TABS[(SHOWCASE_TABS.indexOf(cur) + 1) % SHOWCASE_TABS.length])
    }, TAB_MS)
    return () => clearTimeout(id)
  }, [autoplay, tab])

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-[14px] border border-[var(--lk-line)] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_60px_-28px_rgba(28,25,23,0.22)]"
    >
      {/* Window chrome */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--lk-line)] bg-[var(--lk-stone-50)] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-[#e6e3de]" />
            <span className="size-2.5 rounded-full bg-[#e6e3de]" />
            <span className="size-2.5 rounded-full bg-[#e6e3de]" />
          </span>
          <span className="text-[13px] font-medium text-[var(--lk-ink-2)]">{t(c.windowNewAudit)}</span>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-[var(--lk-faint)] sm:inline-flex">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3.5">
            <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          {t(c.windowSecure)}
        </span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        {/* Left: the real funnel */}
        <div id="calc" className="scroll-mt-28 border-b border-[var(--lk-line)] lg:border-b-0 lg:border-e">
          <LeakCalcPanel locale={locale} page={page} flow={flow} waHref={waHref} sampleHref={sampleHref} />
        </div>

        {/* Right: sample result tabs */}
        <div
          className="flex min-w-0 flex-col bg-[var(--lk-stone-50)]/60"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="flex items-center justify-between gap-3 px-5 pt-4">
            <span className="text-xs font-medium text-[var(--lk-faint)]">{t(c.windowSample)}</span>
          </div>
          <div role="tablist" aria-label={t(c.windowSample)} className="flex gap-1 overflow-x-auto px-4 pt-2 [scrollbar-width:none]">
            {SHOWCASE_TABS.map((k) => {
              const active = k === tab
              return (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setTab(k)
                    setManual(true)
                  }}
                  className={`relative shrink-0 cursor-pointer overflow-hidden rounded-[7px] px-3 py-2 text-[13px] font-medium transition-colors ${
                    active ? 'bg-white text-[var(--lk-ink)] shadow-[0_0_0_1px_var(--lk-line)]' : 'text-[var(--lk-muted)] hover:text-[var(--lk-ink)]'
                  }`}
                >
                  {t(SHOWCASE_TAB_LABEL[k])}
                  {active ? (
                    <span className="absolute inset-x-2 bottom-0 h-px bg-[var(--lk-line)]">
                      <span
                        key={`${k}-${autoplay ? 'on' : 'off'}`}
                        className="lk-tab-progress absolute inset-0 bg-[var(--lk-red)]"
                        style={{
                          animationDuration: `${TAB_MS}ms`,
                          animationPlayState: autoplay ? 'running' : 'paused',
                          transform: manual || reduced ? 'scaleX(1)' : undefined,
                          animationName: manual || reduced ? 'none' : undefined,
                        }}
                      />
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
          <div className="m-4 mt-3 flex-1 overflow-hidden rounded-[10px] border border-[var(--lk-line)] bg-white" role="tabpanel">
            <LeakShowcase locale={locale} tab={tab} />
          </div>
          <p className="m-0 px-5 pb-4 text-xs leading-[1.5] text-[var(--lk-faint)]">{t(c.pvSampleNote)}</p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Bento cards                                                         */
/* ------------------------------------------------------------------ */

function LossBars({ locale }: { locale: AuditLpLocale }) {
  const t = (f: Localized) => tCalc(f, locale)
  const [ref, inView] = useInView<HTMLDivElement>()
  const vals = [9.2, 10.1, 9.6, 11.4, 12.2, 11.8, 13.6, 13.1, 14.9, 14.4, 16.2, 18.4]
  const max = 20
  return (
    <div ref={ref} className="rounded-[12px] border border-white/25 bg-white p-4 text-[var(--lk-ink)] shadow-[0_20px_40px_-24px_rgba(60,0,0,0.6)] sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-[var(--lk-faint)]">{t(c.bLossChart)}</span>
        <span className="text-lg font-medium tabular-nums tracking-[-0.02em]">{formatIls(166_900, locale)}</span>
      </div>
      <div className="mt-4 flex h-[120px] items-end gap-[6px] sm:h-[150px]" dir="ltr">
        {vals.map((v, i) => (
          <span
            key={i}
            data-in={inView ? '' : undefined}
            className="lk-bar-grow flex-1 rounded-t-[3px]"
            style={{
              height: `${(v / max) * 100}%`,
              background: i === vals.length - 1 ? 'var(--lk-red)' : `rgba(229,36,33,${0.16 + (i / vals.length) * 0.45})`,
              transitionDelay: `${i * 45}ms`,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-[var(--lk-faint)]" dir="ltr">
        <span>01</span>
        <span>06</span>
        <span>12</span>
      </div>
    </div>
  )
}

function BentoCard({
  label,
  title,
  body,
  children,
  className = '',
  delay = 0,
}: {
  label: string
  title: string
  body: string
  children?: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <Reveal delay={delay} className={`flex flex-col overflow-hidden rounded-[14px] border border-[var(--lk-line)] bg-white ${className}`}>
      <div className="flex flex-col gap-2 p-6 sm:p-7">
        <span className="text-[13px] font-medium leading-[1.5] text-[var(--lk-red-700)]">{label}</span>
        <h3 className="lk-bar m-0 text-xl font-semibold leading-[1.25] tracking-[-0.02em] text-[var(--lk-ink)]">{title}</h3>
        <p className="m-0 text-[15px] leading-[1.6] text-[var(--lk-muted)]">{body}</p>
      </div>
      {children ? <div className="mt-auto px-6 pb-6 sm:px-7 sm:pb-7">{children}</div> : null}
    </Reveal>
  )
}

function SpeedVisual() {
  const [ref, inView] = useInView<HTMLDivElement>()
  const rows = [
    { l: 'LCP', v: 4.2, max: 6, target: 2.5, unit: 's' },
    { l: 'FCP', v: 2.8, max: 6, target: 1.8, unit: 's' },
    { l: 'TTI', v: 5.6, max: 6, target: 3.8, unit: 's' },
  ]
  return (
    <div ref={ref} className="flex flex-col gap-3 rounded-[10px] border border-[var(--lk-line)] bg-[var(--lk-stone-50)] p-4" dir="ltr">
      {rows.map((r, i) => (
        <div key={r.l} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-medium text-[var(--lk-ink-2)]">{r.l}</span>
            <span className="tabular-nums text-[var(--lk-muted)]">
              {r.v} {r.unit}
            </span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--lk-stone-150)]">
            <span
              className="absolute inset-y-0 start-0 rounded-full bg-[var(--lk-red)] transition-[width] duration-[1100ms] ease-[cubic-bezier(.2,.7,.2,1)]"
              style={{ width: inView ? `${(r.v / r.max) * 100}%` : '0%', transitionDelay: `${i * 120}ms` }}
            />
            <span className="absolute inset-y-[-2px] w-px bg-[var(--lk-ink)]/50" style={{ left: `${(r.target / r.max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function FormsVisual({ locale }: { locale: AuditLpLocale }) {
  const t = (f: Localized) => tCalc(f, locale)
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {c.bFormsIssues.map((iss, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-[9px] border border-[var(--lk-line)] bg-[var(--lk-stone-50)] px-3 py-2.5 text-[13px] leading-[1.5] text-[var(--lk-ink-2)]"
        >
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--lk-red)]/10 text-[11px] font-semibold text-[var(--lk-red-700)]">
            !
          </span>
          {t(iss)}
        </li>
      ))}
    </ul>
  )
}

function AiVisual({ locale }: { locale: AuditLpLocale }) {
  const t = (f: Localized) => tCalc(f, locale)
  const engines = [
    { n: 'ChatGPT', ok: false },
    { n: 'Perplexity', ok: false },
    { n: 'Gemini', ok: true },
    { n: 'Google AI', ok: false },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
      <div className="flex flex-col gap-2.5 rounded-[10px] border border-[var(--lk-line)] bg-[var(--lk-stone-50)] p-4">
        <div className="ms-auto max-w-[90%] rounded-[10px] rounded-ee-[3px] bg-white px-3 py-2 text-[13px] leading-[1.5] text-[var(--lk-ink-2)] shadow-[0_0_0_1px_var(--lk-line)]">
          {t(c.pvAiPrompt)}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="h-2 w-[92%] rounded-full bg-[var(--lk-stone-150)]" />
          <span className="h-2 w-[78%] rounded-full bg-[var(--lk-stone-150)]" />
          <span className="h-2 w-[60%] rounded-full bg-[var(--lk-stone-150)]" />
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-[5px] bg-[var(--lk-red)]/10 px-2 py-1 text-xs font-medium text-[var(--lk-red-700)]">
          {t(c.pvAiYou)} · {t(c.pvAiMissing)}
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0" dir="ltr">
        {engines.map((e) => (
          <li key={e.n} className="flex items-center justify-between rounded-[8px] border border-[var(--lk-line)] bg-white px-3 py-2 text-[13px]">
            <span className="font-medium text-[var(--lk-ink-2)]">{e.n}</span>
            {e.ok ? (
              <span className="text-[var(--lk-green)]">
                <CheckIcon />
              </span>
            ) : (
              <span className="size-1.5 rounded-full bg-[var(--lk-red)]" />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

function FaqItem({ q, a, open, onToggle, id }: { q: string; a: string; open: boolean; onToggle: () => void; id: string }) {
  return (
    <div className="border-b border-[var(--lk-line)]">
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-start text-base font-medium leading-[1.4] text-[var(--lk-ink)] transition-colors hover:text-[var(--lk-red-700)] sm:text-[17px]"
        >
          {q}
          <span
            aria-hidden="true"
            className={`relative flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--lk-line)] transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
          >
            <span className="absolute h-px w-3 bg-current" />
            <span className="absolute h-3 w-px bg-current" />
          </span>
        </button>
      </h3>
      <div
        id={id}
        role="region"
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className="m-0 max-w-[62ch] pb-6 pe-10 text-[15px] leading-[1.65] text-[var(--lk-muted)]">{a}</p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function LeakLpPage({ locale, page }: { locale: AuditLpLocale; page: AuditPageContent }) {
  const t = (f: Localized) => tCalc(f, locale)
  const flow = useLeakCalcFlow()
  const { stage, formStep, resumeSearch, report, pillars, revenue, clients } = flow
  const phone = useSiteContent().siteSettings.phone || ''
  const [waText, setWaText] = useState('')
  const [faqOpen, setFaqOpen] = useState<number | null>(0)
  const [scrolled, setScrolled] = useState(false)

  const waNumber = phone.replace(/[^0-9]/g, '')
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}` : ''
  const sampleHref = buildLeakCalcSampleReportUrl(locale)
  const isReady = Boolean(stage.name === 'ready' && report && pillars)
  const showLang = stage.name === 'form' && formStep === 1

  const domain = useMemo(
    () => (stage.name === 'form' ? '' : displayDomain(stage.submitted.website)),
    [stage],
  )

  // Full-screen report panels fill the viewport below the top bar (--calc-top), as in AuditCalcFlow.
  const headerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const root = document.documentElement
    const sync = () => root.style.setProperty('--calc-top', `${el.offsetHeight}px`)
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.removeProperty('--calc-top')
    }
  }, [isReady])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Funnel moved past step 1 → keep the product window in view.
  const prevStage = useRef(stage.name)
  useEffect(() => {
    if (prevStage.current !== stage.name && (stage.name === 'waiting' || stage.name === 'ready')) {
      if (stage.name === 'ready') window.scrollTo({ top: 0 })
      else document.getElementById('calc')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
    prevStage.current = stage.name
  }, [stage.name])

  const langHref = (l: AuditLpLocale) => {
    const base = LEAK_PATH(l)
    return resumeSearch ? `${base}${resumeSearch.startsWith('?') ? resumeSearch : `?${resumeSearch}`}` : base
  }

  const navLinks = [
    { href: '#checks', label: t(c.navChecks) },
    { href: '#how', label: t(c.navHow) },
    { href: '#faq', label: t(c.navFaq) },
  ]

  const header = (
    <header ref={headerRef} className="sticky top-0 z-50">
      {/* Red strip */}
      <div className="bg-[var(--lk-red)] text-white">
        <div className="mx-auto flex h-9 max-w-[1240px] items-center justify-center gap-3 px-4 text-[13px] leading-[1.5]">
          <span className="truncate">{t(c.strip)}</span>
          <a
            href={sampleHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden shrink-0 items-center gap-1 font-medium text-white underline decoration-white/40 underline-offset-4 hover:decoration-white sm:inline-flex"
          >
            {t(c.stripLink)}
            <ArrowIcon className="size-3" />
          </a>
        </div>
      </div>
      {/* Nav */}
      <div
        className={`border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled || isReady ? 'border-[var(--lk-line)] bg-[var(--lk-bg)]/85 backdrop-blur-md' : 'border-transparent bg-[var(--lk-bg)]'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <a href={mainSiteUrl('/')} aria-label="Erythro.ai" dir="ltr" className="flex shrink-0 transition-opacity hover:opacity-80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo/Logo_digital-on-light.svg" alt="Erythro.ai" width={235} height={74} className="h-9 w-auto sm:h-10" />
          </a>

          {!isReady ? (
            <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
              {navLinks.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  className="rounded-[7px] px-3 py-2 text-sm font-medium text-[var(--lk-muted)] no-underline transition-colors hover:bg-[var(--lk-stone-100)] hover:text-[var(--lk-ink)]"
                >
                  {n.label}
                </a>
              ))}
            </nav>
          ) : null}

          <div className="flex items-center gap-2 sm:gap-3">
            {showLang ? (
              <nav aria-label="Language" className="flex items-center rounded-[8px] border border-[var(--lk-line)] bg-white p-0.5">
                {AUDIT_LP_LOCALES.map((l) => (
                  <a
                    key={l}
                    href={langHref(l)}
                    aria-current={l === locale ? 'true' : undefined}
                    className={`rounded-[6px] px-2 py-1 text-xs font-medium uppercase no-underline transition-colors ${
                      l === locale ? 'bg-[var(--lk-ink)] text-white' : 'text-[var(--lk-muted)] hover:text-[var(--lk-ink)]'
                    }`}
                  >
                    {l}
                  </a>
                ))}
              </nav>
            ) : null}
            {!isReady ? (
              <a
                href="#calc"
                className="lk-btn-primary hidden h-9 items-center gap-1.5 rounded-[8px] px-3.5 text-sm font-medium no-underline sm:inline-flex"
              >
                {t(c.navCta)}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )

  if (stage.name === 'ready' && report && pillars) {
    return (
      <>
        {header}
        <main className="flex w-full flex-1 flex-col items-center bg-[#eaeaea] px-4 pb-10 sm:px-8 lg:px-12 lg:pb-14">
          <div className="mx-auto w-full max-w-[1440px]">
            <CalcResult
              locale={locale}
              domain={domain}
              websiteUrl={stage.submitted.website}
              pillars={pillars}
              pagespeed={report.pagespeed}
              revenue={revenue}
              clients={clients}
              approximate={report.pillars == null}
              reportHref={stage.submitted.reportHref || report.readyHtmlUrl}
              waHref={waHref}
              onWaText={setWaText}
            />
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      {header}

      <main>
        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[620px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(229,36,33,0.07),transparent_70%)]"
          />
          <Frame className="pb-14 pt-14 sm:pt-20 lg:pb-20 lg:pt-24">
            <div className="relative mx-auto flex max-w-[880px] flex-col items-center text-center">
              <span
                className="lk-rise inline-flex items-center gap-2 rounded-full border border-[var(--lk-line)] bg-white px-3 py-1 text-[13px] font-medium leading-[1.5] text-[var(--lk-ink-2)] shadow-[0_1px_1px_rgba(0,0,0,0.03)]"
                style={{ animationDelay: '0ms' }}
              >
                <span className="relative flex size-1.5">
                  <span className="lk-ping absolute inline-flex size-full rounded-full bg-[var(--lk-green)] opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[var(--lk-green)]" />
                </span>
                {t(c.heroKicker)}
              </span>

              <h1
                className="lk-display lk-rise m-0 mt-6 text-[40px] font-semibold leading-[1.04] text-[var(--lk-ink)] sm:text-[56px] lg:text-[72px]"
                style={{ animationDelay: '80ms' }}
              >
                {t(c.heroL1)} <span className="text-[var(--lk-red)]">{t(c.heroL2)}</span>
              </h1>

              <p
                className="lk-rise m-0 mt-6 max-w-[640px] text-[17px] leading-[1.6] text-[var(--lk-muted)] sm:text-lg"
                style={{ animationDelay: '160ms' }}
              >
                {t(c.heroSub)} <RotatingEngine /> {t(c.heroSubTail)}
              </p>

              <div className="lk-rise mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row" style={{ animationDelay: '240ms' }}>
                <a
                  href="#calc"
                  className="lk-btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-[9px] px-6 text-[15px] font-medium no-underline sm:w-auto"
                >
                  {t(c.heroCta)}
                  <ArrowIcon />
                </a>
                <a
                  href={sampleHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lk-btn-secondary inline-flex h-12 w-full items-center justify-center gap-2 rounded-[9px] px-6 text-[15px] font-medium no-underline sm:w-auto"
                >
                  {t(c.heroCtaSecondary)}
                  <ExternalIcon />
                </a>
              </div>
              <p className="lk-rise m-0 mt-5 text-[13px] leading-[1.5] text-[var(--lk-faint)]" style={{ animationDelay: '300ms' }}>
                {t(c.heroProof)}
              </p>
            </div>

            {/* Product window */}
            <div className="lk-rise relative mt-14 sm:mt-16 lg:mt-20" style={{ animationDelay: '380ms' }}>
              <span aria-hidden="true" className="pointer-events-none absolute -inset-x-4 top-0 hidden h-px bg-[var(--lk-line)] lg:block" />
              <ProductWindow locale={locale} page={page} flow={flow} waHref={waHref} sampleHref={sampleHref} />
            </div>
          </Frame>
        </section>

        {/* ================= MEASURED WITH ================= */}
        <section className="border-y border-[var(--lk-line)] bg-[var(--lk-stone-50)]">
          <Frame className="py-10 sm:py-12">
            <Reveal className="flex flex-col items-center gap-7 text-center">
              <p className="m-0 max-w-[560px] text-sm font-medium leading-[1.5] text-[var(--lk-muted)]">{t(c.measuredTitle)}</p>
              <div className="grid w-full gap-6 md:grid-cols-2 md:gap-0 md:divide-x md:divide-[var(--lk-line)] rtl:md:divide-x-reverse">
                {[
                  { title: t(c.measuredPerf), items: ['Google Lighthouse', 'PageSpeed Insights', 'Core Web Vitals', 'Chromium'] },
                  { title: t(c.measuredSearch), items: ['Google Search', 'ChatGPT', 'Perplexity', 'Gemini', 'Schema.org'] },
                ].map((g) => (
                  <div key={g.title} className="flex flex-col items-center gap-3 md:px-6">
                    <span className="text-xs font-medium leading-[1.5] text-[var(--lk-faint)]">{g.title}</span>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2" dir="ltr">
                      {g.items.map((it) => (
                        <span key={it} className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--lk-ink-2)]/70">
                          {it}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </Frame>
        </section>

        {/* ================= BENTO ================= */}
        <section id="checks" className="scroll-mt-24">
          <Frame className="py-20 sm:py-24 lg:py-28">
            <Reveal className="flex max-w-[720px] flex-col gap-4">
              <Kicker>{t(c.bentoKicker)}</Kicker>
              <h2 className="lk-h2 lk-bar m-0 text-[32px] font-semibold leading-[1.1] text-[var(--lk-ink)] sm:text-[44px]">{t(c.bentoTitle)}</h2>
              <p className="m-0 text-[17px] leading-[1.6] text-[var(--lk-muted)]">{t(c.bentoSub)}</p>
            </Reveal>

            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {/* Red loss panel */}
              <Reveal className="lk-dither relative overflow-hidden rounded-[14px] text-white lg:col-span-2">
                <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_1.05fr] md:items-end">
                  <div className="flex flex-col gap-3">
                    <span className="text-[13px] font-medium leading-[1.5] text-white/80">{t(c.bLossLabel)}</span>
                    <h3 className="lk-bar m-0 text-2xl font-semibold leading-[1.2] tracking-[-0.02em] [&::before]:!bg-white sm:text-[28px]">
                      {t(c.bLossTitle)}
                    </h3>
                    <p className="m-0 text-[15px] leading-[1.6] text-white/85">{t(c.bLossBody)}</p>
                    <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
                      {c.bLossPoints.map((p, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-sm leading-[1.5] text-white">
                          <span className="flex size-5 items-center justify-center rounded-full bg-white/15">
                            <CheckIcon className="size-3.5" />
                          </span>
                          {t(p)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <LossBars locale={locale} />
                </div>
              </Reveal>

              <BentoCard label={t(c.bSpeedLabel)} title={t(c.bSpeedTitle)} body={t(c.bSpeedBody)} delay={80}>
                <SpeedVisual />
              </BentoCard>

              <BentoCard label={t(c.bFormsLabel)} title={t(c.bFormsTitle)} body={t(c.bFormsBody)} delay={0}>
                <FormsVisual locale={locale} />
              </BentoCard>

              <BentoCard label={t(c.bAiLabel)} title={t(c.bAiTitle)} body={t(c.bAiBody)} className="lg:col-span-2" delay={80}>
                <AiVisual locale={locale} />
              </BentoCard>
            </div>
          </Frame>
        </section>

        {/* ================= HOW IT WORKS (dark) ================= */}
        <section id="how" className="relative scroll-mt-24 overflow-hidden bg-[var(--lk-dark)] text-white">
          <div aria-hidden="true" className="lk-dots-dark pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(70%_60%_at_50%_0%,#000,transparent)]" />
          <Frame rails={false} className="relative py-20 sm:py-24 lg:py-28">
            <Reveal className="flex max-w-[720px] flex-col gap-4">
              <Kicker dark>{t(c.howKicker)}</Kicker>
              <h2 className="lk-h2 lk-bar m-0 text-[32px] font-semibold leading-[1.1] sm:text-[44px]">{t(c.howTitle)}</h2>
            </Reveal>

            <ol className="m-0 mt-14 grid list-none gap-px overflow-hidden rounded-[14px] border border-white/10 bg-white/10 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {c.howSteps.map((s, i) => (
                <Reveal as="li" key={i} delay={i * 90} className="flex flex-col gap-3 bg-[var(--lk-dark)] p-6 sm:p-7">
                  <span className="flex size-8 items-center justify-center rounded-[8px] border border-white/15 bg-white/[0.04] text-sm font-medium tabular-nums text-white">
                    {i + 1}
                  </span>
                  <h3 className="lk-bar m-0 mt-3 text-lg font-semibold leading-[1.3]">{t(s.t)}</h3>
                  <p className="m-0 text-[15px] leading-[1.6] text-white/60">{t(s.d)}</p>
                </Reveal>
              ))}
            </ol>

            <div className="mt-16 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-10">
                {c.stats.map((s, i) => (
                  <Reveal key={i} delay={i * 70} className="flex flex-col gap-1.5 border-s border-white/15 ps-5">
                    <dt className="order-2 text-sm leading-[1.5] text-white/55">{t(s.l)}</dt>
                    <dd className="order-1 m-0 text-[40px] font-medium leading-none tracking-[-0.04em] tabular-nums sm:text-[52px]" dir="ltr">
                      {s.v}
                    </dd>
                  </Reveal>
                ))}
              </dl>

              <Reveal delay={120}>
                <a
                  href={sampleHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-[14px] border border-white/10 bg-white/[0.04] no-underline transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                >
                  {/* Report thumbnail */}
                  <div className="border-b border-white/10 bg-[#141110] p-5">
                    <div className="flex items-center justify-between gap-3" dir="ltr">
                      <span className="text-xs font-medium text-white/50">mustang.erythro.ai</span>
                      <span className="rounded-[5px] bg-[var(--lk-red)]/15 px-1.5 py-0.5 text-xs font-medium text-[#ff8a80]">69 / 100</span>
                    </div>
                    <div className="mt-4 flex items-end gap-4">
                      <span className="text-[30px] font-medium leading-none tracking-[-0.03em] text-white tabular-nums" dir="ltr">
                        {formatIls(12_600, locale)}
                      </span>
                      <span className="pb-1 text-xs text-white/45">/ {locale === 'he' ? 'חודש' : locale === 'ru' ? 'мес' : 'mo'}</span>
                    </div>
                    <div className="mt-4 flex h-1.5 overflow-hidden rounded-full" dir="ltr">
                      <span className="w-[42%] bg-[var(--lk-red)]" />
                      <span className="w-[27%] bg-[#f0705c]" />
                      <span className="w-[19%] bg-[#f6ab9c]" />
                      <span className="w-[12%] bg-white/20" />
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-4 p-5">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-base font-semibold leading-[1.35] text-white">{t(c.sampleCardTitle)}</span>
                      <span className="text-sm leading-[1.5] text-white/55">{t(c.sampleCardBody)}</span>
                    </div>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                      <ArrowIcon />
                    </span>
                  </div>
                </a>
              </Reveal>
            </div>
          </Frame>
        </section>

        {/* ================= FAQ ================= */}
        <section id="faq" className="scroll-mt-24">
          <Frame className="py-20 sm:py-24 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
              <Reveal className="flex flex-col gap-4 lg:sticky lg:top-32 lg:self-start">
                <Kicker>{t(c.faqKicker)}</Kicker>
                <h2 className="lk-h2 lk-bar m-0 text-[32px] font-semibold leading-[1.1] text-[var(--lk-ink)] sm:text-[44px]">{t(c.faqTitle)}</h2>
                <p className="m-0 text-[15px] leading-[1.6] text-[var(--lk-muted)]">{t(c.faqSub)}</p>
                {waHref ? (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lk-btn-secondary mt-2 inline-flex h-10 w-fit items-center gap-2 rounded-[8px] px-4 text-sm font-medium no-underline"
                  >
                    WhatsApp
                    <ArrowIcon />
                  </a>
                ) : null}
              </Reveal>
              <Reveal delay={80} className="border-t border-[var(--lk-line)]">
                {c.faq.map((f, i) => (
                  <FaqItem
                    key={i}
                    id={`lk-faq-${i}`}
                    q={t(f.q)}
                    a={t(f.a)}
                    open={faqOpen === i}
                    onToggle={() => setFaqOpen((cur) => (cur === i ? null : i))}
                  />
                ))}
              </Reveal>
            </div>
          </Frame>
        </section>

        {/* ================= FINAL CTA (dark) ================= */}
        <section className="px-4 pb-4 sm:px-6 lg:px-10">
          <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[18px] bg-[var(--lk-dark)] text-white">
            <div aria-hidden="true" className="lk-dots-dark pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_80%_at_50%_100%,#000,transparent)]" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[260px] bg-[radial-gradient(50%_70%_at_50%_100%,rgba(229,36,33,0.35),transparent_70%)]"
            />
            <Reveal className="relative flex flex-col items-center gap-5 px-6 py-20 text-center sm:py-24 lg:py-28">
              <h2 className="lk-h2 lk-bar m-0 max-w-[760px] text-start text-[32px] font-semibold leading-[1.1] sm:text-[48px]">{t(c.finalTitle)}</h2>
              <p className="m-0 max-w-[520px] text-[17px] leading-[1.6] text-white/60">{t(c.finalSub)}</p>
              <div className="mt-4 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
                <a
                  href="#calc"
                  className="lk-btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-[9px] px-6 text-[15px] font-medium no-underline sm:w-auto"
                >
                  {t(c.heroCta)}
                  <ArrowIcon />
                </a>
                <a
                  href={sampleHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[9px] border border-white/15 px-6 text-[15px] font-medium text-white no-underline transition-colors hover:bg-white/[0.06] sm:w-auto"
                >
                  {t(c.heroCtaSecondary)}
                  <ExternalIcon />
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="mt-4 bg-[var(--lk-dark)] text-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-4 py-12 sm:px-6 lg:px-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <a href={mainSiteUrl('/')} aria-label="Erythro.ai" dir="ltr" className="flex w-fit transition-opacity hover:opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo/Logo_digital.svg" alt="Erythro.ai" width={235} height={74} className="h-9 w-auto" />
            </a>
            <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {navLinks.map((n) => (
                <a key={n.href} href={n.href} className="text-white/60 no-underline transition-colors hover:text-white">
                  {n.label}
                </a>
              ))}
              <a href={mainSiteUrl('/privacy')} className="text-white/60 no-underline transition-colors hover:text-white">
                {t(c.footerPrivacy)}
              </a>
              <a href={mainSiteUrl('/')} className="text-white/60 no-underline transition-colors hover:text-white" dir="ltr">
                {t(c.footerMain)}
              </a>
            </nav>
          </div>
          <div className="flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-[13px] leading-[1.5] text-white/40 sm:flex-row">
            <span>{t(c.footerNote)}</span>
            <span dir="ltr">© {new Date().getFullYear()} Erythro.ai</span>
          </div>
        </div>
      </footer>
    </>
  )
}

/**
 * Premium Revenue Leak LP (`/lp/audit/leak/{locale}`), Searchable-style editorial layout.
 * Funnel = same backend contract as `AuditCalcFlow` (leadChannel `leak_calc`); result = `CalcResult`.
 */
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

  const font = isHebrew ? FONT_HE : FONT_LATIN

  return (
    <SiteContentProvider value={content}>
      <div
        dir={isHebrew ? 'rtl' : 'ltr'}
        lang={locale}
        className="lk-root relative isolate flex min-h-screen flex-col overflow-x-clip font-sans selection:bg-[#e52421]/15 selection:text-[#c21d1a]"
        style={{ fontFamily: font, ['--font-sans' as string]: font }}
      >
        <LeakLpPage locale={locale} page={auditPageContent} />
        <WhatsAppButton
          alwaysVisible
          className="fixed bottom-3 end-3 z-[70] flex h-[44px] w-[44px] items-center justify-center opacity-90 transition-opacity hover:opacity-100 sm:bottom-4 sm:end-5 sm:h-[48px] sm:w-[48px]"
        />
        <CookieConsent locale={locale} theme="light" privacyHref={mainSiteUrl('/privacy')} />
      </div>
    </SiteContentProvider>
  )
}
