'use client'

import React, { useRef, useState } from 'react'
import { useSiteContent } from '@/components/SiteContentProvider'
import ContactPrivacyConsent from '@/components/ContactPrivacyConsent'
import { ContactHoneypotField } from '@/components/ContactHoneypotField'
import { ContactSendSpinner } from '@/components/ContactSendingPanel'
import { TurnstileField, isTurnstileSiteKeyConfigured, type TurnstileHandle } from '@/components/TurnstileField'
import { CONTACT_HONEYPOT_FIELD } from '@/lib/contactHoneypot'
import { TURNSTILE_TOKEN_FIELD } from '@/lib/turnstile'
import { contactForm } from '@/translations'
import { contactsPage, tContacts } from '@/lib/contactsPage'
import { PhoneE164Field } from '@/components/PhoneE164Field'
import {
  FORM_SUBMIT_CLASS,
  FormPillDivider,
  FormPillShell,
  formPillFieldClass,
  formPillTextareaClass,
  requiredPlaceholder,
} from '@/components/form/FormPills'
import {
  hasContactFieldErrors,
  validateContactForm,
  type ContactField,
  type ContactFieldErrors,
  type ContactFormValues,
} from '@/lib/contactFormValidation'

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

  const [status, setStatus] = useState<Status>('idle')
  const [submitError, setSubmitError] = useState('')
  const [values, setValues] = useState<ContactFormValues>({ name: '', email: '', phone: '', message: '' })
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileHandle>(null)
  const firstFieldRef = useRef<HTMLInputElement | null>(null)

  const bodyTone = isLight ? 'text-coal-900/85' : 'text-white/80'
  const headingTone = isLight ? 'text-coal-900' : 'text-white'
  const accentTone = isLight ? 'text-gold-900' : 'text-gold-500'
  const cardClass = isLight
    ? 'border-coal-900/10 bg-white/70'
    : 'border-white/10 bg-white/[0.04]'
  const pillFieldClass = formPillFieldClass(isLight)
  const fieldLabelClass = isLight ? 'text-coal-900/60' : 'text-white/60'
  const linkClass = isLight
    ? 'text-coal-900 transition-colors hover:text-erythro-500'
    : 'text-white transition-colors hover:text-gold-500'

  const fieldErrorMessage = (field: ContactField) => {
    const err = fieldErrors[field]
    if (!err) return undefined
    return err === 'invalid' ? t(form.emailInvalid) : t(form.fieldRequired)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name as ContactField
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

  const handlePhoneChange = (next: string) => {
    setValues((v) => ({ ...v, phone: next }))
    if (status === 'error') {
      setStatus('idle')
      setSubmitError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return

    const nextFieldErrors = validateContactForm(values)
    setFieldErrors(nextFieldErrors)
    if (!privacyConsent) setConsentError(true)
    else setConsentError(false)

    if (hasContactFieldErrors(nextFieldErrors) || !privacyConsent) return
    if (isTurnstileSiteKeyConfigured() && !turnstileToken) {
      setSubmitError(t(form.captchaFailed))
      setStatus('error')
      return
    }

    const honeypot =
      (e.currentTarget.elements.namedItem(CONTACT_HONEYPOT_FIELD) as HTMLInputElement | null)?.value ?? ''

    setStatus('sending')
    setSubmitError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          [CONTACT_HONEYPOT_FIELD]: honeypot,
          [TURNSTILE_TOKEN_FIELD]: turnstileToken,
          locale,
          privacyConsent: true,
          source: 'contact',
        }),
      })
      if (res.status === 429) {
        setSubmitError(t(form.rateLimited))
        setStatus('error')
        return
      }
      if (!res.ok) {
        setSubmitError(res.status === 403 ? t(form.captchaFailed) : t(form.error))
        setStatus('error')
        return
      }
      setStatus('success')
      setValues({ name: '', email: '', phone: '', message: '' })
      setFieldErrors({})
      setPrivacyConsent(false)
    } catch {
      setSubmitError(t(form.error))
      setStatus('error')
    } finally {
      turnstileRef.current?.reset()
    }
  }

  const detailRows = [
    {
      id: 'email',
      label: t(footer.emailLabel),
      value: site.emailContacts || site.email,
      href: `mailto:${(site.emailContacts || site.email).toLowerCase()}`,
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

        <div className="flex w-full flex-col gap-4 md:gap-5">
          <div className="grid w-full grid-cols-1 gap-2 lg:grid-cols-12 lg:gap-12">
            <h2
              className={`m-0 font-sans text-xl font-normal tracking-[0.04em] md:text-2xl lg:col-span-5 ${headingTone}`}
            >
              {detailsHeading}
            </h2>
            <h2
              className={`m-0 font-sans text-xl font-normal tracking-[0.04em] md:text-2xl lg:col-span-7 ${headingTone}`}
            >
              {formHeading}
            </h2>
          </div>

          <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Details */}
          <div className="flex flex-col gap-8 lg:col-span-5">
            <div className="flex flex-col gap-4">
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
                  href={site.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-[40px] border px-5 py-2.5 text-xs uppercase tracking-[0.18em] transition-colors ${
                    isLight
                      ? 'border-coal-900/20 text-coal-900 hover:border-erythro-500 hover:text-erythro-500'
                      : 'border-white/20 text-white hover:border-gold-500 hover:text-gold-500'
                  }`}
                >
                  Telegram
                </a>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className={`rounded-[10px] border p-4 sm:p-6 ${cardClass}`}>
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
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                  noValidate
                  aria-busy={status === 'sending' || undefined}
                >
                  <fieldset
                    disabled={status === 'sending'}
                    className={`m-0 flex min-w-0 flex-col gap-4 border-0 p-0 ${
                      status === 'sending' ? 'opacity-70' : ''
                    }`}
                  >
                    <legend className="sr-only">{formHeading}</legend>
                    <ContactHoneypotField idPrefix="contacts-page" />
                    <div className="flex flex-col gap-1.5">
                      <FormPillShell
                        isLight={isLight}
                        clip
                        hasError={Boolean(fieldErrors.name || fieldErrors.email)}
                      >
                        <div className="relative min-w-0 flex-1">
                          <label htmlFor="contacts-page-name" className="sr-only">
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
                            placeholder={requiredPlaceholder(t(form.name))}
                            className={pillFieldClass}
                            autoComplete="name"
                            autoCapitalize="words"
                            enterKeyHint="next"
                            aria-required="true"
                            aria-invalid={Boolean(fieldErrors.name) || undefined}
                            aria-describedby={fieldErrors.name ? 'contacts-page-name-error' : undefined}
                          />
                        </div>
                        <FormPillDivider isLight={isLight} />
                        <div
                          className={`relative min-w-0 flex-1 border-t sm:border-t-0 ${
                            isLight ? 'border-coal-900/15' : 'border-white/15'
                          }`}
                        >
                          <label htmlFor="contacts-page-email" className="sr-only">
                            {t(form.email)}
                          </label>
                          <input
                            id="contacts-page-email"
                            name="email"
                            type="email"
                            inputMode="email"
                            required
                            value={values.email}
                            onChange={handleChange}
                            placeholder={requiredPlaceholder(t(form.email))}
                            className={pillFieldClass}
                            autoComplete="email"
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck={false}
                            enterKeyHint="next"
                            dir="ltr"
                            aria-required="true"
                            aria-invalid={Boolean(fieldErrors.email) || undefined}
                            aria-describedby={fieldErrors.email ? 'contacts-page-email-error' : undefined}
                          />
                        </div>
                      </FormPillShell>
                      {fieldErrors.name ? (
                        <p id="contacts-page-name-error" role="alert" className="m-0 text-sm text-erythro-500">
                          {fieldErrorMessage('name')}
                        </p>
                      ) : null}
                      {fieldErrors.email ? (
                        <p id="contacts-page-email-error" role="alert" className="m-0 text-sm text-erythro-500">
                          {fieldErrorMessage('email')}
                        </p>
                      ) : null}
                    </div>

                    <div className="relative z-20 flex flex-col gap-1.5">
                      <FormPillShell isLight={isLight}>
                        <PhoneE164Field
                          id="contacts-page-phone"
                          locale={locale}
                          value={values.phone}
                          onChange={handlePhoneChange}
                          placeholder={t(form.phone)}
                          variant="pill"
                          required={false}
                          isLight={isLight}
                        />
                      </FormPillShell>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <FormPillShell isLight={isLight} clip tall hasError={Boolean(fieldErrors.message)}>
                        <label htmlFor="contacts-page-message" className="sr-only">
                          {t(form.message)}
                        </label>
                        <textarea
                          id="contacts-page-message"
                          name="message"
                          required
                          value={values.message}
                          onChange={handleChange}
                          placeholder={requiredPlaceholder(t(form.message))}
                          rows={3}
                          className={formPillTextareaClass(isLight)}
                          enterKeyHint="send"
                          aria-required="true"
                          aria-invalid={Boolean(fieldErrors.message) || status === 'error' || undefined}
                          aria-describedby={
                            fieldErrors.message
                              ? 'contacts-page-message-error'
                              : status === 'error'
                                ? 'contacts-page-error'
                                : undefined
                          }
                        />
                      </FormPillShell>
                      {fieldErrors.message ? (
                        <p id="contacts-page-message-error" role="alert" className="m-0 text-sm text-erythro-500">
                          {fieldErrorMessage('message')}
                        </p>
                      ) : null}
                    </div>

                    <p className={`m-0 px-1 text-xs ${fieldLabelClass}`}>
                      <span className="text-erythro-500" aria-hidden="true">
                        *
                      </span>
                      {' — '}
                      {t(form.fieldRequired)}
                    </p>

                      {status === 'error' && (
                        <p id="contacts-page-error" role="alert" className="m-0 text-sm text-erythro-500">
                          {submitError || t(form.error)}
                        </p>
                      )}

                      <ContactPrivacyConsent
                        locale={locale}
                        theme={theme}
                        idPrefix="contacts-page"
                        checked={privacyConsent}
                        showRequiredError={consentError}
                        disabled={status === 'sending'}
                        onCheckedChange={(next) => {
                          setPrivacyConsent(next)
                          if (next) setConsentError(false)
                        }}
                      />

                      <TurnstileField
                        ref={turnstileRef}
                        action="contact"
                        theme={isLight ? 'light' : 'dark'}
                        locale={locale}
                        onToken={setTurnstileToken}
                      />

                    <div className="pt-1">
                      <button type="submit" className={FORM_SUBMIT_CLASS}>
                        {status === 'sending' ? (
                          <>
                            <ContactSendSpinner className="h-[18px] w-[18px] shrink-0" />
                            <span>{t(form.sending)}</span>
                          </>
                        ) : (
                          t(form.submit)
                        )}
                      </button>
                    </div>
                    </fieldset>
                    {status === 'sending' ? (
                      <p className="sr-only" role="status" aria-live="polite">
                        {t(form.sending)}
                      </p>
                    ) : null}
                  </form>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="h-[calc(30px+2rem)] w-full shrink-0 lg:hidden" aria-hidden />
    </section>
  )
}
