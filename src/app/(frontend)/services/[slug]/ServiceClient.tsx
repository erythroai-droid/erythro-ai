'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import FooterSection from '@/components/FooterSection'
import { AccessibilityPanel } from '@/components/accessibility'
import CookieConsent from '@/components/CookieConsent'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import { ContactModalProvider } from '@/components/ContactModal'
import ServiceHero from '@/components/services/ServiceHero'
import ServiceBody from '@/components/services/ServiceBody'
import ScrollSideButton from '@/components/portfolio/ScrollSideButton'
import LetsTalkSection from '@/components/LetsTalkSection'
import WhatsAppButton from '@/components/WhatsAppButton'
import type { SiteContent } from '@/lib/defaultContent'
import { tLocale, type ServicePage } from '@/lib/servicePages'

const LOCALE_COOKIE = 'NEXT_LOCALE'

interface ServiceClientProps {
  initialLocale: string
  content: SiteContent
  service: ServicePage
}

export default function ServiceClient({ initialLocale, content, service }: ServiceClientProps) {
  const a11yTranslations = content.accessibility
  const [locale, setLocaleState] = useState(initialLocale)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
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
  const serviceTitle = tLocale(service.title, locale)

  const a11yLabels = useMemo(
    () => ({
      title: pickA11y(a11yTranslations.title),
      reset: pickA11y(a11yTranslations.reset),
      poweredBy: pickA11y(a11yTranslations.poweredBy),
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

  const a11yTargets = useMemo(
    () => [
      { id: 'service-hero', label: serviceTitle },
      { id: 'service-body', label: pickA11y(a11yTranslations.screenReaderDetails) },
      { id: 'contacts', label: pickA11y(a11yTranslations.screenReaderContacts) },
      { id: 'footer', label: pickA11y(a11yTranslations.screenReaderFooter) },
    ],
    [locale, serviceTitle],
  )

  const scrollSectionIds = useMemo(
    () => ['service-hero', 'service-body', 'contacts', 'footer'],
    [],
  )

  return (
    <SiteContentProvider value={content}>
      <ContactModalProvider locale={locale}>
        <div
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          className={`min-h-screen font-sans transition-colors duration-500 bg-primary text-main ${
            locale === 'he' ? 'font-sans' : ''
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

          <div className="relative z-10 lg:contents">
            <ServiceHero service={service} />
          </div>

          <div className="relative z-20 -mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:mt-0 lg:contents">
            <ServiceBody service={service} locale={locale} theme={theme} />
          </div>

          <div className="relative z-30 -mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:mt-0 lg:contents">
            <LetsTalkSection locale={locale} variant="simple" />
          </div>

          <ScrollSideButton label="Scroll" theme={theme} sectionIds={scrollSectionIds} />

          <div className="relative z-40 -mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:mt-0 lg:contents">
            <FooterSection locale={locale} theme={theme} />
          </div>

          <AccessibilityPanel
            isOpen={isAccessibilityOpen}
            onClose={() => setIsAccessibilityOpen(false)}
            labels={a11yLabels}
            screenReaderTargets={a11yTargets}
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
