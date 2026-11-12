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
  const packageLabel = project.packageLabel ? tLocale(project.packageLabel, locale).trim() : ''
  const packageHref = project.packageHref?.trim() || ''
  const highlights = (Array.isArray(project.highlights) ? project.highlights : [])
    .map((row) => {
      if (!row || typeof row !== 'object' || !('label' in row) || !('detail' in row)) {
        return null
      }
      const label = tLocale(row.label, locale).trim()
      const detail = tLocale(row.detail, locale).trim()
      if (!label || !detail) return null
      const parts = detail.split(' · ').map((part) => part.trim()).filter(Boolean)
      const metrics = (Array.isArray(row.metrics) ? row.metrics : [])
        .map((metric) => ({
          value: typeof metric?.value === 'string' ? metric.value : '',
          label: metric?.label ? tLocale(metric.label, locale).trim() : '',
        }))
        .filter((metric) => metric.value && metric.label)
      const metricsNote = row.metricsNote ? tLocale(row.metricsNote, locale).trim() : ''
      return { label, parts, metrics, metricsNote }
    })
    .filter(
      (
        row,
      ): row is {
        label: string
        parts: string[]
        metrics: { value: string; label: string }[]
        metricsNote: string
      } => Boolean(row),
    )
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
        <header className="flex flex-col gap-6 md:gap-8">
          <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <h1 className="m-0 min-w-0 font-sans text-[36px] font-extralight uppercase leading-tight tracking-[0.06em] md:text-[52px] md:tracking-[0.08em] lg:text-[56px]">
              <span className="text-erythro-500">{title.charAt(0)}</span>
              <span>{title.slice(1)}</span>
            </h1>
            {packageLabel ? (
              packageHref ? (
                <Link
                  href={packageHref}
                  className={`inline-flex max-w-full shrink-0 items-center rounded-[4px] border px-2.5 py-1 font-sans text-[11px] font-medium uppercase leading-4 tracking-[0.14em] transition-colors md:text-xs ${
                    isLight
                      ? 'border-coal-900 text-coal-900 hover:border-erythro-500 hover:text-erythro-500'
                      : 'border-gold-500 text-gold-500 hover:border-gold-400 hover:text-gold-400'
                  }`}
                >
                  {packageLabel}
                </Link>
              ) : (
                <span
                  className={`inline-flex max-w-full shrink-0 items-center rounded-[4px] border px-2.5 py-1 font-sans text-[11px] font-medium uppercase leading-4 tracking-[0.14em] md:text-xs ${
                    isLight ? 'border-coal-900 text-coal-900' : 'border-gold-500 text-gold-500'
                  }`}
                >
                  {packageLabel}
                </span>
              )
            ) : null}
          </div>
          {highlights.length > 0 ? (
            <dl
              className={`m-0 flex w-full flex-col border-t ${
                isLight ? 'border-coal-900/15' : 'border-white/15'
              }`}
              aria-label={
                locale === 'ru'
                  ? 'Ключевые преимущества'
                  : locale === 'he'
                    ? 'יתרונות עיקריים'
                    : 'Key highlights'
              }
            >
              {highlights.map((row) => {
                const hasMetrics = row.metrics.length > 0
                const detailText =
                  row.parts.length > 1 ? row.parts.join(' · ') : row.parts[0] || ''
                return (
                  <div
                    key={row.label}
                    className={`grid grid-cols-1 gap-3 border-b py-6 md:grid-cols-[minmax(9rem,22%)_minmax(0,1fr)] md:items-start md:gap-x-10 ${
                      isLight ? 'border-coal-900/15' : 'border-white/15'
                    }`}
                  >
                    <dt
                      className={`m-0 font-sans text-sm font-normal leading-snug md:pt-1 ${
                        isLight ? 'text-coal-900' : 'text-white'
                      }`}
                    >
                      {row.label}
                    </dt>
                    <dd className="m-0 flex min-w-0 flex-col gap-5">
                      <p
                        className={`m-0 font-sans text-base font-light leading-7 md:text-lg md:leading-8 ${
                          isLight ? 'text-coal-900/80' : 'text-white/75'
                        }`}
                      >
                        {detailText}
                      </p>
                      {hasMetrics ? (
                        <div className="flex flex-col gap-3">
                          <ul className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-5 p-0 sm:grid-cols-3 lg:grid-cols-6">
                            {row.metrics.map((metric) => (
                              <li key={metric.label} className="flex min-w-0 flex-col gap-1.5">
                                <span
                                  className={`whitespace-nowrap font-sans text-[32px] font-extralight leading-none tabular-nums md:text-[40px] ${
                                    isLight ? 'text-coal-900' : 'text-white'
                                  }`}
                                >
                                  <bdi>{metric.value}</bdi>
                                </span>
                                <span
                                  className={`font-sans text-xs leading-snug ${
                                    isLight ? 'text-coal-400' : 'text-white/55'
                                  }`}
                                >
                                  {metric.label}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {row.metricsNote ? (
                            <p
                              className={`m-0 font-sans text-xs leading-snug ${
                                isLight ? 'text-coal-400' : 'text-white/45'
                              }`}
                            >
                              {row.metricsNote}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </dd>
                  </div>
                )
              })}
            </dl>
          ) : null}
          {hasSubtitle ? (
            <div
              className={`m-0 w-full max-w-none font-sans text-lg font-light leading-8 md:text-xl md:leading-9 [&_:is(h1,h2,h3,h4,h5,h6,p)]:m-0 [&_p+_p]:mt-3 [&_a]:underline [&_strong]:font-semibold [&_em]:italic [&_img]:mt-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-[10px] [&_img]:shadow-[0_6px_20px_rgba(0,0,0,0.18)] [&_picture]:mt-4 [&_picture]:block [&_picture]:max-w-full ${
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

        <ProjectNav
          locale={locale}
          theme={theme}
          prev={prev}
          next={next}
          portfolioHref={portfolioHref}
          visitHref={project.link || null}
          visitLabel={visitProjectLabel(locale)}
          discussWhatsApp
          projectTitle={title}
        />
      </div>

      <div
        className="h-20 w-full shrink-0 md:h-24 lg:h-[48vh] lg:min-h-[280px]"
        aria-hidden
      />
    </section>
  )
}
