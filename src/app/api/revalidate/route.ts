import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { SITE_CONTENT_TAG } from '@/lib/revalidate'

/**
 * Manual cache-busting endpoint (kept as a fallback). Content edits in the
 * Payload admin already trigger `revalidateTag` automatically via the
 * afterChange/afterDelete hooks in src/lib/revalidate.ts, so calling this is
 * usually unnecessary. Protected by REVALIDATION_TOKEN.
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const path = request.nextUrl.searchParams.get('path')

  if (secret !== process.env.REVALIDATION_TOKEN) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }

  try {
    revalidateTag(SITE_CONTENT_TAG)
    if (path) revalidatePath(path)
    return NextResponse.json({ revalidated: true, tag: SITE_CONTENT_TAG, now: Date.now() })
  } catch {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 })
  }
}
