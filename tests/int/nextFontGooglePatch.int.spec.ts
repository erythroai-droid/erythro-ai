import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

// Guards patches/next@15.5.27.patch (PIT-151): Google Fonts sometimes returns extensionless
// /l/font?kit=… URLs, and next/font 15.5.27 crashed the build with "Cannot read properties of
// null (reading '1')". The fix is backported from next 16.4.3; on 16.4.3+ it is built in.
const require = createRequire(import.meta.url)
const { findFontFilesInCss } = require('next/dist/compiled/@next/font/dist/google/find-font-files-in-css.js') as {
  findFontFilesInCss: (
    css: string,
    subsetsToPreload?: string[],
  ) => Array<{ googleFontFileUrl: string; preloadFontFile: boolean; ext?: string }>
}

const face = (subset: string, src: string) => `/* ${subset} */
@font-face {
  font-family: 'Heebo';
  font-style: normal;
  font-weight: 200 900;
  font-display: swap;
  ${src}
  unicode-range: U+0307-0308, U+0590-05FF;
}
`

describe('next/font Google CSS parsing (PIT-151)', () => {
  it('keeps the extension of a normal fonts.gstatic.com URL', () => {
    const css = face('hebrew', "src: url(https://fonts.gstatic.com/s/heebo/v28/NGS6v5_NC0k9P9GKTbFhsqMA6aw.woff2) format('woff2');")
    const files = findFontFilesInCss(css, ['hebrew'])
    expect(files).toHaveLength(1)
    expect(files[0].ext).toBe('woff2')
    expect(files[0].preloadFontFile).toBe(true)
  })

  it('takes the type from format() when the URL has no extension', () => {
    const css =
      face('hebrew', "src: url(https://fonts.gstatic.com/l/font?kit=NGS6v5_NC0k9P9GKTbFh&skey=abc&v=v28) format('woff2');") +
      face('latin', "src: url(https://fonts.gstatic.com/l/font?kit=NGS6v5_NC0k9P9H2TbFh&skey=abc&v=v28) format('truetype');")
    const files = findFontFilesInCss(css)
    expect(files.map((f) => f.ext)).toEqual(['woff2', 'ttf'])
  })

  it('falls back to woff2 when neither the URL nor the CSS says the type', () => {
    const css = face('hebrew', 'src: url(https://fonts.gstatic.com/l/font?kit=NGS6v5_NC0k9P9GKTbFh&v=v28);')
    expect(findFontFilesInCss(css)[0].ext).toBe('woff2')
  })

  it('ignores a query string after a real extension', () => {
    const css = face('hebrew', "src: url(https://fonts.gstatic.com/s/heebo/v28/x.woff?v=2) format('woff');")
    expect(findFontFilesInCss(css)[0].ext).toBe('woff')
  })
})
