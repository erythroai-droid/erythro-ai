# ИИ-консультант Erythro (Gemini Flash + CMS knowledge base)

Статус: **v1 реализован**. Канон цен — живая CMS (Payload/Postgres), снимок в [`docs/consultant/erythro-knowledge-base.md`](../consultant/erythro-knowledge-base.md) — только fallback при падении CMS.

Связанные документы: [`RAG_INDEX.md`](../RAG_INDEX.md) · [`DEPLOYMENT.md`](../DEPLOYMENT.md) · [`AI_VISIBILITY.md`](../AI_VISIBILITY.md) · [`vps-docker-ports.md`](../infrastructure/vps-docker-ports.md)

## 1. Решение

Публичный консультант на сайте вызывает `POST /api/consult`. Мозг — **Gemini API** (`generativelanguage.googleapis.com`), ключ `GEMINI_API_KEY_AI_CHAT` только server-side. Браузер ключ не видит и на Google напрямую не ходит (CSP `connect-src 'self'`).

- Модель жёстко `gemini-3.6-flash` (как Funnel review в `AuditCollector.java`). `GEMINI_CONSULT_MODEL` — аварийный override.
- SDK: `ai` + `@ai-sdk/google`, `streamText` в Node route.
- xAI / Grok Bot / `XAI_API_KEY` **не используются**.
- Google Search grounding выключен: ответы не должны уезжать за пределы сайта.

Цены и пакеты **не** брать из `src/translations` / `src/lib/servicePages.ts` — production CMS их перебивает.

## 2. Три режима чата

| Режим | Контакты | Что пишем в БД |
|---|---|---|
| Справка (FAQ, пакеты, цены) | не просим, лимит анонимных сообщений | ничего |
| Каталог (готовый пакет / аудит) | не просим | ничего, отдаём чип на `/order` или `/audit` |
| Кастомное ТЗ | OTP-email + телефон | `consult-sessions` + `project-briefs` |
| Техконсультация | OTP-email | `tech-consult-tickets` |

Чат **не оформляет** заказ и не дублирует `/order/*`, `/audit`, контактную форму и оплату.

## 3. Поток

```text
[Widget on Vercel]
        │  POST /api/consult  (Turnstile action=consult, IP limit, анонимная квота)
        ▼
[Vercel Node route]
  system prompt = KB из Payload + bot rules из consultant-settings
  tools: get_knowledge_base, translate_terms, request_email_verification, identify_client,
         escalate_tech, draft_brief, submit_brief
        │
        ├── GEMINI_API_KEY_AI_CHAT → gemini-3.6-flash
        ├── CONSULT_TRANSLATE_URL → Translater (Docker на VPS, HMAC)
        ├── project-briefs → SMTP order@ (без вложений) → Monday.com
        └── tech-consult-tickets → SMTP техконсультанту
```

Нет `GEMINI_API_KEY_AI_CHAT` → `503`, виджет ведёт на форму.

Consultant Settings → **Consultant enabled** = off:

- `ChatButton` прячет spark-кнопку (мобильный FAB и пункт в desktop contact-fan) сразу после `GET /api/consult/copy` (`Cache-Control: private, no-store`).
- Панель чата не монтируется, пока copy не ответил — иначе окно вспыхивает из черновика в sessionStorage и сразу пропадает (PIT-089).
- `POST /api/consult` тоже отвечает `503 unconfigured`, чтобы кэшированный клиент не писал в модель.

### Кэш префикса промпта

Системный промпт (правила + глоссарий + слоты ТЗ + вся KB) одинаков для всех посетителей на одной локали и весит несколько тысяч входных токенов. Он уходит в **explicit context cache** Gemini (`cachedContents`), а в запрос идёт только история диалога:

- ключ кэша — sha256 от модели и текста промпта, поэтому правка в CMS автоматически создаёт новый кэш и старые цены отдать нельзя;
- TTL 1 час; на холодном старте делается один `LIST`, чтобы рестарты не плодили дубликаты, которые тарифицируются за хранение;
- в кэш кладётся **только** `systemInstruction`. Описания инструментов остаются в запросе, иначе правка инструмента ломала бы кэш;
- запрос не может содержать одновременно `cachedContent` и `systemInstruction` — отправляется ровно одно из двух;
- кэш — оптимизация, а не зависимость: если Gemini отверг хэндл и ни один чанк ещё не отправлен, запрос повторяется с инлайн-промптом, а кэш забывается;
- `CONSULT_PROMPT_CACHE=0` выключает механизм целиком.

## 4. Антиспам и временный OTP

Не аккаунты и не Payload-пользователи. Заслон до появления авторизации:

- Turnstile action `consult` + собственный IP-лимит (**не** наследует `AUDIT_INTAKE_LIMITS_OPEN_FOR_QA`).
- Анонимная квота пользовательских сообщений (дефолт 5 / 24 ч) — signed cookie + hash IP.
- Дальше `POST /api/consult/request-otp` → 6 цифр на почту (TTL 10 мин, только hash + pepper), `verify-otp` → httpOnly cookie `consult_verified` (HMAC, ~24 ч).
- После OTP второй потолок: 30 сообщений / сутки на verified email.
- Код в ленту чата не попадает — отдельные поля виджета, вне транскрипта и логов Gemini.

Снять при появлении авторизации: `CONSULT_EMAIL_OTP=0` + удалить `request-otp` / `verify-otp` (см. [`PLAN-deferred.md`](../PLAN-deferred.md)).

## 5. Translater совмещён с ассистентом

Для клиента — один виджет. Translater не второй экран, а обязательный backend-слой:

1. Чат: tool `translate_terms` для спорных IT-идиом (style `UI/Microcopy`).
2. ТЗ на EN/HE: полный pipeline Analyst → Translator → Auditor (style `Documentation/RFC`).
3. Копи виджета — один раз тем же HTTP/CLI в `consultant-settings`.

Pipeline живёт в Docker на VPS (`proxy_network` + Caddy, host-порт **не** публиковать — PIT-053). Не смешивать с образом QA_Auditor (там Playwright и 4.5 GB). VPS недоступен → термин остаётся как есть, ТЗ сохраняется с `translaterStatus=skipped`.

Сборка и деплой: [`services/translater/`](../../services/translater/README.md) (`Dockerfile`, `docker-compose.yml`, `.env.example`) + блок `translate.erythro.ai` в [`infra/caddy/Caddyfile`](../../infra/caddy/Caddyfile). Сам агент вендорится в образ при сборке (`services/translater/agent/`, в git не хранится).

## 6. Env

| Переменная | Где | Назначение |
|---|---|---|
| `GEMINI_API_KEY_AI_CHAT` | Vercel Production/Preview/Development, `.env` | server-only, консультант. Отдельный от аудиторского `GEMINI_API_KEY`; он же — fallback для локальной разработки |
| `GEMINI_CONSULT_MODEL` | опционально | дефолт `gemini-3.6-flash` |
| `CONSULT_EMAIL_OTP` | Vercel | `1` в v1; `0` после авторизации |
| `CONSULT_OTP_PEPPER` | Vercel | hash кода + подпись cookie; в prod обязателен |
| `CONSULT_TRANSLATE_URL` | Vercel | HTTPS Translater; пусто = glossary-only |
| `CONSULT_TRANSLATE_SECRET` | Vercel | HMAC к контейнеру |
| `MONDAY_API_TOKEN` / `MONDAY_BOARD_ID` | Vercel | CRM-карточка проекта |

Запрещено: любые `NEXT_PUBLIC_*` для этих значений.

## 7. Данные

- `consult-sessions` — только после OTP + телефона + предупреждения. `messages` хранится как **parts** (не строка), есть `handoff` (`bot` в v1). Срок 12 месяцев.
- `project-briefs` — `TZ-{id}`, письмо только на `order@` (копию клиенту не слать), `crmStatus`.
- `tech-consult-tickets` — `TC-{id}`, ответ клиенту **только email**, треда в виджете нет.
- В ТЗ и письмах запрещены вложения и любые URL.

## 8. Комплаенс

- Пометка «это ИИ» в первом сообщении виджета.
- Предупреждение о сохранении переписки — до запроса контактов.
- Фраза про чат-консультанта и 12 месяцев хранения — на `/privacy`.
- Цены вне KB не выдумывать; ориентир пакета помечен как «ориентир, не оферта».

## 9. Расширение (не v1)

Контракт заложен, фичи выключены: голос (STT/TTS), вложения (R2/CRM, не в ТЗ), вход инженера в ту же ленту (`handoff: bot | queued | human`).
