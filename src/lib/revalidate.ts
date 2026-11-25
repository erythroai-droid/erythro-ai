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
 * Blog-only cache tag. Blog posts are read only by `/blog/**`, the blog API, markdown
 * negotiation and the sitemap, so a post save must not flush the whole site: every full
 * flush re-reads all CMS content from Supabase and rewrites every ISR page (PIT-172).
 */
export const BLOG_CONTENT_TAG = 'payload-blog'

/**
 * Drops the cached site content. Wrapped in try/catch because Payload config
 * (and therefore these hooks) is also loaded outside a Next.js request scope
 * — e.g. `payload generate:types`, migrations, seed scripts — where
 * `revalidateTag` is unavailable and would otherwise throw.
 */
function revalidateContent(): void {
  try {
    // Next 16 asks for a profile; { expire: 0 } keeps the old behaviour: a CMS edit is live on
    // the next request, not served stale while it revalidates in the background.
    revalidateTag(SITE_CONTENT_TAG, { expire: 0 })
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

/** Drops blog caches and blog routes only (index, pages, posts, RSS) plus the sitemap. */
function revalidateBlog(): void {
  try {
    revalidateTag(BLOG_CONTENT_TAG, { expire: 0 })
    revalidatePath('/blog', 'layout')
    revalidatePath('/sitemap.xml')
  } catch (err) {
    console.error('[revalidate] blog skipped (no request scope):', err)
  }
}

export const revalidateBlogOnChange: CollectionAfterChangeHook = ({ doc }) => {
  revalidateBlog()
  return doc
}

export const revalidateBlogOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateBlog()
  return doc
}

/**
 * A freshly uploaded file is not referenced by any page yet — the post/page that starts
 * using it revalidates on its own save. Only edits to an existing file (alt, replace) can
 * change rendered pages, so only those flush the site (PIT-172: blog bot uploads).
 */
export const revalidateMediaOnChange: CollectionAfterChangeHook = ({ doc, operation }) => {
  if (operation === 'update') revalidateContent()
  return doc
}
