import { Heebo, Inter, Roboto_Mono } from 'next/font/google'

/** Self-hosted via next/font — avoids a render-blocking fonts.googleapis.com request. */
export const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

/**
 * Inter has no Hebrew subset in next/font — Heebo covers hero outline/FG glyphs
 * for `he` (falls through the --font-sans stack when Inter lacks a codepoint).
 */
export const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-heebo',
  display: 'swap',
})

export const robotoMono = Roboto_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
  variable: '--font-roboto-mono',
  display: 'swap',
})
