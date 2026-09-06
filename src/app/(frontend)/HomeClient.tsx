'use client'

import React, { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import { ContactModalProvider } from '@/components/ContactModal'
import type { SiteContent } from '@/lib/defaultContent'
import { persistHomeScrollY } from '@/lib/splash'
import { useSitePrefs } from '@/hooks/useSitePrefs'
import { waitForPostLcpMotion } from '@/lib/lcpGate'

/**
 * Below-fold + chrome — code-split and only mount after LCP/idle (PIT-061).
 * Keeps GSAP-heavy sections off the TBT window. ssr:false so their chunks are
 * not forced into the initial hydration graph.
 */
const CaseStudiesSection = dynamic(() => import('@/components/CaseStudiesSection'), {
  ssr: false,
})
const ServicesSection = dynamic(() => import('@/components/ServicesSection'), {
  ssr: false,
})
const SolutionSection = dynamic(() => import('@/components/SolutionSection'), {
  ssr: false,
})
const FAQSection = dynamic(() => import('@/components/FAQSection'), {
  ssr: false,
})
const FooterSection = dynamic(() => import('@/components/FooterSection'), {
  ssr: false,
})
const ChatButton = dynamic(() => import('@/components/ChatButton'), {
  ssr: false,
})
const ScrollSideButton = dynamic(
  () => import('@/components/portfolio/ScrollSideButton'),
  { ssr: false },
)
const AccessibilityPanel = dynamic(
  () =>
    import('@/components/accessibility').then((m) => m.AccessibilityPanel),
  { ssr: false },
)
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), {
  ssr: false,
})

interface HomeClientProps {
  initialLocale: string
  initialTheme?: 'light' | 'dark'
  /** ISR pages: hydrate locale/theme from storage after mount (no SSR cookies). */
  clientHydratePrefs?: boolean
  content: SiteContent
}

export default function HomeClient({
  initialLocale,
  initialTheme,
  clientHydratePrefs,
  content,
}: HomeClientProps) {
  const a11yTranslations = content.accessibility
  const { locale, setLocale, theme, setTheme } = useSitePrefs(
    initialLocale,
    'dark',
    initialTheme,
    clientHydratePrefs ? { clientHydratePrefs: true } : undefined,
  )
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const [loadBelowFold, setLoadBelowFold] = useState(false)

  useEffect(() => {
    const persist = () => persistHomeScrollY()
    window.addEventListener('pagehide', persist)
    window.addEventListener('beforeunload', persist)
    return () => {
      window.removeEventListener('pagehide', persist)
      window.removeEventListener('beforeunload', persist)
    }
  }, [])

  // After splash + LCP + idle — mount GSAP sections / chrome (TBT).
  useEffect(() => {
    let cancelled = false
    void waitForPostLcpMotion().then(() => {
      if (!cancelled) setLoadBelowFold(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const pickA11y = (field?: Record<string, string> | null) =>
    (field && (field[locale] || field.en)) || ''
  const faqA11yLabel =
    locale === 'ru'
      ? 'Раздел «Вопросы и ответы»'
      : locale === 'he'
        ? 'מדור שאלות נפוצות'
        : 'FAQ section'

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- locale drives pickA11y
    [locale],
  )

  const a11yTargets = useMemo(
    () => [
      { id: 'services', label: pickA11y(a11yTranslations.screenReaderServices) },
      { id: 'solutions', label: pickA11y(a11yTranslations.screenReaderSolutions) },
      { id: 'faq', label: faqA11yLabel },
      { id: 'contacts', label: pickA11y(a11yTranslations.screenReaderContacts) },
      { id: 'contacts-mobile', label: pickA11y(a11yTranslations.screenReaderContacts) },
      { id: 'footer', label: pickA11y(a11yTranslations.screenReaderFooter) },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [faqA11yLabel, locale],
  )

  const scrollSectionIds = useMemo(
    () => ['cases', 'services', 'contacts', 'solutions', 'faq', 'footer'],
    [],
  )

  return (
    <SiteContentProvider value={content}>
      <ContactModalProvider locale={locale}>
        <div
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          suppressHydrationWarning
          className={`min-h-screen font-sans transition-colors duration-500 bg-primary text-main ${
            locale === 'he' ? 'font-sans' : ''
          }`}
        >
          <HeroSection locale={locale} theme={theme} />

          <Navbar
            currentLocale={locale}
            setLocale={setLocale}
            theme={theme}
            setTheme={setTheme}
            onOpenAccessibility={() => {
              setLoadBelowFold(true)
              setIsAccessibilityOpen(true)
            }}
          />

          {loadBelowFold ? (
            <>
              <div className="relative z-10 -mt-8 rounded-t-[28px] shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:contents">
                <CaseStudiesSection locale={locale} />
              </div>

              <div className="relative z-20 -mt-8 rounded-t-[28px] shadow-[0_-12px_30px_rgba(0,0,0,0.28)] max-lg:pointer-events-none lg:contents">
                <ServicesSection locale={locale} theme={theme} />
              </div>

              <div className="relative z-30 -mt-24 overflow-hidden rounded-t-[28px] shadow-[0_-12px_30px_rgba(0,0,0,0.35)] lg:contents">
                <SolutionSection locale={locale} theme={theme} />
              </div>

              <div className="relative z-[35] -mt-8 overflow-hidden rounded-t-[28px] shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:contents">
                <FAQSection locale={locale} theme={theme} />
              </div>

              <div className="relative z-40 -mt-8 rounded-t-[28px] overflow-hidden shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:contents">
                <FooterSection locale={locale} theme={theme} />
              </div>

              <ScrollSideButton locale={locale} theme={theme} sectionIds={scrollSectionIds} />
              <ChatButton locale={locale} theme={theme} />

              <AccessibilityPanel
                isOpen={isAccessibilityOpen}
                onClose={() => setIsAccessibilityOpen(false)}
                labels={a11yLabels}
                screenReaderTargets={a11yTargets}
                rtl={locale === 'he'}
                showPoweredBy
              />

              <CookieConsent locale={locale} theme={theme} />
            </>
          ) : (
            // Reserve approximate below-fold space so late mount does not jump the fold as hard.
            <div className="min-h-[70vh] lg:min-h-[50vh]" aria-hidden />
          )}
        </div>
      </ContactModalProvider>
    </SiteContentProvider>
  )
}
