'use client'

import React from 'react'
import Link from 'next/link'
import { useSiteContent } from '@/components/SiteContentProvider'
import { aboutPage, tAbout } from '@/lib/aboutPage'

type Props = {
  locale: string
  theme: 'light' | 'dark'
}

export default function AboutBody({ locale, theme }: Props) {
  const content = useSiteContent()
  const site = content.siteSettings
  const footer = content.footer
  const isLight = theme === 'light'
  const title = tAbout(aboutPage.title, locale)
  const intro = tAbout(aboutPage.intro, locale)
  const headingTone = isLight ? 'text-coal-900' : 'text-white'
  const bodyTone = isLight ? 'text-coal-900/80' : 'text-white/80'
  const cardClass = isLight ? 'border-coal-900/10 bg-white/70' : 'border-white/10 bg-white/[0.04]'
  const linkClass = isLight
    ? 'text-erythro-500 hover:text-coal-900'
    : 'text-gold-500 hover:text-white'

  const facts: Array<{ term: string; value: React.ReactNode }> = [
    { term: 'Name', value: 'Erythro.ai' },
    { term: locale === 'ru' ? 'Сайт' : locale === 'he' ? 'אתר' : 'Website', value: 'https://erythro.ai' },
    {
      term: locale === 'ru' ? 'Описание' : locale === 'he' ? 'תיאור' : 'Description',
      value: tAbout(aboutPage.servicesList, locale),
    },
    {
      term: tAbout(footer.locationLabel, locale).replace(/:$/, ''),
      value: tAbout(footer.locationValue, locale).trim(),
    },
    {
      term: tAbout(footer.emailLabel, locale).replace(/:$/, ''),
      value: (
        <a href={`mailto:${(site.emailContacts || site.email).toLowerCase()}`} className={linkClass}>
          <bdi dir="ltr">{site.emailContacts || site.email}</bdi>
        </a>
      ),
    },
    {
      term: tAbout(footer.phoneLabel, locale).replace(/:$/, ''),
      value: (
        <a href={`tel:${site.phone}`} className={linkClass}>
          <bdi dir="ltr">{site.phoneDisplay}</bdi>
        </a>
      ),
    },
  ]

  return (
    <section
      id="about-page"
      data-menu-contrast={isLight ? 'light' : 'dark'}
      className={`relative z-20 w-full shadow-[0_-12px_30px_rgba(0,0,0,0.28)] ${
        isLight ? 'bg-gold-100 text-coal-900' : 'dark-gradient-bg text-white'
      }`}
    >
      {!isLight && (
        <div className="solution-section-noise absolute inset-0 z-[1] pointer-events-none" aria-hidden />
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-[900px] flex-col gap-10 px-[30px] py-12 md:gap-12 md:py-16 lg:py-20">
        <header className="flex w-full flex-col gap-4">
          <h1 className="m-0 font-sans text-[28px] font-extralight uppercase tracking-[0.08em] md:text-[40px] md:tracking-[0.1em]">
            <span className="text-erythro-500">{title.charAt(0)}</span>
            <span className={headingTone}>{title.slice(1)}</span>
          </h1>
          <p className={`m-0 font-sans text-lg font-light leading-8 md:text-xl md:leading-9 ${bodyTone}`}>
            {intro}
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <h2 className={`m-0 font-sans text-xl font-normal tracking-[0.04em] md:text-2xl ${headingTone}`}>
            {tAbout(aboutPage.factsHeading, locale)}
          </h2>
          <dl className={`m-0 grid gap-3 rounded-[10px] border p-5 md:p-6 ${cardClass}`}>
            {facts.map((row) => (
              <div key={row.term} className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-4">
                <dt className={`m-0 text-xs font-bold uppercase tracking-[0.16em] ${isLight ? 'text-erythro-500' : 'text-gold-500'}`}>
                  {row.term}
                </dt>
                <dd className={`m-0 font-sans text-base leading-7 md:text-lg ${headingTone}`}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className={`m-0 font-sans text-xl font-normal tracking-[0.04em] md:text-2xl ${headingTone}`}>
            {tAbout(aboutPage.servicesHeading, locale)}
          </h2>
          <ul className={`m-0 list-disc space-y-2 ps-5 font-sans text-base leading-7 md:text-lg ${bodyTone}`}>
            <li>Web development &amp; high-performance websites</li>
            <li>Design, branding &amp; UI/UX</li>
            <li>AI automation &amp; AI agents</li>
            <li>CMS, content editing &amp; baseline SEO</li>
            <li>Motion, launch &amp; ongoing support</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={site.facebook}
            target="_blank"
            rel="noopener noreferrer me"
            className={`rounded-[40px] border px-5 py-2.5 text-xs uppercase tracking-[0.18em] transition-colors ${
              isLight
                ? 'border-coal-900/20 text-coal-900 hover:border-erythro-500 hover:text-erythro-500'
                : 'border-white/20 text-white hover:border-gold-500 hover:text-gold-500'
            }`}
          >
            Facebook
          </a>
          <a
            href={site.telegram}
            target="_blank"
            rel="noopener noreferrer me"
            className={`rounded-[40px] border px-5 py-2.5 text-xs uppercase tracking-[0.18em] transition-colors ${
              isLight
                ? 'border-coal-900/20 text-coal-900 hover:border-erythro-500 hover:text-erythro-500'
                : 'border-white/20 text-white hover:border-gold-500 hover:text-gold-500'
            }`}
          >
            Telegram
          </a>
        </div>

        <div className={`flex flex-col gap-3 rounded-[10px] border p-5 md:p-6 ${cardClass}`}>
          <h2 className={`m-0 font-sans text-xl font-normal tracking-[0.04em] md:text-2xl ${headingTone}`}>
            {tAbout(aboutPage.correctionHeading, locale)}
          </h2>
          <p className={`m-0 font-sans text-base leading-7 ${bodyTone}`}>
            {tAbout(aboutPage.correctionText, locale)}
          </p>
          <Link
            href="/contacts"
            className={`inline-flex w-fit rounded-[40px] border px-6 py-3 text-xs uppercase tracking-[0.18em] transition-colors ${
              isLight
                ? 'border-erythro-500 text-erythro-500 hover:bg-erythro-500 hover:text-white'
                : 'border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-coal-900'
            }`}
          >
            {tAbout(aboutPage.contactCta, locale)}
          </Link>
        </div>
      </div>
    </section>
  )
}
