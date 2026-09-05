export const LOCALE_COOKIE = 'NEXT_LOCALE'
export const THEME_COOKIE = 'erythro-theme'
export const LOCALE_STORAGE_KEY = 'erythro-locale'
export const THEME_STORAGE_KEY = 'erythro-theme'

export const SUPPORTED_LOCALES = ['en', 'ru', 'he'] as const
export type SiteLocale = (typeof SUPPORTED_LOCALES)[number]
export type SiteTheme = 'light' | 'dark'

const ONE_YEAR = 60 * 60 * 24 * 365

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`
}

export function isSiteLocale(value: string | null | undefined): value is SiteLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function isSiteTheme(value: string | null | undefined): value is SiteTheme {
  return value === 'light' || value === 'dark'
}

export function readStoredLocale(): SiteLocale | null {
  if (typeof window === 'undefined') return null
  try {
    const fromStorage = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isSiteLocale(fromStorage)) return fromStorage
  } catch {
    // ignore
  }
  return null
}

export function readStoredTheme(): SiteTheme | null {
  if (typeof window === 'undefined') return null
  try {
    const fromStorage = localStorage.getItem(THEME_STORAGE_KEY)
    if (isSiteTheme(fromStorage)) return fromStorage
  } catch {
    // ignore
  }
  return null
}

export function persistLocale(locale: string) {
  if (!isSiteLocale(locale)) return
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // ignore
  }
  setCookie(LOCALE_COOKIE, locale)
}

export function persistTheme(theme: SiteTheme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // ignore
  }
  setCookie(THEME_COOKIE, theme)
}

export function readLocaleCookieClient(): SiteLocale | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/)
  if (!match?.[1]) return null
  try {
    const value = decodeURIComponent(match[1])
    return isSiteLocale(value) ? value : null
  } catch {
    return null
  }
}

/** Inline bootstrap: apply stored theme before first paint (paste into layout). */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var t=localStorage.getItem(k);if(!t){var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);t=m?decodeURIComponent(m[1]):null}var r=document.documentElement;if(t==='light'){r.classList.remove('dark')}else if(t==='dark'){r.classList.add('dark')}}catch(e){}})();`

/**
 * Apply lang/dir from cookie/localStorage before paint (ISR pages SSR as `en`).
 * Font CSS variables still settle in `useSitePrefs` after mount.
 */
export const LOCALE_BOOTSTRAP_SCRIPT = `(function(){try{var k='${LOCALE_STORAGE_KEY}';var loc=null;try{loc=localStorage.getItem(k)}catch(e){}if(!loc){var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=([^;]*)/);loc=m?decodeURIComponent(m[1]):null}if(loc!=='en'&&loc!=='ru'&&loc!=='he')return;var r=document.documentElement;r.lang=loc;r.dir=loc==='he'?'rtl':'ltr'}catch(e){}})();`

