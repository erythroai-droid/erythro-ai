# Blog API — publish without admin UI

Machine API for creating / updating / listing `blog-posts`. Bypasses Cloudflare Access on `/admin*`; uses a dedicated token.

Date: **2026-11-25**.

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

Hooks on the collection still run → ISR revalidation via `SITE_CONTENT_TAG` (same as admin Save).

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

`body` may be plain text (split on blank lines → paragraphs) or Lexical JSON (`{ "root": { ... } }`).

Optional: `publishedAt` (ISO), `cover` (Media id), `seo` / `seoTitle` / `seoDescription`, `faq`.

Slug rules: lowercase, numbers, hyphens; reserved: `page`.

## Example

```bash
curl -sS -X POST "https://erythro.ai/api/blog" \
  -H "Authorization: Bearer $BLOG_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slug":"geo-checklist-2026","status":"published","title":"GEO checklist","excerpt":"Five checks.","body":"Paragraph one.\n\nParagraph two."}'
```

Publish a draft later:

```bash
curl -sS -X PATCH "https://erythro.ai/api/blog/geo-checklist-2026" \
  -H "Authorization: Bearer $BLOG_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"published"}'
```

## Files

```
src/app/api/blog/route.ts
src/app/api/blog/[slug]/route.ts
src/lib/blogApi.ts
src/lib/blogApiAuth.ts
```

## Out of scope v1

Cover upload by URL, markdown→Lexical headings/lists, public unauthenticated JSON feed (use `/blog/rss.xml` + markdown negotiation).
