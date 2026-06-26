/**
 * Generates the favicon asset set from the source SVG.
 *
 * Run with: node scripts/generate-favicons.mjs
 *
 * Source:  public/images/favicon/favicon_32x32.svg
 * Output:  public/images/favicon/*  (+ favicon.ico)
 */
import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/** Assemble a multi-image .ico that embeds PNG frames (supported everywhere except very old IE). */
function buildIco(pngs) {
  const count = pngs.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(count, 4)

  const entries = Buffer.alloc(16 * count)
  let offset = 6 + 16 * count
  pngs.forEach(({ size, data }, i) => {
    const e = i * 16
    entries.writeUInt8(size >= 256 ? 0 : size, e + 0)
    entries.writeUInt8(size >= 256 ? 0 : size, e + 1)
    entries.writeUInt8(0, e + 2) // palette
    entries.writeUInt8(0, e + 3) // reserved
    entries.writeUInt16LE(1, e + 4) // color planes
    entries.writeUInt16LE(32, e + 6) // bits per pixel
    entries.writeUInt32LE(data.length, e + 8)
    entries.writeUInt32LE(offset, e + 12)
    offset += data.length
  })

  return Buffer.concat([header, entries, ...pngs.map((p) => p.data)])
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'public', 'images', 'favicon')
const source = join(dir, 'favicon_32x32.svg')

const pngTargets = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
]

const svg = await readFile(source)

for (const { name, size } of pngTargets) {
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(dir, name))
  console.log(`✓ ${name} (${size}x${size})`)
}

// Multi-resolution .ico (16/32/48) for legacy browsers and tabs.
const icoFrames = await Promise.all(
  [16, 32, 48].map(async (size) => ({
    size,
    data: await sharp(svg, { density: 384 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
  })),
)
await writeFile(join(dir, 'favicon.ico'), buildIco(icoFrames))
console.log('✓ favicon.ico (16/32/48)')

console.log('Done.')
