# Архитектурный регламент: Сервис AI-Аудита (MVP)

Статус: **MVP без оплаты**. Платежный шлюз, идемпотентность вебхуков, Telegram-алерты и отдельная RAG-коллекция — отложены (см. §8).

Связанные документы: [`DEPLOYMENT.md`](../DEPLOYMENT.md) · [`r2-audit-storage.md`](./r2-audit-storage.md) · [`infrastructure/vps-n8n.md`](../infrastructure/vps-n8n.md) · [`RAG_INDEX.md`](../RAG_INDEX.md) · [`PITFALLS.md`](../PITFALLS.md)

---

## 0. Границы MVP

| В scope | Вне scope (позже) |
|---|---|
| Заявка с формы → запись в CMS → запуск worker | Stripe / Tranzila / Yaad Pay |
| Генерация HTML/PDF-отчёта | Идемпотентность платёжных вебхуков |
| Хранение отчёта в **Cloudflare R2** | Telegram DLQ/алерты |
| Письмо клиенту с `order@erythro.ai` | Отдельная коллекция `KnowledgeBase` + pgvector |
| Страница выдачи `/audit/report/[id]` | Cloudflare Pro/Enterprise |
| n8n reconciliation (базовый cron) | Отдельная коллекция `audits` (пока расширяем `contact-submissions`) |

---

## 1. Системный стек и карта компонентов

```text
                         [ Пользователь / Клиент ]
                                     │
                                     ▼ (HTTPS / DNS Proxied)
                          [ Cloudflare Free ]
                          DNS · WAF · SSL · Rate Limit
                                     │
                                     ▼
                    [ Vercel: Next.js 15 + Payload CMS 3 ]
                    (Node serverless, не чистый Edge Runtime)
                                     │
            ┌────────────────────────┼────────────────────────┐
            ▼                        ▼                        ▼
 [ Supabase PostgreSQL ]   [ Cloudflare R2 ]      [ Hostinger VPS ]
 - contact-submissions     - PDF / HTML отчёты    - Docker: proxy_network
 - users, media meta       - S3-compatible API    - Caddy (SSL)
 - Drizzle via Payload                            - n8n orchestrator
                                                  - Audit worker (Playwright)

 [ Hostinger SMTP ]
 From: order@erythro.ai  →  клиент (+ notify inbox из Site Settings)
```

| Компонент | Платформа | Назначение |
|---|---|---|
| **Edge & DNS** | Cloudflare **Free** | DNS Proxied, базовый WAF, SSL/TLS Full (Strict) к origin, Rate Limiting на формы |
| **Frontend & API** | Vercel (Node serverless) | Next.js App Router, Payload CMS, Zod, Server Actions / Route Handlers |
| **База данных** | Supabase Managed PostgreSQL | Единый источник правды; заявки аудита в `contact-submissions` |
| **Объектное хранилище** | **Cloudflare R2** | PDF/HTML-отчёты и тяжёлые дампы (миграция с Vercel Blob) |
| **Compute & Worker** | Hostinger VPS (Docker) | Caddy, n8n, headless Chromium / Playwright worker |
| **Почта** | Hostinger SMTP | Транзакционные письма с `order@erythro.ai` (Resend — только fallback, если настроен) |

---

## 2. Маршруты продукта

| Маршрут | Роль |
|---|---|
| `/audit` | Лендинг / заказ AI-аудита (существующий) |
| `/order/audit-free`, `/order/audit-diagnostic`, `/order/audit-pro` | Чекаут по тарифу (без оплаты в MVP — submit заявки) |
| **`/audit/report/[id]`** | **Выдача результата** (polling статуса + безопасный просмотр отчёта) |

`/audit` и `/audit/report/[id]` не смешивать: лендинг ≠ страница результата.

---

## 3. Схема данных: расширение `contact-submissions`

Отдельная коллекция `audits` **отложена**. MVP опирается на существующую `ContactSubmissions` (`source: 'audit'`).

Файл: `src/collections/ContactSubmissions.ts`

### 3.1. Уже есть (не ломать)

| Поле | Назначение |
|---|---|
| `name`, `email`, `phone`, `message` | Контакт клиента |
| `source` | `audit` для заявок аудита |
| `locale` | Язык UI сайта |
| `website` | Проверяемый URL |
| `auditLanguage` | `en` \| `ru` \| `he` — язык отчёта |
| `planSlug` | `audit-free` \| `audit-diagnostic` \| `audit-pro` |
| `planTotal` | Отображаемая сумма (информативно; оплаты нет) |
| `auditStatus` | `new` → `in_progress` → `report_sent` |

### 3.2. Добавить для pipeline

| Поле | Тип | Назначение |
|---|---|---|
| `auditScore` | `number` | Итоговая оценка 0–100 |
| `auditSummary` | `json` | Структурированные выводы LLM |
| `reportUrl` | `text` | Публичный/signed URL объекта в R2 |
| `htmlResult` | `textarea` (опц.) | Компактный HTML до ~2MB; крупные — только R2 |
| `retryCount` | `number`, default `0` | Счётчик авто-перезапусков |
| `errorLast` | `textarea` (опц.) | Последняя ошибка worker (без Telegram в MVP — смотреть в CMS) |

### 3.3. Статусы MVP (без payment)

```text
new  →  in_progress  →  report_sent
                 ↘ failed   (после max retries; ручной разбор в /admin)
```

Access: публичный REST `create` **запрещён**. Создание только через server-side `/api/contact` (local Payload API). `read`/`update` — staff / service key.

Импорты Payload 3: `import type { CollectionConfig } from 'payload'` (не `payload/types`).

---

## 4. Хранилище: миграция на Cloudflare R2

### 4.1. Решение

| Было | Станет |
|---|---|
| Vercel Blob (`@payloadcms/storage-vercel-blob`) для media | **Cloudflare R2** — отчёты аудита; media Payload — либо тоже R2, либо поэтапно |

Для AI-аудита отчёты **обязательно** пишутся в R2 (S3 API). Миграция media Payload с Blob → R2 — отдельный шаг в том же направлении (единый object store).

### 4.2. Конфиг (ориентир)

- Bucket: например `erythro-audit-reports` (и при полной миграции — `erythro-media`)
- Доступ worker: R2 Access Key ID + Secret (S3-compatible endpoint)
- Публичная выдача: R2 custom domain **или** short-lived signed URL на `/audit/report/[id]`
- Env (Vercel + VPS worker): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` (если есть)

Payload: заменить/добавить S3-compatible storage adapter под R2 вместо (или параллельно с выключением) Vercel Blob — см. `@payloadcms/storage-s3` + endpoint R2.

> После смены storage-плагина обязателен `pnpm generate:importmap` (PIT-001 / admin blank).

---

## 5. Docker & Reverse Proxy (Hostinger VPS)

Текущий n8n: HTTP на IP (см. `docs/infrastructure/vps-n8n.md`). Целевое состояние MVP — Caddy + HTTPS + общая сеть.

### 5.1. Сеть

```bash
docker network create proxy_network
```

### 5.2. Caddy

`/home/caddy/Caddyfile`:

```caddy
n8n.erythro.ai {
    reverse_proxy n8n:5678
}

agent-api.erythro.ai {
    reverse_proxy audit_agent_worker:8080
}
```

`/home/caddy/docker-compose.yml`:

```yaml
services:
  caddy:
    image: caddy:latest
    container_name: caddy_proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - proxy_network

volumes:
  caddy_data:
  caddy_config:

networks:
  proxy_network:
    external: true
```

DNS (Cloudflare Free, Proxied): `n8n`, `agent-api` → IP VPS. SSL Mode к origin: Full (Strict) после валидных сертификатов Caddy.

### 5.3. n8n

```yaml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: n8n_app
    restart: unless-stopped
    environment:
      - N8N_HOST=n8n.erythro.ai
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://n8n.erythro.ai/
      - GENERIC_TIMEZONE=Asia/Jerusalem
      - N8N_DEFAULT_BINARY_DATA_MODE=filesystem
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - proxy_network

volumes:
  n8n_data:

networks:
  proxy_network:
    external: true
```

### 5.4. Audit worker

Предпочтение MVP: **Node.js + Playwright** (единый язык со стеком сайта). Java/Spring — допустим как отдельный репозиторий агента, если уже есть кодовая база.

Пример Node-ориентированного compose:

```yaml
services:
  audit-agent:
    build: .
    container_name: audit_agent_worker
    restart: unless-stopped
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - PAYLOAD_API_URL=https://erythro.ai
      - AGENT_SECRET_TOKEN=${AGENT_SECRET_TOKEN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - R2_ACCOUNT_ID=${R2_ACCOUNT_ID}
      - R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
      - R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
      - R2_BUCKET=${R2_BUCKET}
      - SMTP_HOST=smtp.hostinger.com
      - SMTP_PORT=465
      - SMTP_USER=order@erythro.ai
      - SMTP_PASS=${SMTP_PASS}
    deploy:
      resources:
        limits:
          cpus: "1.5"
          memory: 3500M
    networks:
      - proxy_network

networks:
  proxy_network:
    external: true
```

Эндпоинт: `POST /api/run-audit` с заголовком `X-Agent-Secret-Key`. Ответ сразу `200 OK`, работа в фоне.

Секреты только в env / secrets store — **не** коммитить в git и не класть plaintext в docs.

---

## 6. Data flow MVP (без оплаты)

```text
[Клиент: /audit или /order/audit-*]
        │
        ▼ (1) POST /api/contact  source=audit
[Payload: contact-submissions]
  auditStatus = new
  planSlug / website / auditLanguage / …
        │
        ▼ (2) Сразу после create (без платёжного вебхука)
[Авторизованный POST → agent-api.erythro.ai/api/run-audit]
  Header: X-Agent-Secret-Key
  Body: { submissionId, targetUrl, locale, planSlug }
        │
        ▼ (3) Worker
  auditStatus → in_progress
  Chromium / Lighthouse / Playwright → технический лог
  LLM → выводы на auditLanguage
  PDF/HTML → Cloudflare R2 → reportUrl
  Письмо клиенту: From order@erythro.ai (Hostinger SMTP)
        │
        ▼ (4)
[contact-submissions]
  auditStatus = report_sent
  auditScore, auditSummary, reportUrl
        │
        ▼ (5) Выдача
  Email с ссылкой / вложением
  Страница /audit/report/[id] (polling → iframe srcDoc или redirect на reportUrl)
```

Когда подключат оплату: между шагами (1) и (2) встанет шлюз + webhook; шаг (2) станет «после paid». Контракт worker **не меняется**.

---

## 7. Отказоустойчивость в MVP

1. **Атомарный порядок доставки:** сначала R2 + статус `report_sent` в БД, затем письмо клиенту.
2. **Cron reconciliation (n8n):** каждые 5–10 мин искать `source=audit` со статусом `new` / `in_progress` старше N минут без `reportUrl` → рестарт worker, `retryCount++`.
3. **Лимит попыток:** при `retryCount >= 3` → `failed`; разбор вручную в Payload Admin (Telegram — позже).
4. **Многоканальная выдача:**
   - Email с `order@erythro.ai`
   - `/audit/report/[id]`
   - Прямой `reportUrl` в R2 (по политике доступа)

Идемпотентность платёжных вебхуков и Telegram DLQ — **вне MVP**.

---

## 8. Отложено (бэклог)

| Тема | Когда |
|---|---|
| Платёжный цикл (Stripe / Tranzila / Yaad) + подпись вебхука + идемпотентность | После стабильного happy-path |
| Telegram-алерты / DLQ | После базового `failed` в CMS |
| Коллекция `audits` (вынос из contact-submissions) | При росте объёма / отдельном биллинге |
| `KnowledgeBase` + pgvector | Отдельная RAG-фаза; пока корпус = `docs/` + Obsidian |
| Cloudflare Pro/Enterprise | По нагрузке / бот-трафику |
| Resend как primary SMTP | Только если Hostinger нестабилен |

---

## 9. Порядок внедрения (чеклист)

1. [x] Bucket R2 + credentials; адаптер storage / SDK upload отчётов — bucket `erythro-audit-reports` (WEUR); credentials — вручную (см. [`r2-audit-storage.md`](./r2-audit-storage.md)); upload SDK — в worker
2. [ ] Миграция media Payload Blob → R2 (или dual-write → cutover) + `generate:importmap`
3. [x] Поля pipeline в `ContactSubmissions` + миграция Postgres (`20260831_120000_contact_submissions_audit_pipeline`)
4. [x] Caddy + DNS `n8n` / `agent-api` на VPS — Caddy/n8n/worker подняты; DNS A (DNS only) + Let's Encrypt OK
5. [x] Worker `/api/run-audit` + секрет — `services/audit-agent` на VPS; секрет в `AGENT_SECRET_TOKEN`
6. [x] Триггер из `/api/contact` после create (`source=audit`) — `src/lib/auditAgentTrigger.ts` (нужен `AGENT_SECRET_TOKEN` + `AUDIT_AGENT_URL` на Vercel)
7. [ ] Страница `/audit/report/[id]`
8. [ ] Письмо клиенту через существующий SMTP (`order@erythro.ai`)
9. [ ] n8n cron reconciliation
10. [ ] (Позже) оплата → тот же trigger, что п.6

---

## 10. Соответствие стеку Erythro.ai

| Стандарт проекта | В этом регламенте |
|---|---|
| Next.js 15 App Router, React 19, Payload 3, Supabase | Да |
| RTL / EN·RU·HE | `auditLanguage` + UI locale |
| Cloudflare | Free, Proxied |
| Почта | `order@erythro.ai` |
| Object storage | Cloudflare R2 (целевое) |
| VPS / n8n | Hostinger + Docker + Caddy |
| Без оплаты в MVP | Да; payment — последний модуль |
