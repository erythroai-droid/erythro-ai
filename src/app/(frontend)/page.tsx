'use client'

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import PartnersShowcase from '@/components/PartnersShowcase'
import ServicesSection from '@/components/ServicesSection'
import Button from '@/components/Button'
import { page as translations } from '@/translations'

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

  const {
    buttonShowcaseTitle,
    buttonShowcaseSubtitle,
    darkBgLabel,
    lightBgLabel,
    ctaLabel,
    moreLabel,
    getStartLabel,
    footerText,
  } = translations

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

      {/* Technology Partners loop showcase */}
      <PartnersShowcase />

      {/* Services Grid with 12-column geometry */}
      <ServicesSection locale={locale} />

      {/* Extra Showcase: Interactive Buttons Matrix */}
      <section className="py-20 bg-noise bg-surface transition-colors duration-300 border-t border-b border-coal-400/10 dark:border-white/5">
        <div className="max-w-[1170px] mx-auto px-[30px]">
          <div className="mb-12 text-center">
            <h2 className="font-heading-3xl text-erythro-500 tracking-widest font-extralight uppercase">
              {t(buttonShowcaseTitle)}
            </h2>
            <p className="font-body-lead text-coal-300 dark:text-gold-700 max-w-xl mx-auto mt-2">
              {t(buttonShowcaseSubtitle)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Column 1: Dark BG buttons */}
            <div className="p-8 bg-coal-800 rounded-radius-lg border border-white/5 flex flex-col gap-6 items-center justify-center text-center shadow-lg">
              <span className="font-mono text-xs text-gold-500 tracking-[0.2em] uppercase">
                {t(darkBgLabel)}
              </span>
              <div className="flex flex-wrap gap-4 items-center justify-center">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-mono text-coal-300 uppercase tracking-widest">Variant 1</span>
                  <Button variant="dark-outline" showArrow>
                    {t(moreLabel)}
                  </Button>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-mono text-coal-300 uppercase tracking-widest">Variant 2</span>
                  <Button variant="dark-text" showArrow={locale !== 'he'}>
                    {t(ctaLabel)}
                  </Button>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-mono text-coal-300 uppercase tracking-widest">Variant 3</span>
                  <Button variant="dark-accent">
                    {t(getStartLabel)}
                  </Button>
                </div>
              </div>
            </div>

            {/* Column 2: Light BG buttons */}
            <div className="p-8 bg-gold-200 rounded-radius-lg border border-coal-400/10 flex flex-col gap-6 items-center justify-center text-center shadow-lg">
              <span className="font-mono text-xs text-coal-900 tracking-[0.2em] uppercase">
                {t(lightBgLabel)}
              </span>
              <div className="flex flex-wrap gap-4 items-center justify-center">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-mono text-coal-400 uppercase tracking-widest">Variant 1</span>
                  <Button variant="light-outline" showArrow>
                    {t(moreLabel)}
                  </Button>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-mono text-coal-400 uppercase tracking-widest">Variant 2</span>
                  <Button variant="light-inverted" showArrow={locale !== 'he'}>
                    {t(ctaLabel)}
                  </Button>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-mono text-coal-400 uppercase tracking-widest">Variant 3</span>
                  <Button variant="light-accent">
                    {t(getStartLabel)}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="py-12 bg-coal-900 border-t border-coal-800 text-center select-none">
        <div className="max-w-[1170px] mx-auto px-[30px] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 flex items-center justify-center bg-erythro-500 rounded">
              <span className="text-white font-extrabold text-[10px]">E</span>
            </div>
            <span className="font-sans font-black text-sm tracking-widest text-white">
              Erythro.ai
            </span>
          </div>

          <p className="font-sans text-[11px] text-coal-300 tracking-wider">
            {t(footerText)}
          </p>

          <a
            href="#"
            className="font-mono text-[10px] text-erythro-500 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            BACK TO TOP ↑
          </a>
        </div>
      </footer>

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
