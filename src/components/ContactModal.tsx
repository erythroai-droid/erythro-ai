'use client'

import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import { contactForm } from '@/translations'
import {
  hasContactFieldErrors,
  validateContactForm,
  type ContactField,
  type ContactFieldErrors,
  type ContactFormValues,
} from '@/lib/contactFormValidation'
import ContactPrivacyConsent from './ContactPrivacyConsent'
import { ContactHoneypotField } from './ContactHoneypotField'
import { ContactSendSpinner } from './ContactSendingPanel'
import type { ContactFormSource } from '@/lib/contactNotification'
import { CONTACT_HONEYPOT_FIELD } from '@/lib/contactHoneypot'

interface ContactModalContextValue {
  open: (source?: ContactFormSource) => void
  close: () => void
}

const ContactModalContext = createContext<ContactModalContextValue>({
  open: () => {},
  close: () => {},
})

/** Opens/closes the global contact form modal from any CTA button. */
export function useContactModal(): ContactModalContextValue {
  return useContext(ContactModalContext)
}

type Status = 'idle' | 'sending' | 'success' | 'error'

export function ContactModalProvider({
  locale,
  children,
}: {
  locale: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [source, setSource] = useState<ContactFormSource>('contact')

  const open = useCallback((nextSource: ContactFormSource = 'contact') => {
    setSource(nextSource === 'order' ? 'order' : 'contact')
    setIsOpen(true)
  }, [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <ContactModalContext.Provider value={{ open, close }}>
      {children}
      {isOpen && <ContactModal locale={locale} source={source} onClose={close} />}
    </ContactModalContext.Provider>
  )
}

function ContactModal({
  locale,
  source,
  onClose,
}: {
  locale: string
  source: ContactFormSource
  onClose: () => void
}) {
  const t = (field: Record<string, string>) => field[locale] || field['en']
  const form = contactForm
  const isRtl = locale === 'he'
  const titleId = useId()
  const errorId = useId()

  const [status, setStatus] = useState<Status>('idle')
  const [submitError, setSubmitError] = useState('')
  const [values, setValues] = useState<ContactFormValues>({ name: '', email: '', phone: '', message: '' })
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const firstFieldRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    try {
      const draft = sessionStorage.getItem('erythro_order_draft')
      if (draft) {
        setValues((v) => ({ ...v, message: draft }))
        sessionStorage.removeItem('erythro_order_draft')
      }
    } catch {
      /* ignore */
    }
  }, [])

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstFieldRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return

    const nextFieldErrors = validateContactForm(values)
    setFieldErrors(nextFieldErrors)
    if (!privacyConsent) setConsentError(true)
    else setConsentError(false)

    if (hasContactFieldErrors(nextFieldErrors) || !privacyConsent) return

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
          locale,
          privacyConsent: true,
          source,
        }),
      })
      if (res.status === 429) {
        setSubmitError(t(form.rateLimited))
        setStatus('error')
        return
      }
      if (!res.ok) throw new Error('Request failed')
      setStatus('success')
      setValues({ name: '', email: '', phone: '', message: '' })
      setFieldErrors({})
      setPrivacyConsent(false)
    } catch {
      setSubmitError(t(form.error))
      setStatus('error')
    }
  }

  const baseInputClass =
    'w-full rounded-[10px] border bg-white/[0.04] px-3.5 py-2.5 text-white placeholder:text-white/40 outline-none transition-colors focus:bg-white/[0.06] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erythro-500'
  const inputClass = (field: ContactField) =>
    fieldErrors[field]
      ? `${baseInputClass} border-erythro-500 focus:border-erythro-500`
      : `${baseInputClass} border-white/15 focus:border-gold-500`
  const labelClass = 'mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-white/70'

  const requiredMark = (
    <span className="ms-0.5 text-erythro-500" aria-hidden="true">
      *
    </span>
  )

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label={t(form.close)}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div className="faq-accordion-scroll relative max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-[10px] border border-white/10 bg-coal-900 p-5 sm:p-7 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <button
          type="button"
          onClick={onClose}
          aria-label={t(form.close)}
          className="absolute top-4 end-4 flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4 4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {status !== 'success' && (
          <h2 id={titleId} className="mb-4 max-w-[85%] font-semibold normal-case tracking-normal text-[22px] leading-snug text-gold-100 sm:text-[24px]">
            {t(form.title)}
          </h2>
        )}

        {status === 'success' ? (
          <div className="py-6 text-center" role="status" aria-live="polite">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-white/85">{t(form.success)}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-[40px] border border-gold-500 px-8 py-3 text-sm uppercase tracking-widest text-gold-500 transition-colors hover:bg-gold-500 hover:text-coal-900"
            >
              {t(form.close)}
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
            noValidate
            aria-busy={status === 'sending' || undefined}
          >
            <fieldset
              disabled={status === 'sending'}
              className={`m-0 flex min-w-0 flex-col gap-3 border-0 p-0 ${
                status === 'sending' ? 'opacity-70' : ''
              }`}
            >
              <legend className="sr-only">{t(form.title)}</legend>
              <ContactHoneypotField idPrefix="contact-modal" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-modal-name" className={labelClass}>
                    {t(form.name)}
                    {requiredMark}
                  </label>
                  <input
                    ref={firstFieldRef}
                    id="contact-modal-name"
                    name="name"
                    type="text"
                    required
                    value={values.name}
                    onChange={handleChange}
                    placeholder={t(form.name)}
                    className={inputClass('name')}
                    autoComplete="name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.name) || undefined}
                    aria-describedby={fieldErrors.name ? 'contact-modal-name-error' : undefined}
                  />
                  {fieldErrors.name ? (
                    <p id="contact-modal-name-error" role="alert" className="mt-1 m-0 text-sm text-erythro-500">
                      {fieldErrorMessage('name')}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="contact-modal-email" className={labelClass}>
                    {t(form.email)}
                    {requiredMark}
                  </label>
                  <input
                    id="contact-modal-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    required
                    value={values.email}
                    onChange={handleChange}
                    placeholder={t(form.email)}
                    className={inputClass('email')}
                    autoComplete="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    dir="ltr"
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.email) || undefined}
                    aria-describedby={fieldErrors.email ? 'contact-modal-email-error' : undefined}
                  />
                  {fieldErrors.email ? (
                    <p id="contact-modal-email-error" role="alert" className="mt-1 m-0 text-sm text-erythro-500">
                      {fieldErrorMessage('email')}
                    </p>
                  ) : null}
                </div>
              </div>
              <div>
                <label htmlFor="contact-modal-phone" className={labelClass}>
                  {t(form.phone)}
                </label>
                <input
                  id="contact-modal-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  value={values.phone}
                  onChange={handleChange}
                  placeholder={t(form.phone)}
                  className={inputClass('phone')}
                  autoComplete="tel"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  dir="ltr"
                />
              </div>
              <div>
                <label htmlFor="contact-modal-message" className={labelClass}>
                  {t(form.message)}
                  {requiredMark}
                </label>
                <textarea
                  id="contact-modal-message"
                  name="message"
                  required
                  value={values.message}
                  onChange={handleChange}
                  placeholder={t(form.message)}
                  rows={3}
                  className={`${inputClass('message')} resize-none`}
                  enterKeyHint="send"
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.message) || status === 'error' || undefined}
                  aria-describedby={
                    fieldErrors.message
                      ? 'contact-modal-message-error'
                      : status === 'error'
                        ? errorId
                        : undefined
                  }
                />
                {fieldErrors.message ? (
                  <p id="contact-modal-message-error" role="alert" className="mt-1 m-0 text-sm text-erythro-500">
                    {fieldErrorMessage('message')}
                  </p>
                ) : null}
              </div>

              {status === 'error' && (
                <p id={errorId} role="alert" className="text-sm text-erythro-500">
                  {submitError || t(form.error)}
                </p>
              )}

              <ContactPrivacyConsent
                locale={locale}
                theme="dark"
                idPrefix="contact-modal"
                checked={privacyConsent}
                showRequiredError={consentError}
                disabled={status === 'sending'}
                onCheckedChange={(next) => {
                  setPrivacyConsent(next)
                  if (next) setConsentError(false)
                }}
              />

              <button
                type="submit"
                className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-[40px] bg-erythro-500 px-8 py-3 text-sm font-medium uppercase tracking-widest text-white transition-all hover:shadow-[0_3px_20px_0_rgba(255,233,199,0.30)] disabled:cursor-wait disabled:hover:shadow-none"
              >
                {status === 'sending' ? (
                  <>
                    <ContactSendSpinner className="h-[18px] w-[18px] shrink-0" />
                    <span>{t(form.sending)}</span>
                  </>
                ) : (
                  t(form.submit)
                )}
              </button>
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
  )
}
