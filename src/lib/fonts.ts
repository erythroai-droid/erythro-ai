import { Heebo, Inter, Roboto_Mono } from 'next/font/google'

/**
 * Self-hosted via next/font — avoids a render-blocking fonts.googleapis.com request.
 *
 * Latin Inter is the only family preloaded on every locale. Cyrillic / Hebrew /
 * mono are extra @font-face files — they were all on the PSI critical path
 * (~1.5 s) even when unused (e.g. cyrillic on he/en).
 */
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

/** Hashed Inter family only — strips next/font's Arial metric fallback. */
export const interLatinFamily = inter.style.fontFamily.split(',')[0]!.trim()

/** Russian body copy — unicode-range keeps this off en/he. */
export const interCyrillic = Inter({
  subsets: ['cyrillic'],
  variable: '--font-inter-cyrillic',
  display: 'swap',
  preload: false,
})

/**
 * Inter has no Hebrew subset in next/font — Heebo covers `he` headlines.
 * Layout adds `heebo.variable` on `<html>` for SSR `he`; `useSitePrefs` must
 * toggle the same class (and `--font-inter-latin`) on client locale switches.
 *
 * No metric fallback: Arial has no unicode-range and would paint Latin/digits
 * when Heebo is first in a stack (hero SVG probes).
 */
export const heebo = Heebo({
  subsets: ['hebrew'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-heebo',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
})

/** Sparse UI (open menu, partners). One weight so we don't fetch 400+700. */
export const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-roboto-mono',
  display: 'optional',
  preload: false,
})
