'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import CaseStudiesSection from '@/components/CaseStudiesSection'
import ServicesSection from '@/components/ServicesSection'
import SolutionSection from '@/components/SolutionSection'
import FooterSection from '@/components/FooterSection'
import FloatingWidget from '@/components/FloatingWidget'
import SplashScreen from '@/components/SplashScreen'
import WhatsAppButton from '@/components/WhatsAppButton'
import { AccessibilityPanel } from '@/components/accessibility'
import CookieConsent from '@/components/CookieConsent'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import { ContactModalProvider } from '@/components/ContactModal'
import type { SiteContent } from '@/lib/defaultContent'

const LOCALE_COOKIE = 'NEXT_LOCALE'

interface HomeClientProps {
  initialLocale: string
  content: SiteContent
}

export default function HomeClient({ initialLocale, content }: HomeClientProps) {
  const a11yTranslations = content.accessibility
  const [locale, setLocaleState] = useState(initialLocale)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)

  // Persist the chosen language to a cookie so the middleware and server render
  // remember it on subsequent visits.
  const setLocale = (next: string) => {
    setLocaleState(next)
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  }

  // Automatically toggle dark class on the HTML/Body element for Tailwind
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  // Keep the document language/direction in sync with the active locale
  useEffect(() => {
    const root = window.document.documentElement
    root.lang = locale
    root.dir = locale === 'he' ? 'rtl' : 'ltr'
  }, [locale])

  // Resolve accessibility panel strings for the active locale. The panel
  // module itself is locale-agnostic; the app supplies the translated labels.
  const pickA11y = (field: Record<string, string>) => field[locale] || field.en

  const a11yLabels = useMemo(
    () => ({
      title: pickA11y(a11yTranslations.title),
      reset: pickA11y(a11yTranslations.reset),
      poweredBy: pickA11y(a11yTranslations.poweredBy),
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
      { id: 'contacts', label: pickA11y(a11yTranslations.screenReaderContacts) },
    ],
    [locale],
  )

  return (
    <SiteContentProvider value={content}>
    <ContactModalProvider locale={locale}>
    <SplashScreen />
    <div
      dir={locale === 'he' ? 'rtl' : 'ltr'}
      className={`min-h-screen font-sans transition-colors duration-500 bg-primary text-main ${
        locale === 'he' ? 'font-sans' : ''
      }`}
    >
      {/* Hero Section with WordStack */}
      <HeroSection locale={locale} />

      {/*
        Global fixed header rendered at the root level (not inside the hero).
        On mobile the hero is sticky and the sections stack over it; a header
        nested inside the sticky hero would be trapped in its stacking context
        and disappear under the rising sections. At root it stays on top.
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
      <div className="relative z-20 -mt-8 rounded-t-[28px] shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:contents">
        <ServicesSection locale={locale} theme={theme} />
      </div>

      {/* Solution: mobile overlap over Lets Talk */}
      <div className="relative z-30 -mt-24 overflow-hidden rounded-t-[28px] shadow-[0_-12px_30px_rgba(0,0,0,0.35)] lg:contents">
        <SolutionSection locale={locale} theme={theme} />
      </div>

      {/* Footer from Figma */}
      <div className="relative z-40 -mt-8 rounded-t-[28px] overflow-hidden shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:contents">
        <FooterSection locale={locale} theme={theme} />
      </div>

      {/* Floating Controls Widget (desktop only — mobile controls live in the burger menu) */}
      <div className="hidden lg:block">
        <FloatingWidget
          locale={locale}
          setLocale={setLocale}
          theme={theme}
          setTheme={setTheme}
          onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        />
      </div>

      {/* Mobile-only pulsing WhatsApp button (desktop has contacts in FloatingWidget) */}
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
