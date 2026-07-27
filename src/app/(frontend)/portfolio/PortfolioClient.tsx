'use client'

import React, { useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import FooterSection from '@/components/FooterSection'
import { AccessibilityPanel } from '@/components/accessibility'
import CookieConsent from '@/components/CookieConsent'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import { ContactModalProvider } from '@/components/ContactModal'
import PortfolioSection from '@/components/portfolio/PortfolioSection'
import ScrollSideButton from '@/components/portfolio/ScrollSideButton'
import LetsTalkSection from '@/components/LetsTalkSection'
import WhatsAppButton from '@/components/WhatsAppButton'
import HeaderChipStrip from '@/components/HeaderChipStrip'
import type { SiteContent } from '@/lib/defaultContent'
import type { PortfolioProject } from '@/lib/portfolioProjects'
import { useSitePrefs } from '@/hooks/useSitePrefs'

interface PortfolioClientProps {
  initialLocale: string
  initialTheme?: 'light' | 'dark'
  content: SiteContent
  projects: PortfolioProject[]
}

export default function PortfolioClient({
  initialLocale,
  initialTheme,
  content,
  projects,
}: PortfolioClientProps) {
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
      { id: 'portfolio', label: pickA11y(a11yTranslations.screenReaderPortfolio) },
      { id: 'portfolio-grid', label: pickA11y(a11yTranslations.screenReaderProjects) },
      { id: 'contacts', label: pickA11y(a11yTranslations.screenReaderContacts) },
      { id: 'footer', label: pickA11y(a11yTranslations.screenReaderFooter) },
    ],
    [locale],
  )

  const scrollSectionIds = useMemo(() => ['portfolio', 'contacts', 'footer'], [])

  return (
    <SiteContentProvider value={content}>
      <ContactModalProvider locale={locale}>
        <div
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          className={`relative min-h-screen font-sans transition-colors duration-500 ${
            theme === 'light' ? 'bg-gold-100' : 'bg-coal-900'
          }`}
        >
          <HeaderChipStrip page="portfolio" />
          <Navbar
            currentLocale={locale}
            setLocale={setLocale}
            theme={theme}
            setTheme={setTheme}
            onOpenAccessibility={() => setIsAccessibilityOpen(true)}
            forceBurger
            headerContrast="auto"
          />

          {/*
            Mobile stack: rounded overlap. Desktop: lg:contents so GSAP pin
            (Let's Talk → Footer) works like Solutions on the home page.
            Top padding is outside the section so the chip header strip shows.
          */}
          <div className="relative z-10 pt-[150px] lg:contents">
            <div className="relative z-20 max-lg:-mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:pt-[150px]">
              <PortfolioSection theme={theme} locale={locale} projects={projects} />
            </div>
          </div>

          <div className="relative z-20 -mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:contents">
            <LetsTalkSection locale={locale} variant="simple" />
          </div>

          <ScrollSideButton label="Scroll" theme={theme} sectionIds={scrollSectionIds} />

          <div className="relative z-40 -mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:contents">
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

          <WhatsAppButton />
        </div>
      </ContactModalProvider>
    </SiteContentProvider>
  )
}
