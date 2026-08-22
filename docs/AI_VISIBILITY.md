# AI visibility — Erythro.ai

Документ описывает, что сделано на `erythro.ai` для **AI-видимости** (обнаружение бренда
ассистентами, корректные факты, измерение AI-referral трафика, базовая безопасность).

Дата внедрения: **2026-08-22**. Коммит: `Add AI visibility assets: llms.txt, brand schema, and security headers.`

Полная карта деплоя и Cloudflare: `DEPLOYMENT.md` §15.

---

## Цели

1. Дать AI-системам **канонический источник фактов** о бренде (меньше галлюцинаций).
2. Разрешить **индексацию AI-краулерами** (robots + Cloudflare AI Crawl Control).
3. Подготовить **машиночитаемые сигналы** (schema, MCP, llms.txt).
4. Включить **GA4 Consent Mode stub** и `dataLayer` для детекта аналитики сканерами.
5. Закрыть **HTTP security headers** (CSP, X-Frame-Options и др.).

---

## Что добавлено в коде

| Артефакт | Путь | Назначение |
|---|---|---|
| llms.txt | `public/llms.txt` → `/llms.txt` | Визитка для LLM ([llmstxt.org](https://llmstxt.org)) |
| MCP manifest | `src/app/.well-known/mcp/route.ts` | Discovery endpoint `/.well-known/mcp` (SEP-1960 style) |
| Brand API | `src/app/api/mcp/route.ts` | Read-only JSON с фактами о бренде |
| About / Brand Facts | `src/app/(frontend)/about/` | Каноническая страница `/about` |
| Organization schema | `src/lib/brandSchema.ts` + `src/components/StructuredData.tsx` | JSON-LD: Organization, WebSite, FAQPage |
| GA bootstrap | `src/components/AnalyticsBootstrap.tsx` | `dataLayer` + Consent Mode default в `<head>` |
| AI referral | `src/lib/aiReferral.ts` | Детект referrer ChatGPT/Perplexity и push в dataLayer |
| Security headers | `next.config.ts` → `headers()` | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| robots Allow AI | `src/app/robots.ts` | Явный `Allow: /` для GPTBot, ClaudeBot, CCBot и др. |
| Sitemap | `src/app/sitemap.ts` | URL `/about` |
| Layout link | `src/app/(frontend)/layout.tsx` | `<link rel="describedby" href="/llms.txt">` |

Тесты: `tests/int/brandSchema.int.spec.ts`.

---

## Проверка на проде

```bash
curl -sI https://erythro.ai | findstr /i "content-security-policy x-frame-options x-content-type-options referrer-policy permissions-policy strict-transport"
curl -s https://erythro.ai/llms.txt
curl -s https://erythro.ai/.well-known/mcp
curl -s https://erythro.ai/about
curl -s https://erythro.ai/robots.txt
```

Ожидаемо после деплоя:

- `llms.txt` — 200, markdown с H1 и ссылками на `/about`, `/contacts`
- `/.well-known/mcp` — 200, `application/json`, поля `mcp_version`, `endpoints`
- `/about` — 200, Brand Facts (dl/dt/dd, список услуг, соцсети)
- Главная — в HTML есть `application/ld+json` с `@type":"Organization"` и `window.dataLayer`
- `robots.txt` — **нет** `Disallow: /` для GPTBot/ClaudeBot; есть `Allow: /` per AI bot
- Заголовки — 6 из 6 (HSTS + CSP + X-Frame-Options + X-Content-Type-Options + Referrer-Policy + Permissions-Policy)

---

## Cloudflare (обязательно вручную)

**Managed robots.txt: OFF** в AI Crawl Control — иначе Cloudflare дописывает
`Disallow: /` для AI-ботов поверх Next.js.

Путь: Cloudflare Dashboard → **AI Crawl Control** → выключить **Managed robots.txt**;
вкладка **Security / Crawlers** — **Allow** для нужных ботов.

См. `DEPLOYMENT.md` §15.

---

## Что ещё может падать в внешних аудитах

| Критерий | Статус | Примечание |
|---|---|---|
| GTM container | Не внедрён | GA4 напрямую; GTM опционален |
| GA4 full load без cookies | Частично | Полный `gtag.js` только после Accept; stub в HTML есть |
| AI channel grouping в GA4 UI | Не настроено | Нужна ручная настройка в GA4 admin |
| Honeypot на формах | Готово | `ContactHoneypotField` + `contactHoneypot.ts`; silent drop в `/api/contact` |
| MCP tools/resources server | Только discovery + `/api/mcp` JSON | Полноценный MCP-сервер не требуется для маркетингового сайта |

---

## Связанные файлы

```
public/llms.txt
src/app/.well-known/mcp/route.ts
src/app/api/mcp/route.ts
src/app/(frontend)/about/
src/lib/aboutPage.ts
src/lib/brandSchema.ts
src/lib/aiReferral.ts
src/components/StructuredData.tsx
src/components/AnalyticsBootstrap.tsx
src/components/AnalyticsLoader.tsx
src/app/robots.ts
next.config.ts
```

---

## Чеклист при изменении бренда

- [ ] Обновить факты в `public/llms.txt` (телефон, email, услуги)
- [ ] Проверить `/about` (контент из CMS через `getCachedSiteContent`)
- [ ] Organization schema подтянет `SiteSettings` автоматически — проверить `sameAs` (Facebook, TikTok)
- [ ] Перезапустить внешний AI visibility scan
