'use client'

import React, { useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import FooterSection from '@/components/FooterSection'
import { AccessibilityPanel } from '@/components/accessibility'
import CookieConsent from '@/components/CookieConsent'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import { ContactModalProvider, useContactModal } from '@/components/ContactModal'
import Button from '@/components/Button'
import WhatsAppButton from '@/components/WhatsAppButton'
import HeaderChipStrip from '@/components/HeaderChipStrip'
import type { SiteContent } from '@/lib/defaultContent'
import {
  ADDON_TERM_MONTHS,
  addonTermDiscount,
  calcAddonAmount,
  calcPlanAmount,
  calcTaxAmount,
  formatPrice,
  tLocale,
  type AddonTermMonths,
  type OrderPlan,
} from '@/lib/orderPlans'
import { isLexicalDoc, lexicalToPlain, resolveLexical } from '@/lib/lexical'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { useSitePrefs } from '@/hooks/useSitePrefs'

interface OrderClientProps {
  initialLocale: string
  initialTheme?: 'light' | 'dark'
  content: SiteContent
  plan: OrderPlan
}

export default function OrderClient({ initialLocale, initialTheme, content, plan }: OrderClientProps) {
  const a11yTranslations = content.accessibility
  const { locale, setLocale, theme, setTheme } = useSitePrefs(initialLocale, 'light', initialTheme)
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
              <OrderCheckout plan={plan} locale={locale} theme={theme} />
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

          <WhatsAppButton />
        </div>
      </ContactModalProvider>
    </SiteContentProvider>
  )
}

function OrderCheckout({
  plan,
  locale,
  theme,
}: {
  plan: OrderPlan
  locale: string
  theme: 'light' | 'dark'
}) {
  const { open: openContact } = useContactModal()
  const isLight = theme === 'light'
  const [periodId, setPeriodId] = useState(plan.defaultPeriodId || plan.periods[0]?.id || '')
  const [selectedAddons, setSelectedAddons] = useState<string[]>(
    plan.addons.filter((a) => a.recommended || a.mandatory).map((a) => a.id),
  )
  const [addonTermMonths, setAddonTermMonths] = useState<Record<string, AddonTermMonths>>(() => {
    const initial: Record<string, AddonTermMonths> = {}
    for (const addon of plan.addons) initial[addon.id] = 1
    return initial
  })
  const [openFeatureIndex, setOpenFeatureIndex] = useState<number | null>(null)
  const [includesOpen, setIncludesOpen] = useState(false)

  const title = tLocale(plan.card.title, locale)
  const subtitle = tLocale(plan.subtitle, locale).trim()
  const pricing = calcPlanAmount(plan, periodId)
  const period = plan.periods.find((p) => p.id === periodId) || plan.periods[0]
  const money = (amount: number) => formatPrice(amount, locale, plan.card.currency)

  const featureRows = plan.card.features
    .map((feature, index) => {
      const label = tLocale(feature.label, locale).trim()
      const value = tLocale(feature.value, locale).trim()
      const plainFull = tLocale(feature.full, locale).trim()
      const richDoc = resolveLexical(feature.fullRich, locale, plainFull || null)
      const hasDesc = Boolean(richDoc && lexicalToPlain(richDoc)) || Boolean(plainFull)
      if (!label && !value && !hasDesc) return null
      return { index, label, value, richDoc, plainFull, hasDesc }
    })
    .filter(Boolean) as Array<{
    index: number
    label: string
    value: string
    richDoc: ReturnType<typeof resolveLexical>
    plainFull: string
    hasDesc: boolean
  }>

  const selectedAddonPricing = plan.addons
    .filter((a) => selectedAddons.includes(a.id))
    .map((addon) => {
      // Mandatory add-ons have no term picker — always bill 1× monthly price
      const months: AddonTermMonths = addon.mandatory ? 1 : addonTermMonths[addon.id] || 1
      const discount = addon.mandatory ? 0 : addonTermDiscount(addon, months)
      const amounts = calcAddonAmount(addon.price, months, discount)
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
    continue:
      locale === 'ru'
        ? 'Отправить заказ'
        : locale === 'he'
          ? 'שלח הזמנה'
          : 'Submit order',
    guarantee:
      locale === 'ru'
        ? 'Гарантия возврата — обсуждается индивидуально'
        : locale === 'he'
          ? 'אחריות להחזר — לדיון פרטני'
          : 'Money-back terms — discussed individually',
    savings: locale === 'ru' ? 'Экономия' : locale === 'he' ? 'חיסכון' : 'Save',
    recommended: locale === 'ru' ? 'Рекомендуем' : locale === 'he' ? 'מומלץ' : 'Recommended',
    perMonth: locale === 'ru' ? '/мес' : locale === 'he' ? '/חודש' : '/mo',
    includes:
      locale === 'ru'
        ? 'Что входит в разработку'
        : locale === 'he'
          ? 'מה כלול בפיתוח'
          : "What's included in development",
  }

  const toggleAddon = (id: string) => {
    if (plan.addons.some((addon) => addon.id === id && addon.mandatory)) return

    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleContinue = () => {
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
    openContact()
  }

  const cardCls = isLight
    ? 'bg-white border border-coal-900/10 shadow-[0_8px_30px_rgba(13,13,13,0.06)]'
    : 'bg-coal-800 border border-white/10'
  const muted = isLight ? 'text-gold-900' : 'text-gold-800'

  return (
    <main
      id="order-main"
      className="relative z-10 mx-auto w-full max-w-[1170px] px-[30px] pb-16 pt-8 lg:pb-24 lg:pt-12"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Plan card */}
          <section className={`rounded-[10px] p-6 md:p-8 ${cardCls}`}>
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px] bg-erythro-500">
                <img
                  src="/images/icons/cloud_sql.svg"
                  alt=""
                  width={22}
                  height={22}
                  className="size-[22px]"
                  aria-hidden
                />
              </div>
              <div>
                <h1 className="font-sans text-xl font-bold uppercase tracking-[0.04em] md:text-2xl">
                  {title}
                </h1>
                {subtitle ? <p className={`mt-1 text-sm ${muted}`}>{subtitle}</p> : null}
              </div>
            </div>

            {plan.periods.length > 0 ? (
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <label className="flex w-full flex-col gap-2 md:max-w-[280px]">
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

                <div className="flex shrink-0 flex-col items-end gap-2" dir="ltr">
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

            {(() => {
              const plainIncludes = tLocale(plan.includes, locale).trim()
              const includesDoc = resolveLexical(plan.includesRich, locale, plainIncludes || null)
              const hasIncludes =
                Boolean(includesDoc && lexicalToPlain(includesDoc)) || Boolean(plainIncludes)
              if (!featureRows.length && !hasIncludes) return null

              const titleClass = `min-w-0 text-sm leading-6 ${
                isLight ? 'text-coal-900/85' : 'text-white/85'
              }`
              const rowBtnClass = `group flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 px-6 py-3 text-start transition-colors duration-300 md:px-8 ${
                isLight ? 'hover:bg-erythro-500/5' : 'hover:bg-gold-500/10'
              }`

              return (
                <div className="mt-6 -mx-6 flex flex-col border-t border-current/10 md:-mx-8">
                  {featureRows.map((row) => {
                    const isOpen = openFeatureIndex === row.index
                    const title = (
                      <>
                        {row.label ? <span className="font-semibold">{row.label} </span> : null}
                        {row.value ? <span>{row.value}</span> : null}
                        {!row.label && !row.value ? (
                          <span>{row.plainFull.slice(0, 80)}</span>
                        ) : null}
                      </>
                    )

                    if (!row.hasDesc) {
                      return (
                        <div
                          key={row.index}
                          className="flex min-h-14 items-center justify-between gap-4 border-b border-current/10 px-6 py-3 md:px-8"
                        >
                          <p className={`m-0 ${titleClass}`}>{title}</p>
                          <span className="h-8 w-8 shrink-0" aria-hidden />
                        </div>
                      )
                    }

                    return (
                      <div key={row.index} className="border-b border-current/10">
                        <button
                          type="button"
                          onClick={() => setOpenFeatureIndex(isOpen ? null : row.index)}
                          className={rowBtnClass}
                          aria-expanded={isOpen}
                          aria-controls={`order-feature-${row.index}`}
                        >
                          <span className={titleClass}>{title}</span>
                          <OrderAccordionPlus isOpen={isOpen} isLight={isLight} size="sm" />
                        </button>
                        <div
                          id={`order-feature-${row.index}`}
                          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div
                              className={`feature-full-desc px-6 pb-3 text-xs leading-5 md:px-8 [&_:is(h1,h2,h3,h4,h5,h6,p)]:m-0 [&_p+_p]:mt-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:ps-4 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:ps-4 [&_li]:my-0.5 [&_a]:underline [&_strong]:font-semibold [&_em]:italic ${muted}`}
                            >
                              {row.richDoc && isLexicalDoc(row.richDoc) ? (
                                <RichText data={row.richDoc as never} />
                              ) : (
                                <p>{row.plainFull}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {hasIncludes ? (
                    <div>
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
                            className={`order-includes px-6 pb-3 text-sm leading-6 md:px-8 [&_:is(h1,h2,h3,h4,h5,h6,p)]:m-0 [&_p+_p]:mt-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:my-1 [&_a]:underline [&_strong]:font-semibold [&_em]:italic ${
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
                </div>
              )
            })()}
          </section>

          {/* Add-ons */}
          {plan.addons.map((addon) => {
            const checked = selectedAddons.includes(addon.id)
            const isMandatory = Boolean(addon.mandatory)
            const note = tLocale(addon.note, locale).trim()
            const description = tLocale(addon.description, locale).trim()
            const months: AddonTermMonths = isMandatory ? 1 : addonTermMonths[addon.id] || 1
            const discount = isMandatory ? 0 : addonTermDiscount(addon, months)
            const amounts = calcAddonAmount(addon.price, months, discount)
            const badgeCls =
              'inline-flex w-fit shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]'
            return (
              <section key={addon.id} className={`rounded-[10px] p-6 md:p-7 ${cardCls}`}>
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

                <div className="mt-5 flex items-start justify-between gap-4 border-t border-current/10 pt-5">
                  <span className="text-sm font-bold uppercase tracking-[0.04em]">
                    {copy.addonTotal}
                  </span>
                  <div className="flex flex-col items-end gap-2" dir="ltr">
                    {amounts.savings > 0 ? (
                      <span className={`text-sm leading-5 line-through opacity-50 ${muted}`}>
                        {money(amounts.list)}
                      </span>
                    ) : null}
                    <span className="text-base font-semibold leading-5">{money(amounts.final)}</span>
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
    </main>
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
