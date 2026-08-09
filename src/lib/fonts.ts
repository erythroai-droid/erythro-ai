import { Heebo, Inter, Roboto_Mono } from 'next/font/google'

/**
 * Self-hosted via next/font — avoids a render-blocking fonts.googleapis.com request.
 *
 * Use the variable Inter file (no static weight list) so Next emits ~1–2 subset
 * preloads instead of one file per weight. Secondary families use preload:false
 * to stop Chrome “preloaded but not used” console spam on cold loads.
 */
export const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

/**
 * Inter has no Hebrew subset in next/font — Heebo covers hero outline/FG glyphs
 * for `he` (falls through the --font-sans stack when Inter lacks a codepoint).
 * Not preloaded: unused on en/ru first paint; still loads via CSS when needed.
 */
export const heebo = Heebo({
  subsets: ['hebrew'],
  variable: '--font-heebo',
  display: 'swap',
  preload: false,
})

/** Sparse UI use (hero pre-heading, code-ish labels) — load on demand. */
export const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto-mono',
  display: 'swap',
  preload: false,
})
