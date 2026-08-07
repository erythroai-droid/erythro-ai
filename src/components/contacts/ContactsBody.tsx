'use client'

import React, { useRef, useState } from 'react'
import { useSiteContent } from '@/components/SiteContentProvider'
import { contactForm } from '@/translations'
import { contactsPage, tContacts } from '@/lib/contactsPage'

interface ContactsBodyProps {
  locale: string
  theme?: 'light' | 'dark'
}

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function ContactsBody({ locale, theme = 'dark' }: ContactsBodyProps) {
  const content = useSiteContent()
  const site = content.siteSettings
  const footer = content.footer
  const isLight = theme === 'light'
  const t = (field: Record<string, string>) => field[locale] || field.en
  const form = contactForm

  const title = tContacts(contactsPage.title, locale)
  const intro = tContacts(contactsPage.intro, locale)
  const detailsHeading = tContacts(contactsPage.detailsHeading, locale)
  const formHeading = tContacts(contactsPage.formHeading, locale)
  const socialHeading = tContacts(contactsPage.socialHeading, locale)

  const bodyTone = isLight ? 'text-coal-900/85' : 'text-white/80'
  const headingTone = isLight ? 'text-coal-900' : 'text-white'
  const accentTone = isLight ? 'text-gold-900' : 'text-gold-500'
  const cardClass = isLight
    ? 'border-coal-900/10 bg-white/70'
    : 'border-white/10 bg-white/[0.04]'
  const inputClass = isLight
    ? 'w-full rounded-[10px] border border-coal-900/15 bg-white px-4 py-3 text-coal-900 placeholder:text-coal-900/40 outline-none transition-colors focus:border-erythro-500 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erythro-500'
    : 'w-full rounded-[10px] border border-white/15 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/40 outline-none transition-colors focus:border-gold-500 focus:bg-white/[0.06] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erythro-500'
  const labelClass = isLight
    ? 'mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-coal-900/70'
    : 'mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-white/70'
  const linkClass = isLight
    ? 'text-coal-900 transition-colors hover:text-erythro-500'
    : 'text-white transition-colors hover:text-gold-500'

  const [status, setStatus] = useState<Status>('idle')
  const [values, setValues] = useState({ name: '', email: '', phone: '', message: '' })
  const firstFieldRef = useRef<HTMLInputElement | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
    if (status === 'error') setStatus('idle')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, locale }),
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus('success')
      setValues({ name: '', email: '', phone: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  const detailRows = [
    {
      id: 'email',
      label: t(footer.emailLabel),
      value: site.email,
      href: `mailto:${site.email}`,
      ltr: true,
    },
    {
      id: 'phone',
      label: t(footer.phoneLabel),
      value: site.phoneDisplay,
      href: `tel:${site.phone}`,
      ltr: true,
    },
    {
      id: 'location',
      label: t(footer.locationLabel),
      value: t(footer.locationValue).trim(),
      href: undefined,
      ltr: false,
    },
  ]

  return (
    <section
      id="contacts-page"
      data-menu-contrast={isLight ? 'light' : 'dark'}
      className={`relative z-20 w-full shadow-[0_-12px_30px_rgba(0,0,0,0.28)] ${
        isLight ? 'bg-gold-100 text-coal-900' : 'dark-gradient-bg text-white'
      }`}
    >
      {!isLight && (
        <div className="solution-section-noise absolute inset-0 z-[1] pointer-events-none" aria-hidden />
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-[1170px] flex-col gap-12 px-[30px] py-12 md:gap-16 md:py-16 lg:gap-20 lg:py-20">
        <header className="flex w-full flex-col gap-4">
          <h1 className="m-0 font-sans text-[28px] font-extralight uppercase tracking-[0.08em] md:text-[40px] md:tracking-[0.1em]">
            <span className="text-erythro-500">{title.charAt(0)}</span>
            <span className={headingTone}>{title.slice(1)}</span>
          </h1>
          <p
            className={`m-0 w-full font-sans text-lg font-light leading-8 whitespace-normal md:text-xl md:leading-9 lg:whitespace-nowrap ${bodyTone}`}
          >
            {intro}
          </p>
        </header>

        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Details */}
          <div className="flex flex-col gap-8 lg:col-span-5">
            <div className="flex flex-col gap-4">
              <h2
                className={`m-0 font-sans text-xl font-normal tracking-[0.04em] md:text-2xl ${headingTone}`}
              >
                {detailsHeading}
              </h2>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {detailRows.map((row) => (
                  <li key={row.id}>
                    <div
                      className={`flex flex-col gap-1 rounded-[10px] border px-5 py-4 ${cardClass}`}
                    >
                      <span className={`text-xs font-bold uppercase tracking-[0.16em] ${accentTone}`}>
                        {row.label.replace(/:$/, '')}
                      </span>
                      {row.href ? (
                        <a
                          href={row.href}
                          className={`font-sans text-base font-medium leading-7 md:text-lg ${linkClass}`}
                        >
                          {row.ltr ? <bdi dir="ltr">{row.value}</bdi> : row.value}
                        </a>
                      ) : (
                        <span
                          className={`font-sans text-base font-medium leading-7 md:text-lg ${headingTone}`}
                        >
                          {row.ltr ? <bdi dir="ltr">{row.value}</bdi> : row.value}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <h2
                className={`m-0 font-sans text-xl font-normal tracking-[0.04em] md:text-2xl ${headingTone}`}
              >
                {socialHeading}
              </h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href={site.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-[40px] border px-5 py-2.5 text-xs uppercase tracking-[0.18em] transition-colors ${
                    isLight
                      ? 'border-coal-900/20 text-coal-900 hover:border-erythro-500 hover:text-erythro-500'
                      : 'border-white/20 text-white hover:border-gold-500 hover:text-gold-500'
                  }`}
                >
                  Facebook
                </a>
                <a
                  href={site.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-[40px] border px-5 py-2.5 text-xs uppercase tracking-[0.18em] transition-colors ${
                    isLight
                      ? 'border-coal-900/20 text-coal-900 hover:border-erythro-500 hover:text-erythro-500'
                      : 'border-white/20 text-white hover:border-gold-500 hover:text-gold-500'
                  }`}
                >
                  TikTok
                </a>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className={`rounded-[10px] border p-6 sm:p-8 ${cardClass}`}>
              {status === 'success' ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="m5 13 4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className={`m-0 max-w-[360px] font-sans text-base font-light leading-7 ${bodyTone}`}>
                    {t(form.success)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className={`mt-2 rounded-[40px] border px-8 py-3 text-sm uppercase tracking-widest transition-colors ${
                      isLight
                        ? 'border-erythro-500 text-erythro-500 hover:bg-erythro-500 hover:text-white'
                        : 'border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-coal-900'
                    }`}
                  >
                    {t(form.close)}
                  </button>
                </div>
              ) : (
                <>
                  <h2
                    className={`m-0 mb-6 font-sans text-xl font-normal tracking-[0.04em] md:text-2xl ${headingTone}`}
                  >
                    {formHeading}
                  </h2>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                    <div>
                      <label htmlFor="contacts-page-name" className={labelClass}>
                        {t(form.name)}
                      </label>
                      <input
                        ref={firstFieldRef}
                        id="contacts-page-name"
                        name="name"
                        type="text"
                        required
                        value={values.name}
                        onChange={handleChange}
                        placeholder={t(form.name)}
                        className={inputClass}
                        autoComplete="name"
                        aria-required="true"
                      />
                    </div>
                    <div>
                      <label htmlFor="contacts-page-email" className={labelClass}>
                        {t(form.email)}
                      </label>
                      <input
                        id="contacts-page-email"
                        name="email"
                        type="email"
                        required
                        value={values.email}
                        onChange={handleChange}
                        placeholder={t(form.email)}
                        className={inputClass}
                        autoComplete="email"
                        dir="ltr"
                        aria-required="true"
                      />
                    </div>
                    <div>
                      <label htmlFor="contacts-page-phone" className={labelClass}>
                        {t(form.phone)}
                      </label>
                      <input
                        id="contacts-page-phone"
                        name="phone"
                        type="tel"
                        value={values.phone}
                        onChange={handleChange}
                        placeholder={t(form.phone)}
                        className={inputClass}
                        autoComplete="tel"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label htmlFor="contacts-page-message" className={labelClass}>
                        {t(form.message)}
                      </label>
                      <textarea
                        id="contacts-page-message"
                        name="message"
                        required
                        value={values.message}
                        onChange={handleChange}
                        placeholder={t(form.message)}
                        rows={5}
                        className={`${inputClass} resize-none`}
                        aria-required="true"
                        aria-invalid={status === 'error' || undefined}
                        aria-describedby={status === 'error' ? 'contacts-page-error' : undefined}
                      />
                    </div>

                    {status === 'error' && (
                      <p id="contacts-page-error" role="alert" className="m-0 text-sm text-erythro-500">
                        {t(form.error)}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="mt-2 w-full cursor-pointer rounded-[40px] bg-erythro-500 px-8 py-3.5 text-sm font-medium uppercase tracking-widest text-white shadow-none transition-[box-shadow,transform,opacity] duration-300 ease-out hover:shadow-[0_3px_20px_0_rgba(229,36,33,0.45)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none"
                    >
                      {status === 'sending' ? t(form.sending) : t(form.submit)}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[calc(30px+2rem)] w-full shrink-0 lg:hidden" aria-hidden />
    </section>
  )
}
