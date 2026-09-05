'use client'

import { useEffect, useState } from 'react'
import { heebo, interCyrillic, interLatinFamily } from '@/lib/fonts'
import {
  isSiteLocale,
  persistLocale,
  persistTheme,
  readLocaleCookieClient,
  readStoredLocale,
  readStoredTheme,
  type SiteTheme,
} from '@/lib/sitePrefs'

/**
 * Mirror layout.tsx font wiring on client locale switches.
 * SSR only adds `heebo` / `interCyrillic` CSS variables for the cookie locale;
 * without this, `html[dir=rtl]` references unset `--font-heebo` until reload.
 */
function applyDocumentLocale(locale: string) {
  const root = document.documentElement
  root.lang = locale
  root.dir = locale === 'he' ? 'rtl' : 'ltr'
  root.classList.toggle(heebo.variable, locale === 'he')
  root.classList.toggle(interCyrillic.variable, locale === 'ru')
  if (locale === 'he') {
    root.style.setProperty('--font-inter-latin', interLatinFamily)
  } else {
    root.style.removeProperty('--font-inter-latin')
  }
}

export type UseSitePrefsOptions = {
  /**
   * ISR / static pages SSR as `en` without reading cookies. After mount, adopt
   * locale + theme from cookie/localStorage so the first paint can stay cacheable.
   */
  clientHydratePrefs?: boolean
}

/**
 * Shared locale + theme state with cookie/localStorage persistence.
 * Pass `initialTheme` from the request cookie so SSR and the first client
 * render match. When omitted (or `clientHydratePrefs`), both sides start from
 * defaults and storage is applied after mount.
 */
export function useSitePrefs(
  initialLocale: string,
  defaultTheme: SiteTheme = 'dark',
  initialTheme?: SiteTheme,
  options?: UseSitePrefsOptions,
) {
  const clientHydratePrefs = options?.clientHydratePrefs === true
  const [locale, setLocaleState] = useState(initialLocale)
  const [theme, setThemeState] = useState<SiteTheme>(initialTheme ?? defaultTheme)

  useEffect(() => {
    if (clientHydratePrefs) {
      const storedTheme = readStoredTheme()
      if (storedTheme) setThemeState(storedTheme)
      else persistTheme(defaultTheme)

      const storedLocale = readStoredLocale() || readLocaleCookieClient()
      if (storedLocale) {
        applyDocumentLocale(storedLocale)
        setLocaleState(storedLocale)
        persistLocale(storedLocale)
      } else if (isSiteLocale(initialLocale)) {
        persistLocale(initialLocale)
      }
      return
    }

    if (initialTheme) {
      persistTheme(initialTheme)
    } else {
      const stored = readStoredTheme()
      if (stored) setThemeState(stored)
      else persistTheme(defaultTheme)
    }
    if (isSiteLocale(initialLocale)) persistLocale(initialLocale)
  }, [clientHydratePrefs, initialLocale, initialTheme, defaultTheme])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  useEffect(() => {
    applyDocumentLocale(locale)
  }, [locale])

  const setLocale = (next: string) => {
    if (!isSiteLocale(next)) return
    // Apply dir/lang/fonts before React re-renders motion/layout-sensitive UI.
    applyDocumentLocale(next)
    setLocaleState(next)
    persistLocale(next)
  }

  const setTheme = (next: SiteTheme) => {
    setThemeState(next)
    persistTheme(next)
  }

  return { locale, setLocale, theme, setTheme }
}
