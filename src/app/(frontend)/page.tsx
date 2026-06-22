'use client'

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import CaseStudiesSection from '@/components/CaseStudiesSection'
import ServicesSection from '@/components/ServicesSection'
import SolutionSection from '@/components/SolutionSection'
import FooterSection from '@/components/FooterSection'

export default function HomePage() {
  const [locale, setLocale] = useState('en')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

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

      {/* Floating Control Console (Playground dashboard) */}
      <div className="fixed bottom-6 end-6 z-50 p-4 rounded-radius-lg border border-coal-400/20 dark:border-white/10 bg-white/95 dark:bg-coal-900/95 shadow-xl flex flex-col gap-3 pointer-events-auto backdrop-blur max-w-[280px]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold text-erythro-500 uppercase tracking-wider">
            Showcase Panel
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>

        {/* Dynamic description of testing metrics */}
        <p className="font-sans text-[10px] text-coal-300 dark:text-gold-700 leading-normal">
          {locale === 'ru'
            ? '✓ Проверка длины текста (+40%)\n✓ Адаптивная авто-раскладка Flexbox'
            : locale === 'he'
            ? '✓ Проверка RTL зеркалирования\n✓ Принудительный шрифт Inter'
            : '✓ Standard LTR layout\n✓ Micro-animations operational'}
        </p>

        <div className="w-full h-px bg-coal-400/10 dark:bg-white/5" />

        {/* Theme Button */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full py-1.5 px-3 rounded bg-coal-400/5 dark:bg-white/5 border border-coal-400/10 dark:border-white/10 text-xs font-bold text-center hover:bg-coal-400/10 dark:hover:bg-white/10 transition-all cursor-pointer"
        >
          {theme === 'dark' ? '☀️ SWITCH TO LIGHT' : '🌙 SWITCH TO DARK'}
        </button>

        {/* Language switchers */}
        <div className="grid grid-cols-3 gap-1.5">
          {['en', 'ru', 'he'].map((lang) => (
            <button
              key={lang}
              onClick={() => setLocale(lang)}
              className={`py-1 rounded text-[10px] font-black uppercase text-center transition-all cursor-pointer ${
                locale === lang
                  ? 'bg-erythro-500 text-white'
                  : 'bg-coal-400/5 dark:bg-white/5 text-coal-300 border border-coal-400/5 hover:bg-coal-400/10 dark:hover:bg-white/10'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
