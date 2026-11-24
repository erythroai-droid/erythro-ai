import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { blogApiAuthorized, blogApiTokenConfigured } from '@/lib/blogApiAuth'
import {
  parseBlogWriteBody,
  serializeBlogPost,
  upsertBlogPost,
} from '@/lib/blogApi'
import { mapBlogPostDoc } from '@/lib/blogCms'

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
 * Blog API for automation / bots (no Cloudflare Access).
 * Auth: `Authorization: Bearer <BLOG_API_TOKEN>` or `x-blog-api-token`.
 *
 * GET  /api/blog?status=published|draft|all&limit=&page=
 * POST /api/blog  — create or upsert by slug
 */
export async function GET(request: NextRequest) {
  if (!blogApiTokenConfigured()) return notConfigured()
  if (!blogApiAuthorized(request.headers)) return unauthorized()

  const { searchParams } = request.nextUrl
  const statusParam = searchParams.get('status') || 'published'
  if (!['published', 'draft', 'all'].includes(statusParam)) {
    return NextResponse.json(
      { error: 'status must be published, draft, or all' },
      { status: 400 },
    )
  }

  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 50) || 50, 1), 200)
  const page = Math.max(Number(searchParams.get('page') || 1) || 1, 1)

  try {
    const payload = await getPayload({ config })
    const where =
      statusParam === 'all'
        ? undefined
        : { status: { equals: statusParam } }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (payload as any).find({
      collection: 'blog-posts',
      locale: 'all',
      depth: 1,
      limit,
      page,
      sort: '-publishedAt',
      overrideAccess: true,
      ...(where ? { where } : {}),
    })

    const docs = Array.isArray(res.docs) ? res.docs : []
    const posts = docs
      .map((d: unknown) => mapBlogPostDoc(d))
      .filter(Boolean)
      .map((p: NonNullable<ReturnType<typeof mapBlogPostDoc>>) => serializeBlogPost(p))

    return NextResponse.json({
      posts,
      total: res.totalDocs ?? posts.length,
      page: res.page ?? page,
      totalPages: res.totalPages ?? 1,
    })
  } catch (err) {
    console.error('[api/blog] GET failed:', err)
    return NextResponse.json({ error: 'Failed to list posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!blogApiTokenConfigured()) return notConfigured()
  if (!blogApiAuthorized(request.headers)) return unauthorized()

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = parseBlogWriteBody(json, { requireSlug: true })
  if ('error' in parsed) {
    return NextResponse.json(
      { error: parsed.error, details: parsed.details },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayload({ config })
    const { post, created } = await upsertBlogPost(payload, parsed)
    return NextResponse.json(
      { ok: true, created, post: serializeBlogPost(post) },
      { status: created ? 201 : 200 },
    )
  } catch (err) {
    const status = typeof (err as { status?: number })?.status === 'number'
      ? (err as { status: number }).status
      : 500
    const message = err instanceof Error ? err.message : 'Failed to save post'
    if (status >= 500) console.error('[api/blog] POST failed:', err)
    return NextResponse.json({ error: message }, { status })
  }
}
