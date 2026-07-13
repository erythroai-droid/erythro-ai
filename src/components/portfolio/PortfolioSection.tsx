'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useCursorGlow } from '@/hooks/useCursorGlow'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export type PortfolioCategory =
  | 'all'
  | 'ai'
  | 'crm'
  | 'websites'
  | 'landing'
  | 'apps'
  | 'other'

export interface PortfolioProject {
  id: string
  title: string
  category: PortfolioCategory
  categoryLabel: string
  description: string
  tags: string[]
  image: string
}

const FILTERS: { id: PortfolioCategory; label: string }[] = [
  { id: 'all', label: 'All Projects' },
  { id: 'ai', label: 'AI Agents' },
  { id: 'crm', label: 'CRM Systems' },
  { id: 'websites', label: 'Websites' },
  { id: 'landing', label: 'Landing Pages' },
  { id: 'apps', label: 'Apps' },
  { id: 'other', label: 'Other' },
]

const PROJECTS: PortfolioProject[] = [
  {
    id: '1',
    title: 'AI Lead Qualifier',
    category: 'ai',
    categoryLabel: 'AI Agents',
    description: 'Autonomous agent that scores inbound leads and books qualified calls.',
    tags: ['n8n', 'OpenAI', 'CRM'],
    image: '/images/portfolio/case-1.png',
  },
  {
    id: '2',
    title: 'Ops Command Center',
    category: 'crm',
    categoryLabel: 'CRM Systems',
    description: 'Unified dashboard for pipeline, tasks, and client communication.',
    tags: ['Next.js', 'Payload', 'Postgres'],
    image: '/images/portfolio/case-2.png',
  },
  {
    id: '3',
    title: 'Studio Portfolio Site',
    category: 'websites',
    categoryLabel: 'Websites',
    description: 'High-performance brand site with cinematic motion and CMS editing.',
    tags: ['Next.js', 'GSAP', 'Design'],
    image: '/images/portfolio/case-3.png',
  },
  {
    id: '4',
    title: 'Product Launch Landing',
    category: 'landing',
    categoryLabel: 'Landing Pages',
    description: 'Conversion-focused landing with A/B-ready sections and analytics.',
    tags: ['Webflow', 'Analytics'],
    image: '/images/portfolio/case-1.png',
  },
  {
    id: '5',
    title: 'Client Portal App',
    category: 'apps',
    categoryLabel: 'Apps',
    description: 'Secure client space for deliveries, approvals, and messaging.',
    tags: ['React', 'Auth', 'API'],
    image: '/images/portfolio/case-2.png',
  },
  {
    id: '6',
    title: 'Brand Identity System',
    category: 'other',
    categoryLabel: 'Other',
    description: 'Visual language, guidelines, and asset kit for a digital product brand.',
    tags: ['Branding', 'Figma'],
    image: '/images/portfolio/case-3.png',
  },
]

const matchesFilter = (category: PortfolioCategory, filter: PortfolioCategory) =>
  filter === 'all' || category === filter

interface PortfolioSectionProps {
  theme?: 'light' | 'dark'
  locale?: string
}

export default function PortfolioSection({ theme = 'dark' }: PortfolioSectionProps) {
  const isLight = theme === 'light'
  const sectionRef = React.useRef<HTMLElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [activeFilter, setActiveFilter] = useState<PortfolioCategory>('all')
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const isFirstRender = useRef(true)
  const isFiltering = useRef(false)
  const pendingFilter = useRef<PortfolioCategory | null>(null)

  useCursorGlow(sectionRef)

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
        ? PROJECTS
        : PROJECTS.filter((project) => matchesFilter(project.category, activeFilter)),
    [activeFilter],
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

    // Fade out in place — keep opacity at 0 until the next set is mounted
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

    // Only animate after an intentional filter transition
    if (!isFiltering.current || pendingFilter.current !== activeFilter) return

    pendingFilter.current = null

    if (prefersReducedMotion || cards.length === 0) {
      isFiltering.current = false
      return
    }

    // Start invisible this frame (before paint), then fade in — no flash
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

  // Desktop: pin the last viewport of Portfolio so Let's Talk can slide over it
  // (same pattern as Case Studies → Services / Services → Solutions).
  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px)', () => {
        ScrollTrigger.create({
          id: 'portfolio-pin',
          trigger: sectionRef.current,
          // Scroll through all cards first; lock only once the section bottom
          // reaches the viewport bottom — then Let's Talk rides up over it.
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
      data-glow-x={isLight ? '50' : '82'}
      data-glow-y={isLight ? '32' : '14'}
      className={`relative z-10 min-h-screen w-full overflow-hidden pt-[100px] ${
        isLight ? 'bg-gold-100' : 'dark-gradient-bg'
      }`}
    >
      {!isLight && (
        <div className="solution-section-noise absolute inset-0 z-[1] pointer-events-none" aria-hidden />
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-[1170px] flex-col items-center px-[30px]">
        <div className="mb-10 flex flex-col items-center gap-[5px] text-center lg:mb-12">
          <h1 className="font-sans text-[32px] font-extralight uppercase leading-tight tracking-[9.6px] lg:text-[48px] lg:leading-[60px]">
            <span className="text-erythro-500">P</span>
            <span className={isLight ? 'text-coal-900' : 'text-white'}>ortfolio</span>
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
          role="tablist"
          aria-label="Project filters"
        >
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.id
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleFilterChange(filter.id)}
                className={`portfolio-filter-btn cursor-pointer rounded-full border px-4 py-2 font-sans text-xs uppercase tracking-[1.6px] md:px-5 md:text-[12px] ${
                  active
                    ? 'is-active border-erythro-500 bg-erythro-500 text-white shadow-[0_4px_18px_0_rgba(229,36,33,0.35)]'
                    : isLight
                      ? 'border-coal-900 bg-white text-coal-900 hover:border-erythro-500 hover:bg-white hover:text-erythro-500'
                      : 'border-white/80 bg-white/5 text-white/80 hover:border-gold-500 hover:bg-gold-500 hover:text-coal-900 hover:shadow-[0_3px_16px_0_rgba(255,233,199,0.35)]'
                }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        <div
          ref={gridRef}
          id="portfolio-grid"
          className="grid w-full grid-cols-1 gap-[30px] md:grid-cols-2 xl:grid-cols-3"
        >
          {projects.map((project) => (
            <article
              key={project.id}
              data-project={project.id}
              className={`group flex flex-col gap-5 ${
                isLight ? 'text-coal-900' : 'text-white'
              }`}
            >
              <div className="relative aspect-[370/310] w-full overflow-hidden bg-coal-800">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 370px"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="font-sans text-base font-bold uppercase leading-6 tracking-wide">
                  {project.title}
                </h2>
                <p
                  className={`font-sans text-sm font-normal leading-6 ${
                    isLight ? 'text-gold-900' : 'text-gold-800'
                  }`}
                >
                  {project.description}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span
                    className={`rounded-[2px] px-2 py-1 font-sans text-[11px] uppercase tracking-[1.2px] ${
                      isLight
                        ? 'bg-coal-500 text-gold-100'
                        : 'bg-erythro-500/15 text-[#f7bbba]'
                    }`}
                  >
                    {project.categoryLabel}
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
            </article>
          ))}
        </div>

        {projects.length === 0 && (
          <p className={`mt-8 text-center text-sm ${isLight ? 'text-gold-900' : 'text-gold-800'}`}>
            No projects in this category yet.
          </p>
        )}
      </div>

      {/* Explicit bottom spacing — matches requested 150px below cards */}
      <div className="relative z-10 h-[150px] w-full shrink-0" aria-hidden />
    </section>
  )
}
