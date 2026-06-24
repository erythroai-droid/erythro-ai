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

export default function HomePage() {
  const [locale, setLocale] = useState('en')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)

  // Automatically toggle dark class on the HTML/Body element for Tailwind
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  // Translate helpers
  const t = (field: Record<string, string>) => field[locale] || field['en']

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
          />
        }
      />

      {/* Case Studies showcase with partner logos */}
      <CaseStudiesSection locale={locale} />

      {/* Services Grid with 12-column geometry */}
      <ServicesSection locale={locale} />

      {/* Solution pricing cards */}
      <SolutionSection locale={locale} />

      {/* Footer from Figma */}
      <FooterSection locale={locale} />

      {/* Floating Controls Widget */}
      <FloatingWidget
        locale={locale}
        setLocale={setLocale}
        theme={theme}
        setTheme={setTheme}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
      />

      {/* Accessibility Control Panel */}
      <AccessibilityPanel
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
        locale={locale}
      />
    </div>
  )
}
