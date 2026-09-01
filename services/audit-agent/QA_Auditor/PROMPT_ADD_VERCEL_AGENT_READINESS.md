# Prompt: Vercel Level 1 — «Improve your domain for AI agents»

Скопируй **весь этот файл** в чат агента при работе в репозитории  
`C:\agents\website-auditor\erythro-ai`.

Не путать с `PROMPT_ADD_AI_VISIBILITY_TESTS.md` — тот блок (llms.txt, MCP, JSON-LD, /about, GA4) **уже внедрён**. Этот промпт добавляет **пять новых проверок** из Vercel Dashboard → **Improve your domain for AI agents → Level 1 (5/5)**.

---

## Роль

Ты — Lead QA Automation Engineer в Erythro.ai. Работай в `QA_Auditor/` (Java 17+, Playwright, Maven). Не ломай существующие проверки RTL, lead capture, PageSpeed, security headers, llms.txt/MCP.

Референс продакшена (золотой стандарт, все 5 checks pass): `https://erythro.ai`  
Исходники сайта: `C:\dev\erythro-ai` — `docs/AI_VISIBILITY.md`, `src/app/robots.txt/route.ts`, `src/middleware.ts`, `src/lib/markdownAccept.ts`, `src/app/sitemap.ts`.

Спеки:

- robots / AI bots: не блокировать GPTBot, ClaudeBot, CCBot, Google-Extended (+ ChatGPT-User, PerplexityBot, Applebot-Extended, anthropic-ai)
- Content Signals: https://contentsignals.org/ — директива `Content-Signal:` в `robots.txt`
- Markdown negotiation: `Accept: text/markdown` → `Content-Type: text/markdown` с той же URL, что отдаёт HTML браузеру (Vercel: content negotiation, не обязательно `*.md`)
- Sitemap: XML-карта + строка `Sitemap:` в robots.txt

---

## Что уже есть (не дублировать)

В `AuditCollector.java`:

| Есть | Где |
|---|---|
| `GET /robots.txt` как файл индексации | `collectInfrastructureSecurity` → `has_robots_txt` |
| `GET /sitemap.xml` как SEO-карта | там же → `has_sitemap_xml`, `sitemap_urls_count` |
| Allow/Disallow для 4 ботов | `AI_CRAWLER_BOTS` = GPTBot, ClaudeBot, CCBot, Google-Extended; `parseRobotsAiAccess` |
| llms.txt, MCP, /about, JSON-LD, dataLayer | `collectAiVisibility` + `AI_VISIBILITY_SCRIPT` |

Чего **нет** (дырки относительно Vercel Level 1):

1. Парсинг `Content-Signal:` из robots.txt
2. HTTP-проверка Markdown Negotiation (`Accept: text/markdown`)
3. Sitemap как **карта для агентов** (директива `Sitemap:` + валидный XML + `<loc>` + желательно `<lastmod>`) — сейчас только «файл есть»
4. Расширенный список AI-ботов (как на erythro.ai)
5. HTML-discovery markdown: `link[rel=alternate][type="text/markdown"]`
6. Отдельные строки scorecard / PDF / MD / findings под эти 5 checks

Важно: `documentRequest()` шлёт `Accept: */*`. Для markdown нужен **отдельный** request с `Accept: text/markdown`. Иначе проверка всегда получит HTML.

---

## Задача

Расширь блок `ai_visibility` вложенным объектом **`vercel_level1`** (ровно 5 checks Vercel) и вызови сбор из `collectAiVisibility`. Обнови отчёты, score, findings, i18n-строки PDF.

### Файлы

```
QA_Auditor/src/main/java/ai/erythro/AuditCollector.java
QA_Auditor/src/main/java/ai/erythro/ReportFindingsCatalog.java
QA_Auditor/src/main/java/ai/erythro/A44Recommendations.java
QA_Auditor/src/main/java/ai/erythro/AuditReportI18n.java   # только если без этого не обойтись
QA_Auditor/AGENTS.md
QA_Auditor/README.md
```

**Не раздувай** позиционный конструктор `AuditReportI18n` (~80 аргументов). Новые названия строк PDF бери через `ReportFindingsCatalog.tr(lang, ru, en, he)` в `appendAiVisibilityCheckRows`.

---

## 1. Пять проверок Vercel Level 1

Вызови новые методы из `collectAiVisibility(origin, domSignals)` после существующих fetch. Origin без trailing slash.

### L1-1. `robots_txt` — Preferences for bot behavior (High impact)

«Базовые house rules»: агенты понимают, кто сайт и куда можно ходить.

| Поле | Pass |
|---|---|
| HTTP | `GET {origin}/robots.txt` → **200** |
| Не HTML | body не начинается с `<` / `<!DOCTYPE` |
| Есть правила | хотя бы один `User-agent:` и хотя бы один `Allow:` или `Disallow:` |
| Не глухой запрет `*` | у `User-agent: *` нет `Disallow: /` (или `Disallow:` пустой) **без** компенсирующего `Allow: /` |

`ok = true` только если все четыре. Warn (не fail): нет `Host:`.  
Cloudflare: если body содержит `BEGIN Cloudflare Managed` — `cloudflare_managed=true` (warn; часто затирает сигналы).

Не путать с L1-3: здесь проверяем **наличие валидного robots.txt**, не список AI-ботов.

### L1-2. `sitemap` — Give agents a website map (High impact)

| Поле | Pass |
|---|---|
| Директива | в robots.txt есть `Sitemap: https://...` (абсолютный URL) |
| Fetch | этот URL (fallback `{origin}/sitemap.xml`) → **200** |
| XML | body содержит `<urlset` или `<sitemapindex` |
| Есть URL | ≥ 1 тег `<loc>` с http(s) URL |
| lastmod | warn, не fail: доля URL с `<lastmod>` < 50% |

Переиспользуй `infrastructure_and_security.robots_sitemap_directives` / `sitemap_locs`, но **сохрани отдельный объект** в `vercel_level1.sitemap` (не только SEO-флаг `has_sitemap_xml`).

`ok = true` если директива + 200 + xml + loc≥1.

Опциональный warn (не fail): нет `/sitemap.md` — это docs-паттерн Vercel, у маркетинговых сайтов его может не быть.

### L1-3. `ai_crawler_rules` — Manage AI bots

Расширь константу:

```java
private static final List<String> AI_CRAWLER_BOTS = List.of(
        "GPTBot", "ChatGPT-User", "ClaudeBot", "anthropic-ai",
        "CCBot", "Google-Extended", "Applebot-Extended", "PerplexityBot"
);
```

Логика как в текущем `parseRobotsAiAccess`: для каждого бота взять его блок, иначе `*`.

- `severe_block=true` если у бота `Disallow: /` (или пустой Disallow) **и нет** `Allow: /`
- `ok = true` если `severe_block=false` **и** robots.txt вообще валиден (L1-1)
- В JSON: `allowed_bots`, `blocked_bots`, `explicit_allow_bots` (боты, у которых свой `User-agent:` блок с `Allow: /` — как на erythro.ai)

Не требуй отдельный блок на каждого бота: fallback на `*` с `Allow: /` — это pass (Vercel/isitagentready так и считают).  
Fail / bad в PDF только при `severe_block`.

### L1-4. `content_signals` — Declare how automated systems should use your content

Парси директивы `Content-Signal:` / `Content-signal:` из **того же** robots.txt ([contentsignals.org](https://contentsignals.org/)).

Форматы:

```
Content-Signal: ai-train=no, search=yes, ai-input=yes
Content-Signal: /about ai-train=yes, search=yes, ai-input=yes
```

Ключи: `search`, `ai-input`, `ai-train`. Значения: `yes` | `no` (case-insensitive).

| Поле | Pass |
|---|---|
| Наличие | ≥ 1 валидная директива с хотя бы одним ключом |
| Полнота | warn, если нет всех трёх ключей |
| Политика (info) | сохрани разобранную карту; **не fail** из-за `ai-train=no` — это валидная политика erythro.ai |

`ok = true` если есть ≥ 1 валидный сигнал (на `*` или на любом AI-боте).  
`ok = false` если robots нет или ни одной директивы (типичный fail Vercel Level 1).

Опционально (info, не fail): HTTP-заголовок `Content-Signal` / `content-signal` на markdown-ответе. На erythro.ai markdown route шлёт `content-signal: ai-train=yes, search=yes` — не путать с robots-политикой `ai-train=no`.

### L1-5. `markdown_negotiation` — Serve AI-optimized text formats

Два запроса на **одну и ту же** homepage URL (`origin + "/"` или `origin`):

**A. Markdown (обязательный)**

```
GET {origin}/
Accept: text/markdown
```

Pass:

- status 200
- `Content-Type` содержит `text/markdown` или `text/x-markdown` или `text/vnd.markdown`
- body **не** HTML (`<!DOCTYPE`, `<html`, `<head`)
- body похож на markdown: начинается с `#` **или** есть `##` / заголовок + ссылки `[text](url)` / список `- `
- длина body ≥ 80 символов (не пустая заглушка)

Warn (не fail): нет `Vary` с токеном `Accept` (риск отдать markdown из CDN браузеру).

**B. HTML control (обязательный, чтобы не сломать людей)**

```
GET {origin}/
Accept: text/html
```

- `Content-Type` содержит `html` **или** body начинается как HTML
- если и HTML-запрос отдаёт markdown — `ok=false`, `browser_broken=true` (критично)

**C. DOM discovery (warn, не fail для `ok`)**

В `AI_VISIBILITY_SCRIPT` на главной:

```javascript
const mdAlternate = !!document.querySelector(
  'link[rel="alternate"][type="text/markdown"], link[rel="alternate"][type="text/x-markdown"]'
);
```

На erythro.ai: `<link rel="alternate" type="text/markdown" href="/" />`.

Не требуй URL вида `/page.md` — erythro использует negotiation, не суффикс.

`ok = true` только если A pass **и** B не сломан.

Реализация HTTP: не используй `documentRequest()`. Сделай `markdownRequest(URI)` с заголовком `Accept: text/markdown` и `htmlRequest` с `Accept: text/html`.

---

## 2. JSON в `audit_data.json`

Внутри `ai_visibility` добавь:

```json
"vercel_level1": {
  "robots_txt": {
    "status": 200,
    "ok": true,
    "has_user_agent": true,
    "has_allow_or_disallow": true,
    "star_blocks_root": false,
    "cloudflare_managed": false
  },
  "sitemap": {
    "ok": true,
    "robots_sitemap_directive": true,
    "sitemap_url": "https://example.com/sitemap.xml",
    "status": 200,
    "is_xml": true,
    "loc_count": 12,
    "lastmod_ratio": 1.0
  },
  "ai_crawler_rules": {
    "ok": true,
    "severe_block": false,
    "allowed_bots": ["GPTBot", "ClaudeBot"],
    "blocked_bots": [],
    "explicit_allow_bots": ["GPTBot"]
  },
  "content_signals": {
    "ok": true,
    "present": true,
    "signals": { "search": "yes", "ai-input": "yes", "ai-train": "no" },
    "has_all_three_keys": true
  },
  "markdown_negotiation": {
    "ok": true,
    "status": 200,
    "content_type": "text/markdown; charset=utf-8",
    "is_markdown_body": true,
    "vary_accept": true,
    "html_still_html": true,
    "browser_broken": false,
    "dom_alternate_link": true
  },
  "checks_passed": 5,
  "checks_total": 5,
  "score": 100
}
```

`checks_passed` = число L1-* с `ok=true`. `score` = round(passed/5*100).

Существующие ключи `llms_txt`, `mcp_manifest`, `robots_ai`, `dom` **не удаляй**. `robots_ai` можно наполнить из того же парсера, что L1-3 (расширенный список ботов).

---

## 3. Score `ai_visibility`

Сейчас 7 критериев. Станет **10**:

1. llms.txt  
2. MCP manifest  
3. /about  
4. robots AI `!severe_block` (L1-3)  
5. Organization schema  
6. `llms_describedby`  
7. dataLayer (+ consent stub как сейчас)  
8. **content_signals.ok** (L1-4)  
9. **markdown_negotiation.ok** (L1-5)  
10. **sitemap.ok** (L1-2)  

L1-1 (валидный robots) почти всегда следует из L1-3; в десятку отдельно не включай, но в `vercel_level1.score` он входит.

`ai_visibility.checks_total = 10`. Шкала scorecard `ai_visibility` по-прежнему 0–100 из этих 10.

---

## 4. Отчёты

### Markdown (`generateMarkdownReport`, секция «7. 🤖 AI VISIBILITY»)

Добавь **5 строк** после существующих (или подзаголовок «Vercel Agent Readiness — Level 1»):

| Check | Fix hint (RU), если fail |
|---|---|
| robots.txt (house rules) | Опубликуйте валидный /robots.txt с User-agent и Allow/Disallow |
| Sitemap для агентов | Добавьте Sitemap: в robots.txt и XML с \<loc\> |
| AI Crawler Rules | Allow: / для GPTBot/ClaudeBot; выключите Cloudflare Managed robots.txt |
| Content Signals | Content-Signal: search=yes, ai-input=yes, ai-train=no (политика сайта) |
| Markdown Negotiation | Отдавайте text/markdown по Accept: text/markdown с той же URL |

### PDF check rows (`appendAiVisibilityCheckRows`)

Две новые агрегированные строки (чтобы не раздуть A4):

1. **Content Signals + AI crawler rules** — good если L1-3 и L1-4 ok; bad если severe_block; warn если нет сигналов  
2. **Markdown negotiation + sitemap** — good если L1-2 и L1-5 ok; warn если одно из двух; bad если оба fail  

Существующую строку `checkRobotsAi` оставь, но в details добавь `Content-Signal: …` если есть.

ids для `checkRow`: `content_signals`, `markdown_neg`.

### A44Recommendations

Добавь ветки `content_signals` и `markdown_neg` (и `recKey`). Коммерческий тон, ru/en/he:

- нет Content-Signal → агенты не знают, можно ли цитировать сайт в ответах vs train  
- нет markdown → ChatGPT/Perplexity тянут HTML+JS, путают бренд, дороже токены  

### ReportFindingsCatalog

В агрегированный finding «ИИ-ассистенты не находят ваш сайт» добавь gaps:

- `Content-Signal в robots.txt`
- `Markdown negotiation (Accept: text/markdown)`
- `Sitemap для агентов`

Расширь `Context` **только если нужно** (новые boolean). Если не хочешь трогать гигантский record — читай `vercel_level1` из `ai_visibility` там, где уже есть `aiVisScore`, либо добавь 3 boolean в конец Context и обнови единственный `new Context(...)` в `calculateExecutiveScorecard`.

---

## 5. DOM script

В `AI_VISIBILITY_SCRIPT` добавь `markdown_alternate` (см. L1-5 C) в возвращаемый объект. В `collectAiVisibility` скопируй в `vercel_level1.markdown_negotiation.dom_alternate_link`.

---

## 6. Документация агента

`AGENTS.md` — в § «AI Visibility & Brand Discovery» и в таблицу чеклиста добавь подраздел **Vercel Agent Readiness Level 1** с 5 ID.

`README.md` — в bullet AI Visibility допиши: Content Signals, Markdown Negotiation, sitemap для агентов, AI crawler rules.

---

## Acceptance criteria

1. `reports/audit_data.json` → `ai_visibility.vercel_level1` с 5 объектами + `score`.
2. Прогон `mvn compile exec:java` против `https://erythro.ai` (нужен сеть): все 5 L1 = `ok: true`. Не регрессия llms/MCP/schema/GA4.
3. PDF и MD показывают новые строки. RU/EN/HE не сломаны (`REPORT_LANG=en` и `he` хотя бы компилируются / строки не null).
4. Сайт **без** markdown negotiation не падает аудитором: L1-5 `ok: false`, статус warn/bad, процесс доходит до PDF.
5. Не требовать Erythro-специфичные слова в markdown body (проверка универсальна для любого `origin`).

---

## Pitfalls

- **Accept: */*** в `documentRequest` — отдельный markdown-запрос обязателен.
- **Cloudflare Managed robots.txt** — прод может показать `Disallow: /` для GPTBot и вырезать `Content-Signal`. Пиши это в fix hint. На erythro.ai Managed должен быть OFF.
- **`AuditReportI18n` конструктор** — не добавляй поля без правки всех трёх локалей RU/EN/HE; лучше `tr()`.
- **Кэш CDN**: если markdown 200 но body HTML — часто нет `Vary: Accept`. Фиксируй `vary_accept=false`, всё равно fail по content-type/body.
- **Не ломай HTML**: control-запрос с `Accept: text/html` обязателен.
- **Windows**: smoke через `curl.exe`, не unix `head`.

---

## Smoke (после реализации, против prod)

```powershell
curl.exe -s https://erythro.ai/robots.txt
curl.exe -s https://erythro.ai/sitemap.xml | Select-Object -First 20
curl.exe -s -D - -H "Accept: text/markdown" https://erythro.ai/ -o - | Select-Object -First 30
curl.exe -s -D - -H "Accept: text/html" https://erythro.ai/ | Select-Object -First 20
```

Ожидание на erythro.ai:

- robots: блоки `User-Agent: GPTBot` … `PerplexityBot` с `Content-Signal: ai-train=no, search=yes, ai-input=yes` и `Allow: /`
- `Sitemap: https://erythro.ai/sitemap.xml`
- markdown: `content-type: text/markdown`, тело с `# Erythro.ai`
- html: по-прежнему HTML

Референс реализации сайта:

```
src/app/robots.txt/route.ts
src/app/sitemap.ts
src/middleware.ts          # rewrite на /api/markdown-negotiate
src/lib/markdownAccept.ts  # shouldServeMarkdown
src/app/api/markdown-negotiate/route.ts
src/app/(frontend)/layout.tsx  # link rel=alternate type=text/markdown
```

---

## Порядок работы

1. Прочитай текущие `collectAiVisibility`, `parseRobotsAiAccess`, `appendAiVisibilityCheckRows`, `AI_VISIBILITY_SCRIPT`.
2. Реализуй парсер Content-Signal + markdown HTTP + sitemap-as-agent-map.
3. Вклей JSON, score 10, PDF/MD rows, findings, A44.
4. Обнови AGENTS.md / README.md.
5. `mvn compile` затем полный прогон на `https://erythro.ai`.
6. Кратко отчитайся: 5/5 L1 на erythro.ai, список файлов, что осталось warn.
