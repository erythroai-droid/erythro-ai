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
 */
export function useSitePrefs(
  initialLocale: string,
  defaultTheme: SiteTheme = 'dark',
) {
  const [locale, setLocaleState] = useState(initialLocale)
  const [theme, setThemeState] = useState<SiteTheme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    return readStoredTheme() ?? defaultTheme
  })

  // Hydrate theme from storage; keep locale storage aligned with cookie/SSR.
  useEffect(() => {
    const stored = readStoredTheme()
    if (stored) setThemeState(stored)
    if (isSiteLocale(initialLocale)) persistLocale(initialLocale)
  }, [initialLocale])

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
