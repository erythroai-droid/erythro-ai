import { NextRequest, NextResponse } from 'next/server'
import { getR2Object } from '@/lib/r2'

export const runtime = 'nodejs'

const ALLOWED = new Set([
  'logo-digital.svg',
  'logo-footer.svg',
  'icon-idea-16.svg',
  'icon-idea.svg',
  'icon-arrow-down.svg',
  'icon-copy.svg',
  'icon-alert.svg',
  'icon-diagram.svg',
  'chart-grid.svg',
  'figma-a4.png',
])

const FALLBACK_TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
}

type RouteParams = { params: Promise<{ path?: string[] }> }

/**
 * Serve A44 report static assets from R2 (assets/figma-assets/*).
 * HTML rewrites ../../templates/figma-assets/X → /api/audit/assets/figma-assets/X
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { path: parts } = await params
  if (!parts || parts.length !== 2 || parts[0] !== 'figma-assets') {
    return new NextResponse('Not found', { status: 404 })
  }

  const file = parts[1]
  if (!ALLOWED.has(file) || file.includes('..') || file.includes('/') || file.includes('\\')) {
    return new NextResponse('Not found', { status: 404 })
  }

  const obj = await getR2Object(`assets/figma-assets/${file}`)
  if (!obj) {
    return new NextResponse('Not found', { status: 404 })
  }

  const ext = file.includes('.') ? `.${file.split('.').pop()!.toLowerCase()}` : ''
  const contentType =
    obj.contentType || FALLBACK_TYPES[ext] || 'application/octet-stream'

  return new NextResponse(new Uint8Array(obj.body), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
