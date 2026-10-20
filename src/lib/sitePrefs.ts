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

/** `?lang=en|ru|he` (ads LP handoff, shared links). */
export function readQueryLocale(): SiteLocale | null {
  if (typeof window === 'undefined') return null
  const match = (window.location.search || '').match(/[?&]lang=(en|ru|he)(?:&|$)/)
  return match && isSiteLocale(match[1]) ? match[1] : null
}

/**
 * Map BCP-47 tags to a supported site locale (`iw` → `he`).
 * Pure helper for tests and `detectBrowserLocale`.
 */
export function pickLocaleFromLanguageTags(tags: readonly string[]): SiteLocale | null {
  for (const tag of tags) {
    if (!tag) continue
    let base = tag.trim().toLowerCase().split('-')[0]
    if (base === 'iw') base = 'he'
    if (isSiteLocale(base)) return base
  }
  return null
}

/** First matching `navigator.languages` / `navigator.language`, or null. */
export function detectBrowserLocale(): SiteLocale | null {
  if (typeof navigator === 'undefined') return null
  const tags: string[] = []
  if (navigator.languages?.length) tags.push(...navigator.languages)
  if (navigator.language) tags.push(navigator.language)
  return pickLocaleFromLanguageTags(tags)
}

/**
 * Unlocked client locale: `?lang=` → storage/cookie → browser → fallback.
 * Does not run on ads LP locks (`lockedLocale` / host path).
 */
export function resolveClientLocale(fallback: string = 'en'): SiteLocale {
  const fromQuery = readQueryLocale()
  if (fromQuery) return fromQuery
  const stored = readStoredLocale() || readLocaleCookieClient()
  if (stored) return stored
  const browser = detectBrowserLocale()
  if (browser) return browser
  return isSiteLocale(fallback) ? fallback : 'en'
}

/** Inline bootstrap: apply stored theme before first paint (paste into layout). */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var t=localStorage.getItem(k);if(!t){var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);t=m?decodeURIComponent(m[1]):null}var r=document.documentElement;if(t==='light'){r.classList.remove('dark')}else if(t==='dark'){r.classList.add('dark')}}catch(e){}})();`

/**
 * Apply lang/dir before paint (ISR pages SSR as `en`).
 * Ads audit LPs (`audit-{locale}.erythro.ai` or `/lp/audit/{locale}`) lock
 * locale from host/path and ignore cookie/localStorage so the UI cannot jump.
 * First visit (no `?lang=` / storage / cookie): adopt `navigator.languages`.
 * Font CSS variables still settle in `useSitePrefs` after mount.
 */
export const LOCALE_BOOTSTRAP_SCRIPT = `(function(){try{var h=(location.hostname||'').toLowerCase();var path=location.pathname||'/';var lock=null;if(h==='audit-rus.erythro.ai'||h==='audit-ru.erythro.ai')lock='ru';else if(h==='audit-en.erythro.ai')lock='en';else if(h==='audit-he.erythro.ai')lock='he';else{var pm=path.match(/^\\/lp\\/audit\\/(en|ru|he)(?:\\/|$)/);if(pm)lock=pm[1]}var loc=lock;var k='${LOCALE_STORAGE_KEY}';if(!loc){var qm=(location.search||'').match(/[?&]lang=(en|ru|he)(?:&|$)/);if(qm)loc=qm[1]}if(!loc){try{loc=localStorage.getItem(k)}catch(e){}if(!loc){var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=([^;]*)/);loc=m?decodeURIComponent(m[1]):null}}if(!loc){try{var langs=navigator.languages||[];if(!langs.length&&navigator.language)langs=[navigator.language];for(var i=0;i<langs.length;i++){var b=String(langs[i]||'').toLowerCase().split('-')[0];if(b==='iw')b='he';if(b==='en'||b==='ru'||b==='he'){loc=b;break}}}catch(e){}}if(loc!=='en'&&loc!=='ru'&&loc!=='he')return;var r=document.documentElement;r.lang=loc;r.dir=loc==='he'?'rtl':'ltr';if(lock)r.setAttribute('data-locale-lock',lock);else{try{localStorage.setItem(k,loc)}catch(e){}document.cookie='${LOCALE_COOKIE}='+encodeURIComponent(loc)+'; path=/; max-age=31536000; samesite=lax'}}catch(e){}})();`

