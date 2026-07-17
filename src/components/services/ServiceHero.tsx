'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { tLocale, type ServicePage } from '@/lib/servicePages'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ServiceHeroProps {
  service: ServicePage
  locale: string
}

export default function ServiceHero({ service, locale }: ServiceHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const title = tLocale(service.title, locale)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px)', () => {
        ScrollTrigger.create({
          id: 'service-hero-pin',
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
      id="service-hero"
      className="relative z-10 flex h-[30vh] min-h-[220px] w-full flex-col justify-end overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        {service.hero.type === 'video' ? (
          <video
            className="h-full w-full object-cover"
            src={service.hero.src}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          />
        ) : (
          <Image
            src={service.hero.src}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-coal-900 via-coal-900/50 to-coal-900/15"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1170px] px-[30px] pb-14 pt-20 md:pb-10">
        <h1 className="max-w-[900px] font-sans text-[28px] font-extralight uppercase leading-tight tracking-[0.08em] text-white md:text-[40px] md:tracking-[0.1em] lg:text-[48px]">
          {title}
        </h1>
      </div>
    </section>
  )
}
