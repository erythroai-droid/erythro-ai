'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { heebo, interCyrillic, interLatinFamily } from '@/lib/fonts'
import {
  isSiteLocale,
  persistLocale,
  persistTheme,
  readLocaleCookieClient,
  readQueryLocale,
  readStoredLocale,
  readStoredTheme,
  resolveClientLocale,
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
  /**
   * Hard-lock UI language (ads LPs). Ignores cookie/localStorage and no-ops
   * `setLocale`. Theme may still hydrate from storage.
   */
  lockedLocale?: string
}

/**
 * Shared locale + theme state with cookie/localStorage persistence.
 * Pass `initialTheme` from the request cookie so SSR and the first client
 * render match. When omitted (or `clientHydratePrefs`), both sides start from
 * defaults and storage is applied after mount.
 *
 * First visit (no `?lang=` / storage / cookie): `resolveClientLocale` uses
 * `navigator.languages` so RU/HE browsers are not stuck on EN.
 */
export function useSitePrefs(
  initialLocale: string,
  defaultTheme: SiteTheme = 'dark',
  initialTheme?: SiteTheme,
  options?: UseSitePrefsOptions,
) {
  const clientHydratePrefs = options?.clientHydratePrefs === true
  const lockedLocale =
    options?.lockedLocale && isSiteLocale(options.lockedLocale) ? options.lockedLocale : null
  const [locale, setLocaleState] = useState(lockedLocale ?? initialLocale)
  const [theme, setThemeState] = useState<SiteTheme>(initialTheme ?? defaultTheme)

  // useLayoutEffect: apply stored / browser locale before paint to cut CLS from
  // EN→RU/HE swap after ISR HTML (always SSR as `en`). Locked LPs never adopt
  // cookie / browser locale.
  useLayoutEffect(() => {
    if (lockedLocale) {
      applyDocumentLocale(lockedLocale)
      setLocaleState(lockedLocale)
      const storedTheme = readStoredTheme()
      if (storedTheme) setThemeState(storedTheme)
      else if (!initialTheme) persistTheme(defaultTheme)
      return
    }

    if (clientHydratePrefs) {
      const storedTheme = readStoredTheme()
      if (storedTheme) setThemeState(storedTheme)
      else persistTheme(defaultTheme)

      const resolved = resolveClientLocale(initialLocale)
      applyDocumentLocale(resolved)
      setLocaleState(resolved)
      persistLocale(resolved)
      return
    }

    // Dynamic SSR pages: cookie may already match. On first visit, adopt browser.
    const existing = readQueryLocale() || readStoredLocale() || readLocaleCookieClient()
    if (existing) {
      if (existing !== initialLocale) {
        applyDocumentLocale(existing)
        setLocaleState(existing)
      }
      persistLocale(existing)
    } else {
      const resolved = resolveClientLocale(initialLocale)
      applyDocumentLocale(resolved)
      setLocaleState(resolved)
      persistLocale(resolved)
    }
  }, [clientHydratePrefs, initialLocale, defaultTheme, lockedLocale, initialTheme])

  useEffect(() => {
    if (lockedLocale || clientHydratePrefs) return

    if (initialTheme) {
      persistTheme(initialTheme)
    } else {
      const stored = readStoredTheme()
      if (stored) setThemeState(stored)
      else persistTheme(defaultTheme)
    }
  }, [clientHydratePrefs, initialTheme, defaultTheme, lockedLocale])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  useEffect(() => {
    applyDocumentLocale(locale)
  }, [locale])

  const setLocale = (next: string) => {
    if (lockedLocale) return
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

  return { locale, setLocale, theme, setTheme, localeLocked: Boolean(lockedLocale) }
}
