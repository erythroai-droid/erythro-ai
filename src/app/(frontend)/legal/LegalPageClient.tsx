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
import LegalBody from '@/components/legal/LegalBody'
import type { SiteContent } from '@/lib/defaultContent'
import { getLegalPage, type LegalPageId } from '@/lib/legalPages'
import { useSitePrefs } from '@/hooks/useSitePrefs'

interface LegalPageClientProps {
  initialLocale: string
  content: SiteContent
  pageId: LegalPageId
}

export default function LegalPageClient({
  initialLocale,
  content,
  pageId,
}: LegalPageClientProps) {
  const page = getLegalPage(pageId)
  const a11yTranslations = content.accessibility
  const { locale, setLocale, theme, setTheme } = useSitePrefs(initialLocale)
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
      { id: 'legal-body', label: pickA11y(a11yTranslations.screenReaderDetails) },
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

          <div className="relative z-10 pt-[72px] lg:pt-[100px]" data-menu-contrast={theme === 'light' ? 'light' : 'dark'}>
            <LegalBody page={page} locale={locale} theme={theme} />
          </div>

          <div className="relative z-30 -mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:mt-0 lg:contents">
            <LetsTalkSection locale={locale} variant="simple" />
          </div>

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
