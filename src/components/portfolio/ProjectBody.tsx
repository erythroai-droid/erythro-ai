'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { PortfolioProject } from '@/lib/portfolioProjects'
import { tLocale, tLocaleList } from '@/lib/portfolioProjects'
import {
  isLexicalDoc,
  lexicalFromText,
  lexicalHasContent,
  lexicalToPlain,
  type LexicalDoc,
} from '@/lib/lexical'
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

function visitProjectLabel(locale: string): string {
  if (locale === 'ru') return 'Открыть проект'
  if (locale === 'he') return 'לצפייה בפרויקט'
  return 'Visit project'
}

function pickRichDoc(
  rich: Record<string, unknown> | null | undefined,
  locale: string,
  fallbackPlain: string,
): LexicalDoc {
  const candidate = rich?.[locale] ?? rich?.en
  if (isLexicalDoc(candidate)) return candidate
  return lexicalFromText(fallbackPlain)
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
  const title = tLocale(project.title, locale)
  const subtitlePlain = tLocale(project.subtitle, locale).trim()
  const subtitleDoc = pickRichDoc(
    project.subtitleRich as Record<string, unknown> | undefined,
    locale,
    subtitlePlain,
  )
  const hasSubtitle = Boolean(lexicalToPlain(subtitleDoc).trim() || subtitlePlain)

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
      <div className="mx-auto flex w-full min-w-0 max-w-[1170px] flex-col gap-16 px-[30px] py-16 md:gap-20 md:py-24 lg:gap-24 lg:py-[120px]">
        <header className="flex flex-col gap-4 md:gap-5">
          <h1 className="m-0 font-sans text-[36px] font-extralight uppercase leading-tight tracking-[0.06em] md:text-[52px] md:tracking-[0.08em] lg:text-[56px]">
            <span className="text-erythro-500">{title.charAt(0)}</span>
            <span>{title.slice(1)}</span>
          </h1>
          {hasSubtitle ? (
            <div
              className={`m-0 max-w-[720px] font-sans text-lg font-light leading-8 md:text-xl md:leading-9 [&_:is(h1,h2,h3,h4,h5,h6,p)]:m-0 [&_p+_p]:mt-3 [&_a]:underline [&_strong]:font-semibold [&_em]:italic [&_img]:mt-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-[10px] [&_img]:shadow-[0_6px_20px_rgba(0,0,0,0.18)] [&_picture]:mt-4 [&_picture]:block [&_picture]:max-w-full ${
                isLight ? 'text-coal-900/70' : 'text-gold-500'
              }`}
            >
              <RichText data={subtitleDoc as never} />
            </div>
          ) : null}
        </header>
        {project.body.map((section, index) => {
          const heading = section.heading ? tLocale(section.heading, locale) : ''
          const plainParagraphs = tLocaleList(section.paragraphs, locale).filter(Boolean)
          const richList = Array.isArray(section.paragraphsRich?.[locale])
            ? (section.paragraphsRich?.[locale] as unknown[])
            : Array.isArray(section.paragraphsRich?.en)
              ? (section.paragraphsRich?.en as unknown[])
              : []
          const paragraphDocs =
            richList.length > 0
              ? richList
                  .map((doc, i) =>
                    isLexicalDoc(doc)
                      ? doc
                      : lexicalFromText(plainParagraphs[i] || ''),
                  )
                  .filter((doc) => lexicalHasContent(doc))
              : plainParagraphs.map((text) => lexicalFromText(text))

          return (
            <div key={heading || `section-${index}`} className="flex min-w-0 flex-col gap-8 md:gap-10">
              {heading ? (
                <h2
                  className={`m-0 font-sans text-[28px] font-extralight uppercase tracking-[0.08em] md:text-[40px] md:tracking-[0.1em] ${
                    isLight ? 'text-gold-900' : 'text-gold-500'
                  }`}
                >
                  {heading}
                </h2>
              ) : null}

              <div className="flex w-full min-w-0 flex-col gap-5">
                {paragraphDocs.map((doc, i) => (
                  <div
                    key={`${heading || index}-p-${i}-${lexicalToPlain(doc).slice(0, 32)}`}
                    className={`min-w-0 font-sans text-base font-light leading-7 md:text-lg md:leading-8 [&_:is(h1,h2,h3,h4,h5,h6,p)]:m-0 [&_p+_p]:mt-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:my-1 [&_a]:underline [&_strong]:font-semibold [&_em]:italic [&_img]:mt-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-[10px] [&_img]:shadow-[0_6px_20px_rgba(0,0,0,0.18)] [&_picture]:mt-4 [&_picture]:block [&_picture]:max-w-full ${
                      isLight ? 'text-coal-900/85' : 'text-white/80'
                    }`}
                  >
                    <RichText data={doc as never} />
                  </div>
                ))}
              </div>

              {section.images.length > 0 ? (
                <div
                  className={`grid w-full gap-5 ${
                    section.images.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  {section.images.map((src) => (
                    <div key={src} className="w-full">
                      <Image
                        src={src}
                        alt=""
                        width={1920}
                        height={1080}
                        sizes={
                          section.images.length === 1
                            ? '100vw'
                            : '(max-width: 768px) 100vw, 50vw'
                        }
                        className="h-auto w-full rounded-[10px] shadow-[0_6px_20px_rgba(0,0,0,0.18)]"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}

        {project.link ? (
          <div className="flex w-full justify-start">
            <Link
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex h-10 items-center justify-center rounded-[var(--xl,40px)] border px-8 font-sans text-[11px] font-medium uppercase tracking-[1.8px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-[0.97] active:duration-100 sm:h-11 sm:px-10 sm:text-[12px] sm:tracking-[2px] ${
                isLight
                  ? 'border-transparent bg-erythro-500 text-white hover:bg-erythro-600 active:bg-erythro-700'
                  : 'border-gold-500 bg-transparent text-gold-500 hover:bg-gold-500 hover:text-coal-900 active:bg-gold-500 active:text-coal-900'
              }`}
            >
              {visitProjectLabel(locale)}
            </Link>
          </div>
        ) : null}

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
