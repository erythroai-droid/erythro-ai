'use client'

import React, { useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import FooterSection from '@/components/FooterSection'
import { AccessibilityPanel } from '@/components/accessibility'
import CookieConsent from '@/components/CookieConsent'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import { ContactModalProvider } from '@/components/ContactModal'
import LetsTalkSection from '@/components/LetsTalkSection'
import WhatsAppButton from '@/components/WhatsAppButton'
import HeaderChipStrip from '@/components/HeaderChipStrip'
import AboutBody from '@/components/about/AboutBody'
import type { SiteContent } from '@/lib/defaultContent'
import { useSitePrefs } from '@/hooks/useSitePrefs'

interface AboutClientProps {
  initialLocale: string
  initialTheme?: 'light' | 'dark'
  content: SiteContent
}

export default function AboutClient({ initialLocale, initialTheme, content }: AboutClientProps) {
  const a11yTranslations = content.accessibility
  const { locale, setLocale, theme, setTheme } = useSitePrefs(initialLocale, 'dark', initialTheme)
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

  const a11yTargets = useMemo(
    () => [
      { id: 'about-page', label: pickA11y(a11yTranslations.screenReaderDetails) },
      { id: 'contacts', label: pickA11y(a11yTranslations.screenReaderContacts) },
      { id: 'footer', label: pickA11y(a11yTranslations.screenReaderFooter) },
    ],
    [locale],
  )

  return (
    <SiteContentProvider value={content}>
      <ContactModalProvider locale={locale}>
        <div
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          className={`relative min-h-screen font-sans transition-colors duration-500 ${
            theme === 'light' ? 'bg-gold-100' : 'bg-coal-900'
          }`}
        >
          <div className="relative z-10 lg:contents">
            <HeaderChipStrip page="legal" />
          </div>
          <Navbar
            locale={locale}
            setLocale={setLocale}
            theme={theme}
            setTheme={setTheme}
            onAccessibilityClick={() => setIsAccessibilityOpen(true)}
          />
          <AboutBody locale={locale} theme={theme} />
          <LetsTalkSection locale={locale} theme={theme} />
          <FooterSection locale={locale} theme={theme} />
          <WhatsAppButton locale={locale} />
          <CookieConsent locale={locale} theme={theme} />
          <AccessibilityPanel
            isOpen={isAccessibilityOpen}
            onClose={() => setIsAccessibilityOpen(false)}
            locale={locale}
            labels={a11yLabels}
            targets={a11yTargets}
          />
        </div>
      </ContactModalProvider>
    </SiteContentProvider>
  )
}
