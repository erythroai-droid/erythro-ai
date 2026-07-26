'use client'

import React, { useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import FooterSection from '@/components/FooterSection'
import { AccessibilityPanel } from '@/components/accessibility'
import CookieConsent from '@/components/CookieConsent'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import { ContactModalProvider } from '@/components/ContactModal'
import ProjectHero from '@/components/portfolio/ProjectHero'
import ProjectBody from '@/components/portfolio/ProjectBody'
import ScrollSideButton from '@/components/portfolio/ScrollSideButton'
import LetsTalkSection from '@/components/LetsTalkSection'
import WhatsAppButton from '@/components/WhatsAppButton'
import type { SiteContent } from '@/lib/defaultContent'
import type { PortfolioProject } from '@/lib/portfolioProjects'
import { useSitePrefs } from '@/hooks/useSitePrefs'

interface ProjectClientProps {
  initialLocale: string
  content: SiteContent
  project: PortfolioProject
  prev: { slug: string; title: string } | null
  next: { slug: string; title: string } | null
}

export default function ProjectClient({
  initialLocale,
  content,
  project,
  prev,
  next,
}: ProjectClientProps) {
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
      { id: 'project-hero', label: project.title },
      { id: 'project-body', label: pickA11y(a11yTranslations.screenReaderDescription) },
      { id: 'contacts', label: pickA11y(a11yTranslations.screenReaderContacts) },
      { id: 'footer', label: pickA11y(a11yTranslations.screenReaderFooter) },
    ],
    [locale, project.title],
  )

  const scrollSectionIds = useMemo(
    () => ['project-hero', 'project-body', 'contacts', 'footer'],
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
          <Navbar
            currentLocale={locale}
            setLocale={setLocale}
            theme={theme}
            setTheme={setTheme}
            onOpenAccessibility={() => setIsAccessibilityOpen(true)}
            forceBurger
          />

          <div className="relative z-10 lg:contents">
            <ProjectHero project={project} />
          </div>

          <div className="relative z-20 -mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:mt-0 lg:contents">
            <ProjectBody
              project={project}
              theme={theme}
              locale={locale}
              prev={prev}
              next={next}
              portfolioHref={content.caseStudies.viewAllHref || '/portfolio'}
            />
          </div>

          <div className="relative z-30 -mt-8 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:mt-0 lg:contents">
            <LetsTalkSection locale={locale} variant="simple" />
          </div>

          <ScrollSideButton label="Scroll" theme={theme} sectionIds={scrollSectionIds} />

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
