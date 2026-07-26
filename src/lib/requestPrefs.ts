import { cookies } from 'next/headers'
import {
  LOCALE_COOKIE,
  THEME_COOKIE,
  isSiteLocale,
  isSiteTheme,
  type SiteTheme,
} from '@/lib/sitePrefs'

/**
 * Locale + theme from request cookies so SSR matches the client's first paint.
 * `initialTheme` is undefined when the theme cookie is absent — the client may
 * then adopt localStorage after mount without a hydration mismatch.
 */
export async function getRequestPrefs(fallbackTheme: SiteTheme = 'dark') {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  const initialLocale = isSiteLocale(cookieLocale) ? cookieLocale : 'en'
  const cookieTheme = cookieStore.get(THEME_COOKIE)?.value
  const initialTheme = isSiteTheme(cookieTheme) ? cookieTheme : undefined
  return { initialLocale, initialTheme, fallbackTheme }
}
