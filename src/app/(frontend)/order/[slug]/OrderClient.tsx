'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from '@/components/Navbar'
import FooterSection from '@/components/FooterSection'
import { AccessibilityPanel } from '@/components/accessibility'
import CookieConsent from '@/components/CookieConsent'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import { ContactModalProvider, useContactModal } from '@/components/ContactModal'
import Button from '@/components/Button'
import ChatButton from '@/components/ChatButton'
import HeaderChipStrip from '@/components/HeaderChipStrip'
import type { SiteContent } from '@/lib/defaultContent'
import {
  ADDON_TERM_MONTHS,
  AUDIT_CHECK_CATEGORIES,
  addonMonthlyAmount,
  addonTermDiscount,
  calcAddonAmount,
  calcPlanAmount,
  calcTaxAmount,
  formatPrice,
  isSubscriptionFeatureLabel,
  SUBSCRIPTION_ADDON_ID,
  tLocale,
  type AddonTermMonths,
  type OrderAddon,
  type OrderPlan,
} from '@/lib/orderPlans'
import { isLexicalDoc, lexicalToPlain, resolveLexical } from '@/lib/lexical'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { useSitePrefs } from '@/hooks/useSitePrefs'
import ProjectNav, { type ProjectNavNeighbor } from '@/components/portfolio/ProjectNav'
import BidiText from '@/components/BidiText'
import ContactPrivacyConsent from '@/components/ContactPrivacyConsent'
import { ContactHoneypotField } from '@/components/ContactHoneypotField'
import { PhoneE164Field } from '@/components/PhoneE164Field'
import {
  FORM_SUBMIT_CLASS,
  FormPillDivider,
  FormPillShell,
  formPillFieldClass,
  requiredPlaceholder,
} from '@/components/form/FormPills'
import { FieldOkCheck } from '@/components/FieldOkCheck'
import { ContactSendSpinner } from '@/components/ContactSendingPanel'
import { TurnstileField, isTurnstileSiteKeyConfigured, type TurnstileHandle } from '@/components/TurnstileField'
import { CONTACT_HONEYPOT_FIELD } from '@/lib/contactHoneypot'
import { TURNSTILE_TOKEN_FIELD } from '@/lib/turnstile'
import {
  AUDIT_REPORT_LANGUAGES,
  buildAuditContactPayload,
  buildAuditOrderMessage,
  hasAuditFieldErrors,
  validateAuditForm,
  type AuditField,
  type AuditFieldErrors,
  type AuditFormValues,
  type AuditReportLanguage,
} from '@/lib/auditFormValidation'
import { useAuditFieldChecks } from '@/hooks/useAuditFieldChecks'
import { contactForm } from '@/translations'
import { auditPage, tAudit, tAuditWebsiteUnreachable, type AuditPageContent } from '@/lib/auditPage'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/** Accordion open/close duration; keep in sync with the grid-rows transition. */
const ACCORDION_MS = 300

interface OrderClientProps {
  initialLocale: string
  initialTheme?: 'light' | 'dark'
  content: SiteContent
  plan: OrderPlan
  prev?: ProjectNavNeighbor | null
  next?: ProjectNavNeighbor | null
  /** CMS form copy for audit checkout fields (website / report language). */
  auditForm?: AuditPageContent['form']
}

export default function OrderClient({
  initialLocale,
  initialTheme,
  content,
  plan,
  prev = null,
  next = null,
  auditForm,
}: OrderClientProps) {
  const a11yTranslations = content.accessibility
  const { locale, setLocale, theme, setTheme } = useSitePrefs(initialLocale, 'light', initialTheme)
  const formCopy = auditForm ?? auditPage.form
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)

  const pickA11y = (field?: Record<string, string> | null) =>
    (field && (field[locale] || field.en)) || ''

  const a11yLabels = useMemo(
    () => ({
      title: pickA11y(a11yTranslations.title),
      reset: pickA11y(a11yTranslations.reset),
      poweredBy: pickA11y(a11yTranslations.poweredBy),
      statementLink: pickA11y(a11yTranslations.statementLink),
      closeLabel: pickA11y(a11yTranslations.closeLabel),
      screenReaderEnabled: pickA11y(a11yTranslations.screenReaderEnabled),
      biggerText: pickA11y(a11yTranslations.biggerText),
      dyslexia: pickA11y(a11yTranslations.dyslexia),
      contrast: pickA11y(a11yTranslations.contrast),
      monochrome: pickA11y(a11yTranslations.monochrome),
      highlightLinks: pickA11y(a11yTranslations.highlightLinks),
      pauseAnimations: pickA11y(a11yTranslations.pauseAnimations),
      spacing: pickA11y(a11yTranslations.spacing),
      cursor: pickA11y(a11yTranslations.cursor),
      keyboardNavigation: pickA11y(a11yTranslations.keyboardNavigation),
      screenReader: pickA11y(a11yTranslations.screenReader),
    }),
    [locale],
  )

  return (
    <SiteContentProvider value={content}>
      <ContactModalProvider locale={locale}>
        <div
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          className={`relative min-h-screen font-sans transition-colors duration-500 ${
            theme === 'light' ? 'bg-[#F4F1EC]' : 'bg-coal-900'
          }`}
        >
          <div className="relative z-10 lg:contents">
            <HeaderChipStrip page="order" />
          </div>
          <Navbar
            currentLocale={locale}
            setLocale={setLocale}
            theme={theme}
            setTheme={setTheme}
            onOpenAccessibility={() => setIsAccessibilityOpen(true)}
            forceBurger
            headerContrast="auto"
          />

          <div className="relative z-20 -mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:mt-0">
            <div
              className={`relative ${
                theme === 'light' ? 'bg-[#F4F1EC] text-coal-900' : 'dark-gradient-bg text-main'
              }`}
            >
              <OrderCheckout
                plan={plan}
                locale={locale}
                theme={theme}
                prev={prev}
                next={next}
                formCopy={formCopy}
              />
            </div>
          </div>

          <div className="relative z-40 -mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:mt-0">
            <FooterSection locale={locale} theme={theme} pinSpacer={false} />
          </div>

          <AccessibilityPanel
            isOpen={isAccessibilityOpen}
            onClose={() => setIsAccessibilityOpen(false)}
            labels={a11yLabels}
            screenReaderTargets={[
              { id: 'order-main', label: pickA11y(a11yTranslations.screenReaderOrder) },
              { id: 'order-summary', label: pickA11y(a11yTranslations.screenReaderSummary) },
              { id: 'footer', label: pickA11y(a11yTranslations.screenReaderFooter) },
            ]}
            rtl={locale === 'he'}
            showPoweredBy
          />

          <CookieConsent locale={locale} theme={theme} />

          <ChatButton locale={locale} theme={theme} />
        </div>
      </ContactModalProvider>
    </SiteContentProvider>
  )
}

function OrderCheckout({
  plan,
  locale,
  theme,
  prev,
  next,
  formCopy,
}: {
  plan: OrderPlan
  locale: string
  theme: 'light' | 'dark'
  prev: ProjectNavNeighbor | null
  next: ProjectNavNeighbor | null
  formCopy: AuditPageContent['form']
}) {
  const { open: openContact } = useContactModal()
  const isLight = theme === 'light'
  const isAudit = plan.kind === 'audit' || plan.slug.startsWith('audit-')

  const [periodId, setPeriodId] = useState(plan.defaultPeriodId || plan.periods[0]?.id || '')
  const [selectedAddons, setSelectedAddons] = useState<string[]>(
    plan.addons.filter((a) => a.recommended || a.mandatory).map((a) => a.id),
  )
  const [addonTermMonths, setAddonTermMonths] = useState<Record<string, AddonTermMonths>>(() => {
    const initial: Record<string, AddonTermMonths> = {}
    for (const addon of plan.addons) initial[addon.id] = 1
    return initial
  })
  const [openAddonFullId, setOpenAddonFullId] = useState<string | null>(null)
  const [includesOpen, setIncludesOpen] = useState(false)
  const [checksOpen, setChecksOpen] = useState(false)
  const [auditModalOpen, setAuditModalOpen] = useState(false)

  // The footer is pinned by ScrollTrigger with cached measurements; without a
  // refresh an expanded accordion grows the page and the pin overlaps content.
  useEffect(() => {
    const timer = window.setTimeout(() => ScrollTrigger.refresh(), ACCORDION_MS + 50)
    return () => window.clearTimeout(timer)
  }, [includesOpen, checksOpen, openAddonFullId, selectedAddons, periodId])

  const isSubscriptionAddon = (addon: OrderAddon) =>
    addon.id === SUBSCRIPTION_ADDON_ID || isSubscriptionFeatureLabel(addon.name)

  const title = tLocale(plan.card.title, locale)
  const subtitle = tLocale(plan.subtitle, locale).trim()
  const pricing = calcPlanAmount(plan, periodId)
  const period = plan.periods.find((p) => p.id === periodId) || plan.periods[0]
  const money = (amount: number) => formatPrice(amount, locale, plan.card.currency)

  const featureRows = plan.card.features
    .map((feature, index) => {
      const label = tLocale(feature.label, locale).trim()
      const value = tLocale(feature.value, locale).trim()
      if (!label && !value) return null
      return { index, label, value }
    })
    .filter(Boolean) as Array<{
    index: number
    label: string
    value: string
  }>

  const selectedAddonPricing = plan.addons
    .filter((a) => selectedAddons.includes(a.id))
    .map((addon) => {
      const months: AddonTermMonths = addon.mandatory ? 1 : addonTermMonths[addon.id] || 1
      const discount = addon.mandatory ? 0 : addonTermDiscount(addon, months)
      const amounts = calcAddonAmount(addonMonthlyAmount(addon, locale), months, discount)
      return { addon, months, discount, ...amounts }
    })

  const addonTotal = selectedAddonPricing.reduce((sum, row) => sum + row.final, 0)

  const paymentNote = tLocale(plan.paymentNote, locale).trim()
  const promoText = tLocale(plan.promo, locale).trim()
  const taxNote = tLocale(plan.taxNote, locale).trim()
  const taxValue = tLocale(plan.taxValue, locale).trim()
  const subtotal = pricing.base + addonTotal
  const taxAmount = calcTaxAmount(subtotal, taxNote, taxValue)
  const total = subtotal + taxAmount
  const accent = isLight ? 'text-gold-900' : 'text-gold-800'

  const copy = {
    period: locale === 'ru' ? 'Варианты оплаты' : locale === 'he' ? 'אפשרויות תשלום' : 'Payment options',
    summary: locale === 'ru' ? 'Итог заказа' : locale === 'he' ? 'סיכום הזמנה' : 'Order summary',
    subtotal: locale === 'ru' ? 'Итого' : locale === 'he' ? 'ביניים' : 'Subtotal',
    addonTotal: locale === 'ru' ? 'Итого:' : locale === 'he' ? 'סה״כ:' : 'Total:',
    totalDue:
      locale === 'ru' ? 'Всего к оплате' : locale === 'he' ? 'סה״כ לתשלום' : 'Total due',
    taxes: locale === 'ru' ? 'Налоги' : locale === 'he' ? 'מיסים' : 'Taxes',
    planRow: locale === 'ru' ? 'Тариф' : locale === 'he' ? 'מסלול' : 'Plan',
    term: locale === 'ru' ? 'Срок подписки' : locale === 'he' ? 'תקופת מנוי' : 'Subscription term',
    monthsLabel: (n: number) =>
      locale === 'ru'
        ? n === 1
          ? '1 месяц'
          : `${n} месяцев`
        : locale === 'he'
          ? n === 1
            ? 'חודש 1'
            : `${n} חודשים`
          : n === 1
            ? '1 month'
            : `${n} months`,
    continue: isAudit
      ? pricing.base === 0
        ? locale === 'ru'
          ? 'Заказать бесплатный аудит'
          : locale === 'he'
            ? 'בקשת ביקורת חינם'
            : 'Request free audit'
        : locale === 'ru'
          ? 'Оформить заказ'
          : locale === 'he'
            ? 'ביצוע הזמנה'
            : 'Complete order'
      : locale === 'ru'
        ? 'Отправить заказ'
        : locale === 'he'
          ? 'שלח הזמנה'
          : 'Submit order',
    guarantee: isAudit
      ? locale === 'ru'
        ? 'Отчёты на RU / EN / HE · Безопасная обработка данных'
        : locale === 'he'
          ? 'דוחות ב-RU / EN / HE · עיבוד מאובטח'
          : 'Reports in RU / EN / HE · Secure data processing'
      : locale === 'ru'
        ? 'Гарантия возврата — обсуждается индивидуально'
        : locale === 'he'
          ? 'אחריות להחזר — לדיון פרטני'
          : 'Money-back terms — discussed individually',
    savings: locale === 'ru' ? 'Экономия' : locale === 'he' ? 'חיסכון' : 'Save',
    recommended: locale === 'ru' ? 'Рекомендуем' : locale === 'he' ? 'מומלץ' : 'Recommended',
    perMonth: locale === 'ru' ? '/мес' : locale === 'he' ? '/חודש' : '/mo',
    subscriptionIncludes:
      locale === 'ru'
        ? 'Что входит в подписку?'
        : locale === 'he'
          ? 'מה כלול במנוי?'
          : "What's included in the subscription?",
    includes: isAudit
      ? locale === 'ru'
        ? 'Что входит в тариф?'
        : locale === 'he'
          ? 'מה כלול במסלול?'
          : "What's included in this plan?"
      : locale === 'ru'
        ? 'Что входит в разработку?'
        : locale === 'he'
          ? 'מה כלול בפיתוח?'
          : "What's included in development?",
    checksTitle:
      locale === 'ru'
        ? 'Что проверяем (60+ сигналов)'
        : locale === 'he'
          ? 'מה אנחנו בודקים (60+ אותות)'
          : 'What we check (60+ signals)',
  }

  const toggleAddon = (id: string) => {
    if (plan.addons.some((addon) => addon.id === id && addon.mandatory)) return

    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleContinue = () => {
    if (isAudit) {
      setAuditModalOpen(true)
      return
    }

    const addonLines = selectedAddonPricing
      .map(({ addon, months, final }) => {
        const term = addon.mandatory ? '' : ` (${copy.monthsLabel(months)})`
        return `${tLocale(addon.name, locale)}${term}: ${money(final)}`
      })
      .join(', ')
    const draft = [
      `Order: ${title}`,
      `Period: ${tLocale(period?.label, locale)}`,
      `Subtotal: ${money(subtotal)}`,
      `Tax: ${money(taxAmount)}`,
      `Total: ${money(total)}`,
      addonLines ? `Add-ons: ${addonLines}` : null,
    ]
      .filter(Boolean)
      .join('\n')
    try {
      sessionStorage.setItem('erythro_order_draft', draft)
    } catch {
      /* ignore */
    }
    openContact('order')
  }

  const cardCls = isLight
    ? 'bg-white border border-coal-900/10 shadow-[0_8px_30px_rgba(13,13,13,0.06)]'
    : 'bg-coal-800 border border-white/10'
  const muted = isLight ? 'text-gold-900' : 'text-gold-800'

  return (
    <>
      <main
        id="order-main"
        className="relative z-10 mx-auto w-full max-w-[1170px] px-[30px] pb-16 pt-8 lg:pb-24 lg:pt-12"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
          {/* Left column */}
          <div className="flex flex-col gap-5">
            {/* Plan card */}
            <section className={`overflow-hidden rounded-[10px] p-6 md:p-8 ${cardCls}`}>
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px] bg-erythro-500 text-white">
                  {isAudit ? (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                      <path d="M11 8v6" />
                      <path d="M8 11h6" />
                    </svg>
                  ) : (
                    <img
                      src="/images/icons/cloud_sql.svg"
                      alt=""
                      width={22}
                      height={22}
                      className="size-[22px]"
                      aria-hidden
                    />
                  )}
                </div>
                <div>
                  <h1 className="font-sans text-xl font-bold uppercase tracking-[0.04em] md:text-2xl">
                    {title}
                  </h1>
                  {subtitle ? <p className={`mt-1 text-sm ${muted}`}>{subtitle}</p> : null}
                </div>
              </div>

              {plan.periods.length > 0 ? (
                <label className="flex w-full flex-col gap-2">
                  <span className={`text-xs uppercase tracking-[0.16em] ${muted}`}>
                    {copy.period}
                  </span>
                  <select
                    value={periodId}
                    onChange={(e) => setPeriodId(e.target.value)}
                    className={`h-12 w-full rounded-[10px] border px-4 text-sm outline-none transition-colors ${
                      isLight
                        ? 'border-coal-900/15 bg-[#F7F5F1] text-coal-900 focus:border-erythro-500'
                        : 'border-white/15 bg-coal-900 text-white focus:border-gold-500'
                    }`}
                  >
                    {plan.periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {tLocale(p.label, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {paymentNote ? (
                <p className={`mt-4 text-xs leading-5 ${muted}`}>{paymentNote}</p>
              ) : null}

              {promoText ? (
                <div
                  className={`mt-5 flex items-start gap-3 rounded-[10px] border px-4 py-3 text-sm ${
                    isLight
                      ? 'border-emerald-700/30 bg-emerald-500/15 text-emerald-950'
                      : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                  }`}
                >
                  <span
                    className={`mt-0.5 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <p>{promoText}</p>
                </div>
              ) : null}

              {(() => {
                const plainIncludes = tLocale(plan.includes, locale).trim()
                const includesDoc = resolveLexical(plan.includesRich, locale, plainIncludes || null)
                const hasIncludes =
                  Boolean(includesDoc && lexicalToPlain(includesDoc)) || Boolean(plainIncludes)
                const hasChecks = isAudit

                if (!featureRows.length && !hasIncludes && !hasChecks) {
                  return (
                    <div className="mt-6 -mx-6 border-t border-current/10 px-6 pt-4 md:-mx-8 md:px-8">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm font-bold uppercase tracking-[0.04em]">
                          {copy.addonTotal}
                        </span>
                        <div className="flex flex-col items-end gap-2" dir="ltr">
                          {pricing.savings > 0 ? (
                            <span className={`text-sm line-through opacity-50 ${muted}`}>
                              {money(pricing.list)}
                              {pricing.perMonth ? copy.perMonth : ''}
                            </span>
                          ) : null}
                          <span className="text-xl font-bold tracking-wide md:text-2xl">
                            {pricing.perMonth
                              ? `${money(pricing.perMonth)}${copy.perMonth}`
                              : money(pricing.base)}
                            {plan.card.priceNote ? (
                              <span className="relative -top-3 inline-block text-sm leading-none text-erythro-500">
                                *
                              </span>
                            ) : null}
                          </span>
                          {pricing.savings > 0 ? (
                            <span
                              className={`inline-flex w-fit shrink-0 whitespace-nowrap rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                                isLight ? 'text-emerald-900' : 'text-emerald-300'
                              }`}
                            >
                              {copy.savings} {money(pricing.savings)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                }

                const titleClass = `min-w-0 text-sm leading-6 ${
                  isLight ? 'text-coal-900/85' : 'text-white/85'
                }`
                const rowBtnClass = `group flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 px-6 py-3 text-start transition-colors duration-300 md:px-8 ${
                  isLight ? 'hover:bg-erythro-500/5' : 'hover:bg-gold-500/10'
                }`

                return (
                  <div className="mt-6 -mx-6 flex flex-col border-t border-current/10 md:-mx-8">
                    {featureRows.map((row, rowPos) => {
                      const isLastFeature =
                        rowPos === featureRows.length - 1 && !hasIncludes && !hasChecks
                      const rowBorder = isLastFeature ? '' : 'border-b border-current/10'
                      return (
                        <div
                          key={row.index}
                          className={`flex min-h-14 items-center justify-between gap-4 px-6 py-3 md:px-8 ${rowBorder}`}
                        >
                          <p className={`m-0 ${titleClass}`}>
                            {row.label ? <span className="font-semibold">{row.label} </span> : null}
                            {row.value ? <BidiText>{row.value}</BidiText> : null}
                          </p>
                          <span className="h-8 w-8 shrink-0" aria-hidden />
                        </div>
                      )
                    })}

                    {hasIncludes ? (
                      <div className={hasChecks ? 'border-b border-current/10' : ''}>
                        <button
                          type="button"
                          onClick={() => setIncludesOpen((open) => !open)}
                          className={rowBtnClass}
                          aria-expanded={includesOpen}
                          aria-controls="order-includes"
                        >
                          <span className={`${titleClass} font-semibold`}>{copy.includes}</span>
                          <OrderAccordionPlus isOpen={includesOpen} isLight={isLight} size="sm" />
                        </button>
                        <div
                          id="order-includes"
                          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                            includesOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div
                              className={`order-includes px-6 pb-4 text-sm leading-6 md:px-8 [&_:is(h1,h2,h3,h4,h5,h6,p)]:m-0 [&_p+_p]:mt-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:my-1 [&_a]:underline [&_strong]:font-semibold [&_em]:italic ${
                                isLight ? 'text-coal-900/85' : 'text-white/85'
                              }`}
                            >
                              {includesDoc && isLexicalDoc(includesDoc) ? (
                                <RichText data={includesDoc as never} />
                              ) : (
                                <p>{plainIncludes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {hasChecks ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => setChecksOpen((open) => !open)}
                          className={rowBtnClass}
                          aria-expanded={checksOpen}
                          aria-controls="order-audit-checks"
                        >
                          <span className={`${titleClass} font-semibold`}>{copy.checksTitle}</span>
                          <OrderAccordionPlus isOpen={checksOpen} isLight={isLight} size="sm" />
                        </button>
                        <div
                          id="order-audit-checks"
                          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                            checksOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="px-6 pb-4 md:px-8">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {AUDIT_CHECK_CATEGORIES.map((cat, i) => (
                                  <div
                                    key={i}
                                    className={`rounded-[8px] border p-3 ${
                                      isLight
                                        ? 'border-coal-900/10 bg-coal-900/[0.02]'
                                        : 'border-white/10 bg-white/[0.02]'
                                    }`}
                                  >
                                    <h4 className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-erythro-500">
                                      {tLocale(cat.title, locale)}
                                    </h4>
                                    <p
                                      className={`mt-1 m-0 text-xs leading-5 ${
                                        isLight ? 'text-coal-900/75' : 'text-white/75'
                                      }`}
                                    >
                                      {tLocale(cat.description, locale)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-start justify-between gap-4 border-t border-current/10 px-6 pt-4 md:px-8">
                      <span className="text-sm font-bold uppercase tracking-[0.04em]">
                        {copy.addonTotal}
                      </span>
                      <div className="flex flex-col items-end gap-2" dir="ltr">
                        {pricing.savings > 0 ? (
                          <span className={`text-sm line-through opacity-50 ${muted}`}>
                            {money(pricing.list)}
                            {pricing.perMonth ? copy.perMonth : ''}
                          </span>
                        ) : null}
                        <span className="text-xl font-bold tracking-wide md:text-2xl">
                          {pricing.perMonth
                            ? `${money(pricing.perMonth)}${copy.perMonth}`
                            : money(pricing.base)}
                          {plan.card.priceNote ? (
                            <span className="relative -top-3 inline-block text-sm leading-none text-erythro-500">
                              *
                            </span>
                          ) : null}
                        </span>
                        {pricing.savings > 0 ? (
                          <span
                            className={`inline-flex w-fit shrink-0 whitespace-nowrap rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                              isLight ? 'text-emerald-900' : 'text-emerald-300'
                            }`}
                          >
                            {copy.savings} {money(pricing.savings)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {(() => {
                const disclaimer = tLocale(plan.card.disclaimer, locale).trim()
                if (!disclaimer) return null
                const starIndex = disclaimer.indexOf('*')
                return (
                  <p className={`mt-3 text-[11px] leading-5 ${muted}`}>
                    {starIndex === -1 ? (
                      disclaimer
                    ) : (
                      <>
                        {disclaimer.slice(0, starIndex)}
                        <span className="text-erythro-500">*</span>
                        {disclaimer.slice(starIndex + 1)}
                      </>
                    )}
                  </p>
                )
              })()}
            </section>

            {/* Add-ons */}
            {plan.addons.map((addon) => {
              const checked = selectedAddons.includes(addon.id)
              const isMandatory = Boolean(addon.mandatory)
              const isSubscription = isSubscriptionAddon(addon)
              const note = tLocale(addon.note, locale).trim()
              const description = tLocale(addon.description, locale).trim()
              const months: AddonTermMonths = isMandatory ? 1 : addonTermMonths[addon.id] || 1
              const discount = isMandatory ? 0 : addonTermDiscount(addon, months)
              const amounts = calcAddonAmount(addonMonthlyAmount(addon, locale), months, discount)
              const plainFull = tLocale(addon.full, locale).trim()
              const fullDoc = resolveLexical(addon.fullRich, locale, plainFull || null)
              const hasFull = Boolean(fullDoc && lexicalToPlain(fullDoc)) || Boolean(plainFull)
              const badgeCls =
                'inline-flex w-fit shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]'
              const includesTitleClass = `min-w-0 text-sm font-semibold leading-6 ${
                isLight ? 'text-coal-900/85' : 'text-white/85'
              }`
              const rowBtnClass = `group flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 px-6 py-3 text-start transition-colors duration-300 md:px-8 ${
                isLight ? 'hover:bg-erythro-500/5' : 'hover:bg-gold-500/10'
              }`
              const fullOpen = openAddonFullId === addon.id
              return (
                <section key={addon.id} className={`overflow-hidden rounded-[10px] p-6 md:p-8 ${cardCls}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAddon(addon.id)}
                      disabled={isMandatory}
                      className="mt-1 size-5 shrink-0 accent-[var(--erythro-500,#e52421)] disabled:cursor-not-allowed disabled:opacity-100"
                      aria-label={tLocale(addon.name, locale)}
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="font-sans text-base font-bold uppercase tracking-[0.04em]">
                        {tLocale(addon.name, locale)}
                      </h2>

                      {addon.recommended ? (
                        <div className="mt-2">
                          <span className={`${badgeCls} bg-erythro-500/15 text-erythro-500`}>
                            {copy.recommended}
                          </span>
                        </div>
                      ) : null}

                      {description ? (
                        <p className={`mt-2 text-sm leading-6 ${muted}`}>{description}</p>
                      ) : null}

                      {!isMandatory ? (
                        <label className="mt-4 flex w-full flex-col gap-2">
                          <span className={`text-xs uppercase tracking-[0.16em] ${muted}`}>
                            {copy.term}
                          </span>
                          <select
                            value={months}
                            onChange={(e) => {
                              const next = Number(e.target.value) as AddonTermMonths
                              setAddonTermMonths((prev) => ({ ...prev, [addon.id]: next }))
                            }}
                            className={`h-12 w-full rounded-[10px] border px-4 text-sm outline-none transition-colors ${
                              isLight
                                ? 'border-coal-900/15 bg-[#F7F5F1] text-coal-900 focus:border-erythro-500'
                                : 'border-white/15 bg-coal-900 text-white focus:border-gold-500'
                            }`}
                          >
                            {ADDON_TERM_MONTHS.map((n) => (
                              <option key={n} value={n}>
                                {copy.monthsLabel(n)}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}

                      {note ? (
                        <p
                          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                            isLight
                              ? 'bg-emerald-500/15 text-emerald-950'
                              : 'bg-emerald-500/10 text-emerald-300'
                          }`}
                        >
                          {note}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {isSubscription || hasFull ? (
                    <div className="mt-6 -mx-6 flex flex-col border-t border-current/10 md:-mx-8">
                      {hasFull ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => setOpenAddonFullId(fullOpen ? null : addon.id)}
                            className={rowBtnClass}
                            aria-expanded={fullOpen}
                            aria-controls={`order-addon-full-${addon.id}`}
                          >
                            <span className={includesTitleClass}>
                              {isSubscription
                                ? copy.subscriptionIncludes
                                : tLocale(addon.name, locale)}
                            </span>
                            <OrderAccordionPlus isOpen={fullOpen} isLight={isLight} size="sm" />
                          </button>
                          <div
                            id={`order-addon-full-${addon.id}`}
                            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                              fullOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div
                                className={`order-includes px-6 pb-3 text-sm leading-6 md:px-8 [&_:is(h1,h2,h3,h4,h5,h6,p)]:m-0 [&_p+_p]:mt-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:my-1 [&_a]:underline [&_strong]:font-semibold [&_em]:italic ${
                                  isLight ? 'text-coal-900/85' : 'text-white/85'
                                }`}
                              >
                                {fullDoc && isLexicalDoc(fullDoc) ? (
                                  <RichText data={fullDoc as never} />
                                ) : (
                                  <p>{plainFull}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-h-14 items-center justify-between gap-4 px-6 py-3 md:px-8">
                          <p className={`m-0 ${includesTitleClass}`}>
                            {copy.subscriptionIncludes}
                          </p>
                          <span className="h-8 w-8 shrink-0" aria-hidden />
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-4 border-t border-current/10 px-6 pt-4 md:px-8">
                        <span className="text-sm font-bold uppercase tracking-[0.04em]">
                          {copy.addonTotal}
                        </span>
                        <div className="flex flex-col items-end gap-2" dir="ltr">
                          {amounts.savings > 0 ? (
                            <span className={`text-sm leading-5 line-through opacity-50 ${muted}`}>
                              {money(amounts.list)}
                            </span>
                          ) : null}
                          <span className="text-base font-semibold leading-5">
                            {money(amounts.final)}
                          </span>
                          {amounts.savings > 0 ? (
                            <span
                              className={`${badgeCls} bg-emerald-500/15 ${
                                isLight ? 'text-emerald-900' : 'text-emerald-300'
                              }`}
                            >
                              {copy.savings} {money(amounts.savings)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 -mx-6 border-t border-current/10 px-6 pt-4 md:-mx-8 md:px-8">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm font-bold uppercase tracking-[0.04em]">
                          {copy.addonTotal}
                        </span>
                        <div className="flex flex-col items-end gap-2" dir="ltr">
                          {amounts.savings > 0 ? (
                            <span className={`text-sm leading-5 line-through opacity-50 ${muted}`}>
                              {money(amounts.list)}
                            </span>
                          ) : null}
                          <span className="text-base font-semibold leading-5">
                            {money(amounts.final)}
                          </span>
                          {amounts.savings > 0 ? (
                            <span
                              className={`${badgeCls} bg-emerald-500/15 ${
                                isLight ? 'text-emerald-900' : 'text-emerald-300'
                              }`}
                            >
                              {copy.savings} {money(amounts.savings)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )
            })}
          </div>

          {/* Right column — summary */}
          <aside
            id="order-summary"
            className={`lg:sticky lg:top-28 ${cardCls} rounded-[10px] p-6 md:p-7`}
          >
            <h2 className={`mb-6 font-sans text-lg font-bold uppercase tracking-[0.06em] ${accent}`}>
              {copy.summary}
            </h2>

            <ul className="flex flex-col gap-5">
              <li className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-[0.04em]">{copy.planRow}</p>
                  <p className={`mt-0.5 text-xs uppercase tracking-[0.04em] ${muted}`}>{title}</p>
                </div>
                <div className="shrink-0 text-end text-sm" dir="ltr">
                  {pricing.savings > 0 ? (
                    <p className={`text-xs line-through opacity-50`}>{money(pricing.list)}</p>
                  ) : null}
                  <p className="font-semibold">
                    {pricing.perMonth
                      ? `${money(pricing.perMonth)}${copy.perMonth}`
                      : money(pricing.base)}
                  </p>
                </div>
              </li>

              {selectedAddonPricing.map(({ addon, months, list, final, savings }) => (
                <li key={addon.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold uppercase tracking-[0.04em]">
                      {tLocale(addon.name, locale)}
                    </p>
                    {!addon.mandatory ? (
                      <p className={`mt-0.5 text-xs ${muted}`}>{copy.monthsLabel(months)}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-end text-sm" dir="ltr">
                    {savings > 0 ? (
                      <p className={`text-xs line-through opacity-50`}>{money(list)}</p>
                    ) : null}
                    <p className="font-semibold">{money(final)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-4 border-t border-current/10 pt-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold uppercase tracking-[0.04em]">{copy.subtotal}</span>
                <span className="text-sm font-semibold" dir="ltr">
                  {money(subtotal)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-[0.04em]">{copy.taxes}</p>
                  {taxNote ? (
                    <p className={`mt-0.5 text-xs uppercase tracking-[0.04em] ${muted}`}>{taxNote}</p>
                  ) : null}
                </div>
                <p className="shrink-0 text-sm font-semibold" dir="ltr">
                  {taxAmount > 0
                    ? money(taxAmount)
                    : taxValue || money(0)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4 border-t border-current/10 pt-5">
              <span className={`text-base font-bold uppercase tracking-[0.08em] ${accent}`}>
                {copy.totalDue}
              </span>
              <p className="text-2xl font-bold tracking-wide" dir="ltr">
                {money(total)}
              </p>
            </div>

            <div className="mt-6">
              <Button
                variant="light-accent"
                className="w-full !rounded-[5px] !border-transparent uppercase hover:!border-transparent hover:!shadow-[0_3px_20px_0_var(--erythro-alpha-30,rgba(229,36,33,0.30))]"
                onClick={handleContinue}
              >
                {copy.continue}
              </Button>
            </div>

            <p className={`mt-4 flex items-center gap-2 text-xs ${muted}`}>
              <span aria-hidden>↺</span>
              {copy.guarantee}
            </p>
          </aside>
        </div>

        <div className="mt-12 md:mt-16">
          <ProjectNav
            locale={locale}
            theme={theme}
            kind={isAudit ? 'audit' : 'solutions'}
            prev={prev}
            next={next}
            showListLink={false}
          />
        </div>
      </main>

      {isAudit && (
        <AuditOrderModal
          isOpen={auditModalOpen}
          onClose={() => setAuditModalOpen(false)}
          plan={plan}
          locale={locale}
          totalFormatted={money(total)}
          formCopy={formCopy}
        />
      )}
    </>
  )
}

function OrderAccordionPlus({
  isOpen,
  isLight,
  size = 'md',
}: {
  isOpen: boolean
  isLight: boolean
  size?: 'sm' | 'md'
}) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
        isOpen
          ? isLight
            ? 'border-erythro-500 bg-erythro-500 text-white'
            : 'border-gold-500 bg-gold-500 text-coal-900'
          : isLight
            ? 'border-coal-900/10 bg-gold-100 text-coal-900 group-hover:border-erythro-500 group-hover:bg-erythro-500 group-hover:text-white'
            : 'border-white/15 bg-white/5 text-white group-hover:border-gold-500 group-hover:bg-gold-500 group-hover:text-coal-900'
      }`}
      aria-hidden
    >
      <svg
        className={`${icon} transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5V19M5 12H19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

type ModalStatus = 'idle' | 'sending' | 'success' | 'error'

function AuditOrderModal({
  isOpen,
  onClose,
  plan,
  locale,
  totalFormatted,
  formCopy,
}: {
  isOpen: boolean
  onClose: () => void
  plan: OrderPlan
  locale: string
  totalFormatted: string
  formCopy: AuditPageContent['form']
}) {
  const isRtl = locale === 'he'
  const titleId = useId()
  const errorId = useId()
  const firstFieldRef = useRef<HTMLInputElement | null>(null)

  const defaultAuditLanguage = (['en', 'ru', 'he'].includes(locale) ? locale : 'en') as AuditReportLanguage
  const [status, setStatus] = useState<ModalStatus>('idle')
  const [submitError, setSubmitError] = useState('')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [reportHref, setReportHref] = useState<string | null>(null)
  const [values, setValues] = useState<AuditFormValues>({
    name: '',
    email: '',
    website: '',
    auditLanguage: defaultAuditLanguage,
    phone: '',
  })
  const [fieldErrors, setFieldErrors] = useState<AuditFieldErrors>({})
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileHandle>(null)
  const [langSelectOpen, setLangSelectOpen] = useState(false)
  const langSelectRef = useRef<HTMLDivElement | null>(null)
  const {
    ok: fieldOk,
    checkingWebsite,
    onValueChange,
    blurName,
    blurEmail,
    blurPhone,
    blurWebsite,
    ensureWebsiteOk,
  } = useAuditFieldChecks(values, setFieldErrors)

  const planTitle = tLocale(plan.card.title, locale)
  const tForm = (field: Record<string, string>) => field[locale] || field.en

  useEffect(() => {
    setValues((v) => ({ ...v, auditLanguage: defaultAuditLanguage }))
  }, [defaultAuditLanguage])

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    if (!isOpen) return
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
  }, [isOpen, onClose])

  // Close language dropdown on click outside
  useEffect(() => {
    if (!langSelectOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!langSelectRef.current?.contains(event.target as Node)) setLangSelectOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [langSelectOpen])

  if (!isOpen) return null

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

  const handleLanguageChange = (lang: AuditReportLanguage) => {
    setValues((v) => ({ ...v, auditLanguage: lang }))
    setLangSelectOpen(false)
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

  const validateForm = (): AuditFieldErrors => validateAuditForm(values)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return

    const nextErrors = validateForm()
    setFieldErrors(nextErrors)
    if (!privacyConsent) setConsentError(true)
    else setConsentError(false)

    if (hasAuditFieldErrors(nextErrors) || !privacyConsent) return
    if (isTurnstileSiteKeyConfigured() && !turnstileToken) {
      setSubmitError(tForm(contactForm.captchaFailed))
      setStatus('error')
      return
    }

    const websiteOk = await ensureWebsiteOk()
    if (!websiteOk) return

    const honeypot =
      (e.currentTarget.elements.namedItem(CONTACT_HONEYPOT_FIELD) as HTMLInputElement | null)?.value ?? ''

    const orderMessage = buildAuditOrderMessage({
      planTitle,
      planSlug: plan.slug,
      website: values.website,
      auditLanguage: values.auditLanguage,
      totalFormatted,
    })

    setStatus('sending')
    setSubmitError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...buildAuditContactPayload({
            values,
            locale,
            honeypot,
            message: orderMessage,
            planSlug: plan.slug,
            planTotal: totalFormatted,
          }),
          [TURNSTILE_TOKEN_FIELD]: turnstileToken,
        }),
      })
      if (res.status === 429) {
        const errPayload = (await res.json().catch(() => null)) as { message?: string } | null
        setSubmitError(errPayload?.message || tForm(contactForm.rateLimited))
        setStatus('error')
        return
      }
      if (!res.ok) {
        const errPayload = (await res.json().catch(() => null)) as { message?: string } | null
        setSubmitError(
          res.status === 403
            ? tForm(contactForm.captchaFailed)
            : errPayload?.message || tForm(contactForm.error),
        )
        setStatus('error')
        return
      }
      const payload = (await res.json().catch(() => null)) as {
        submissionId?: number | string
        orderId?: string
      } | null
      const sid = payload?.submissionId
      setOrderId(payload?.orderId || (sid != null ? `AUD-${sid}` : null))
      setReportHref(sid != null ? `/audit/report/${sid}` : null)
      setStatus('success')
    } catch {
      setSubmitError(tForm(contactForm.error))
      setStatus('error')
    } finally {
      turnstileRef.current?.reset()
    }
  }

  const isLight = false
  const pillFieldClass = formPillFieldClass(isLight)
  const fieldLabelClass = 'text-white/60'

  const modalTitle =
    locale === 'ru'
      ? `Оформление заказа: ${planTitle}`
      : locale === 'he'
        ? `ביצוע הזמנה: ${planTitle}`
        : `Order Checkout: ${planTitle}`

  const submitLabel =
    status === 'sending'
      ? tForm(contactForm.sending)
      : locale === 'ru'
        ? 'Оформить заказ'
        : locale === 'he'
          ? 'שליחת הזמנה'
          : 'Submit Order'

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden p-4 sm:p-6"
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label={tForm(contactForm.close)}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm"
      />

      <div className="relative max-h-[90vh] min-w-0 w-full max-w-[620px] overflow-hidden rounded-[12px] border border-white/10 bg-coal-900 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={onClose}
          aria-label={tForm(contactForm.close)}
          className="absolute top-4 end-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4 4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <div className="faq-accordion-scroll max-h-[90vh] min-w-0 w-full overflow-x-hidden overflow-y-auto p-5 sm:p-8">

        {status === 'success' ? (
          <div className="py-8 text-center" role="status" aria-live="polite">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="mb-2 font-sans text-xl font-bold uppercase tracking-[0.04em] text-white">
              {locale === 'ru' ? 'Заказ оформлен!' : locale === 'he' ? 'ההזמנה התקבלה!' : 'Order received!'}
            </h2>
            <p className="mx-auto max-w-[420px] text-sm text-white/80 leading-6">
              {tAudit(formCopy.success, locale)}
            </p>
            {orderId ? (
              <p className="mx-auto mt-3 max-w-[420px] text-sm text-white/80">
                <span className="text-gold-500">
                  {locale === 'ru' ? 'ID заказа' : locale === 'he' ? 'מספר הזמנה' : 'Order ID'}:
                </span>{' '}
                <code className="font-mono tracking-wide text-white">{orderId}</code>
              </p>
            ) : null}
            {reportHref ? (
              <a
                href={reportHref}
                className="mt-4 inline-flex rounded-[40px] border border-gold-500 px-8 py-3 text-sm uppercase tracking-widest text-gold-500 transition-colors hover:bg-gold-500 hover:text-coal-900"
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
                setOrderId(null)
                setReportHref(null)
                onClose()
              }}
              className="mt-6 rounded-[40px] border border-gold-500 px-8 py-3 text-sm uppercase tracking-widest text-gold-500 transition-colors hover:bg-gold-500 hover:text-coal-900"
            >
              {tForm(contactForm.close)}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <span className="inline-flex rounded-full bg-erythro-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-erythro-500">
                {planTitle} · {totalFormatted}
              </span>
              <h2
                id={titleId}
                className="mt-2 font-sans text-xl font-bold uppercase tracking-[0.04em] text-white sm:text-2xl"
              >
                {modalTitle}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <fieldset
                disabled={status === 'sending'}
                className={`m-0 flex min-w-0 max-w-full flex-col gap-4 border-0 p-0 ${
                  status === 'sending' ? 'opacity-70' : ''
                }`}
              >
                <ContactHoneypotField idPrefix="audit-order-modal" />

                <div className="flex flex-col gap-1.5">
                  <FormPillShell
                    isLight={isLight}
                    clip
                    hasError={Boolean(fieldErrors.name || fieldErrors.email)}
                  >
                    <div className="relative min-w-0 flex-1">
                      <label htmlFor="audit-order-name" className="sr-only">
                        {tForm(contactForm.name)}
                      </label>
                      <input
                        ref={firstFieldRef}
                        id="audit-order-name"
                        name="name"
                        type="text"
                        required
                        value={values.name}
                        onChange={handleChange}
                        onBlur={blurName}
                        placeholder={requiredPlaceholder(tForm(contactForm.name))}
                        className={`${pillFieldClass} ${fieldOk.name ? 'pe-10' : 'pe-4'}`}
                        autoComplete="name"
                        autoCapitalize="words"
                        aria-required="true"
                        aria-invalid={Boolean(fieldErrors.name) || undefined}
                      />
                      <FieldOkCheck show={Boolean(fieldOk.name)} />
                    </div>
                    <FormPillDivider isLight={isLight} />
                    <div
                      className={`relative min-w-0 flex-1 border-t sm:border-t-0 ${
                        isLight ? 'border-coal-900/15' : 'border-white/15'
                      }`}
                    >
                      <label htmlFor="audit-order-email" className="sr-only">
                        {tForm(contactForm.email)}
                      </label>
                      <input
                        id="audit-order-email"
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
                        dir="ltr"
                        aria-required="true"
                        aria-invalid={Boolean(fieldErrors.email) || undefined}
                      />
                      <FieldOkCheck show={Boolean(fieldOk.email)} />
                    </div>
                  </FormPillShell>
                  {fieldErrors.name ? (
                    <p role="alert" className="m-0 text-sm text-erythro-500">
                      {tForm(contactForm.fieldRequired)}
                    </p>
                  ) : null}
                  {fieldErrors.email ? (
                    <p role="alert" className="m-0 text-sm text-erythro-500">
                      {fieldErrors.email === 'invalid'
                        ? tForm(contactForm.emailInvalid)
                        : tForm(contactForm.fieldRequired)}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <FormPillShell isLight={isLight} clip hasError={Boolean(fieldErrors.website)}>
                    <div className="relative min-w-0 flex-1">
                      <label htmlFor="audit-order-website" className="sr-only">
                        {tAudit(formCopy.website, locale)}
                      </label>
                      <input
                        id="audit-order-website"
                        name="website"
                        type="url"
                        inputMode="url"
                        required
                        value={values.website}
                        onChange={handleChange}
                        onBlur={blurWebsite}
                        placeholder={requiredPlaceholder(tAudit(formCopy.website, locale))}
                        className={`${pillFieldClass} ${fieldOk.website || checkingWebsite ? 'pe-10' : 'pe-4'}`}
                        autoComplete="url"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        dir="ltr"
                        aria-required="true"
                        aria-invalid={Boolean(fieldErrors.website) || undefined}
                      />
                      <FieldOkCheck show={Boolean(fieldOk.website)} checking={checkingWebsite} />
                    </div>
                  </FormPillShell>
                  {fieldErrors.website ? (
                    <p role="alert" className="m-0 text-sm text-erythro-500">
                      {fieldErrors.website === 'invalid'
                        ? tAudit(formCopy.websiteInvalid, locale)
                        : fieldErrors.website === 'unreachable'
                          ? tAuditWebsiteUnreachable(formCopy.websiteUnreachable, locale)
                          : tForm(contactForm.fieldRequired)}
                    </p>
                  ) : null}
                </div>

                <div className="relative z-20 flex flex-col gap-1.5">
                  <FormPillShell
                    isLight={isLight}
                    hasError={Boolean(fieldErrors.auditLanguage || fieldErrors.phone)}
                  >
                    <div ref={langSelectRef} className="relative min-w-0 flex-1">
                      <label htmlFor="audit-order-language" className="sr-only">
                        {tAudit(formCopy.auditLanguage, locale)}
                      </label>
                      <button
                        id="audit-order-language"
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={langSelectOpen}
                        onClick={() => setLangSelectOpen((c) => !c)}
                        className={`${pillFieldClass} cursor-pointer pe-10 text-start`}
                      >
                        {tAudit(formCopy.auditLanguageOptions[values.auditLanguage], locale)}
                      </button>
                      <svg
                        className={`pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50 ${
                          langSelectOpen ? 'rotate-180' : ''
                        }`}
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
                      {langSelectOpen ? (
                        <ul
                          role="listbox"
                          className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-[16px] bg-coal-500 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                        >
                          {AUDIT_REPORT_LANGUAGES.map((lang) => {
                            const selected = lang === values.auditLanguage
                            return (
                              <li key={lang} role="presentation">
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={selected}
                                  onClick={() => handleLanguageChange(lang)}
                                  className={`flex w-full cursor-pointer items-center px-4 py-2.5 text-start text-sm transition-colors ${
                                    selected ? 'text-gold-500' : 'text-white'
                                  } hover:bg-gold-500 hover:text-coal-900`}
                                >
                                  {tAudit(formCopy.auditLanguageOptions[lang], locale)}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      ) : null}
                    </div>
                    <FormPillDivider isLight={isLight} />
                    <PhoneE164Field
                      id="audit-order-phone"
                      locale={locale}
                      value={values.phone}
                      onChange={handlePhoneChange}
                      onBlur={blurPhone}
                      showOk={Boolean(fieldOk.phone)}
                      invalid={Boolean(fieldErrors.phone)}
                      describedBy={fieldErrors.phone ? 'audit-order-phone-error' : undefined}
                      placeholder={requiredPlaceholder(tForm(contactForm.phone))}
                      variant="pill"
                      split
                      isLight={isLight}
                    />
                  </FormPillShell>
                  {fieldErrors.auditLanguage ? (
                    <p role="alert" className="m-0 text-sm text-erythro-500">
                      {tForm(contactForm.fieldRequired)}
                    </p>
                  ) : null}
                  {fieldErrors.phone ? (
                    <p id="audit-order-phone-error" role="alert" className="m-0 text-sm text-erythro-500">
                      {fieldErrors.phone === 'invalid'
                        ? tForm(contactForm.phoneInvalid)
                        : tForm(contactForm.fieldRequired)}
                    </p>
                  ) : null}
                </div>

                <p className={`m-0 px-1 text-xs ${fieldLabelClass}`}>
                  <span className="text-erythro-500" aria-hidden="true">
                    *
                  </span>
                  {' — '}
                  {tForm(contactForm.fieldRequired)}
                </p>

                <ContactPrivacyConsent
                  locale={locale}
                  theme="dark"
                  idPrefix="audit-order-modal"
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
                  action="audit"
                  theme="dark"
                  locale={locale}
                  onToken={setTurnstileToken}
                />

                {status === 'error' ? (
                  <p id={errorId} role="alert" className="m-0 text-sm text-erythro-500">
                    {submitError || tForm(contactForm.error)}
                  </p>
                ) : null}

                <div className="pt-1">
                  <button type="submit" disabled={status === 'sending'} className={FORM_SUBMIT_CLASS}>
                    {status === 'sending' ? (
                      <>
                        <ContactSendSpinner className="h-[18px] w-[18px] shrink-0" />
                        <span>{tForm(contactForm.sending)}</span>
                      </>
                    ) : (
                      submitLabel
                    )}
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
