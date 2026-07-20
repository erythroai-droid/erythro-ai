import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

/**
 * Cache tag shared by every cached read of editable site content
 * (see `getCachedSiteContent` / `getCachedSeoSettings` in getSiteContent.ts).
 */
export const SITE_CONTENT_TAG = 'payload-content'

/**
 * Drops the cached site content. Wrapped in try/catch because Payload config
 * (and therefore these hooks) is also loaded outside a Next.js request scope
 * — e.g. `payload generate:types`, migrations, seed scripts — where
 * `revalidateTag` is unavailable and would otherwise throw.
 */
function revalidateContent(): void {
  try {
    revalidateTag(SITE_CONTENT_TAG)
    revalidatePath('/', 'layout')
    // Keep SEO endpoints in sync when services / portfolio / plans change.
    revalidatePath('/sitemap.xml')
    revalidatePath('/robots.txt')
  } catch (err) {
    console.error('[revalidate] skipped (no request scope):', err)
  }
}

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc }) => {
  revalidateContent()
  return doc
}

export const revalidateOnChange: CollectionAfterChangeHook = ({ doc }) => {
  revalidateContent()
  return doc
}

export const revalidateOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateContent()
  return doc
}
