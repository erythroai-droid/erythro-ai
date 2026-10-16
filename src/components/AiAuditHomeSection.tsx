'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BorderBeam } from 'border-beam'
import { useSiteContent } from './SiteContentProvider'
import StylizedSectionTitle from './StylizedSectionTitle'
import Button from './Button'
import { useContactModal } from './ContactModal'
import { loadGsapAfterLcp } from '@/lib/gsapAfterLcp'
import { tAudit } from '@/lib/auditPage'
import { staticAuditPricingPlans } from '@/lib/auditPricingPlans'
import { currencySymbol } from '@/lib/orderPlans'
import { isContactModalHref, navigateCtaHref, normalizeCtaHref } from '@/lib/ctaNav'
import { homeAiAudit as homeAiAuditFallback } from '@/translations'

interface AiAuditHomeSectionProps {
  locale: string
}

type ProofSlide = (typeof homeAiAuditFallback.proofSlides)[number]

const AUDIT_BEAM_STYLE = {
  '--pulse-glow-boost': 1.45,
  '--beam-glow-brightness': 1.15,
} as React.CSSProperties

function BodyWithAccent({ body, accent }: { body: string; accent: string }) {
  const i = body.indexOf(accent)
  if (i < 0) return <>{body}</>
  return (
    <>
      {body.slice(0, i)}
      <strong className="font-normal text-gold-200">{accent}</strong>
      {body.slice(i + accent.length)}
    </>
  )
}

function useCountUp(target: number, active: boolean, durationMs = 1100) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) {
      setValue(0)
      return
    }
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || target <= 0) {
      setValue(target)
      return
    }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, durationMs])

  return value
}

function LabProtocolCarousel({
  locale,
  label,
  slides,
}: {
  locale: string
  label: string
  slides: ProofSlide[]
}) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const t = (field?: Record<string, string> | null) =>
    (field && (field[locale] || field.en)) || ''

  const safeSlides = slides.length ? slides : homeAiAuditFallback.proofSlides

  useEffect(() => {
    if (paused || safeSlides.length < 2) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeSlides.length)
    }, 4200)
    return () => window.clearInterval(id)
  }, [paused, safeSlides.length])

  return (
    <div
      className="audit-beam-hue overflow-visible p-4 -m-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false)
      }}
    >
      <BorderBeam
        size="pulse-outside"
        colorVariant="colorful"
        strength={0.7}
        duration={2.2}
        theme="dark"
        className="w-full overflow-visible"
        style={AUDIT_BEAM_STYLE}
      >
        <div className="relative flex h-[380px] w-full flex-col rounded-[20px] border border-white/10 bg-coal-500 px-7 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:h-[400px] sm:px-8 sm:py-9">
          <p className="m-0 shrink-0 text-[11px] font-medium uppercase tracking-[3.2px] text-erythro-500">
            {label}
          </p>

          <div className="relative min-h-0 flex-1">
            {safeSlides.map((item, i) => {
              const active = i === index
              return (
                <div
                  key={i}
                  aria-hidden={!active}
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-4 px-1 text-center transition-opacity duration-300 ease-out ${
                    active ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                >
                  <p
                    dir="ltr"
                    className="relative m-0 flex h-[88px] w-full items-start justify-center font-bold leading-none tracking-[-2px] text-gold-500"
                  >
                    <span className="relative inline-block text-[72px] tabular-nums md:text-[88px]">
                      {active ? <CountUpDigit target={item.value} /> : item.value}
                      {t(item.suffix) ? (
                        <span className="absolute bottom-[0.55em] start-full ms-0.5 text-[28px] font-bold leading-none text-gold-500 md:text-[34px]">
                          {t(item.suffix)}
                        </span>
                      ) : null}
                    </span>
                  </p>

                  <p className="m-0 min-h-[2.5rem] max-w-[16rem] text-[15px] font-light leading-snug text-[#989898]">
                    {t(item.support)}
                  </p>
                  <p className="m-0 min-h-[2.75rem] max-w-[18rem] text-[18px] font-medium leading-snug text-white md:text-[20px]">
                    {t(item.impact)}
                  </p>
                  <p className="m-0 flex min-h-[1.5rem] items-center justify-center gap-2 text-[15px] font-medium text-white">
                    <span className="inline-block size-2 shrink-0 rounded-full bg-erythro-500" aria-hidden />
                    {t(item.ask)}
                  </p>
                </div>
              )
            })}
          </div>

          <div
            className="flex shrink-0 items-center justify-center gap-2 pt-1"
            role="tablist"
            aria-label={label}
          >
            {safeSlides.map((_, i) => {
              const selected = i === index
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={`${i + 1} / ${safeSlides.length}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    selected
                      ? 'w-6 bg-erythro-500'
                      : 'w-1.5 bg-white/25 hover:bg-white/45'
                  }`}
                />
              )
            })}
          </div>
        </div>
      </BorderBeam>
    </div>
  )
}

function CountUpDigit({ target }: { target: number }) {
  const value = useCountUp(target, true, 1100)
  return <>{value}</>
}

export default function AiAuditHomeSection({ locale }: AiAuditHomeSectionProps) {
  const fromCms = useSiteContent().homeAiAudit
  const translations = {
    ...homeAiAuditFallback,
    ...fromCms,
    proofSlides:
      fromCms?.proofSlides?.length ? fromCms.proofSlides : homeAiAuditFallback.proofSlides,
  }
  const { open: openContact } = useContactModal()
  const router = useRouter()
  const t = (field?: Record<string, string> | null) =>
    (field && (field[locale] || field.en)) || ''

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const headingRef = useRef<HTMLDivElement | null>(null)
  const bodyRowRef = useRef<HTMLDivElement | null>(null)
  const pricingRef = useRef<HTMLDivElement | null>(null)

  const plans = staticAuditPricingPlans()
  const shekel = currencySymbol('ILS')
  const slides = translations.proofSlides

  useEffect(() => {
    let cancelled = false
    let ctx: { revert: () => void } | null = null

    void loadGsapAfterLcp().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !wrapperRef.current) return

      ctx = gsap.context(() => {
        const mm = gsap.matchMedia()

        mm.add('(min-width: 1024px)', () => {
          gsap.set(wrapperRef.current, {
            clipPath: 'inset(50% 0% 50% 0%)',
          })
          gsap.set([headingRef.current, bodyRowRef.current, pricingRef.current], {
            opacity: 0,
            y: 40,
          })

          let settleGateProgress: number | null = null
          let settleComplete = false
          let settleStartTime = 0

          const blockForwardWhileSettling = (event: WheelEvent) => {
            if (settleGateProgress == null || settleComplete) return
            if (event.deltaY > 0) event.preventDefault()
          }
          window.addEventListener('wheel', blockForwardWhileSettling, { passive: false })

          const settleTl = gsap.timeline({
            paused: true,
            onComplete: () => {
              settleComplete = true
              settleGateProgress = null
            },
            onReverseComplete: () => {
              settleComplete = false
              settleGateProgress = null
            },
          })
          settleTl
            .to(headingRef.current, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 0)
            .to(bodyRowRef.current, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 0.2)
            .to(pricingRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.4)

          const tl = gsap.timeline({
            scrollTrigger: {
              id: 'ai-audit-pin',
              trigger: wrapperRef.current,
              start: 'top top',
              end: '+=180%',
              pin: true,
              pinSpacing: false,
              scrub: 1,
              invalidateOnRefresh: true,
              onUpdate(self) {
                const total = tl.duration()
                if (!settleStartTime || total <= 0) return
                const settleAtProgress = Math.min(0.999, settleStartTime / total)

                if (self.progress >= settleAtProgress - 0.0005) {
                  if (!settleComplete && settleTl.progress() < 1) {
                    if (settleGateProgress == null) settleGateProgress = settleAtProgress
                    if (!settleTl.isActive()) settleTl.play()
                  }
                  if (!settleComplete && self.progress > settleAtProgress) {
                    self.scroll(self.start + settleAtProgress * (self.end - self.start))
                  }
                } else if (self.progress < settleAtProgress - 0.02) {
                  if (settleTl.progress() > 0 || settleComplete || settleGateProgress != null) {
                    settleTl.pause(0)
                    settleComplete = false
                    settleGateProgress = null
                  }
                }
              },
            },
          })

          tl.fromTo(
            wrapperRef.current,
            { clipPath: 'inset(50% 0% 50% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.0, ease: 'power2.inOut' },
          )

          settleStartTime = tl.duration()
          tl.to({}, { duration: 0.55 })

          ScrollTrigger.sort()

          return () => {
            window.removeEventListener('wheel', blockForwardWhileSettling)
          }
        })

        mm.add('(max-width: 1023px)', () => {
          gsap.set(wrapperRef.current, { clipPath: 'inset(0% 0% 0% 0%)' })
          gsap.set([headingRef.current, bodyRowRef.current, pricingRef.current], {
            opacity: 0,
            y: 30,
          })

          gsap
            .timeline({
              scrollTrigger: {
                trigger: wrapperRef.current,
                start: 'top 88%',
                toggleActions: 'play none none reverse',
              },
            })
            .to(headingRef.current, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' })
            .to(bodyRowRef.current, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '-=0.35')
            .to(pricingRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.35')
        })
      }, wrapperRef)
    })

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [])

  return (
    <section
      id="ai-audit"
      ref={wrapperRef}
      data-menu-contrast="dark"
      className="relative z-10 flex min-h-[100svh] w-full flex-col overflow-hidden dark-gradient-bg py-14 shadow-[0_-12px_30px_rgba(0,0,0,0.28)] max-lg:rounded-t-[28px] lg:h-screen lg:justify-center lg:overflow-y-auto lg:py-12"
    >
      <div className="solution-section-noise absolute inset-0 z-[1] pointer-events-none" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-[1170px] flex-1 flex-col justify-center gap-7 px-[30px] lg:gap-8">
        <div
          ref={headingRef}
          className="flex flex-col items-center gap-[5px] text-center"
        >
          <h2 className="m-0 font-sans text-[32px] font-extralight uppercase leading-tight tracking-[9.6px] text-white lg:text-[48px] lg:leading-[60px]">
            <StylizedSectionTitle text={t(translations.sectionTitle)} restClassName="text-white" />
          </h2>
          <p className="m-0 font-sans text-base font-light leading-8 tracking-[3.2px] text-gold-800">
            {t(translations.sectionSubtitle)}
          </p>
        </div>

        <div
          ref={bodyRowRef}
          className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-12 xl:gap-16"
        >
          <div className="flex w-full max-w-[560px] flex-col items-start gap-5 lg:flex-1">
            <div className="flex flex-col gap-1">
              <p className="m-0 text-[26px] font-extralight leading-tight tracking-[-0.5px] text-[#686868] md:text-[36px] lg:text-[40px]">
                {t(translations.headlineMuted)}
              </p>
              <p className="m-0 pe-1 text-[32px] font-light leading-tight tracking-[-0.5px] text-white md:text-[48px] lg:text-[52px]">
                {t(translations.headlineEmph)}
              </p>
            </div>

            <p className="m-0 max-w-[34rem] text-[16px] font-light leading-[1.7] tracking-[0.2px] text-[#b9b9b9]">
              <BodyWithAccent body={t(translations.body)} accent={t(translations.bodyAccent)} />
            </p>

            <div className="flex flex-col items-start gap-3">
              <Button
                variant="dark-outline"
                showArrow
                type="button"
                onClick={() => router.push(translations.ctaHref || '/audit')}
              >
                {t(translations.ctaLabel)}
              </Button>
              <p className="m-0 text-[12px] font-light tracking-[1.2px] text-gold-800">
                {t(translations.ctaMicro)}
              </p>
            </div>
          </div>

          <aside className="w-full max-w-[400px] shrink-0 lg:w-[400px]">
            <LabProtocolCarousel
              locale={locale}
              label={t(translations.proofLabel)}
              slides={slides}
            />
          </aside>
        </div>

        <div ref={pricingRef} className="flex w-full flex-col items-center gap-4">
          <p className="m-0 text-[11px] font-medium uppercase tracking-[3.2px] text-erythro-500">
            {t(translations.pricingKicker)}
          </p>
          <ul className="m-0 flex w-full list-none flex-wrap items-stretch justify-center gap-3 p-0 lg:gap-4">
            {plans.map((plan) => {
              const priceText = tAudit(plan.price, locale)
              const compare = plan.priceCompare ? tAudit(plan.priceCompare, locale) : ''
              const note = plan.priceNote ? tAudit(plan.priceNote, locale) : ''
              const href = normalizeCtaHref(plan.ctaHref) || `/order/${plan.slug || plan.id}`
              const featured = Boolean(plan.featured)
              const opensContact = isContactModalHref(href)

              const cardClass = featured
                ? 'border-erythro-500/70 bg-erythro-600/90 text-white'
                : 'border-gold-200/20 bg-white/[0.04] text-white hover:border-gold-200/40'

              const inner = (
                <>
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gold-200">
                    {tAudit(plan.name, locale)}
                  </span>
                  <span dir="ltr" className="flex items-baseline gap-1.5 font-light">
                    {compare ? (
                      <span className="text-[13px] text-white/45 line-through">
                        {shekel}
                        {compare}
                      </span>
                    ) : null}
                    <span className={`text-[22px] leading-none ${featured ? 'text-white' : 'text-gold-200'}`}>
                      <span className="text-[14px]">{shekel}</span>
                      {priceText}
                    </span>
                  </span>
                  {note ? (
                    <span className="text-[11px] font-light leading-snug text-white/55">{note}</span>
                  ) : null}
                </>
              )

              if (opensContact) {
                return (
                  <li key={plan.id} className="min-w-[140px] flex-1 sm:max-w-[200px] sm:flex-none">
                    <button
                      type="button"
                      onClick={() => navigateCtaHref(href, { openContact })}
                      className={`flex h-full w-full cursor-pointer flex-col items-start gap-1.5 rounded-[14px] border px-4 py-3.5 text-start transition-colors duration-300 ${cardClass}`}
                    >
                      {inner}
                    </button>
                  </li>
                )
              }

              return (
                <li key={plan.id} className="min-w-[140px] flex-1 sm:max-w-[200px] sm:flex-none">
                  <Link
                    href={href}
                    className={`flex h-full w-full flex-col items-start gap-1.5 rounded-[14px] border px-4 py-3.5 transition-colors duration-300 ${cardClass}`}
                  >
                    {inner}
                  </Link>
                </li>
              )
            })}
          </ul>
          <Link
            href="/audit"
            className="text-[12px] font-light tracking-[1.2px] text-gold-800 underline-offset-4 transition-colors hover:text-gold-200 hover:underline"
          >
            {t(translations.pricingAll)}
          </Link>
        </div>
      </div>
    </section>
  )
}
