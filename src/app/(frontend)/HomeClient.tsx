'use client'

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import CaseStudiesSection from '@/components/CaseStudiesSection'
import ServicesSection from '@/components/ServicesSection'
import SolutionSection from '@/components/SolutionSection'
import FooterSection from '@/components/FooterSection'
import FloatingWidget from '@/components/FloatingWidget'
import AccessibilityPanel from '@/components/AccessibilityPanel'
import CookieConsent from '@/components/CookieConsent'

const LOCALE_COOKIE = 'NEXT_LOCALE'

interface HomeClientProps {
  initialLocale: string
}

export default function HomeClient({ initialLocale }: HomeClientProps) {
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

  return (
    <div
      dir={locale === 'he' ? 'rtl' : 'ltr'}
      className={`min-h-screen font-sans transition-colors duration-500 bg-primary text-main ${
        locale === 'he' ? 'font-sans' : ''
      }`}
    >
      {/* Hero Section with WordStack and embedded Navbar */}
      <HeroSection
        locale={locale}
        navbar={
          <Navbar
            currentLocale={locale}
            setLocale={setLocale}
            theme={theme}
            setTheme={setTheme}
            onOpenAccessibility={() => setIsAccessibilityOpen(true)}
          />
        }
      />

      {/* Case Studies showcase with partner logos */}
      <CaseStudiesSection locale={locale} />

      {/* Services Grid with 12-column geometry */}
      <ServicesSection locale={locale} theme={theme} />

      {/* Solution pricing cards */}
      <SolutionSection locale={locale} theme={theme} />

      {/* Footer from Figma */}
      <FooterSection locale={locale} theme={theme} />

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

      {/* Accessibility Control Panel */}
      <AccessibilityPanel
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
        locale={locale}
      />

      {/* Cookie consent banner */}
      <CookieConsent locale={locale} theme={theme} />
    </div>
  )
}
