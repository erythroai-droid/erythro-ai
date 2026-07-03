import { Inter, Roboto_Mono } from 'next/font/google'

/** Self-hosted via next/font — avoids a render-blocking fonts.googleapis.com request. */
export const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

export const robotoMono = Roboto_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
  variable: '--font-roboto-mono',
  display: 'swap',
})
