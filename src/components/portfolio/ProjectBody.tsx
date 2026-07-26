'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { PortfolioProject } from '@/lib/portfolioProjects'
import ProjectNav, { type ProjectNavNeighbor } from './ProjectNav'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ProjectBodyProps {
  project: PortfolioProject
  theme?: 'light' | 'dark'
  locale?: string
  prev?: ProjectNavNeighbor | null
  next?: ProjectNavNeighbor | null
  portfolioHref?: string
}

export default function ProjectBody({
  project,
  theme = 'dark',
  locale = 'en',
  prev = null,
  next = null,
  portfolioHref = '/portfolio',
}: ProjectBodyProps) {
  const isLight = theme === 'light'
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px)', () => {
        ScrollTrigger.create({
          id: 'project-body-pin',
          trigger: sectionRef.current,
          start: 'bottom bottom',
          end: '+=160%',
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
      id="project-body"
      data-menu-contrast={isLight ? 'light' : 'dark'}
      className={`relative z-20 w-full shadow-[0_-12px_30px_rgba(0,0,0,0.28)] ${
        isLight ? 'bg-gold-100 text-coal-900' : 'dark-gradient-bg text-white'
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1170px] flex-col gap-16 px-[30px] py-16 md:gap-20 md:py-24 lg:gap-24 lg:py-[120px]">
        <header className="flex flex-col gap-4 md:gap-5">
          <h1 className="m-0 font-sans text-[36px] font-extralight uppercase leading-tight tracking-[0.06em] md:text-[52px] md:tracking-[0.08em] lg:text-[56px]">
            <span className="text-erythro-500">{project.title.charAt(0)}</span>
            <span>{project.title.slice(1)}</span>
          </h1>
          {(project.summary || project.description) && (
            <p
              className={`m-0 max-w-[720px] font-sans text-lg font-light leading-8 md:text-xl md:leading-9 ${
                isLight ? 'text-coal-900/70' : 'text-gold-500'
              }`}
            >
              {project.summary || project.description}
            </p>
          )}
        </header>
        {project.body.map((section, index) => (
          <div key={section.heading ?? `section-${index}`} className="flex flex-col gap-8 md:gap-10">
            {section.heading ? (
              <h2
                className={`m-0 font-sans text-[28px] font-extralight uppercase tracking-[0.08em] md:text-[40px] md:tracking-[0.1em] ${
                  isLight ? 'text-gold-900' : 'text-gold-500'
                }`}
              >
                {section.heading}
              </h2>
            ) : null}

            <div className="flex w-full flex-col gap-5">
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className={`font-sans text-base font-light leading-7 md:text-lg md:leading-8 ${
                    isLight ? 'text-coal-900/85' : 'text-white/80'
                  }`}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {section.images.length > 0 ? (
              <div
                className={`grid w-full gap-5 ${
                  section.images.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {section.images.map((src) => (
                  <div
                    key={src}
                    className={`relative w-full overflow-hidden bg-coal-800 ${
                      section.images.length === 1 ? 'aspect-[16/10]' : 'aspect-[4/3]'
                    }`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes={
                        section.images.length === 1
                          ? '100vw'
                          : '(max-width: 768px) 100vw, 50vw'
                      }
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        <ProjectNav
          locale={locale}
          theme={theme}
          prev={prev}
          next={next}
          portfolioHref={portfolioHref}
        />
      </div>

      <div
        className="h-20 w-full shrink-0 md:h-24 lg:h-[48vh] lg:min-h-[280px]"
        aria-hidden
      />
    </section>
  )
}
