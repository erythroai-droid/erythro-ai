'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import CaseStudiesSection from '@/components/CaseStudiesSection'
import ServicesSection from '@/components/ServicesSection'
import SolutionSection from '@/components/SolutionSection'
import FAQSection from '@/components/FAQSection'
import FooterSection from '@/components/FooterSection'
import WhatsAppButton from '@/components/WhatsAppButton'
import ChatButton from '@/components/ChatButton'
import ScrollSideButton from '@/components/portfolio/ScrollSideButton'
import { AccessibilityPanel } from '@/components/accessibility'
import CookieConsent from '@/components/CookieConsent'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import { ContactModalProvider } from '@/components/ContactModal'
import type { SiteContent } from '@/lib/defaultContent'
import { persistHomeScrollY } from '@/lib/splash'
import { useSitePrefs } from '@/hooks/useSitePrefs'

interface HomeClientProps {
  initialLocale: string
  initialTheme?: 'light' | 'dark'
  content: SiteContent
}

export default function HomeClient({ initialLocale, initialTheme, content }: HomeClientProps) {
  const a11yTranslations = content.accessibility
  const { locale, setLocale, theme, setTheme } = useSitePrefs(initialLocale, 'dark', initialTheme)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)

  // Persist scroll before unload so a mid-page refresh can use the quick splash
  // and restore ScrollTrigger pins at the right place.
  useEffect(() => {
    const persist = () => persistHomeScrollY()
    window.addEventListener('pagehide', persist)
    window.addEventListener('beforeunload', persist)
    return () => {
      window.removeEventListener('pagehide', persist)
      window.removeEventListener('beforeunload', persist)
    }
  }, [])

  // Resolve accessibility panel strings for the active locale. The panel
  // module itself is locale-agnostic; the app supplies the translated labels.
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
      className={`min-h-screen font-sans transition-colors duration-500 bg-primary text-main ${
        locale === 'he' ? 'font-sans' : ''
      }`}
    >
      {/* Hero Section with WordStack */}
      <HeroSection locale={locale} theme={theme} />

      {/*
        Global fixed header rendered at the root level (not inside the hero).
        Desktop: logo + Menu (same as inner pages). Mobile: plate with controls.
      */}
      <Navbar
        currentLocale={locale}
        setLocale={setLocale}
        theme={theme}
        setTheme={setTheme}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
      />

      {/*
        Mobile "stacking" scroll: the hero stays pinned (sticky) while each
        following section rides up over the previous one with a rounded top edge
        and soft shadow. Long sections (Services/Solutions) still scroll normally
        so no content is hidden. `lg:contents` removes these wrappers on desktop,
        leaving the original GSAP-pinned layout untouched.
      */}
      {/* Case Studies showcase with partner logos */}
      <div className="relative z-10 -mt-8 rounded-t-[28px] overflow-hidden shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:contents">
        <CaseStudiesSection locale={locale} />
      </div>

      {/* Services Grid with 12-column geometry */}
      <div className="relative z-20 -mt-8 rounded-t-[28px] shadow-[0_-12px_30px_rgba(0,0,0,0.28)] max-lg:pointer-events-none lg:contents">
        <ServicesSection locale={locale} theme={theme} />
      </div>

      {/* Solution: mobile overlap over Lets Talk */}
      <div className="relative z-30 -mt-24 overflow-hidden rounded-t-[28px] shadow-[0_-12px_30px_rgba(0,0,0,0.35)] lg:contents">
        <SolutionSection locale={locale} theme={theme} />
      </div>

      <div className="relative z-[35] -mt-8 overflow-hidden rounded-t-[28px] shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:contents">
        <FAQSection locale={locale} theme={theme} />
      </div>

      {/* Footer from Figma */}
      <div className="relative z-40 -mt-8 rounded-t-[28px] overflow-hidden shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:contents">
        <FooterSection locale={locale} theme={theme} />
      </div>

      <ScrollSideButton locale={locale} theme={theme} sectionIds={scrollSectionIds} />

      {/* Desktop chat CTA → contact modal; mobile keeps WhatsApp */}
      <ChatButton />
      <WhatsAppButton />

      {/* Accessibility Control Panel */}
      <AccessibilityPanel
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
        labels={a11yLabels}
        screenReaderTargets={a11yTargets}
        rtl={locale === 'he'}
        showPoweredBy
      />

      {/* Cookie consent banner */}
      <CookieConsent locale={locale} theme={theme} />
    </div>
    </ContactModalProvider>
    </SiteContentProvider>
  )
}
