'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { PortfolioProject } from '@/lib/portfolioProjects'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ProjectHeroProps {
  project: PortfolioProject
}

export default function ProjectHero({ project }: ProjectHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null)

  const meta = [
    { label: 'Category', value: project.categoryLabel },
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
      className="relative z-10 flex min-h-screen w-full flex-col justify-end overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        {project.hero.type === 'video' ? (
          <video
            className="h-full w-full object-cover"
            src={project.hero.src}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          />
        ) : (
          <Image
            src={project.hero.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-coal-900 via-coal-900/55 to-coal-900/20"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1170px] px-[30px] pb-16 pt-[140px] md:pb-20 lg:pb-24">
        <p className="mb-4 font-sans text-xs uppercase tracking-[0.24em] text-white/55">
          {project.categoryLabel}
        </p>
        <p className="max-w-[640px] font-sans text-base font-light leading-7 text-white/80 md:text-lg md:leading-8">
          {project.summary}
        </p>

        <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-white/15 pt-8 md:grid-cols-4 lg:mt-12 lg:gap-x-10">
          {meta.map((item) => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <dt className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/45">
                {item.label}
              </dt>
              <dd className="font-sans text-sm font-normal leading-snug text-white md:text-[15px]">
                {item.value}
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
