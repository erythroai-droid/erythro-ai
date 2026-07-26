'use client'

import { useEffect, useState } from 'react'
import {
  isSiteLocale,
  persistLocale,
  persistTheme,
  readStoredTheme,
  type SiteTheme,
} from '@/lib/sitePrefs'

/**
 * Shared locale + theme state with cookie/localStorage persistence.
 * Pass `initialTheme` from the request cookie so SSR and the first client
 * render match. When omitted, both sides start from `defaultTheme` and
 * localStorage is applied only after mount.
 */
export function useSitePrefs(
  initialLocale: string,
  defaultTheme: SiteTheme = 'dark',
  initialTheme?: SiteTheme,
) {
  const [locale, setLocaleState] = useState(initialLocale)
  const [theme, setThemeState] = useState<SiteTheme>(initialTheme ?? defaultTheme)

  useEffect(() => {
    if (initialTheme) {
      persistTheme(initialTheme)
    } else {
      const stored = readStoredTheme()
      if (stored) setThemeState(stored)
      else persistTheme(defaultTheme)
    }
    if (isSiteLocale(initialLocale)) persistLocale(initialLocale)
  }, [initialLocale, initialTheme, defaultTheme])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = locale === 'he' ? 'rtl' : 'ltr'
  }, [locale])

  const setLocale = (next: string) => {
    if (!isSiteLocale(next)) return
    // Apply dir/lang before React re-renders motion/layout-sensitive UI.
    const root = document.documentElement
    root.lang = next
    root.dir = next === 'he' ? 'rtl' : 'ltr'
    setLocaleState(next)
    persistLocale(next)
  }

  const setTheme = (next: SiteTheme) => {
    setThemeState(next)
    persistTheme(next)
  }

  return { locale, setLocale, theme, setTheme }
}
