# AI visibility — Erythro.ai

Документ описывает, что сделано на `erythro.ai` для **AI-видимости** (обнаружение бренда
ассистентами, корректные факты, измерение AI-referral трафика, базовая безопасность).

Дата внедрения: **2026-08-22**. Коммит: `Add AI visibility assets: llms.txt, brand schema, and security headers.`

Дополнения agent-readiness (**2026-08-28**): Content Signals, Link headers (RFC 8288 / 9727),
API Catalog, OpenAPI, Markdown negotiation, ACP discovery.

Полная карта деплоя и Cloudflare: `DEPLOYMENT.md` §15.

---

## Цели

1. Дать AI-системам **канонический источник фактов** о бренде (меньше галлюцинаций).
2. Разрешить **индексацию AI-краулерами** (robots + Cloudflare AI Crawl Control).
3. Подготовить **машиночитаемые сигналы** (schema, MCP, llms.txt, Content Signals, Link headers).
4. Включить **GA4 Consent Mode stub** и `dataLayer` для детекта аналитики сканерами.
5. Закрыть **HTTP security headers** (CSP, X-Frame-Options и др.).
6. Упростить **discovery для агентов** (api-catalog, OpenAPI, markdown negotiation).

---

## Что добавлено в коде

| Артефакт | Путь | Назначение |
|---|---|---|
| llms.txt | `public/llms.txt` → `/llms.txt` | Визитка для LLM ([llmstxt.org](https://llmstxt.org)) |
| MCP manifest | `src/app/.well-known/mcp/route.ts` | Discovery endpoint `/.well-known/mcp` (SEP-1960 style) |
| Brand API | `src/app/api/mcp/route.ts` | Read-only JSON с фактами о бренде |
| About / Brand Facts | `src/app/(frontend)/about/` | Каноническая страница `/about` |
| Organization schema | `src/lib/brandSchema.ts` + `src/components/StructuredData.tsx` | JSON-LD: Organization (`sameAs`: GitHub, LinkedIn, FB, TG; `founder`: Person), WebSite, FAQPage |
| GA bootstrap | `src/components/AnalyticsBootstrap.tsx` | `dataLayer` + Consent Mode default в `<head>` |
| AI referral | `src/lib/aiReferral.ts` | Детект referrer ChatGPT/Perplexity и push в dataLayer |
| Security headers | `next.config.ts` → `headers()` | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| robots + Content Signals | `src/app/robots.txt/route.ts` | `Allow: /` для AI-ботов; `Content-Signal: ai-train=no, search=yes, ai-input=yes` ([contentsignals.org](https://contentsignals.org/)) |
| Link headers | `src/middleware.ts` + `src/lib/agentDiscovery.ts` | На `/`: `api-catalog`, `service-desc`, `service-doc`, `describedby` (RFC 8288 / 9727) |
| API Catalog | `src/app/.well-known/api-catalog/route.ts` | `application/linkset+json` каталог публичных API |
| OpenAPI | `src/app/openapi.json/route.ts` | `rel=service-desc` для Brand API / MCP |
| Markdown negotiation | `src/lib/markdownNegotiation.ts` + `src/app/api/markdown-negotiate/` | `Accept: text/markdown` → structured Markdown |
| ACP discovery | `src/app/.well-known/acp.json/`, `src/app/.well-known/acp/` | Agentic Commerce Protocol discovery |
| security.txt | `src/app/.well-known/security.txt/route.ts` | RFC 9116 vulnerability disclosure (`Contact: order@`) |
| Sitemap | `src/app/sitemap.ts` | URL `/about` (и др.) |
| Layout link | `src/app/(frontend)/layout.tsx` | `<link rel="describedby" href="/llms.txt">`, `alternate` markdown |

Тесты: `tests/int/brandSchema.int.spec.ts`, `tests/int/markdownNegotiation.int.spec.ts`,
`tests/int/acpDiscovery.int.spec.ts`, `tests/int/securityTxt.int.spec.ts`.

Внешний скан: [isitagentready.com](https://isitagentready.com/) — ожидать pass для
`contentSignals`, `linkHeaders`, `apiCatalog` (после деплоя + Cloudflare).

### CI / деплой грабли (закрыты 2026-08-28)

| Проблема | Фикс | PIT |
|---|---|---|
| Vercel: middleware тянул Payload → `node:*` | Edge-only `markdownAccept.ts` | PIT-024 |
| Unit: 404 на `/order/audit-diagnostic` | статический slug из `ORDER_PLANS` | PIT-025 |
| Unit: 68 pass + unhandled rejections | mock Payload без `DATABASE_URL` | PIT-026 |

См. `PLAYBOOK.md` §9.20, `PITFALLS.md`.

---

## Проверка на проде

```bash
curl -sI https://erythro.ai | findstr /i "content-security-policy x-frame-options x-content-type-options referrer-policy permissions-policy strict-transport ^link:"
curl -s https://erythro.ai/llms.txt
curl -s https://erythro.ai/.well-known/mcp
curl -s https://erythro.ai/.well-known/api-catalog
curl -sI https://erythro.ai/.well-known/api-catalog
curl -s https://erythro.ai/.well-known/security.txt
curl -s https://erythro.ai/openapi.json
curl -s https://erythro.ai/about
curl -s https://erythro.ai/robots.txt
curl -s -H "Accept: text/markdown" https://erythro.ai/
```

Ожидаемо после деплоя:

- `llms.txt` — 200, markdown с H1 и ссылками на `/about`, `/contacts`
- `/.well-known/mcp` — 200, `application/json`, поля `mcp_version`, `endpoints`
- `/.well-known/api-catalog` — 200, `application/linkset+json`, профиль RFC 9727
- `/.well-known/security.txt` — 200, `text/plain`, `Contact: mailto:order@erythro.ai`, Expires 2027-01-01
- `/openapi.json` — 200, OpenAPI 3.x с путями `/api/mcp`, `/.well-known/mcp`
- `/about` — 200, Brand Facts (dl/dt/dd, список услуг, соцсети)
- Главная — в HTML есть `application/ld+json` с `@type":"Organization"` и `window.dataLayer`
- Главная — ответный заголовок `Link:` с `rel="api-catalog"` (и др.)
- `robots.txt` — **нет** `Disallow: /` для GPTBot/ClaudeBot; есть `Allow: /` per AI bot;
  есть `Content-Signal: ai-train=no, search=yes, ai-input=yes`
- `Accept: text/markdown` на `/` — `text/markdown` тело
- Заголовки — 6 из 6 (HSTS + CSP + X-Frame-Options + X-Content-Type-Options + Referrer-Policy + Permissions-Policy)

---

## Политика Content Signals

| Сигнал | Значение | Смысл |
|---|---|---|
| `search` | yes | Классическая поисковая индексация |
| `ai-input` | yes | RAG / grounding / ответы ассистентов (llms.txt, MCP) |
| `ai-train` | no | Без обучения / fine-tuning на контенте сайта |

---

## Cloudflare (обязательно вручную)

**Managed robots.txt: OFF** в AI Crawl Control — иначе Cloudflare дописывает
`Disallow: /` для AI-ботов поверх Next.js (и может затереть Content Signals).

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
| DNS-AID / Web Bot Auth | Не внедрено | Опционально для isitagentready |

---

## Связанные файлы

```
public/llms.txt
src/app/.well-known/mcp/route.ts
src/app/.well-known/api-catalog/route.ts
src/app/.well-known/acp.json/route.ts
src/app/.well-known/acp/route.ts
src/app/api/mcp/route.ts
src/app/api/markdown-negotiate/route.ts
src/app/openapi.json/route.ts
src/app/robots.txt/route.ts
src/app/(frontend)/about/
src/lib/aboutPage.ts
src/lib/agentDiscovery.ts
src/lib/brandSchema.ts
src/lib/aiReferral.ts
src/lib/markdownAccept.ts
src/lib/markdownNegotiation.ts
src/components/StructuredData.tsx
src/components/AnalyticsBootstrap.tsx
src/components/AnalyticsLoader.tsx
src/middleware.ts
vitest.setup.ts
next.config.ts
```

---

## Чеклист при изменении бренда

- [ ] Обновить факты в `public/llms.txt` (телефон, email, услуги)
- [ ] Проверить `/about` (контент из CMS через `getCachedSiteContent`)
- [ ] Organization schema подтянет `SiteSettings` и канонические профили — проверить `sameAs` (GitHub, LinkedIn, Facebook, Telegram)
- [ ] При смене публичных API — обновить `src/lib/agentDiscovery.ts` (Link header, catalog, OpenAPI)
- [ ] Перезапустить внешний AI visibility / isitagentready scan
