'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { BorderBeam } from 'border-beam'
import { contactForm } from '@/translations'
import ContactPrivacyConsent from '@/components/ContactPrivacyConsent'
import { ContactHoneypotField } from '@/components/ContactHoneypotField'
import { FieldOkCheck } from '@/components/FieldOkCheck'
import { PhoneE164Field } from '@/components/PhoneE164Field'
import {
  FORM_SUBMIT_CLASS,
  FormPillShell,
  formPillFieldClass,
  requiredPlaceholder,
} from '@/components/form/FormPills'
import { ContactSendSpinner } from '@/components/ContactSendingPanel'
import { CONTACT_HONEYPOT_FIELD } from '@/lib/contactHoneypot'
import { TURNSTILE_TOKEN_FIELD } from '@/lib/turnstile'
import {
  auditPage,
  tAudit,
  tAuditWebsitePlatform,
  tAuditWebsiteUnreachable,
  type AuditPageContent,
} from '@/lib/auditPage'
import {
  AUDIT_LP_TURNSTILE_ENABLED,
  auditLpCopyFor,
  auditLpPlanSlug,
  mainSiteUrl,
  mainSiteUrlWithLang,
  tAuditLp,
  type AuditLpProduct,
} from '@/lib/auditLp'
import { auditSampleReportHref, auditSampleReportLabel } from '@/lib/auditSampleReports'
import { TurnstileField, isTurnstileSiteKeyConfigured, type TurnstileHandle } from '@/components/TurnstileField'
import {
  buildAuditOrderMessage,
  hasAuditFieldErrors,
  validateAuditForm,
  type AuditField,
  type AuditFieldErrors,
  type AuditFormValues,
  type AuditReportLanguage,
} from '@/lib/auditFormValidation'
import { useAuditFieldChecks } from '@/hooks/useAuditFieldChecks'

type Status = 'idle' | 'sending' | 'error'

const AUDIT_BEAM_PROPS = {
  size: 'pulse-outside' as const,
  colorVariant: 'colorful' as const,
  strength: 0.7,
  duration: 2.2,
  className: 'w-full overflow-visible',
  style: {
    '--pulse-glow-boost': 1.45,
    '--beam-glow-brightness': 1.15,
  } as React.CSSProperties,
}

function AuditLpExternalLink({
  href,
  isLight,
  children,
}: {
  href: string
  isLight: boolean
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex max-w-full items-center gap-1.5 text-sm font-medium underline decoration-from-font underline-offset-4 transition-colors ${
        isLight
          ? 'text-gold-900 hover:text-erythro-500'
          : 'text-gold-500 hover:text-white'
      }`}
    >
      <span className="min-w-0 break-words">{children}</span>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
        className="size-3.5 shrink-0"
      >
        <path
          d="M5 3.5h7.5V11M12.5 3.5 3.5 12.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  )
}

export default function AuditLpPaidForm({
  locale,
  product,
  theme = 'dark',
  page = auditPage,
}: {
  locale: string
  product: Exclude<AuditLpProduct, 'free'>
  theme?: 'light' | 'dark'
  page?: AuditPageContent
}) {
  const isLight = theme === 'light'
  const copy = auditLpCopyFor(product)
  const planSlug = auditLpPlanSlug(product)
  const planTitle = tAuditLp(copy.eyebrow, locale)
  const priceLabel = product === 'pro' ? '₪490' : '₪99'
  const reportLanguage = (
    locale === 'ru' || locale === 'he' || locale === 'en' ? locale : 'en'
  ) as AuditReportLanguage
  const tForm = (field: Record<string, string>) => field[locale] || field.en || ''
  const formId = useId()

  const [status, setStatus] = useState<Status>('idle')
  const [submitError, setSubmitError] = useState('')
  const [values, setValues] = useState<AuditFormValues>({
    website: '',
    name: '',
    email: '',
    phone: '',
    auditLanguage: reportLanguage,
  })
  const [fieldErrors, setFieldErrors] = useState<AuditFieldErrors>({})
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileHandle>(null)
  const submittingRef = useRef(false)
  const {
    ok: fieldOk,
    checkingWebsite,
    onValueChange,
    blurEmail,
    blurWebsite,
    blurName,
    blurPhone,
    ensureWebsiteOk,
  } = useAuditFieldChecks(values, setFieldErrors)

  useEffect(() => {
    setValues((current) => ({ ...current, auditLanguage: reportLanguage }))
  }, [reportLanguage])

  const pillFieldClass = formPillFieldClass(isLight)
  const fieldLabelClass = isLight ? 'text-coal-900/60' : 'text-white/60'
  const samplePath = auditSampleReportHref(planSlug, locale)
  const sampleHref = samplePath ? mainSiteUrl(samplePath) : null
  const submitLabel =
    (copy.formSubmit ? tAuditLp(copy.formSubmit, locale) : null) ||
    tAudit(page.form.submit, locale)

  const fieldErrorMessage = (field: AuditField) => {
    const err = fieldErrors[field]
    if (!err) return undefined
    if (field === 'website' && err === 'invalid') return tAudit(page.form.websiteInvalid, locale)
    if (field === 'website' && err === 'unreachable') {
      return tAuditWebsiteUnreachable(page.form.websiteUnreachable, locale)
    }
    if (field === 'website' && err === 'platform') {
      return tAuditWebsitePlatform(page.form.websitePlatform, locale)
    }
    if (field === 'email' && err === 'invalid') return tForm(contactForm.emailInvalid)
    if (field === 'phone' && err === 'invalid') return tForm(contactForm.phoneInvalid)
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
    onValueChange(name)
    if (status === 'error') {
      setStatus('idle')
      setSubmitError('')
    }
  }

  const handlePhoneChange = (phone: string) => {
    setValues((v) => ({ ...v, phone }))
    onValueChange('phone')
    if (status === 'error') {
      setStatus('idle')
      setSubmitError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submittingRef.current || status === 'sending') return

    const nextFieldErrors = validateAuditForm(values, { requireNamePhone: true })
    setFieldErrors(nextFieldErrors)

    if (hasAuditFieldErrors(nextFieldErrors)) return
    if (
      AUDIT_LP_TURNSTILE_ENABLED &&
      isTurnstileSiteKeyConfigured() &&
      !turnstileToken
    ) {
      setSubmitError(tForm(contactForm.captchaFailed))
      setStatus('error')
      return
    }

    const honeypot =
      (e.currentTarget.elements.namedItem(CONTACT_HONEYPOT_FIELD) as HTMLInputElement | null)?.value ??
      ''

    submittingRef.current = true
    setStatus('sending')
    setSubmitError('')
    let posted = false
    try {
      const websiteOk = await ensureWebsiteOk()
      if (!websiteOk) {
        setStatus('idle')
        return
      }

      posted = true
      const orderMessage = buildAuditOrderMessage({
        planTitle,
        planSlug,
        website: values.website,
        auditLanguage: values.auditLanguage,
        totalFormatted: priceLabel,
      })

      const paymentRes = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug,
          periodId: '',
          addonIds: [],
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          website: values.website.trim(),
          auditLanguage: values.auditLanguage,
          locale,
          message: orderMessage,
          [CONTACT_HONEYPOT_FIELD]: honeypot,
          ...(AUDIT_LP_TURNSTILE_ENABLED
            ? { [TURNSTILE_TOKEN_FIELD]: turnstileToken }
            : {}),
        }),
        signal: AbortSignal.timeout(30_000),
      })

      const paymentData = (await paymentRes.json().catch(() => null)) as {
        ok?: boolean
        paymentUrl?: string
        code?: string
        message?: string
      } | null

      if (paymentRes.ok && paymentData?.ok && paymentData.paymentUrl) {
        window.location.href = paymentData.paymentUrl
        return
      }

      const code = paymentData?.code
      setSubmitError(
        code === 'name_unsupported'
          ? tForm(contactForm.paymentName)
          : code === 'phone_unsupported'
            ? tForm(contactForm.paymentPhone)
            : code === 'payment_unavailable' || code === 'not_payable'
              ? tForm(contactForm.paymentUnavailable)
              : paymentRes.status === 429
                ? tForm(contactForm.rateLimited)
                : tForm(contactForm.error),
      )
      setStatus('error')
    } catch {
      setSubmitError(tForm(contactForm.error))
      setStatus('error')
    } finally {
      submittingRef.current = false
      if (posted && AUDIT_LP_TURNSTILE_ENABLED) turnstileRef.current?.reset()
    }
  }

  const card = (
    <div
      className={`relative z-[1] w-full rounded-[20px] border px-4 pb-6 pt-4 sm:px-5 sm:pb-8 sm:pt-5 ${
        isLight
          ? 'bg-white shadow-[0_4px_24px_0_rgba(13,13,13,0.08)] [border-color:color-mix(in_oklab,var(--color-coal-900)_10%,transparent)]'
          : 'border-white/10 bg-coal-500'
      }`}
    >
      <p
        className={`mx-auto mb-6 mt-1 max-w-3xl px-2 text-center font-sans text-xl font-semibold uppercase leading-tight tracking-[0.08em] sm:mb-8 sm:mt-2 sm:px-4 sm:text-2xl md:text-[1.75rem] md:leading-tight ${
          isLight ? 'text-coal-900' : 'text-gold-500'
        }`}
      >
        {tAuditLp(copy.formKicker, locale)}
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-col gap-3"
        noValidate
        aria-busy={status === 'sending' || undefined}
      >
        <fieldset
          disabled={status === 'sending'}
          className={`m-0 flex min-w-0 flex-col gap-3 border-0 p-0 ${
            status === 'sending' ? 'opacity-70' : ''
          }`}
        >
          <ContactHoneypotField idPrefix={`audit-lp-${product}`} />

          <div className="flex min-w-0 flex-col gap-3">
            <div className="grid min-w-0 grid-cols-1 gap-3 overflow-visible sm:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-3 overflow-visible">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <FormPillShell isLight={isLight} clip hasError={Boolean(fieldErrors.name)}>
                    <div className="relative min-w-0 flex-1">
                      <label htmlFor={`${formId}-name`} className="sr-only">
                        {tForm(contactForm.name)}
                      </label>
                      <input
                        id={`${formId}-name`}
                        name="name"
                        type="text"
                        required
                        value={values.name}
                        onChange={handleChange}
                        onBlur={blurName}
                        placeholder={requiredPlaceholder(tForm(contactForm.name))}
                        className={`${pillFieldClass} ${fieldOk.name ? 'pe-10' : 'pe-4'}`}
                        autoComplete="name"
                        aria-required="true"
                        aria-invalid={Boolean(fieldErrors.name) || undefined}
                        aria-describedby={fieldErrors.name ? `${formId}-name-error` : undefined}
                      />
                      <FieldOkCheck show={Boolean(fieldOk.name)} isLight={isLight} />
                    </div>
                  </FormPillShell>
                  {renderFieldError('name', `${formId}-name-error`)}
                </div>

                <div className="relative z-30 flex min-w-0 flex-col gap-1.5 overflow-visible">
                  {/* No `clip` — country list is absolute and must overflow the pill. */}
                  <FormPillShell isLight={isLight} hasError={Boolean(fieldErrors.phone)}>
                    <PhoneE164Field
                      id={`${formId}-phone`}
                      locale={locale}
                      value={values.phone}
                      onChange={handlePhoneChange}
                      onBlur={blurPhone}
                      showOk={Boolean(fieldOk.phone)}
                      invalid={Boolean(fieldErrors.phone)}
                      describedBy={fieldErrors.phone ? `${formId}-phone-error` : undefined}
                      placeholder={requiredPlaceholder(tForm(contactForm.phone))}
                      variant="pill"
                      isLight={isLight}
                    />
                  </FormPillShell>
                  {renderFieldError('phone', `${formId}-phone-error`)}
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <FormPillShell isLight={isLight} clip hasError={Boolean(fieldErrors.email)}>
                    <div className="relative min-w-0 flex-1">
                      <label htmlFor={`${formId}-email`} className="sr-only">
                        {tForm(contactForm.email)}
                      </label>
                      <input
                        id={`${formId}-email`}
                        name="email"
                        type="email"
                        inputMode="email"
                        required
                        value={values.email}
                        onChange={handleChange}
                        onBlur={blurEmail}
                        placeholder={requiredPlaceholder(tForm(contactForm.email))}
                        className={`${pillFieldClass} ${fieldOk.email ? 'pe-10' : 'pe-4'}`}
                        autoComplete="email"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        aria-required="true"
                        aria-invalid={Boolean(fieldErrors.email) || undefined}
                        aria-describedby={fieldErrors.email ? `${formId}-email-error` : undefined}
                      />
                      <FieldOkCheck show={Boolean(fieldOk.email)} isLight={isLight} />
                    </div>
                  </FormPillShell>
                  {renderFieldError('email', `${formId}-email-error`)}
                </div>

                <div className="flex min-w-0 flex-col gap-1.5">
                  <FormPillShell isLight={isLight} clip hasError={Boolean(fieldErrors.website)}>
                    <div className="relative min-w-0 flex-1">
                      <label htmlFor={`${formId}-website`} className="sr-only">
                        {tAudit(page.form.website, locale)}
                      </label>
                      <input
                        id={`${formId}-website`}
                        name="website"
                        type="url"
                        inputMode="url"
                        required
                        value={values.website}
                        onChange={handleChange}
                        onBlur={blurWebsite}
                        placeholder={requiredPlaceholder(tAudit(page.form.website, locale))}
                        className={`${pillFieldClass} ${fieldOk.website || checkingWebsite ? 'pe-10' : 'pe-4'} ${
                          locale === 'he' ? 'text-right placeholder:text-right' : ''
                        }`}
                        autoComplete="url"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        dir="ltr"
                        aria-required="true"
                        aria-invalid={Boolean(fieldErrors.website) || undefined}
                        aria-describedby={fieldErrors.website ? `${formId}-website-error` : undefined}
                      />
                      <FieldOkCheck
                        show={Boolean(fieldOk.website)}
                        checking={checkingWebsite}
                        isLight={isLight}
                      />
                    </div>
                  </FormPillShell>
                  {renderFieldError('website', `${formId}-website-error`)}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={`${FORM_SUBMIT_CLASS} box-border h-[50px] w-full py-0 sm:h-[54px]`}
            >
              {status === 'sending' ? (
                <>
                  <ContactSendSpinner className="h-[18px] w-[18px] shrink-0" />
                  <span>{tForm(contactForm.sending)}</span>
                </>
              ) : (
                submitLabel
              )}
            </button>

            <ContactPrivacyConsent
              locale={locale}
              theme={theme}
              idPrefix={`audit-lp-${product}`}
              parts="notice"
              privacyHref={mainSiteUrl('/privacy')}
              termsHref={mainSiteUrl('/terms')}
            />

            <p
              className={`m-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 px-1 text-[11px] font-light leading-snug ${fieldLabelClass}`}
            >
              <span>
                {tAuditLp(copy.legalNote, locale)}{' '}
                <a
                  href={mainSiteUrl('/privacy')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    isLight
                      ? 'font-normal text-coal-900/80 underline underline-offset-2 decoration-coal-900/25 transition-colors hover:text-erythro-500 hover:decoration-erythro-500'
                      : 'font-normal text-gold-500/90 underline underline-offset-2 decoration-gold-500/35 transition-colors hover:text-gold-100 hover:decoration-gold-100'
                  }
                >
                  {tForm(locale === 'ru' ? contactForm.privacyLink : contactForm.privacyPolicy)}
                </a>
                {locale === 'ru' ? '' : '.'}
              </span>
              <span className="inline-flex items-baseline gap-1">
                <span className="text-erythro-500" aria-hidden="true">
                  *
                </span>
                <span>
                  {'— '}
                  {tAudit(page.form.requiredNote, locale)}
                </span>
              </span>
            </p>
          </div>

          {status === 'error' ? (
            <p id={`${formId}-error`} role="alert" className="m-0 text-sm text-erythro-500">
              {submitError || tForm(contactForm.error)}
            </p>
          ) : null}

          {AUDIT_LP_TURNSTILE_ENABLED ? (
            <TurnstileField
              ref={turnstileRef}
              action="audit"
              theme={isLight ? 'light' : 'dark'}
              locale={locale}
              onToken={setTurnstileToken}
              deferUntilInteraction
            />
          ) : null}

          <div className="flex flex-col items-center justify-center gap-4 pt-2 text-center sm:flex-row sm:flex-wrap sm:gap-x-14 sm:gap-y-3">
            {sampleHref ? (
              <AuditLpExternalLink href={sampleHref} isLight={isLight}>
                {auditSampleReportLabel(locale)}
              </AuditLpExternalLink>
            ) : null}
            <AuditLpExternalLink
              href={mainSiteUrlWithLang('/audit', locale)}
              isLight={isLight}
            >
              {tAuditLp(copy.allOffersLink, locale)}
            </AuditLpExternalLink>
          </div>
        </fieldset>
        {status === 'sending' ? (
          <p className="sr-only" role="status" aria-live="polite">
            {tForm(contactForm.sending)}
          </p>
        ) : null}
      </form>
    </div>
  )

  return isLight ? (
    card
  ) : (
    <div className="audit-beam-hue overflow-visible p-4 -m-4">
      <BorderBeam {...AUDIT_BEAM_PROPS} theme="dark">
        {card}
      </BorderBeam>
    </div>
  )
}
