'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { PortfolioProject } from '@/lib/portfolioProjects'
import { tLocale } from '@/lib/portfolioProjects'
import BidiText from '@/components/BidiText'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { isLexicalDoc, lexicalFromText, lexicalToPlain } from '@/lib/lexical'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ProjectHeroProps {
  project: PortfolioProject
  locale?: string
}

function HeroMediaSlot({
  type,
  src,
  visibilityClass,
  objectPositionClass = 'object-center',
  priority = false,
}: {
  type: 'image' | 'video'
  src: string
  /** Breakpoint visibility, e.g. `lg:hidden` / `hidden lg:block`. */
  visibilityClass?: string
  /** Framing for cover crops — mobile stills usually need object-top. */
  objectPositionClass?: string
  priority?: boolean
}) {
  if (type === 'video') {
    return (
      <video
        className={`absolute inset-0 h-full w-full object-cover ${objectPositionClass} ${visibilityClass || ''}`}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      />
    )
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      priority={priority}
      sizes="100vw"
      className={`object-cover ${objectPositionClass} ${visibilityClass || ''}`}
    />
  )
}

function HeroMedia({
  type,
  src,
  srcMobile,
  typeMobile,
}: {
  type: 'image' | 'video'
  src: string
  srcMobile?: string
  typeMobile?: 'image' | 'video'
}) {
  const hasSeparateMobile = Boolean(srcMobile && srcMobile !== src)
  const mobileSrc = srcMobile || src
  // Mobile may be a still while desktop is video (CMS pattern) — never share one kind.
  const mobileType = hasSeparateMobile ? typeMobile || 'image' : type

  if (!hasSeparateMobile) {
    return <HeroMediaSlot type={type} src={src} priority />
  }

  return (
    <>
      <HeroMediaSlot
        type={mobileType}
        src={mobileSrc}
        visibilityClass="lg:hidden"
        objectPositionClass="object-top"
        priority
      />
      <HeroMediaSlot
        type={type}
        src={src}
        visibilityClass="hidden lg:block"
        objectPositionClass="object-center"
      />
    </>
  )
}

export default function ProjectHero({ project, locale = 'en' }: ProjectHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const categoryLabel = tLocale(project.categoryLabel, locale)
  const summaryPlain = tLocale(project.summary, locale)
  const summaryCandidate =
    project.summaryRich && typeof project.summaryRich === 'object'
      ? (project.summaryRich as Record<string, unknown>)[locale] ??
        (project.summaryRich as Record<string, unknown>).en
      : null
  const summaryDoc = isLexicalDoc(summaryCandidate)
    ? summaryCandidate
    : lexicalFromText(summaryPlain)
  const hasSummary = Boolean(lexicalToPlain(summaryDoc).trim() || summaryPlain.trim())

  const meta = [
    { label: 'Category', value: categoryLabel },
    { label: 'Date', value: project.date },
    { label: 'Stack', value: project.stack.join(' · ') },
    { label: 'Client', value: project.client },
  ]

  // Desktop: pin full-bleed hero so Project Body can ride up over it
  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px)', () => {
        ScrollTrigger.create({
          id: 'project-hero-pin',
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=100%',
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="project-hero"
      data-menu-contrast="dark"
      className="relative z-10 flex w-full flex-col overflow-hidden bg-coal-900 max-lg:h-[100dvh] max-lg:max-h-[100dvh] lg:min-h-screen lg:justify-end"
    >
      {/* Full-bleed media — sits behind the mobile copy plate on all breakpoints. */}
      <div className="absolute inset-0">
        <HeroMedia
          type={project.hero.type}
          src={project.hero.src}
          srcMobile={project.hero.srcMobile}
          typeMobile={project.hero.typeMobile}
        />
        {/* Flat veil darkens the whole photo; gradient still lifts the bottom for copy. */}
        <div className="absolute inset-0 bg-coal-900/55" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-t from-coal-900 via-coal-900/50 to-transparent"
          aria-hidden
        />
      </div>

      {/* Mobile: black plate fades 0→100% so the photo shows through under the copy. */}
      <div className="relative z-10 mt-auto w-full max-lg:bg-gradient-to-t max-lg:from-coal-900 max-lg:via-coal-900/90 max-lg:to-transparent">
        <div className="mx-auto w-full max-w-[1170px] px-[30px] pb-16 pt-14 max-lg:pb-20 md:pt-8 lg:pb-28 lg:pt-[140px]">
          <p className="mb-3 font-sans text-xs uppercase tracking-[0.24em] text-white/55 md:mb-4">
            {categoryLabel}
          </p>
          {hasSummary ? (
            <div className="max-w-[640px] font-sans text-base font-light leading-7 text-white/80 max-lg:line-clamp-4 md:text-lg md:leading-8 [&_:is(h1,h2,h3,h4,h5,h6,p)]:m-0 [&_p+_p]:mt-3 [&_a]:underline [&_strong]:font-semibold [&_em]:italic">
              <RichText data={summaryDoc as never} />
            </div>
          ) : null}

          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-white/15 pt-6 md:mt-10 md:gap-y-6 md:pt-8 md:grid-cols-4 lg:mt-12 lg:gap-x-10">
            {meta.map((item) => (
              <div key={item.label} className="flex flex-col gap-1.5">
                <dt className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/45">
                  {item.label}
                </dt>
                <dd className="font-sans text-sm font-normal leading-snug text-white md:text-[15px]">
                  <BidiText forceLtr={item.label === 'Stack'}>{item.value}</BidiText>
                </dd>
              </div>
            ))}
            {project.link ? (
              <div className="col-span-2 flex items-end md:col-span-4 lg:col-span-1">
                <Link
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex h-11 max-w-full min-w-0 items-center justify-center gap-2 rounded-[var(--xl,40px)] border border-gold-500 bg-transparent px-5 font-sans text-[12px] font-medium uppercase tracking-[2px] text-gold-500 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-gold-500 hover:text-coal-900 active:scale-[0.97] active:bg-gold-500 active:text-coal-900 active:duration-100"
                >
                  {locale === 'ru'
                    ? 'Открыть проект'
                    : locale === 'he'
                      ? 'לצפייה בפרויקט'
                      : 'Visit project'}
                  <svg
                    viewBox="0 0 16 16"
                    className="size-3.5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 11 11 5M6 5h5v5" />
                  </svg>
                  <span className="sr-only">
                    {locale === 'ru'
                      ? '(откроется в новой вкладке)'
                      : locale === 'he'
                        ? '(נפתח בכרטיסייה חדשה)'
                        : '(opens in a new tab)'}
                  </span>
                </Link>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </section>
  )
}
