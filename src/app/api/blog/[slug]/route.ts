import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { blogApiAuthorized, blogApiTokenConfigured } from '@/lib/blogApiAuth'
import {
  findBlogPostBySlug,
  normalizeBlogSlug,
  parseBlogWriteBody,
  serializeBlogPost,
  upsertBlogPost,
} from '@/lib/blogApi'
import { mapBlogPostDoc } from '@/lib/blogCms'

type Ctx = { params: Promise<{ slug: string }> }

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function notConfigured() {
  return NextResponse.json(
    { error: 'BLOG_API_TOKEN is not configured' },
    { status: 503 },
  )
}

/**
 * GET    /api/blog/[slug]
 * PATCH  /api/blog/[slug]  — partial update / publish
 * DELETE /api/blog/[slug]
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  if (!blogApiTokenConfigured()) return notConfigured()
  if (!blogApiAuthorized(request.headers)) return unauthorized()

  const slug = normalizeBlogSlug((await ctx.params).slug)
  if (!slug) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })

  try {
    const payload = await getPayload({ config })
    const doc = await findBlogPostBySlug(payload, slug)
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const post = mapBlogPostDoc(doc)
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ post: serializeBlogPost(post) })
  } catch (err) {
    console.error('[api/blog/slug] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load post' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!blogApiTokenConfigured()) return notConfigured()
  if (!blogApiAuthorized(request.headers)) return unauthorized()

  const slug = normalizeBlogSlug((await ctx.params).slug)
  if (!slug) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = parseBlogWriteBody(
    { ...(typeof json === 'object' && json && !Array.isArray(json) ? json : {}), slug },
    { requireSlug: false, fallbackSlug: slug },
  )
  if ('error' in parsed) {
    return NextResponse.json(
      { error: parsed.error, details: parsed.details },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayload({ config })
    const existing = await findBlogPostBySlug(payload, slug)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { post } = await upsertBlogPost(payload, parsed)
    return NextResponse.json({ ok: true, created: false, post: serializeBlogPost(post) })
  } catch (err) {
    const status = typeof (err as { status?: number })?.status === 'number'
      ? (err as { status: number }).status
      : 500
    const message = err instanceof Error ? err.message : 'Failed to update post'
    if (status >= 500) console.error('[api/blog/slug] PATCH failed:', err)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!blogApiTokenConfigured()) return notConfigured()
  if (!blogApiAuthorized(request.headers)) return unauthorized()

  const slug = normalizeBlogSlug((await ctx.params).slug)
  if (!slug) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })

  try {
    const payload = await getPayload({ config })
    const existing = await findBlogPostBySlug(payload, slug)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).delete({
      collection: 'blog-posts',
      id: existing.id,
      overrideAccess: true,
    })

    return NextResponse.json({ ok: true, deleted: slug })
  } catch (err) {
    console.error('[api/blog/slug] DELETE failed:', err)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
