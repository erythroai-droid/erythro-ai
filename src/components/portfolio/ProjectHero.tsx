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

function HeroMedia({
  type,
  src,
  srcMobile,
}: {
  type: 'image' | 'video'
  src: string
  srcMobile?: string
}) {
  const mobileSrc = srcMobile || src
  const hasSeparateMobile = Boolean(srcMobile && srcMobile !== src)

  if (type === 'video') {
    if (!hasSeparateMobile) {
      return (
        <video
          className="absolute inset-0 h-full w-full object-cover object-center"
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
      <>
        <video
          className="absolute inset-0 h-full w-full object-cover object-center lg:hidden"
          src={mobileSrc}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
        <video
          className="absolute inset-0 hidden h-full w-full object-cover object-center lg:block"
          src={src}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      </>
    )
  }

  if (!hasSeparateMobile) {
    return (
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
    )
  }

  return (
    <>
      <Image
        src={mobileSrc}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center lg:hidden"
      />
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="hidden object-cover object-center lg:block"
      />
    </>
  )
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
      className="relative z-10 flex w-full flex-col overflow-hidden bg-coal-900 lg:min-h-screen lg:justify-end"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full lg:w-full">
        <HeroMedia
          type={project.hero.type}
          src={project.hero.src}
          srcMobile={project.hero.srcMobile}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-coal-900 via-coal-900/40 to-transparent lg:via-coal-900/55 lg:to-coal-900/20"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1170px] px-[30px] pb-12 pt-8 md:pb-16 lg:pb-24 lg:pt-[140px]">
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
