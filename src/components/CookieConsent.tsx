'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSiteContent } from './SiteContentProvider'
import {
  clearAnalyticsCookies,
  getConsentValue,
  CONSENT_OPEN_EVENT,
  setConsentValue,
  type ConsentValue,
} from '@/lib/privacyConsent'

interface CookieConsentProps {
  locale: string
  theme: 'light' | 'dark'
  /**
   * Absolute URL (e.g. https://erythro.ai/privacy) on ads LPs — avoids Next.js
   * soft-nav / RSC prefetch on the LP host and CSP connect-src issues.
   */
  privacyHref?: string
}

export default function CookieConsent({ locale, theme, privacyHref = '/privacy' }: CookieConsentProps) {
  const translations = useSiteContent().cookieConsent
  const [visible, setVisible] = useState(false)

  const t = (field?: Record<string, string> | null) => field?.[locale] || field?.en || ''

  useEffect(() => {
    if (!getConsentValue()) {
      setVisible(true)
    }

    const onOpen = () => setVisible(true)
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen)
  }, [])

  const handleConsent = (value: ConsentValue) => {
    setConsentValue(value)
    if (value === 'declined') {
      clearAnalyticsCookies()
    }
    setVisible(false)
  }

  if (!visible) return null

  const linkClass =
    theme === 'light'
      ? 'text-coal-900 underline underline-offset-2 decoration-coal-900/30 transition-colors hover:text-erythro-500 hover:decoration-erythro-500'
      : 'text-gold-500 underline underline-offset-2 decoration-gold-500/40 transition-colors hover:text-gold-100 hover:decoration-gold-100'

  const privacyLabel = t(
    translations.privacyLink || { en: 'Privacy Policy', ru: 'Конфиденциальность', he: 'מדיניות פרטיות' },
  )
  const fullMessage = `${t(translations.message)} ${privacyLabel}`

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] w-full pointer-events-none"
      role="region"
      aria-label={
        locale === 'ru'
          ? 'Согласие на использование cookie'
          : locale === 'he'
            ? 'הסכמה לקובצי Cookie'
            : 'Cookie consent'
      }
    >
      <div
        className={`pointer-events-auto flex w-full items-center gap-2 border-t px-3 py-2 backdrop-blur-md sm:gap-3 sm:px-4 ${
          theme === 'light'
            ? 'border-coal-900/10 bg-white/95 text-coal-900 shadow-[0_-4px_16px_0_rgba(13,13,13,0.06)]'
            : 'border-white/10 bg-coal-900/90 text-gold-100 shadow-[0_-4px_16px_0_rgba(0,0,0,0.35)]'
        }`}
      >
        <p
          className={`m-0 min-w-0 flex-1 truncate text-[11px] leading-none tracking-[0.3px] ${
            theme === 'light' ? 'text-coal-900/70' : 'text-gold-100/80'
          }`}
          title={fullMessage}
        >
          <span className="sm:hidden">
            {t(translations.messageCompact || translations.message)}{' '}
          </span>
          <span className="hidden sm:inline">{t(translations.message)} </span>
          {/^https?:\/\//i.test(privacyHref) ? (
            <a
              href={privacyHref}
              className={linkClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              {privacyLabel}
            </a>
          ) : (
            <Link href={privacyHref} className={linkClass}>
              {privacyLabel}
            </Link>
          )}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => handleConsent('declined')}
            className={`cursor-pointer whitespace-nowrap text-[11px] font-light uppercase tracking-[1.5px] transition-colors duration-300 ${
              theme === 'light'
                ? 'text-coal-900/55 hover:text-coal-900'
                : 'text-gold-100/55 hover:text-gold-500'
            }`}
          >
            {t(translations.decline)}
          </button>
          <button
            type="button"
            onClick={() => handleConsent('accepted')}
            className="cursor-pointer whitespace-nowrap rounded-full bg-erythro-500 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[1.2px] text-white transition-colors hover:bg-erythro-600"
          >
            {t(translations.accept)}
          </button>
        </div>
      </div>
    </div>
  )
}
