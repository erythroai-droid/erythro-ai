'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BorderBeam } from 'border-beam'
import { contactForm } from '@/translations'
import ContactPrivacyConsent from '@/components/ContactPrivacyConsent'
import { ContactHoneypotField } from '@/components/ContactHoneypotField'
import { FieldOkCheck } from '@/components/FieldOkCheck'
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
  contactSubmitErrorMessage,
  isFreeAuditCooldownError,
  postContactForm,
  readContactSubmitErrorBody,
} from '@/lib/contactSubmit'
import AuditCooldownModal from '@/components/audit/AuditCooldownModal'
import { trackFreeAuditLead } from '@/lib/adsConversion'
import {
  auditPage,
  tAudit,
  tAuditWebsiteUnreachable,
  type AuditPageContent,
} from '@/lib/auditPage'
import {
  AUDIT_LP_TURNSTILE_ENABLED,
  auditLpCopy,
  mainSiteUrl,
  mainSiteUrlWithLang,
  tAuditLp,
} from '@/lib/auditLp'
import { auditSampleReportHref, auditSampleReportLabel } from '@/lib/auditSampleReports'
import { TurnstileField, isTurnstileSiteKeyConfigured, type TurnstileHandle } from '@/components/TurnstileField'
import { buildAuditReportPath, withAuditReportLang } from '@/lib/auditReport'
import {
  buildAuditContactPayload,
  buildAuditSubmissionMessage,
  hasAuditFieldErrors,
  validateAuditForm,
  type AuditField,
  type AuditFieldErrors,
  type AuditFormValues,
  type AuditReportLanguage,
} from '@/lib/auditFormValidation'
import { useAuditFieldChecks } from '@/hooks/useAuditFieldChecks'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'

type Status = 'idle' | 'sending' | 'success' | 'error'

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

function AuditLpSuccessModal({
  locale,
  orderId,
  reportHref,
  message,
  closeLabel,
  onClose,
}: {
  locale: string
  orderId: string | null
  reportHref: string | null
  message: string
  closeLabel: string
  onClose: () => void
}) {
  const titleId = useId()
  const isRtl = locale === 'he'
  useLockBodyScroll(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const title =
    locale === 'ru' ? 'Заказ отправлен!' : locale === 'he' ? 'ההזמנה נשלחה!' : 'Order submitted!'
  const statusLabel =
    locale === 'ru'
      ? 'Смотреть статус заказа'
      : locale === 'he'
        ? 'צפה בסטטוס ההזמנה'
        : 'View order status'
  const orderIdLabel =
    locale === 'ru' ? 'ID заказа' : locale === 'he' ? 'מספר הזמנה' : 'Order ID'

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center overflow-hidden overscroll-none p-4 sm:p-6"
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-coal-900/70 backdrop-blur-[2px]"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-[20px] border border-white/10 bg-coal-500 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-8">
        <h2 id={titleId} className="m-0 font-sans text-xl font-medium text-gold-500">
          {title}
        </h2>
        <p className="mt-3 m-0 text-sm font-light leading-6 text-white/85">{message}</p>
        {orderId ? (
          <p className="mt-4 m-0 text-xs text-white/55">
            {orderIdLabel}: <span className="text-white/80">{orderId}</span>
          </p>
        ) : null}
        {reportHref ? (
          <a
            href={reportHref}
            className="mt-5 inline-flex text-sm font-medium text-gold-500 underline decoration-from-font underline-offset-4 hover:text-gold-400"
          >
            {statusLabel}
          </a>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 flex w-full items-center justify-center rounded-full bg-erythro-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-erythro-600"
        >
          {closeLabel}
        </button>
      </div>
    </div>,
    document.body,
  )
}

export default function AuditLpForm({
  locale,
  theme = 'dark',
  page = auditPage,
}: {
  locale: string
  theme?: 'light' | 'dark'
  page?: AuditPageContent
}) {
  const isLight = theme === 'light'
  const reportLanguage = (
    locale === 'ru' || locale === 'he' || locale === 'en' ? locale : 'en'
  ) as AuditReportLanguage
  const tForm = (field: Record<string, string>) => field[locale] || field.en || ''

  const [status, setStatus] = useState<Status>('idle')
  const [submitError, setSubmitError] = useState('')
  const [cooldownNotice, setCooldownNotice] = useState<{
    message: string
    remainingLabel: string
  } | null>(null)
  const [reportHref, setReportHref] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [values, setValues] = useState<AuditFormValues>({
    website: '',
    name: '',
    email: '',
    phone: '',
    auditLanguage: reportLanguage,
  })
  const [fieldErrors, setFieldErrors] = useState<AuditFieldErrors>({})
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileHandle>(null)
  const submittingRef = useRef(false)
  const [portalReady, setPortalReady] = useState(false)
  const {
    ok: fieldOk,
    checkingWebsite,
    onValueChange,
    blurEmail,
    blurWebsite,
    ensureWebsiteOk,
    resetChecks,
  } = useAuditFieldChecks(values, setFieldErrors)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    setValues((current) => ({ ...current, auditLanguage: reportLanguage }))
  }, [reportLanguage])

  const pillFieldClass = formPillFieldClass(isLight)
  const fieldLabelClass = isLight ? 'text-coal-900/60' : 'text-white/60'
  const samplePath = auditSampleReportHref('audit-free', locale)
  const sampleHref = samplePath ? mainSiteUrl(samplePath) : null

  const fieldErrorMessage = (field: AuditField) => {
    const err = fieldErrors[field]
    if (!err) return undefined
    if (field === 'website' && err === 'invalid') return tAudit(page.form.websiteInvalid, locale)
    if (field === 'website' && err === 'unreachable') {
      return tAuditWebsiteUnreachable(page.form.websiteUnreachable, locale)
    }
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
    onValueChange(name)
    if (status === 'error') {
      setStatus('idle')
      setSubmitError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submittingRef.current || status === 'sending') return

    const nextFieldErrors = validateAuditForm(values, { requireNamePhone: false })
    setFieldErrors(nextFieldErrors)
    if (!privacyConsent) setConsentError(true)
    else setConsentError(false)

    if (hasAuditFieldErrors(nextFieldErrors) || !privacyConsent) return
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
    setCooldownNotice(null)
    let posted = false
    try {
      const websiteOk = await ensureWebsiteOk()
      if (!websiteOk) {
        setStatus('idle')
        return
      }

      posted = true
      const res = await postContactForm({
        ...buildAuditContactPayload({
          values,
          locale,
          honeypot,
          message: buildAuditSubmissionMessage(values.website, values.auditLanguage),
          planSlug: 'audit-free',
        }),
        ...(AUDIT_LP_TURNSTILE_ENABLED
          ? { [TURNSTILE_TOKEN_FIELD]: turnstileToken }
          : {}),
      })
      if (!res.ok) {
        const errPayload = await readContactSubmitErrorBody(res)
        if (isFreeAuditCooldownError(res.status, errPayload)) {
          setCooldownNotice({
            message: errPayload.message.trim(),
            remainingLabel:
              errPayload.retryAfterLabel?.trim() ||
              (typeof errPayload.retryAfterSec === 'number' && errPayload.retryAfterSec > 0
                ? `${Math.max(1, Math.ceil(errPayload.retryAfterSec / 60))} min`
                : ''),
          })
          setStatus('idle')
          return
        }
        setSubmitError(
          contactSubmitErrorMessage(res.status, errPayload, {
            error: tForm(contactForm.error),
            rateLimited: tForm(contactForm.rateLimited),
            captchaFailed: tForm(contactForm.captchaFailed),
          }),
        )
        setStatus('error')
        return
      }
      const payload = (await res.json().catch(() => null)) as {
        submissionId?: number | string
        orderId?: string
        reportPath?: string
        reportAccessToken?: string
      } | null
      const sid = payload?.submissionId
      const path =
        typeof payload?.reportPath === 'string' && payload.reportPath.startsWith('/')
          ? withAuditReportLang(payload.reportPath, reportLanguage)
          : sid != null && typeof payload?.reportAccessToken === 'string'
            ? buildAuditReportPath(sid, payload.reportAccessToken, reportLanguage)
            : null
      // Always open report on the main domain (LP hosts redirect non-root paths).
      // `?lang=` carries LP locale — cookies/localStorage do not cross audit-*. → erythro.ai.
      setReportHref(path ? mainSiteUrl(path) : null)
      setOrderId(payload?.orderId || (sid != null ? `AUD-${sid}` : null))
      setStatus('success')
      if (sid != null) trackFreeAuditLead(String(sid))
      setValues({
        website: '',
        name: '',
        email: '',
        phone: '',
        auditLanguage: reportLanguage,
      })
      setFieldErrors({})
      resetChecks()
      setPrivacyConsent(false)
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
        {tAuditLp(auditLpCopy.formKicker, locale)}
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
          <ContactHoneypotField idPrefix="audit-lp" />

          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <FormPillShell isLight={isLight} clip hasError={Boolean(fieldErrors.email)}>
                    <div className="relative min-w-0 flex-1">
                      <label htmlFor="audit-lp-email" className="sr-only">
                        {tForm(contactForm.email)}
                      </label>
                      <input
                        id="audit-lp-email"
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
                        aria-describedby={fieldErrors.email ? 'audit-lp-email-error' : undefined}
                      />
                      <FieldOkCheck show={Boolean(fieldOk.email)} isLight={isLight} />
                    </div>
                  </FormPillShell>
                  {fieldErrors.email ? renderFieldError('email', 'audit-lp-email-error') : null}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <FormPillShell isLight={isLight} clip hasError={Boolean(fieldErrors.website)}>
                    <div className="relative min-w-0 flex-1">
                      <label htmlFor="audit-lp-website" className="sr-only">
                        {tAudit(page.form.website, locale)}
                      </label>
                      <input
                        id="audit-lp-website"
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
                        aria-describedby={fieldErrors.website ? 'audit-lp-website-error' : undefined}
                      />
                      <FieldOkCheck
                        show={Boolean(fieldOk.website)}
                        checking={checkingWebsite}
                        isLight={isLight}
                      />
                    </div>
                  </FormPillShell>
                  {renderFieldError('website', 'audit-lp-website-error')}
                </div>
              </div>

              <ContactPrivacyConsent
                locale={locale}
                theme={theme}
                idPrefix="audit-lp"
                parts="notice"
                privacyHref={mainSiteUrl('/privacy')}
                termsHref={mainSiteUrl('/terms')}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-2 lg:shrink-0">
              <button
                type="submit"
                className={`${FORM_SUBMIT_CLASS} box-border h-[50px] py-0 sm:h-[54px] lg:w-auto lg:shrink-0 lg:px-10`}
              >
                {status === 'sending' ? (
                  <>
                    <ContactSendSpinner className="h-[18px] w-[18px] shrink-0" />
                    <span>{tForm(contactForm.sending)}</span>
                  </>
                ) : (
                  tAudit(page.form.submit, locale)
                )}
              </button>

              <ContactPrivacyConsent
                locale={locale}
                theme={theme}
                idPrefix="audit-lp"
                parts="consent"
                privacyHref={mainSiteUrl('/privacy')}
                termsHref={mainSiteUrl('/terms')}
                checked={privacyConsent}
                showRequiredError={consentError}
                disabled={status === 'sending'}
                onCheckedChange={(next) => {
                  setPrivacyConsent(next)
                  if (next) setConsentError(false)
                }}
              />

              <p className={`m-0 px-1 text-xs ${fieldLabelClass}`}>
                <span className="text-erythro-500" aria-hidden="true">
                  *
                </span>
                {' — '}
                {tAudit(page.form.requiredNote, locale)}
              </p>
            </div>
          </div>

          {status === 'error' ? (
            <p id="audit-lp-error" role="alert" className="m-0 text-sm text-erythro-500">
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
              href={mainSiteUrlWithLang('/order/audit-pro', locale)}
              isLight={isLight}
            >
              {tAuditLp(auditLpCopy.allOffersLink, locale)}
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

  return (
    <>
      {isLight ? (
        card
      ) : (
        <div className="audit-beam-hue overflow-visible p-4 -m-4">
          <BorderBeam {...AUDIT_BEAM_PROPS} theme="dark">
            {card}
          </BorderBeam>
        </div>
      )}

      {portalReady && status === 'success' ? (
        <AuditLpSuccessModal
          locale={locale}
          orderId={orderId}
          reportHref={reportHref}
          message={tAudit(page.form.success, locale)}
          closeLabel={tForm(contactForm.close)}
          onClose={() => {
            setStatus('idle')
            setReportHref(null)
            setOrderId(null)
          }}
        />
      ) : null}

      {cooldownNotice ? (
        <AuditCooldownModal
          locale={locale}
          message={cooldownNotice.message}
          remainingLabel={cooldownNotice.remainingLabel}
          closeLabel={tForm(contactForm.close)}
          onClose={() => setCooldownNotice(null)}
        />
      ) : null}
    </>
  )
}
