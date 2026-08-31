'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BorderBeam } from 'border-beam'
import Button from '@/components/Button'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { contactForm } from '@/translations'
import ContactPrivacyConsent from '@/components/ContactPrivacyConsent'
import { ContactHoneypotField } from '@/components/ContactHoneypotField'
import { ContactSendSpinner } from '@/components/ContactSendingPanel'
import { CONTACT_HONEYPOT_FIELD } from '@/lib/contactHoneypot'
import {
  auditPage,
  tAudit,
  type AuditTabId,
} from '@/lib/auditPage'
import {
  AUDIT_REPORT_LANGUAGES,
  buildAuditContactPayload,
  buildAuditSubmissionMessage,
  hasAuditFieldErrors,
  validateAuditForm,
  type AuditField,
  type AuditFieldErrors,
  type AuditFormValues,
  type AuditReportLanguage,
} from '@/lib/auditFormValidation'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface AuditBodyProps {
  locale: string
  theme?: 'light' | 'dark'
}

type Status = 'idle' | 'sending' | 'success' | 'error'

const TAB_ORDER: AuditTabId[] = ['audit', 'how', 'pricing']

const AUDIT_BEAM_STYLE = {
  '--pulse-glow-boost': 1.45,
  '--beam-glow-brightness': 1.15,
} as React.CSSProperties

const AUDIT_BEAM_PROPS = {
  size: 'pulse-outside' as const,
  colorVariant: 'colorful' as const,
  strength: 0.7,
  duration: 2.2,
  className: 'w-full overflow-visible',
  style: AUDIT_BEAM_STYLE,
}

export default function AuditBody({ locale, theme = 'dark' }: AuditBodyProps) {
  const [activeTab, setActiveTab] = useState<AuditTabId>('audit')
  const formRef = useRef<HTMLDivElement | null>(null)

  const isLight = theme === 'light'
  const tForm = (field: Record<string, string>) => field[locale] || field.en
  const title = tAudit(auditPage.title, locale)

  const bodyTone = isLight ? 'text-coal-900/85' : 'text-white/80'
  const headingTone = isLight ? 'text-coal-900' : 'text-white'
  const accentTone = isLight ? 'text-gold-900' : 'text-gold-500'
  const cardClass = isLight
    ? 'border-coal-900/10 bg-white/70'
    : 'border-white/10 bg-white/[0.04]'

  const goToForm = () => {
    setActiveTab('audit')
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  // Let’s Talk / Footer pins cache start positions. Tab panels differ a lot in
  // height — without a refresh the pin keeps the short-form measurements and
  // Let’s Talk covers “How it works” / pricing copy.
  useEffect(() => {
    const timer = window.setTimeout(() => ScrollTrigger.refresh(), 50)
    return () => window.clearTimeout(timer)
  }, [activeTab, locale, theme])

  return (
    <section
      id="audit-page"
      data-menu-contrast={isLight ? 'light' : 'dark'}
      className={`relative z-20 w-full shadow-[0_-12px_30px_rgba(0,0,0,0.28)] ${
        isLight ? 'solution-light-bg text-coal-900' : 'dark-gradient-bg text-white'
      }`}
    >
      <div className="solution-section-noise absolute inset-0 z-[1] pointer-events-none" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-[1170px] flex-col gap-10 px-[30px] py-12 md:gap-12 md:py-16 lg:gap-14 lg:py-20">
        <header className="flex w-full flex-col gap-4">
          <h1 className="m-0 font-sans text-[28px] font-extralight uppercase tracking-[0.08em] md:text-[40px] md:tracking-[0.1em]">
            <span className="text-erythro-500">{title.charAt(0)}</span>
            <span className={headingTone}>{title.slice(1)}</span>
          </h1>
        </header>

        <div
          role="tablist"
          aria-label={title}
          className={`flex flex-wrap gap-2 rounded-[40px] border p-1.5 ${cardClass}`}
        >
          {TAB_ORDER.map((tabId) => {
            const selected = activeTab === tabId
            return (
              <button
                key={tabId}
                type="button"
                role="tab"
                id={`audit-tab-${tabId}`}
                aria-selected={selected}
                aria-controls={`audit-panel-${tabId}`}
                onClick={() => setActiveTab(tabId)}
                className={`flex-1 min-w-[120px] cursor-pointer rounded-[32px] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-300 ${
                  selected
                    ? 'bg-erythro-500 text-white shadow-[0_3px_16px_0_rgba(229,36,33,0.35)]'
                    : isLight
                      ? 'text-coal-900/70 hover:text-coal-900'
                      : 'text-white/70 hover:text-white'
                }`}
              >
                {tAudit(auditPage.tabs[tabId], locale)}
              </button>
            )
          })}
        </div>

        <div ref={formRef}>
          {activeTab === 'audit' ? (
            <AuditFormPanel
              locale={locale}
              theme={theme}
              bodyTone={bodyTone}
              tForm={tForm}
            />
          ) : null}

          {activeTab === 'how' ? (
            <AuditHowPanel
              locale={locale}
              isLight={isLight}
              bodyTone={bodyTone}
              headingTone={headingTone}
              accentTone={accentTone}
            />
          ) : null}

          {activeTab === 'pricing' ? (
            <AuditPricingPanel
              locale={locale}
              bodyTone={bodyTone}
              headingTone={headingTone}
              accentTone={accentTone}
              isLight={isLight}
              onRequestAudit={goToForm}
            />
          ) : null}
        </div>
      </div>

      <div className="h-[calc(30px+2rem)] w-full shrink-0 lg:hidden" aria-hidden />
    </section>
  )
}

function AuditPillShell({
  isLight,
  hasError,
  children,
}: {
  isLight: boolean
  hasError?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`flex min-w-0 flex-col overflow-visible rounded-[24px] border sm:flex-row sm:rounded-full ${
        hasError
          ? 'border-erythro-500'
          : isLight
            ? 'border-coal-900/15'
            : 'border-white/15'
      } ${isLight ? 'bg-white' : 'bg-white/[0.04]'}`}
    >
      {children}
    </div>
  )
}

function AuditPillDivider({ isLight }: { isLight: boolean }) {
  return (
    <div
      className={`hidden h-auto w-px shrink-0 self-stretch sm:block ${
        isLight ? 'bg-coal-900/15' : 'bg-white/15'
      }`}
      aria-hidden
    />
  )
}

function auditPillFieldClass(isLight: boolean) {
  return `h-12 w-full min-w-0 flex-1 border-0 bg-transparent px-4 text-sm outline-none sm:h-[52px] ${
    isLight
      ? 'text-coal-900 placeholder:text-coal-900/40'
      : 'text-white placeholder:text-white/40'
  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-erythro-500`
}

function AuditLanguageSelect({
  id,
  locale,
  isLight,
  value,
  invalid,
  describedBy,
  onChange,
}: {
  id: string
  locale: string
  isLight: boolean
  value: AuditReportLanguage
  invalid?: boolean
  describedBy?: string
  onChange: (language: AuditReportLanguage) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const listId = `${id}-list`

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        {tAudit(auditPage.form.auditLanguage, locale)}
        <span className="ms-0.5 text-erythro-500" aria-hidden="true">
          *
        </span>
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-required="true"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => setOpen((current) => !current)}
        className={`${auditPillFieldClass(isLight)} cursor-pointer pe-10 text-start`}
      >
        {tAudit(auditPage.form.auditLanguageOptions[value], locale)}
      </button>
      <svg
        className={`pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 ${
          isLight ? 'text-coal-900/50' : 'text-white/50'
        } ${open ? 'rotate-180' : ''}`}
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden
      >
        <path
          d="m5 7.5 5 5 5-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-[16px] bg-coal-500 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        >
          {AUDIT_REPORT_LANGUAGES.map((language) => {
            const selected = language === value
            return (
              <li key={language} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(language)
                    setOpen(false)
                  }}
                  className={`flex w-full cursor-pointer items-center px-4 py-2.5 text-start text-sm transition-colors ${
                    selected ? 'text-gold-500' : 'text-white'
                  } hover:bg-gold-500 hover:text-coal-900`}
                >
                  {tAudit(auditPage.form.auditLanguageOptions[language], locale)}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

function AuditFormPanel({
  locale,
  theme,
  bodyTone,
  tForm,
}: {
  locale: string
  theme: 'light' | 'dark'
  bodyTone: string
  tForm: (field: Record<string, string>) => string
}) {
  const isLight = theme === 'light'
  const beamSurfaceClass = isLight
    ? 'border-coal-900/10 bg-white'
    : 'border-white/10 bg-coal-500'
  const defaultAuditLanguage = (['en', 'ru', 'he'].includes(locale) ? locale : 'en') as AuditReportLanguage
  const [status, setStatus] = useState<Status>('idle')
  const [submitError, setSubmitError] = useState('')
  const [reportHref, setReportHref] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [values, setValues] = useState<AuditFormValues>({
    website: '',
    name: '',
    email: '',
    phone: '',
    auditLanguage: defaultAuditLanguage,
  })
  const [fieldErrors, setFieldErrors] = useState<AuditFieldErrors>({})
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)

  useEffect(() => {
    setValues((current) => ({ ...current, auditLanguage: defaultAuditLanguage }))
  }, [defaultAuditLanguage])

  const pillFieldClass = auditPillFieldClass(isLight)
  const requiredPlaceholder = (text: string) => `${text} *`
  const fieldLabelClass = isLight ? 'text-coal-900/60' : 'text-white/60'

  const fieldErrorMessage = (field: AuditField) => {
    const err = fieldErrors[field]
    if (!err) return undefined
    if (field === 'website' && err === 'invalid') return tAudit(auditPage.form.websiteInvalid, locale)
    if (field === 'email' && err === 'invalid') return tForm(contactForm.emailInvalid)
    return tForm(contactForm.fieldRequired)
  }

  const renderFieldError = (field: AuditField, id: string) => {
    if (!fieldErrors[field]) return null
    return (
      <p id={id} role="alert" className="m-0 px-1 text-sm text-erythro-500">
        {fieldErrorMessage(field)}
      </p>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as AuditField
    setValues((v) => ({ ...v, [name]: e.target.value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
    if (status === 'error') {
      setStatus('idle')
      setSubmitError('')
    }
  }

  const handleLanguageChange = (language: AuditReportLanguage) => {
    setValues((v) => ({ ...v, auditLanguage: language }))
    if (fieldErrors.auditLanguage) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.auditLanguage
        return next
      })
    }
    if (status === 'error') {
      setStatus('idle')
      setSubmitError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return

    const nextFieldErrors = validateAuditForm(values)
    setFieldErrors(nextFieldErrors)
    if (!privacyConsent) setConsentError(true)
    else setConsentError(false)

    if (hasAuditFieldErrors(nextFieldErrors) || !privacyConsent) return

    const honeypot =
      (e.currentTarget.elements.namedItem(CONTACT_HONEYPOT_FIELD) as HTMLInputElement | null)?.value ?? ''

    setStatus('sending')
    setSubmitError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildAuditContactPayload({
            values,
            locale,
            honeypot,
            message: buildAuditSubmissionMessage(values.website, values.auditLanguage),
            planSlug: 'audit-free',
          }),
        ),
      })
      if (res.status === 429) {
        setSubmitError(tForm(contactForm.rateLimited))
        setStatus('error')
        return
      }
      if (!res.ok) throw new Error('Request failed')
      const payload = (await res.json().catch(() => null)) as {
        submissionId?: number | string
        orderId?: string
      } | null
      const sid = payload?.submissionId
      setReportHref(sid != null ? `/audit/report/${sid}` : null)
      setOrderId(
        payload?.orderId ||
          (sid != null ? `AUD-${sid}` : null),
      )
      setStatus('success')
      setValues({
        website: '',
        name: '',
        email: '',
        phone: '',
        auditLanguage: defaultAuditLanguage,
      })
      setFieldErrors({})
      setPrivacyConsent(false)
    } catch {
      setSubmitError(tForm(contactForm.error))
      setStatus('error')
    }
  }

  return (
    <div
      role="tabpanel"
      id="audit-panel-audit"
      aria-labelledby="audit-tab-audit"
      className="w-full"
    >
      <div className="audit-beam-hue overflow-visible p-4 -m-4">
        <BorderBeam {...AUDIT_BEAM_PROPS} theme={isLight ? 'light' : 'dark'}>
          <div
            className={`relative z-[1] rounded-[20px] border p-5 sm:p-8 lg:p-10 ${beamSurfaceClass}`}
          >
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
                <p className={`m-0 max-w-[420px] font-sans text-base font-light leading-7 ${bodyTone}`}>
                  {tAudit(auditPage.form.success, locale)}
                </p>
                {orderId ? (
                  <p className={`m-0 font-sans text-sm ${bodyTone}`}>
                    <span className="text-gold-500">
                      {locale === 'ru' ? 'ID заказа' : locale === 'he' ? 'מספר הזמנה' : 'Order ID'}:
                    </span>{' '}
                    <code className="font-mono tracking-wide">{orderId}</code>
                  </p>
                ) : null}
                {reportHref ? (
                  <a
                    href={reportHref}
                    className={`mt-1 rounded-[40px] border px-8 py-3 text-sm uppercase tracking-widest transition-colors ${
                      isLight
                        ? 'border-erythro-500 text-erythro-500 hover:bg-erythro-500 hover:text-white'
                        : 'border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-coal-900'
                    }`}
                  >
                    {locale === 'ru'
                      ? 'Смотреть статус отчёта'
                      : locale === 'he'
                        ? 'צפה בסטטוס הדוח'
                        : 'View report status'}
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle')
                    setReportHref(null)
                    setOrderId(null)
                  }}
                  className={`mt-2 rounded-[40px] border px-8 py-3 text-sm uppercase tracking-widest transition-colors ${
                    isLight
                      ? 'border-erythro-500 text-erythro-500 hover:bg-erythro-500 hover:text-white'
                      : 'border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-coal-900'
                  }`}
                >
                  {tForm(contactForm.close)}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12 xl:gap-16">
                <div className="flex flex-col gap-5 lg:pe-2">
                  <h2 className="m-0 font-sans text-xl font-medium uppercase tracking-[0.08em] text-gold-500 md:text-2xl lg:text-[1.75rem] lg:leading-tight">
                    {tAudit(auditPage.form.heading, locale)}
                  </h2>
                  <div className="flex flex-col gap-5">
                    <p
                      className={`m-0 font-sans text-base font-light leading-relaxed md:text-lg ${
                        isLight ? 'text-coal-900' : 'text-white'
                      }`}
                    >
                      {tAudit(auditPage.form.intro, locale)}
                    </p>
                    <p className="m-0 font-sans text-[14px] font-light leading-6 text-gold-800">
                      {tAudit(auditPage.form.introNote, locale)}
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="flex min-w-0 flex-col gap-4"
                  noValidate
                  aria-busy={status === 'sending' || undefined}
                >
                  <fieldset
                    disabled={status === 'sending'}
                    className={`m-0 flex min-w-0 flex-col gap-4 border-0 p-0 ${
                      status === 'sending' ? 'opacity-70' : ''
                    }`}
                  >
                    <ContactHoneypotField idPrefix="audit-page" />

                    <div className="flex flex-col gap-1.5">
                      <AuditPillShell
                        isLight={isLight}
                        hasError={Boolean(fieldErrors.name || fieldErrors.email)}
                      >
                        <div className="min-w-0 flex-1">
                          <label htmlFor="audit-page-name" className="sr-only">
                            {tForm(contactForm.name)}
                          </label>
                          <input
                            id="audit-page-name"
                            name="name"
                            type="text"
                            required
                            value={values.name}
                            onChange={handleChange}
                            placeholder={requiredPlaceholder(tForm(contactForm.name))}
                            className={pillFieldClass}
                            autoComplete="name"
                            autoCapitalize="words"
                            aria-required="true"
                            aria-invalid={Boolean(fieldErrors.name) || undefined}
                            aria-describedby={fieldErrors.name ? 'audit-page-name-error' : undefined}
                          />
                        </div>
                        <AuditPillDivider isLight={isLight} />
                        <div
                          className={`min-w-0 flex-1 border-t sm:border-t-0 ${
                            isLight ? 'border-coal-900/15' : 'border-white/15'
                          }`}
                        >
                          <label htmlFor="audit-page-email" className="sr-only">
                            {tForm(contactForm.email)}
                          </label>
                          <input
                            id="audit-page-email"
                            name="email"
                            type="email"
                            inputMode="email"
                            required
                            value={values.email}
                            onChange={handleChange}
                            placeholder={requiredPlaceholder(tForm(contactForm.email))}
                            className={pillFieldClass}
                            autoComplete="email"
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck={false}
                            dir="ltr"
                            aria-required="true"
                            aria-invalid={Boolean(fieldErrors.email) || undefined}
                            aria-describedby={fieldErrors.email ? 'audit-page-email-error' : undefined}
                          />
                        </div>
                      </AuditPillShell>
                      {fieldErrors.name ? renderFieldError('name', 'audit-page-name-error') : null}
                      {fieldErrors.email ? renderFieldError('email', 'audit-page-email-error') : null}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <AuditPillShell isLight={isLight} hasError={Boolean(fieldErrors.website)}>
                        <div className="min-w-0 flex-1">
                          <label htmlFor="audit-page-website" className="sr-only">
                            {tAudit(auditPage.form.website, locale)}
                          </label>
                          <input
                            id="audit-page-website"
                            name="website"
                            type="url"
                            inputMode="url"
                            required
                            value={values.website}
                            onChange={handleChange}
                            placeholder={requiredPlaceholder(tAudit(auditPage.form.website, locale))}
                            className={pillFieldClass}
                            autoComplete="url"
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck={false}
                            dir="ltr"
                            aria-required="true"
                            aria-invalid={Boolean(fieldErrors.website) || undefined}
                            aria-describedby={fieldErrors.website ? 'audit-page-website-error' : undefined}
                          />
                        </div>
                      </AuditPillShell>
                      {renderFieldError('website', 'audit-page-website-error')}
                    </div>

                    <div className="relative z-20 flex flex-col gap-1.5">
                      <AuditPillShell
                        isLight={isLight}
                        hasError={Boolean(fieldErrors.auditLanguage || fieldErrors.phone)}
                      >
                        <AuditLanguageSelect
                          id="audit-page-audit-language"
                          locale={locale}
                          isLight={isLight}
                          value={values.auditLanguage}
                          invalid={Boolean(fieldErrors.auditLanguage)}
                          describedBy={
                            fieldErrors.auditLanguage ? 'audit-page-audit-language-error' : undefined
                          }
                          onChange={handleLanguageChange}
                        />
                        <AuditPillDivider isLight={isLight} />
                        <div
                          className={`min-w-0 flex-1 border-t sm:border-t-0 ${
                            isLight ? 'border-coal-900/15' : 'border-white/15'
                          }`}
                        >
                          <label htmlFor="audit-page-phone" className="sr-only">
                            {tForm(contactForm.phone)}
                          </label>
                          <input
                            id="audit-page-phone"
                            name="phone"
                            type="tel"
                            inputMode="tel"
                            required
                            value={values.phone}
                            onChange={handleChange}
                            placeholder={requiredPlaceholder(tForm(contactForm.phone))}
                            className={pillFieldClass}
                            autoComplete="tel"
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck={false}
                            dir="ltr"
                            aria-required="true"
                            aria-invalid={Boolean(fieldErrors.phone) || undefined}
                            aria-describedby={fieldErrors.phone ? 'audit-page-phone-error' : undefined}
                          />
                        </div>
                      </AuditPillShell>
                      {renderFieldError('auditLanguage', 'audit-page-audit-language-error')}
                      {renderFieldError('phone', 'audit-page-phone-error')}
                    </div>

                    <p className={`m-0 px-1 text-xs ${fieldLabelClass}`}>
                      <span className="text-erythro-500" aria-hidden="true">
                        *
                      </span>
                      {' — '}
                      {tAudit(auditPage.form.requiredNote, locale)}
                    </p>

                    {status === 'error' ? (
                      <p id="audit-page-error" role="alert" className="m-0 text-sm text-erythro-500">
                        {submitError || tForm(contactForm.error)}
                      </p>
                    ) : null}

                    <ContactPrivacyConsent
                      locale={locale}
                      theme={theme}
                      idPrefix="audit-page"
                      checked={privacyConsent}
                      showRequiredError={consentError}
                      disabled={status === 'sending'}
                      onCheckedChange={(next) => {
                        setPrivacyConsent(next)
                        if (next) setConsentError(false)
                      }}
                    />

                    <div className="pt-1">
                      <button
                        type="submit"
                        className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-erythro-500 px-8 py-3 text-sm font-medium uppercase tracking-widest text-white shadow-none transition-[box-shadow,transform,opacity] duration-300 ease-out hover:shadow-[0_3px_20px_0_rgba(229,36,33,0.45)] disabled:cursor-wait disabled:hover:shadow-none"
                      >
                        {status === 'sending' ? (
                          <>
                            <ContactSendSpinner className="h-[18px] w-[18px] shrink-0" />
                            <span>{tForm(contactForm.sending)}</span>
                          </>
                        ) : (
                          tAudit(auditPage.form.submit, locale)
                        )}
                      </button>
                    </div>
                  </fieldset>
                  {status === 'sending' ? (
                    <p className="sr-only" role="status" aria-live="polite">
                      {tForm(contactForm.sending)}
                    </p>
                  ) : null}
                </form>
              </div>
            )}
          </div>
        </BorderBeam>
      </div>
    </div>
  )
}

function howSurfaceClass(isLight: boolean, featured = false) {
  if (featured) {
    return 'bg-erythro-600 shadow-[0_5px_50px_0_rgba(13,13,13,0.3)] hover:shadow-[0_10px_44px_0_rgba(13,13,13,0.38)]'
  }
  return isLight
    ? 'border border-white bg-white shadow-card-services hover:shadow-[0_8px_26px_0_rgba(13,13,13,0.22)]'
    : 'border border-gold-500 bg-[#1E1E1E] hover:shadow-[0_8px_26px_0_rgba(0,0,0,0.45)]'
}

function howNameBarClass(isLight: boolean, featured = false) {
  if (featured) return 'bg-white text-erythro-500'
  return isLight ? 'bg-coal-900 text-white' : 'bg-gold-500 text-coal-900'
}

function HowStepsTrack({ count }: { count: number }) {
  return (
    <div className="relative w-full py-1" aria-hidden>
      <div className="pointer-events-none absolute start-[16.666%] end-[16.666%] top-1/2 h-px -translate-y-1/2 bg-gold-500" />
      <ol className="relative m-0 grid list-none grid-cols-3 justify-items-center p-0">
        {Array.from({ length: count }, (_, index) => (
          <li key={index} className="flex justify-center">
            <span
              dir="ltr"
              className="relative z-[1] flex size-11 items-center justify-center rounded-full border border-gold-500 bg-erythro-500 text-sm font-bold tracking-[0.06em] text-white shadow-[0_3px_16px_0_rgba(229,36,33,0.35)]"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function AuditHowPanel({
  locale,
  isLight,
  bodyTone,
  headingTone,
  accentTone,
}: {
  locale: string
  isLight: boolean
  bodyTone: string
  headingTone: string
  accentTone: string
}) {
  const { how } = auditPage

  return (
    <div
      role="tabpanel"
      id="audit-panel-how"
      aria-labelledby="audit-tab-how"
      className="flex flex-col gap-10 md:gap-12"
    >
      <div className="flex w-full flex-col gap-5">
        <div className="flex w-full flex-col gap-3">
          <p className={`m-0 text-[11px] font-bold uppercase tracking-[0.18em] ${accentTone}`}>
            {tAudit(how.kicker, locale)}
          </p>
          <h2 className={`m-0 w-full font-sans text-2xl font-normal leading-[1.5] tracking-[0.04em] md:text-3xl ${headingTone}`}>
            {tAudit(how.heroTitle, locale)}
          </h2>
          <p className={`m-0 w-full font-sans text-base font-light leading-7 md:text-lg ${bodyTone}`}>
            {tAudit(how.heroIntro, locale)}
          </p>
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {how.stats.map((stat) => (
            <li
              key={stat.en}
              className={`rounded-[40px] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] ${
                isLight ? 'bg-coal-900 text-white' : 'bg-gold-500 text-coal-900'
              }`}
            >
              {tAudit(stat, locale)}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-6">
        <h3 className={`m-0 font-sans text-xl font-normal leading-[1.5] tracking-[0.04em] md:text-2xl ${headingTone}`}>
          {tAudit(how.stepsHeading, locale)}
        </h3>
        <HowStepsTrack count={how.steps.length} />
        <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
          {how.steps.map((step) => (
            <li
              key={step.label.en}
              className="rounded-[10px] border border-gold-500 bg-coal-900 p-6 pb-11 md:p-8 md:pb-[52px]"
            >
              <h4 className="m-0 mb-3 font-sans text-[24px] font-semibold leading-[1.5] tracking-normal text-gold-500">
                {tAudit(step.title, locale)}
              </h4>
              <p className="m-0 text-base font-light leading-7 text-white/80">
                {tAudit(step.body, locale)}
              </p>
              <span className="sr-only">{tAudit(step.label, locale)}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex max-w-3xl flex-col gap-3">
          <h3 className={`m-0 font-sans text-xl font-normal leading-[1.5] tracking-[0.04em] md:text-2xl ${headingTone}`}>
            {tAudit(how.methodologyTitle, locale)}
          </h3>
          <p className={`m-0 text-base font-light leading-7 ${bodyTone}`}>
            {tAudit(how.methodologyIntro, locale)}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-[30px] md:grid-cols-2 lg:grid-cols-6">
          {how.pillars.map((pillar, index) => {
            const wide = index >= 3
            return (
              <article
                key={pillar.title.en}
                className={`flex h-full w-full flex-col items-center gap-2 rounded-[10px] px-4 pt-[30px] pb-[50px] transition-shadow duration-300 ease-out ${howSurfaceClass(isLight)} ${
                  wide ? 'lg:col-span-3' : 'lg:col-span-2'
                }`}
              >
                <div className="relative flex min-h-[70px] w-full flex-col items-center justify-center py-1 text-center">
                  <p
                    dir="ltr"
                    className={`m-0 font-bold uppercase leading-tight ${
                      isLight ? 'text-coal-900' : 'text-gold-500'
                    }`}
                  >
                    <span className="text-[2.5rem] leading-tight">{pillar.weight}</span>
                  </p>
                  <p
                    className={`m-0 text-[11px] font-bold uppercase tracking-[0.14em] ${
                      isLight ? 'text-coal-900/50' : 'text-gold-500/70'
                    }`}
                  >
                    {tAudit(how.weightNote, locale)}
                  </p>
                </div>
                <div
                  className={`flex min-h-[30px] w-full items-center justify-center rounded-[2px] px-2 py-1.5 ${howNameBarClass(isLight)}`}
                >
                  <span className="text-center font-bold text-sm uppercase leading-snug break-words hyphens-auto">
                    {tAudit(pillar.title, locale)}
                  </span>
                </div>
                <p className={`m-0 w-full pt-2 text-center text-base font-light leading-7 ${bodyTone}`}>
                  {tAudit(pillar.body, locale)}
                </p>
              </article>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex max-w-3xl flex-col gap-3">
          <h3 className={`m-0 font-sans text-xl font-normal leading-[1.5] tracking-[0.04em] md:text-2xl ${headingTone}`}>
            {tAudit(how.categoriesTitle, locale)}
          </h3>
          <p className={`m-0 text-base font-light leading-7 ${bodyTone}`}>
            {tAudit(how.categoriesIntro, locale)}
          </p>
        </div>
        <ul
          className={`m-0 flex list-none flex-col p-0 ${howSurfaceClass(isLight)} overflow-hidden rounded-[10px]`}
        >
          {how.categories.map((item, index) => (
            <li
              key={item.title.en}
              className={`relative flex flex-col gap-1.5 px-5 py-5 ps-9 ${
                index > 0
                  ? isLight
                    ? 'border-t border-coal-900/10'
                    : 'border-t border-gold-500/25'
                  : ''
              }`}
            >
              <span
                className="absolute start-5 top-[1.55rem] size-1 shrink-0 rounded-[1px] bg-erythro-500"
                aria-hidden
              />
              <h4 className={`m-0 font-sans text-sm font-bold uppercase leading-[1.5] tracking-[0.08em] ${headingTone}`}>
                {tAudit(item.title, locale)}
              </h4>
              <p className={`m-0 text-base font-light leading-7 ${bodyTone}`}>{tAudit(item.body, locale)}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-5">
        <h3 className={`m-0 font-sans text-xl font-normal leading-[1.5] tracking-[0.04em] md:text-2xl ${headingTone}`}>
          {tAudit(how.principlesTitle, locale)}
        </h3>
        <div className="grid grid-cols-1 gap-[30px] md:grid-cols-3">
          {how.principles.map((item) => (
            <article
              key={item.title.en}
              className={`flex h-full w-full flex-col items-center gap-3 rounded-[10px] px-4 pt-[30px] pb-[50px] transition-shadow duration-300 ease-out ${howSurfaceClass(isLight)}`}
            >
              <div
                className={`flex min-h-[30px] w-full items-center justify-center rounded-[2px] px-2 py-1.5 ${howNameBarClass(isLight)}`}
              >
                <span className="text-center font-bold text-sm uppercase leading-snug break-words hyphens-auto">
                  {tAudit(item.title, locale)}
                </span>
              </div>
              <p className={`m-0 w-full text-center text-base font-light leading-7 ${bodyTone}`}>
                {tAudit(item.body, locale)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

function splitAuditPrice(price: string) {
  const match = price.trim().match(/^([^\d]*?)([\d][\d.,]*)(.*)$/u)
  if (!match) return { prefix: '', amount: price, suffix: '' }
  return { prefix: match[1], amount: match[2], suffix: match[3] }
}

const SOLUTION_CTA_LINK_CLASS =
  'inline-flex h-[48px] min-h-[48px] min-w-[183px] shrink-0 cursor-pointer select-none items-center justify-center gap-[10px] rounded-[var(--xl,40px)] border bg-transparent px-[40px] text-[12px] font-normal uppercase leading-[18px] tracking-[2.4px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erythro-500 active:scale-[0.97] active:brightness-[0.96] active:transition-[transform,filter,background-color,border-color,color,box-shadow] active:duration-100 rtl:text-[14px]'

function AuditPricingCard({
  plan,
  locale,
  isLight,
  onRequestAudit,
}: {
  plan: (typeof auditPage.pricing.plans)[number]
  locale: string
  isLight: boolean
  onRequestAudit: () => void
}) {
  const featured = plan.id === 'diagnostic'
  const priceText = tAudit(plan.price, locale)
  const { prefix, amount, suffix } = splitAuditPrice(priceText)
  const ctaHref = 'ctaHref' in plan ? plan.ctaHref : undefined

  const solutionButtonClassName = featured
    ? 'border-white text-white hover:bg-white hover:text-coal-900 hover:border-white active:bg-white active:text-coal-900 active:border-white aria-busy:bg-white aria-busy:text-coal-900 aria-busy:border-white'
    : isLight
      ? 'border-coal-900 text-coal-900 hover:!bg-erythro-500 hover:!text-white hover:!border-erythro-500 active:!bg-erythro-500 active:!text-white active:!border-erythro-500 aria-busy:!bg-erythro-500 aria-busy:!text-white aria-busy:!border-erythro-500'
      : 'border-[var(--Button-Tertiary-link,#FFE9C7)] text-[var(--Button-Tertiary-link,#FFE9C7)] hover:bg-[var(--Button-Tertiary-link,#FFE9C7)] hover:text-coal-900 hover:border-[var(--Button-Tertiary-link,#FFE9C7)] active:bg-[var(--Button-Tertiary-link,#FFE9C7)] active:text-coal-900 active:border-[var(--Button-Tertiary-link,#FFE9C7)] aria-busy:bg-[var(--Button-Tertiary-link,#FFE9C7)] aria-busy:text-coal-900 aria-busy:border-[var(--Button-Tertiary-link,#FFE9C7)]'

  const priceTone = featured ? 'text-white' : isLight ? 'text-coal-900' : 'text-gold-500'
  const dotClass = featured ? 'bg-white' : 'bg-erythro-500'
  const featureTextClass = featured ? 'text-white' : isLight ? 'text-coal-900' : 'text-white'

  return (
    <article
      className={`relative flex h-full w-full flex-col items-center gap-2 rounded-[10px] px-4 py-[30px] transition-shadow duration-300 ease-out ${
        featured
          ? 'max-lg:mb-4 min-h-[560px] h-auto bg-erythro-600 shadow-[0_5px_50px_0_rgba(13,13,13,0.3)] hover:shadow-[0_10px_44px_0_rgba(13,13,13,0.38)] lg:min-h-[540px] xl:min-h-[570px]'
          : isLight
            ? 'min-h-[530px] h-auto border border-white bg-white shadow-card-services hover:shadow-[0_8px_26px_0_rgba(13,13,13,0.22)] lg:min-h-[510px] xl:min-h-[530px]'
            : 'min-h-[530px] h-auto border border-gold-500 bg-[#1E1E1E] hover:shadow-[0_8px_26px_0_rgba(0,0,0,0.45)] lg:min-h-[510px] xl:min-h-[530px]'
      }`}
    >
        {'priceCompare' in plan && plan.priceCompare ? (
          <p
            dir="ltr"
            className={`absolute top-[17px] font-bold text-sm uppercase text-white ${
              locale === 'he' ? 'start-4' : 'end-4'
            }`}
          >
            <span className="line-through">{tAudit(plan.priceCompare, locale)}</span>
          </p>
        ) : null}

        <div className="relative flex min-h-[70px] w-full items-center justify-center py-2 text-center">
          <p dir="ltr" className={`font-bold uppercase leading-tight ${priceTone}`}>
            {prefix ? <span className="text-[1.6125rem] leading-tight">{prefix}</span> : null}
            {prefix ? ' ' : null}
            <span className="text-[2.5rem] leading-tight">{amount}</span>
            {suffix ? <span className="text-base leading-tight">{suffix}</span> : null}
          </p>
        </div>

        <div
          className={`flex min-h-[30px] w-full items-center justify-center rounded-[2px] px-2 py-1.5 ${
            featured ? 'bg-white' : isLight ? 'bg-coal-900' : 'bg-gold-500'
          }`}
        >
          <span
            className={`text-center font-bold text-base uppercase leading-snug break-words hyphens-auto ${
              featured ? 'text-erythro-500' : isLight ? 'text-white' : 'text-coal-900'
            }`}
          >
            {tAudit(plan.name, locale)}
          </span>
        </div>

        <ul className="flex w-full flex-1 flex-col gap-4 py-4 ps-4">
          {plan.features.map((feature) => (
            <li key={feature.en} className="relative flex items-start gap-2.5">
              <span
                className={`absolute -start-4 top-2.5 size-1 shrink-0 rounded-[1px] ${dotClass}`}
                aria-hidden
              />
              <p className={`break-words text-base leading-6 lg:text-sm ${featureTextClass}`}>
                {tAudit(feature, locale)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex w-full flex-col items-center">
          {ctaHref ? (
            <Link
              href={ctaHref}
              className={`${SOLUTION_CTA_LINK_CLASS} w-full text-center ${solutionButtonClassName}`}
            >
              {tAudit(plan.cta, locale)}
            </Link>
          ) : (
            <Button
              variant="solution-cta"
              className={solutionButtonClassName}
              onClick={onRequestAudit}
            >
              {tAudit(plan.cta, locale)}
            </Button>
          )}
        </div>
      </article>
  )
}

function AuditPricingPanel({
  locale,
  bodyTone,
  headingTone,
  accentTone,
  isLight,
  onRequestAudit,
}: {
  locale: string
  bodyTone: string
  headingTone: string
  accentTone: string
  isLight: boolean
  onRequestAudit: () => void
}) {
  const { pricing } = auditPage

  return (
    <div
      role="tabpanel"
      id="audit-panel-pricing"
      aria-labelledby="audit-tab-pricing"
      className="flex flex-col gap-8 md:gap-10"
    >
      <div className="flex max-w-3xl flex-col gap-3">
        <p className={`m-0 text-[11px] font-bold uppercase tracking-[0.18em] ${accentTone}`}>
          {tAudit(pricing.kicker, locale)}
        </p>
        <h2 className={`m-0 font-sans text-2xl font-normal leading-tight tracking-[0.04em] md:text-3xl ${headingTone}`}>
          {tAudit(pricing.title, locale)}
        </h2>
        <p className={`m-0 font-sans text-base font-light leading-7 ${bodyTone}`}>
          {tAudit(pricing.intro, locale)}
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-[30px] sm:grid-cols-2 xl:grid-cols-4 xl:items-center">
        {pricing.plans.map((plan) => (
            <div key={plan.id} className="min-w-0 w-full">
              <AuditPricingCard
                plan={plan}
                locale={locale}
                isLight={isLight}
                onRequestAudit={onRequestAudit}
              />
            </div>
          ))}
      </div>

      <p className={`m-0 text-center text-xs font-light tracking-[0.06em] ${bodyTone}`}>
        {tAudit(pricing.footnote, locale)}
      </p>

      <div className="flex flex-col items-center gap-2 text-center">
        <p className={`m-0 text-sm font-light ${bodyTone}`}>{tAudit(pricing.agency, locale)}</p>
        <Link
          href="/contacts"
          className={`text-sm font-medium uppercase tracking-[0.12em] transition-colors ${
            isLight ? 'text-erythro-500 hover:text-coal-900' : 'text-gold-500 hover:text-white'
          }`}
        >
          {tAudit(pricing.agencyCta, locale)}
        </Link>
      </div>
    </div>
  )
}
