'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { PortfolioProject } from '@/lib/portfolioProjects'
import { tLocale } from '@/lib/portfolioProjects'
import BidiText from '@/components/BidiText'

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
  const summary = tLocale(project.summary, locale)

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
      {/* Mobile: image fills leftover viewport above the copy. Desktop: full-bleed behind content. */}
      <div className="relative min-h-0 w-full flex-1 lg:absolute lg:inset-0 lg:h-full lg:w-full lg:flex-none">
        <HeroMedia
          type={project.hero.type}
          src={project.hero.src}
          srcMobile={project.hero.srcMobile}
          typeMobile={project.hero.typeMobile}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-coal-900/15 via-coal-900/[0.08] to-transparent lg:from-coal-900 lg:via-coal-900/55 lg:to-coal-900/20"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1170px] shrink-0 px-[30px] pb-16 pt-5 max-lg:pb-20 md:pt-8 lg:pb-28 lg:pt-[140px]">
        <p className="mb-3 font-sans text-xs uppercase tracking-[0.24em] text-white/55 md:mb-4">
          {categoryLabel}
        </p>
        <p className="max-w-[640px] font-sans text-base font-light leading-7 text-white/80 max-lg:line-clamp-4 md:text-lg md:leading-8">
          {summary}
        </p>

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
            <div className="col-span-2 flex flex-col gap-1.5 md:col-span-4 lg:col-span-1">
              <dt className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/45">
                Link
              </dt>
              <dd>
                <Link
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm text-gold-500 underline-offset-4 transition-colors duration-300 hover:text-white hover:underline md:text-[15px]"
                >
                  Visit project
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  )
}
