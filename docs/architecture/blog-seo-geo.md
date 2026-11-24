# Blog — SEO & GEO

Раздел `/blog` для регулярных статей: индексация поиском и цитирование AI-ассистентами.

Дата: **2026-11-24**.

## Цели

1. Дать Google / Bing канонические URL с sitemap, Article schema, RSS.
2. Дать AI-краулерам и ассистентам машиночитаемый текст (`Accept: text/markdown`, `llms.txt`, `BlogPosting` + Organization `@id`).
3. Не раздувать основное меню: ссылка только в футере (Company Links).

## Маршруты

| URL | Назначение |
|---|---|
| `/blog` | Лента опубликованных постов, `Blog` JSON-LD |
| `/blog/[slug]` | Пост: `BlogPosting` + `BreadcrumbList` + опц. `FAQPage` |
| `/blog/rss.xml` | RSS 2.0 (EN titles/excerpts) |
| `Accept: text/markdown` на `/blog` и `/blog/[slug]` | Чистый Markdown для RAG / grounding |

## CMS

Коллекция Payload `blog-posts` (admin → Content → Blog Posts).

| Поле | Зачем |
|---|---|
| `slug`, `status` (draft/published), `publishedAt` | URL + индексация только published |
| `title`, `excerpt`, `body` (EN/RU/HE) | Контент; excerpt = тезис для сниппета / AI |
| `cover` | Карточка + OG |
| `tags` | `Article.keywords` |
| `relatedLinks` | Перелинковка entity graph (`/audit`, `/services/*`, `/about`) |
| `faq` | Опциональный FAQ → FAQPage JSON-LD |
| `seo.title` / `seo.description` | Переопределение meta |

Миграция: `src/migrations/20261124_120000_blog_posts.ts` (+ сид ссылки Blog в footer company links).

## SEO / GEO чеклист при публикации

1. Status = **Published**, заполнить `publishedAt`.
2. Excerpt = прямой ответ / тезис (1–2 предложения).
3. В body — H2 как ответы на вопросы; факты без воды.
4. Related links на `/audit`, релевантный `/services/…`, `/about`.
5. SEO title/description при необходимости.
6. Soft-save в Production admin (ISR 1h) или дождаться TTL.
7. После деплоя: проверить `/blog/[slug]` в Rich Results / Schema Validator; при первом посте — Request indexing в GSC.

## Связанные файлы

```
src/collections/BlogPosts.ts
src/lib/blogPosts.ts
src/lib/blogCms.ts
src/lib/blogSchema.ts
src/app/(frontend)/blog/
src/components/blog/
src/lib/markdownNegotiation.ts
src/lib/sitemapEntries.ts
src/app/sitemap.ts
public/llms.txt
docs/AI_VISIBILITY.md
```

## Вне scope v1

Категории/авторы как отдельные сущности, комментарии, `speakable`, динамический список постов внутри `llms.txt` (сейчас — ссылка на `/blog` + sitemap/RSS/markdown).
