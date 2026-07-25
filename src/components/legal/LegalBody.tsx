'use client'

import React from 'react'
import {
  tLegal,
  tLegalList,
  type LegalPage,
} from '@/lib/legalPages'

interface LegalBodyProps {
  page: LegalPage
  locale: string
  theme?: 'light' | 'dark'
}

function formatUpdatedAt(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(
      locale === 'he' ? 'he-IL' : locale === 'ru' ? 'ru-RU' : 'en-GB',
      { year: 'numeric', month: 'long', day: 'numeric' },
    ).format(new Date(`${iso}T12:00:00`))
  } catch {
    return iso
  }
}

export default function LegalBody({ page, locale, theme = 'dark' }: LegalBodyProps) {
  const isLight = theme === 'light'
  const title = tLegal(page.title, locale)
  const bodyTone = isLight ? 'text-coal-900/85' : 'text-white/80'
  const headingTone = isLight ? 'text-coal-900' : 'text-white'

  return (
    <section
      id="legal-body"
      className={`relative z-20 w-full shadow-[0_-12px_30px_rgba(0,0,0,0.28)] ${
        isLight ? 'bg-gold-100 text-coal-900' : 'dark-gradient-bg text-white'
      }`}
    >
      <article className="mx-auto flex w-full max-w-[1170px] flex-col gap-10 px-[30px] py-12 md:gap-14 md:py-16 lg:gap-16 lg:py-20">
        <header className="flex flex-col gap-4">
          <h1 className="m-0 font-sans text-[28px] font-extralight uppercase tracking-[0.08em] md:text-[40px] md:tracking-[0.1em]">
            <span className="text-erythro-500">{title.charAt(0)}</span>
            <span>{title.slice(1)}</span>
          </h1>
          <p className="m-0 font-sans text-sm font-light tracking-[0.04em] text-gold-500 md:text-base">
            {tLegal(page.updatedLabel, locale)}: {formatUpdatedAt(page.updatedAt, locale)}
          </p>
          <p className={`m-0 max-w-[720px] font-sans text-lg font-light leading-8 md:text-xl md:leading-9 ${bodyTone}`}>
            {tLegal(page.intro, locale)}
          </p>
        </header>

        <div className="flex flex-col gap-10 md:gap-12">
          {page.sections.map((section) => {
            const heading = tLegal(section.heading, locale)
            const paragraphs = tLegalList(section.paragraphs, locale)
            const bullets = section.bullets ? tLegalList(section.bullets, locale) : []

            return (
              <section key={heading} className="flex flex-col gap-4">
                <h2
                  className={`m-0 font-sans text-xl font-normal tracking-[0.04em] md:text-2xl ${headingTone}`}
                >
                  {heading}
                </h2>
                {paragraphs.map((p) => (
                  <p
                    key={p.slice(0, 48)}
                    className={`m-0 font-sans text-base font-light leading-7 md:text-lg md:leading-8 ${bodyTone}`}
                  >
                    {p}
                  </p>
                ))}
                {bullets.length > 0 && (
                  <ul
                    className={`m-0 list-disc space-y-2 ps-5 font-sans text-base font-light leading-7 md:text-lg md:leading-8 ${bodyTone}`}
                  >
                    {bullets.map((item) => (
                      <li key={item.slice(0, 48)}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>

        {page.closing && (
          <p className="m-0 border-t border-white/10 pt-8 font-sans text-base font-light leading-7 text-gold-500 md:text-lg">
            {tLegal(page.closing, locale)}
          </p>
        )}
      </article>
    </section>
  )
}
