'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import FooterSection from '@/components/FooterSection'
import { AccessibilityPanel } from '@/components/accessibility'
import CookieConsent from '@/components/CookieConsent'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import { ContactModalProvider, useContactModal } from '@/components/ContactModal'
import Button from '@/components/Button'
import WhatsAppButton from '@/components/WhatsAppButton'
import type { SiteContent } from '@/lib/defaultContent'
import {
  calcPlanAmount,
  featureLines,
  formatPrice,
  tLocale,
  type OrderPlan,
} from '@/lib/orderPlans'

const LOCALE_COOKIE = 'NEXT_LOCALE'

interface OrderClientProps {
  initialLocale: string
  content: SiteContent
  plan: OrderPlan
}

export default function OrderClient({ initialLocale, content, plan }: OrderClientProps) {
  const a11yTranslations = content.accessibility
  const [locale, setLocaleState] = useState(initialLocale)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)

  const setLocale = (next: string) => {
    setLocaleState(next)
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  }

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement
    root.lang = locale
    root.dir = locale === 'he' ? 'rtl' : 'ltr'
  }, [locale])

  const pickA11y = (field: Record<string, string>) => field[locale] || field.en

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
          className={`min-h-screen font-sans transition-colors duration-500 ${
            theme === 'light' ? 'bg-[#F4F1EC] text-coal-900' : 'bg-primary text-main'
          }`}
        >
          <Navbar
            currentLocale={locale}
            setLocale={setLocale}
            theme={theme}
            setTheme={setTheme}
            onOpenAccessibility={() => setIsAccessibilityOpen(true)}
            forceBurger
          />

          <OrderCheckout plan={plan} locale={locale} theme={theme} />

          <div className="relative z-40">
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
  const [periodId, setPeriodId] = useState(plan.defaultPeriodId)
  const [selectedAddons, setSelectedAddons] = useState<string[]>(
    plan.addons.filter((a) => a.recommended || a.mandatory).map((a) => a.id),
  )

  const title = tLocale(plan.card.title, locale)
  const subtitle = tLocale(plan.subtitle, locale)
  const features = featureLines(plan.card.features, locale)
  const pricing = calcPlanAmount(plan, periodId)
  const period = plan.periods.find((p) => p.id === periodId) || plan.periods[0]
  const money = (amount: number) => formatPrice(amount, locale, plan.card.currency)

  const addonTotal = plan.addons
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0)

  const total = pricing.base + addonTotal
  const listTotal = pricing.list + addonTotal

  const copy = {
    period: locale === 'ru' ? 'Период' : locale === 'he' ? 'תקופה' : 'Period',
    summary: locale === 'ru' ? 'Итог заказа' : locale === 'he' ? 'סיכום הזמנה' : 'Order summary',
    total: locale === 'ru' ? 'Всего' : locale === 'he' ? 'סה״כ' : 'Total',
    taxes: locale === 'ru' ? 'Налоги' : locale === 'he' ? 'מסים' : 'Taxes',
    included: locale === 'ru' ? 'Включено' : locale === 'he' ? 'כלול' : 'Included',
    continue:
      locale === 'ru'
        ? 'Отправить заказ'
        : locale === 'he'
          ? 'שלח הזמנה'
          : 'Send order',
    guarantee:
      locale === 'ru'
        ? 'Гарантия возврата — обсуждается индивидуально'
        : locale === 'he'
          ? 'אחריות להחזר — לדיון פרטני'
          : 'Money-back terms — discussed individually',
    savings: locale === 'ru' ? 'Экономия' : locale === 'he' ? 'חיסכון' : 'Save',
    recommended: locale === 'ru' ? 'Рекомендуем' : locale === 'he' ? 'מומלץ' : 'Recommended',
    perMonth: locale === 'ru' ? '/мес' : locale === 'he' ? '/חודש' : '/mo',
    renew:
      locale === 'ru'
        ? 'После оплаты свяжемся для старта и реквизитов.'
        : locale === 'he'
          ? 'אחרי התשלום ניצור קשר לתחילת העבודה ולפרטי תשלום.'
          : 'After payment we will contact you to start and confirm details.',
  }

  const toggleAddon = (id: string) => {
    if (plan.addons.some((addon) => addon.id === id && addon.mandatory)) return

    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleContinue = () => {
    const addonNames = plan.addons
      .filter((a) => selectedAddons.includes(a.id))
      .map((a) => tLocale(a.name, locale))
      .join(', ')
    const draft = [
      `Order: ${title}`,
      `Period: ${tLocale(period?.label, locale)}`,
      `Total: ${money(total)}`,
      addonNames ? `Add-ons: ${addonNames}` : null,
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
      className="relative z-10 mx-auto w-full max-w-[1170px] px-[30px] pb-16 pt-[110px] lg:pb-24 lg:pt-[130px]"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Plan card */}
          <section className={`rounded-[10px] p-6 md:p-8 ${cardCls}`}>
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-erythro-500/15 text-erythro-500">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 7h16v10H4V7Zm2 2v6h12V9H6Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div>
                <h1 className="font-sans text-xl font-bold uppercase tracking-[0.04em] md:text-2xl">
                  {title}
                </h1>
                <p className={`mt-1 text-sm ${muted}`}>{subtitle}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <label className="flex w-full flex-col gap-2 md:max-w-[280px]">
                <span className={`text-xs uppercase tracking-[0.16em] ${muted}`}>{copy.period}</span>
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

              <div className="flex flex-wrap items-center gap-3 md:justify-end" dir="ltr">
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
                </span>
                {pricing.savings > 0 ? (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                    {copy.savings} {money(pricing.savings)}
                  </span>
                ) : null}
              </div>
            </div>

            {plan.card.pricePrefix ? (
              <p className={`mt-2 text-xs ${muted}`}>
                {tLocale(plan.card.pricePrefix, locale)} {money(pricing.base)}
              </p>
            ) : null}

            <p className={`mt-4 text-xs leading-5 ${muted}`}>{copy.renew}</p>

            {plan.promo ? (
              <div className="mt-5 flex items-start gap-3 rounded-[10px] border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                <span className="mt-0.5 text-emerald-500" aria-hidden>
                  ✓
                </span>
                <p>{tLocale(plan.promo, locale)}</p>
              </div>
            ) : null}

            <ul className="mt-6 flex flex-col gap-2.5 border-t border-current/10 pt-6">
              {features.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm leading-6">
                  <span className="mt-2 h-1 w-1 shrink-0 rotate-45 bg-erythro-500" />
                  <span className={isLight ? 'text-coal-900/85' : 'text-white/85'}>{line}</span>
                </li>
              ))}
            </ul>

            {plan.card.disclaimer ? (
              <p className={`mt-4 text-[11px] ${muted}`}>{tLocale(plan.card.disclaimer, locale)}</p>
            ) : null}
          </section>

          {/* Add-ons */}
          {plan.addons.map((addon) => {
            const checked = selectedAddons.includes(addon.id)
            const isMandatory = Boolean(addon.mandatory)
            const note = tLocale(addon.note, locale).trim()
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
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-sans text-base font-bold uppercase tracking-[0.04em]">
                        {tLocale(addon.name, locale)}
                      </h2>
                      {addon.recommended ? (
                        <span className="rounded-full bg-erythro-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-erythro-500">
                          {copy.recommended}
                        </span>
                      ) : null}
                    </div>
                    <p className={`mt-2 text-sm leading-6 ${muted}`}>
                      {tLocale(addon.description, locale)}
                    </p>
                    {note ? (
                      <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                        {note}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-semibold" dir="ltr">
                    {money(addon.price)}
                  </p>
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
          <h2 className="mb-5 font-sans text-lg font-bold uppercase tracking-[0.06em]">
            {copy.summary}
          </h2>

          <ul className="flex flex-col gap-4 border-b border-current/10 pb-5">
            <li className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className={`text-xs ${muted}`}>{tLocale(period?.label, locale)}</p>
              </div>
              <div className="text-end text-sm" dir="ltr">
                {pricing.savings > 0 ? (
                  <p className={`text-xs line-through opacity-50`}>{money(pricing.list)}</p>
                ) : null}
                <p className="font-semibold">{money(pricing.base)}</p>
              </div>
            </li>

            {plan.addons
              .filter((a) => selectedAddons.includes(a.id))
              .map((addon) => (
                <li key={addon.id} className="flex items-start justify-between gap-4 text-sm">
                  <p>{tLocale(addon.name, locale)}</p>
                  <p className="shrink-0 font-semibold" dir="ltr">
                    {money(addon.price)}
                  </p>
                </li>
              ))}

            <li className={`flex items-center justify-between text-sm ${muted}`}>
              <span>{copy.taxes}</span>
              <span>{copy.included}</span>
            </li>
          </ul>

          <div className="mt-5 flex items-end justify-between gap-4">
            <span className="text-base font-bold uppercase tracking-[0.08em]">{copy.total}</span>
            <div className="text-end" dir="ltr">
              {listTotal > total ? (
                <p className={`text-xs line-through opacity-50`}>{money(listTotal)}</p>
              ) : null}
              <p className="text-2xl font-bold tracking-wide">{money(total)}</p>
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="light-accent"
              className="w-full !rounded-[10px] !border-transparent uppercase hover:!border-transparent hover:!shadow-[0_3px_20px_0_var(--erythro-alpha-30,rgba(229,36,33,0.30))]"
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
