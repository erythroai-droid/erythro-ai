'use client'

import React, { useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import FooterSection from '@/components/FooterSection'
import { AccessibilityPanel } from '@/components/accessibility'
import CookieConsent from '@/components/CookieConsent'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import { ContactModalProvider } from '@/components/ContactModal'
import LetsTalkSection from '@/components/LetsTalkSection'
import ChatButton from '@/components/ChatButton'
import HeaderChipStrip from '@/components/HeaderChipStrip'
import ContactsBody from '@/components/contacts/ContactsBody'
import type { SiteContent } from '@/lib/defaultContent'
import { useSitePrefs } from '@/hooks/useSitePrefs'

interface ContactsClientProps {
  initialLocale: string
  initialTheme?: 'light' | 'dark'
  content: SiteContent
}

export default function ContactsClient({
  initialLocale,
  initialTheme,
  content,
}: ContactsClientProps) {
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
      { id: 'contacts-page', label: pickA11y(a11yTranslations.screenReaderContacts) },
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
            <HeaderChipStrip page="contacts" />
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

          <div className="relative z-20 -mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:mt-0 lg:contents">
            <div>
              <ContactsBody locale={locale} theme={theme} />
            </div>
          </div>

          <div className="relative z-30 -mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:mt-0 lg:contents">
            <LetsTalkSection locale={locale} variant="simple" />
          </div>

          <div className="relative z-40 -mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:mt-0 lg:contents">
            <FooterSection locale={locale} theme={theme} pinSpacer={false} />
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
          <ChatButton locale={locale} />
        </div>
      </ContactModalProvider>
    </SiteContentProvider>
  )
}
