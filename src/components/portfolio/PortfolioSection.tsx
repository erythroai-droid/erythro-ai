'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  matchesPortfolioFilter,
  tLocale,
  type PortfolioCategory,
  type PortfolioFilter,
  type PortfolioProject,
} from '@/lib/portfolioProjects'
import StylizedSectionTitle from '@/components/StylizedSectionTitle'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface PortfolioSectionProps {
  theme?: 'light' | 'dark'
  locale?: string
  projects: PortfolioProject[]
  filters: PortfolioFilter[]
}

export default function PortfolioSection({
  theme = 'dark',
  locale = 'en',
  projects: allProjects,
  filters,
}: PortfolioSectionProps) {
  const isLight = theme === 'light'
  const sectionRef = React.useRef<HTMLElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [activeFilter, setActiveFilter] = useState<PortfolioCategory>('all')
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const isFirstRender = useRef(true)
  const isFiltering = useRef(false)
  const pendingFilter = useRef<PortfolioCategory | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setPrefersReducedMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const projects = useMemo(
    () =>
      activeFilter === 'all'
        ? allProjects
        : allProjects.filter((project) =>
            matchesPortfolioFilter(project.category, activeFilter),
          ),
    [activeFilter, allProjects],
  )

  const handleFilterChange = (next: PortfolioCategory) => {
    if (next === activeFilter || isFiltering.current || !gridRef.current) return

    if (prefersReducedMotion) {
      setActiveFilter(next)
      return
    }

    isFiltering.current = true
    pendingFilter.current = next

    const outgoing = Array.from(
      gridRef.current.querySelectorAll<HTMLElement>('[data-project]'),
    )

    gsap.to(outgoing, {
      opacity: 0,
      duration: 0.28,
      ease: 'power1.out',
      overwrite: true,
      onComplete: () => setActiveFilter(next),
    })
  }

  useLayoutEffect(() => {
    if (!gridRef.current) return

    const cards = Array.from(gridRef.current.querySelectorAll<HTMLElement>('[data-project]'))

    if (isFirstRender.current) {
      isFirstRender.current = false
      if (prefersReducedMotion) return
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.06,
          ease: 'power2.out',
          delay: 0.04,
          clearProps: 'transform',
        },
      )
      return
    }

    if (!isFiltering.current || pendingFilter.current !== activeFilter) return

    pendingFilter.current = null

    if (prefersReducedMotion || cards.length === 0) {
      isFiltering.current = false
      return
    }

    gsap.set(cards, { opacity: 0 })
    gsap.to(cards, {
      opacity: 1,
      duration: 0.34,
      stagger: 0.04,
      ease: 'power1.out',
      overwrite: true,
      onComplete: () => {
        gsap.set(cards, { clearProps: 'opacity' })
        isFiltering.current = false
        ScrollTrigger.refresh()
      },
    })
  }, [activeFilter, prefersReducedMotion])

  useEffect(() => {
    ScrollTrigger.refresh()
  }, [activeFilter])

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px)', () => {
        ScrollTrigger.create({
          id: 'portfolio-pin',
          trigger: sectionRef.current,
          start: 'bottom bottom',
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
      id="portfolio"
      data-menu-contrast={isLight ? 'light' : 'dark'}
      className={`relative z-10 min-h-screen w-full overflow-hidden ${
        isLight ? 'bg-gold-100' : 'dark-gradient-bg'
      }`}
    >
      {!isLight && (
        <div className="solution-section-noise absolute inset-0 z-[1] pointer-events-none" aria-hidden />
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-[1170px] flex-col items-center px-[30px] pb-16 pt-10 lg:pb-24 lg:pt-12">
        <div className="mb-10 flex flex-col items-center gap-[5px] text-center lg:mb-12">
          <h1 className="font-sans text-[32px] font-extralight uppercase leading-tight tracking-[9.6px] lg:text-[48px] lg:leading-[60px]">
            <StylizedSectionTitle
              text="PORTFOLIO"
              restClassName={isLight ? 'text-coal-900' : 'text-white'}
            />
          </h1>
          <p
            className={`font-sans text-base font-light leading-8 tracking-[3.2px] ${
              isLight ? 'text-gold-900' : 'text-gold-800'
            }`}
          >
            Projects built end-to-end
          </p>
        </div>

        <div
          className="mb-12 flex w-full max-w-[900px] flex-wrap items-center justify-center gap-2 md:gap-3"
          role="group"
          aria-label={
            locale === 'ru'
              ? 'Фильтры проектов'
              : locale === 'he'
                ? 'מסנני פרויקטים'
                : 'Project filters'
          }
        >
          {filters.map((filter) => {
            const active = activeFilter === filter.id
            const label = tLocale(filter.label, locale)
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleFilterChange(filter.id)}
                className={`portfolio-filter-btn cursor-pointer rounded-full border px-4 py-2 font-sans text-xs uppercase tracking-[1.6px] transition-all duration-200 active:scale-[0.97] md:px-5 md:text-[12px] ${
                  active
                    ? 'is-active border-erythro-500 bg-erythro-500 text-white shadow-[0_4px_18px_0_rgba(229,36,33,0.35)] active:brightness-90'
                    : isLight
                      ? 'border-coal-900 bg-white text-coal-900 hover:border-erythro-500 hover:bg-white hover:text-erythro-500 active:border-erythro-500 active:text-erythro-500'
                      : 'border-white/80 bg-white/5 text-white/80 hover:border-gold-500 hover:bg-gold-500 hover:text-coal-900 hover:shadow-[0_3px_16px_0_rgba(255,233,199,0.35)] active:border-gold-500 active:bg-gold-500 active:text-coal-900'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div
          ref={gridRef}
          id="portfolio-grid"
          className="grid w-full grid-cols-1 gap-[30px] md:grid-cols-2 xl:grid-cols-3"
        >
          {projects.map((project) => {
            const title = tLocale(project.title, locale)
            const description = tLocale(project.description, locale)
            const categoryLabel = tLocale(project.categoryLabel, locale)
            return (
            <Link
              key={project.id}
              href={`/portfolio/${project.slug}`}
              data-project={project.id}
              className={`group flex flex-col gap-5 ${
                isLight ? 'text-coal-900' : 'text-white'
              }`}
            >
              <div className="relative aspect-[370/310] w-full overflow-hidden bg-coal-800">
                <Image
                  src={project.image}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 370px"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="font-sans text-base font-bold uppercase leading-6 tracking-wide">
                  {title}
                </h2>
                <p
                  className={`font-sans text-sm font-normal leading-6 ${
                    isLight ? 'text-gold-900' : 'text-gold-800'
                  }`}
                >
                  {description}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span
                    className={`rounded-[2px] px-2 py-1 font-sans text-[11px] uppercase tracking-[1.2px] ${
                      isLight
                        ? 'bg-coal-500 text-gold-100'
                        : 'bg-erythro-500/15 text-[#f7bbba]'
                    }`}
                  >
                    {categoryLabel}
                  </span>
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-[2px] px-2 py-1 font-sans text-[11px] uppercase tracking-[1.2px] ${
                        isLight
                          ? 'bg-coal-900/5 text-coal-900/70'
                          : 'bg-white/5 text-white/60'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
            )
          })}
        </div>

        {projects.length === 0 && (
          <p className={`mt-8 text-center text-sm ${isLight ? 'text-gold-900' : 'text-gold-800'}`}>
            No projects in this category yet.
          </p>
        )}
      </div>

      <div className="relative z-10 h-[150px] w-full shrink-0" aria-hidden />
    </section>
  )
}
