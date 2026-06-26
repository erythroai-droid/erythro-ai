/**
 * Generates the Open Graph / social share banner (1200x630).
 *
 * Run with: node scripts/generate-og.mjs
 * Output:   public/images/og-image.png
 */
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'images', 'og-image.png')

const W = 1200
const H = 630

// Brand logo mark (red rounded square + white glyph) from the favicon source,
// scaled up from its 32x32 viewBox.
const logoMark = `
  <g transform="translate(110, 175) scale(8.75)">
    <rect width="32" height="32" rx="2" fill="#E52421"/>
    <path d="M16.2992 22.415C13.9936 21.9154 12.2688 20.7021 11.8992 18.2576H26.7712C26.912 17.4368 27 16.3305 27 15.3848C27 8.47944 23.04 5 16.352 5C16.3344 5 16.2992 5 16.2816 5V9.62141C16.352 9.62141 16.4224 9.62141 16.4928 9.62141C19.2032 9.62141 20.5936 11.031 20.6816 13.8324H16.2816H11.8816H5.2464C5.088 14.7068 5 15.6524 5 16.6695C5 24.0031 9.4704 27.5539 16.2992 28V22.4329V22.415Z" fill="white"/>
  </g>
`

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="78%" cy="22%" r="65%">
      <stop offset="0%" stop-color="#E52421" stop-opacity="0.30"/>
      <stop offset="55%" stop-color="#E52421" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#E52421" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#121212"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="28"
        fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2"/>

  ${logoMark}

  <text x="110" y="470" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="700" fill="#ffffff">Erythro.ai</text>
  <text x="114" y="540" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="400" letter-spacing="8" fill="#ffe9c7">DIGITAL AGENCY</text>

  <text x="${W - 60}" y="${H - 50}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="400" letter-spacing="2" fill="#ffffff" fill-opacity="0.55">erythro.ai</text>
</svg>
`

await sharp(Buffer.from(svg)).png().toFile(out)
console.log(`✓ og-image.png (${W}x${H}) → ${out}`)
