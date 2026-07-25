'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSiteContent } from './SiteContentProvider'
import Button from './Button'

const CONSENT_COOKIE = 'cookie_consent'

interface CookieConsentProps {
  locale: string
  theme: 'light' | 'dark'
}

export default function CookieConsent({ locale, theme }: CookieConsentProps) {
  const translations = useSiteContent().cookieConsent
  const [visible, setVisible] = useState(false)

  const t = (field: Record<string, string>) => field[locale] || field['en']

  useEffect(() => {
    const hasConsent = document.cookie
      .split('; ')
      .some((entry) => entry.startsWith(`${CONSENT_COOKIE}=`))
    if (!hasConsent) {
      setVisible(true)
    }
  }, [])

  const handleConsent = (value: 'accepted' | 'declined') => {
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    setVisible(false)
  }

  if (!visible) return null

  const linkClass =
    theme === 'light'
      ? 'text-coal-900 underline underline-offset-2 decoration-coal-900/30 transition-colors hover:text-erythro-500 hover:decoration-erythro-500'
      : 'text-gold-500 underline underline-offset-2 decoration-gold-500/40 transition-colors hover:text-gold-100 hover:decoration-gold-100'

  return (
    <div className="fixed inset-x-0 bottom-6 z-[60] w-full px-[30px] max-w-[1170px] mx-auto pointer-events-none">
      {/* Pill matches the navbar geometry/colors and reacts to the active theme */}
      <div
        className={`pointer-events-auto w-full flex flex-col sm:flex-row items-center gap-4 rounded-[40px] border px-[30px] py-4 backdrop-blur-md transition-colors duration-500 ${
          theme === 'light'
            ? 'border-gold-100 bg-white text-coal-900 shadow-[0_4px_24px_0_rgba(13,13,13,0.08)]'
            : 'border-[#0D0D0D] bg-coal-900/50 text-gold-100'
        }`}
      >
        <p
          className={`flex-1 text-[12px] leading-relaxed tracking-[0.5px] text-center sm:text-start ${
            theme === 'light' ? 'text-coal-900/70' : 'text-gold-100/80'
          }`}
        >
          {t(translations.message)}{' '}
          <Link href="/privacy" className={linkClass}>
            {t(translations.privacyLink)}
          </Link>
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleConsent('declined')}
            className={`text-[12px] font-light uppercase tracking-[2.4px] transition-colors duration-300 cursor-pointer ${
              theme === 'light'
                ? 'text-coal-900/60 hover:text-coal-900'
                : 'text-gold-100/60 hover:text-gold-500'
            }`}
          >
            {t(translations.decline)}
          </button>
          <Button
            variant={theme === 'light' ? 'light-accent' : 'nav-talk'}
            onClick={() => handleConsent('accepted')}
          >
            {t(translations.accept)}
          </Button>
        </div>
      </div>
    </div>
  )
}
