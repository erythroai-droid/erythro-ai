# Blog API — publish without admin UI

Machine API for creating / updating / listing `blog-posts`, plus media upload for covers and body assets. Bypasses Cloudflare Access on `/admin*`; uses a dedicated token.

Date: **2026-11-25** (media upload added same day).

## Auth

Env: `BLOG_API_TOKEN` (Production + Preview on Vercel).

Send either:

```http
Authorization: Bearer <BLOG_API_TOKEN>
```

or

```http
x-blog-api-token: <BLOG_API_TOKEN>
```

Missing token config → **503**. Bad token → **401**.

Do **not** reuse `AGENT_SECRET_TOKEN` or Payload admin password.

## Endpoints

| Method | Path | Action |
|---|---|---|
| `GET` | `/api/blog?status=published\|draft\|all&limit=&page=` | List |
| `POST` | `/api/blog` | Create or upsert by `slug` |
| `GET` | `/api/blog/[slug]` | One post (incl. drafts) |
| `PATCH` | `/api/blog/[slug]` | Partial update / publish |
| `DELETE` | `/api/blog/[slug]` | Hard delete |
| `POST` | `/api/blog/media` | Upload image/video → Media (R2) |

Hooks on the collection still run → ISR revalidation via `SITE_CONTENT_TAG` (same as admin Save).

## Media upload (`POST /api/blog/media`)

Allowed: **jpeg / png / webp / gif / avif**, **mp4 / webm / mov**.  
`alt` is required (Payload Media field).

### A) Multipart (small files ≤ 4 MB)

```bash
curl -sS -X POST "https://erythro.ai/api/blog/media" \
  -H "Authorization: Bearer $BLOG_API_TOKEN" \
  -F "file=@./cover.jpg" \
  -F "alt=GEO checklist cover"
```

### B) JSON by public HTTPS URL (≤ 12 MB)

```bash
curl -sS -X POST "https://erythro.ai/api/blog/media" \
  -H "Authorization: Bearer $BLOG_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/clip.mp4","alt":"Product demo","filename":"demo.mp4"}'
```

Response:

```json
{ "ok": true, "media": { "id": 234, "url": "https://…", "mimeType": "image/jpeg", "alt": "…", "filename": "…" } }
```

Use `media.id` as `cover` on the post. Larger videos: upload elsewhere (or admin), then pass HTTPS URL / id.

Private / localhost URLs are rejected (SSRF guard).

## Body shape (POST / PATCH)

Minimal create (EN only; plain text → Lexical paragraphs):

```json
{
  "slug": "geo-checklist-2026",
  "status": "published",
  "title": "GEO checklist for B2B sites",
  "excerpt": "Five concrete checks before you claim AI-search visibility.",
  "body": "First paragraph.\n\n## Direct answer\n\nSecond paragraph.",
  "tags": ["GEO", "SEO"],
  "relatedLinks": [
    { "href": "/audit", "label": { "en": "Free AI audit", "ru": "Бесплатный AI-аудит", "he": "ביקורת AI חינם" } }
  ]
}
```

### Cover (photo or video)

Any of:

```json
{ "cover": 234 }
```

```json
{ "cover": { "id": 234 } }
```

```json
{
  "cover": {
    "url": "https://example.com/og.jpg",
    "alt": "GEO checklist cover"
  }
}
```

`cover: null` clears the cover.

Locales as maps or nested blocks:

```json
{
  "slug": "geo-checklist-2026",
  "status": "published",
  "title": { "en": "...", "ru": "...", "he": "..." },
  "excerpt": { "en": "...", "ru": "...", "he": "..." },
  "body": { "en": "...", "ru": "...", "he": "..." },
  "ru": { "title": "...", "excerpt": "...", "body": "..." },
  "he": { "title": "...", "excerpt": "...", "body": "..." }
}
```

`body` may be plain text (split on blank lines → paragraphs) or Lexical JSON (`{ "root": { ... } }`). Inline Lexical upload nodes for in-article media are supported by the frontend renderer if the bot sends full Lexical with `relationTo: media` (advanced); the simple path is **cover + text**.

Optional: `publishedAt` (ISO), `seo` / `seoTitle` / `seoDescription`, `faq`.

Slug rules: lowercase, numbers, hyphens; reserved: `page`.

## Example — upload cover then publish

```bash
# 1) upload
MEDIA=$(curl -sS -X POST "https://erythro.ai/api/blog/media" \
  -H "Authorization: Bearer $BLOG_API_TOKEN" \
  -F "file=@./cover.jpg" -F "alt=Cover")
ID=$(echo "$MEDIA" | jq -r .media.id)

# 2) create post
curl -sS -X POST "https://erythro.ai/api/blog" \
  -H "Authorization: Bearer $BLOG_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"slug\":\"geo-checklist-2026\",\"status\":\"published\",\"title\":\"GEO checklist\",\"excerpt\":\"Five checks.\",\"body\":\"Paragraph one.\",\"cover\":$ID}"
```

Or one shot with URL cover:

```bash
curl -sS -X POST "https://erythro.ai/api/blog" \
  -H "Authorization: Bearer $BLOG_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slug":"geo-checklist-2026","status":"published","title":"GEO checklist","excerpt":"Five checks.","body":"Hi.","cover":{"url":"https://example.com/og.jpg","alt":"Cover"}}'
```

## Files

```
src/app/api/blog/route.ts
src/app/api/blog/[slug]/route.ts
src/app/api/blog/media/route.ts
src/lib/blogApi.ts
src/lib/blogApiAuth.ts
src/lib/blogMediaApi.ts
```

## Out of scope

Markdown→Lexical headings/lists, public unauthenticated JSON feed (use `/blog/rss.xml` + markdown negotiation), direct-to-R2 multipart for files >12 MB.
