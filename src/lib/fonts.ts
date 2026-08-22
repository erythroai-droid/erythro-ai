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

/** Russian body copy — unicode-range keeps this off en/he. */
export const interCyrillic = Inter({
  subsets: ['cyrillic'],
  variable: '--font-inter-cyrillic',
  display: 'swap',
  preload: false,
})

/**
 * Inter has no Hebrew subset in next/font — Heebo covers `he` headlines.
 * Applied on `<html>` only when locale is `he`.
 */
export const heebo = Heebo({
  subsets: ['hebrew'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-heebo',
  display: 'swap',
  preload: false,
})

/** Sparse UI (open menu, partners). One weight so we don't fetch 400+700. */
export const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-roboto-mono',
  display: 'optional',
  preload: false,
})
