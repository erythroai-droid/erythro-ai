'use client'

import React, { useEffect, useMemo, useState } from 'react'
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

interface PortfolioSectionProps {
  theme?: 'light' | 'dark'
  locale?: string
}

export default function PortfolioSection({ theme = 'dark' }: PortfolioSectionProps) {
  const isLight = theme === 'light'
  const sectionRef = React.useRef<HTMLElement | null>(null)
  const [activeFilter, setActiveFilter] = useState<PortfolioCategory>('all')

  useCursorGlow(sectionRef)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      // Hold the last viewport of Portfolio while Let's Talk rides up over it
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

  const projects = useMemo(
    () =>
      activeFilter === 'all'
        ? PROJECTS
        : PROJECTS.filter((project) => project.category === activeFilter),
    [activeFilter],
  )

  useEffect(() => {
    ScrollTrigger.refresh()
  }, [projects])

  return (
    <section
      ref={sectionRef}
      id="portfolio"
      data-glow-x={isLight ? '50' : '82'}
      data-glow-y={isLight ? '32' : '14'}
      className={`relative z-10 min-h-screen w-full overflow-hidden pt-[100px] pb-[100px] shadow-[0_-12px_30px_rgba(0,0,0,0.28)] ${
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
                onClick={() => setActiveFilter(filter.id)}
                className={`cursor-pointer rounded-full border px-4 py-2 font-sans text-xs uppercase tracking-[1.6px] transition-all duration-300 md:px-5 md:text-[12px] ${
                  active
                    ? 'border-erythro-500 bg-erythro-500 text-white'
                    : isLight
                      ? 'border-coal-900/15 bg-white/50 text-coal-900 hover:border-gold-500 hover:text-gold-500'
                      : 'border-white/15 bg-white/5 text-white/80 hover:border-gold-500 hover:text-gold-500'
                }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        <div
          id="portfolio-grid"
          className="grid w-full grid-cols-1 gap-[30px] md:grid-cols-2 xl:grid-cols-3"
        >
          {projects.map((project) => (
            <article
              key={project.id}
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
                  <span className="rounded-[2px] bg-erythro-500/15 px-2 py-1 font-sans text-[11px] uppercase tracking-[1.2px] text-erythro-500">
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
    </section>
  )
}
