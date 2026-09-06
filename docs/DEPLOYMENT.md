# Деплой Erythro.ai: Supabase + Vercel

Журнал боевого деплоя проекта на прод. Описывает **что настроено**, **какие ошибки сборки
встретились и как починены**, и **что осталось на будущее**. Дополняет `PLAYBOOK.md`
(там — про разработку; здесь — про инфраструктуру и деплой).

Статус: **сайт задеплоен и работает** (Production, Vercel, Node.js 24.x, БД — Supabase).

**Связанные документы:** [`RAG_INDEX.md`](./RAG_INDEX.md) · [`PITFALLS.md`](./PITFALLS.md) ·
[`PORTFOLIO_CMS.md`](./PORTFOLIO_CMS.md) · [`PLAYBOOK.md`](./PLAYBOOK.md)

---

## 1. Архитектура прода

| Слой | Решение |
|---|---|
| Хостинг / билд | Vercel (GitHub-интеграция, авто-деплой по push в `main`) |
| Рантайм | Vercel Functions (Fluid Compute), регион `iad1` |
| База данных | Supabase PostgreSQL |
| Node.js | `24.x` (билд-образ Vercel) |
| Пакетный менеджер | pnpm 10.x |

Репозиторий: `github.com/erythroai-droid/erythro-ai`, ветка `main`.
Деплой триггерится автоматически при каждом push/merge в `main`, **после** прохождения
GitHub Actions (см. §11).

---

## 2. Supabase (база данных)

### Подключение
В Supabase есть несколько строк подключения. Для разных сценариев используются разные:

| Сценарий | Строка | Порт |
|---|---|---|
| Локальная разработка / сидинг | **Direct connection** (`db.<ref>.supabase.co`) | 5432 |
| Прод на Vercel (serverless) | **Transaction pooler** (`...pooler.supabase.com`) | 6543 |
| Запасной для прода | **Session pooler** (`...pooler.supabase.com`) | 5432 |

### Важно про SSL
`pg-connection-string` v3 трактует `sslmode=require` как `verify-full`, и Supabase падает с
`self-signed certificate in certificate chain`. Решение — использовать **`sslmode=no-verify`**:

```
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-1-...pooler.supabase.com:6543/postgres?sslmode=no-verify
```

### Сидинг
Контент (globals, services, solution-plans на en/ru/he) залит в Supabase скриптом
`scripts/seed.ts`. Схема Payload запушена туда же (dev `push`).
> ⚠️ Пользователей-админов сид **не создаёт** — первый админ создаётся вручную через `/admin`
> на задеплоенном сайте.

### Предотвращение засыпания БД (Free Tier Keepalive)
На бесплатном тарифе Supabase проект засыпает (pauses) после 7 дней неактивности.
Для предотвращения настроен GitHub Actions workflow `.github/workflows/keepalive-db.yml` (каждые 3 дня) и скрипт `scripts/ping-db.mjs` (`pnpm db:ping`), который шлет легковесный ping-запрос к Postgres и HTTP endpoint.

---

## 3. Переменные окружения на Vercel

`Settings → Environment Variables` (Production / Preview / Development):

| Переменная | Значение | Назначение |
|---|---|---|
| `DATABASE_URL` | Transaction pooler URI (порт 6543, `sslmode=no-verify`) | подключение к Supabase |
| `PAYLOAD_SECRET` | случайный 64-символьный hex (`openssl`/`crypto.randomBytes(32)`) | шифрование сессий Payload — **не менять после первого деплоя** |
| `NEXT_PUBLIC_SITE_URL` | `https://erythro.ai` | canonical / OG |
| `REVALIDATION_TOKEN` | (опционально) | для On-Demand Revalidation из n8n — добавить позже |
| `SMTP_PASS` | пароль ящика Hostinger `order@erythro.ai` | форма шлёт с `order@erythro.ai` на email из Site Settings → Contacts |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | sitekey виджета (публичный). Алиас: `TURNSTILE_SITE_KEY` | Cloudflare Turnstile на формах |
| `TURNSTILE_SECRET` | secret виджета. Алиас: `TURNSTILE_SECRET_KEY` | server-side siteverify, не в браузер |
| `TURNSTILE_HOSTNAMES` | `erythro.ai,www.erythro.ai` (prod) | allowlist hostname из siteverify; **без** localhost на проде |

Локально те же значения лежат в `.env` (он в `.gitignore`, в репозиторий не попадает).

---

## 4. Ошибки сборки и их фиксы (хронология)

Первый деплой не прошёл с первого раза. Последовательно вылезли 4 проблемы:

### 4.1. Node.js: `engines.node` не совпал с билд-образом
**Симптом:** сборка падала за ~8 сек сразу после `Vercel CLI`, без шага установки зависимостей.
**Причина:** в `package.json` стояло `"node": ">=24.15.0"`, а билд-образ Vercel использует Node
`24.11.0` — он **не** попадает в диапазон `>=24.15.0`, и Vercel не находит подходящую версию.
**Фикс:** указывать только мажорную версию (рекомендация Vercel):
```json
"engines": { "node": "24.x" }
```

### 4.2. Двойной лок-файл (npm + pnpm)
**Симптом:** Vercel мог выбрать неверный пакетный менеджер.
**Причина:** в репозитории лежали и `pnpm-lock.yaml`, и `package-lock.json`.
**Фикс:** удалён `package-lock.json` (проект на pnpm — скрипты, `engines.pnpm`, секция `pnpm`).

### 4.3. Устаревший `pnpm-lock.yaml`
**Симптом:** `ERR_PNPM_OUTDATED_LOCKFILE` — `rimraf@^6.1.3` есть в `package.json`, но нет в локе.
**Причина:** CI ставит зависимости с `--frozen-lockfile`; при расхождении установка падает.
**Фикс:** пересобрать лок локально тем же мажором pnpm (10.x):
```bash
pnpm install --lockfile-only
```

### 4.4. Уязвимая версия Next.js (жёсткий блок Vercel)
**Симптом:** `next build` фактически собирался, но Vercel помечал деплой **Build Failed** с текстом
`Vulnerable version of Next.js detected`.
**Причина:** Vercel теперь блокирует выкладку версий Next.js с критической RCE
**CVE-2025-66478** (CVSS 10.0). Был `next@15.1.0`.
**Фикс:** апгрейд в патч-версию, совместимую с Payload 3.85
(peer-окно `>=15.4.11 <15.5.0`) + апгрейд React:
```json
"next": "~15.4.11",
"react": "^19.2.0",
"react-dom": "^19.2.0"
```
> Тильда `~15.4.11` важна: каретка `^15.4.11` подтянула бы 15.5.x — вне окна Payload.
> Патчированные версии Next по линиям: 15.4.x → 15.4.11+, 15.5.x → 15.5.7+, 16.0.x → 16.0.7+.

---

## 5. Что проверить после каждого деплоя

1. Статус деплоя в **Deployments** → должен быть **Ready** (зелёный).
2. `https://<домен>/admin` открывается, можно войти / создать админа.
3. Главная страница рендерится, контент тянется из Supabase (en/ru/he, тема, cookie-баннер).
4. **Runtime Logs** без ошибок 500 / подключения к БД.
5. Контактная форма: заявка в `/admin` **и** письмо на `order@erythro.ai` (см. §13, PIT-020).

---

## 6. Открытые задачи на будущее (TODO)

- [x] **Медиа-хранилище — Vercel Blob.** Подключён адаптер `@payloadcms/storage-vercel-blob`
      для коллекции `media` (см. §8). Загрузки из админки теперь переживают редеплой.
- [x] **Домен `erythro.ai`.** Привязан, сайт открывается по основному домену.
- [x] **Миграции схемы Payload (частично).** Formal migrations лежат в `src/migrations/` и
      гоняются через `payload migrate` на билде (не `prodMigrations` на каждый serverless init — PIT-027). Для отстающих колонок на проде/CI добавлены
      idempotent fix-скрипты (`pnpm db:fix-*`) — см. §12. Полностью уйти от исторического
      `push`-наследия на Supabase ещё предстоит аудитом.
- [ ] **Безопасность Next.js.** Держать Next запатченным (выходят новые CVE: 55183/55184/67779 и т.д.).
      Обновлять в пределах окна Payload или поднимать Payload.
- [ ] **Transaction pooler и prepared statements.** Если в Runtime Logs появится
      `prepared statement "..." already exists` — переключить `DATABASE_URL` на **Session pooler**
      (порт 5432).
- [x] **On-Demand Revalidation контента.** `getSiteContent` / `getSeoSettings` обёрнуты в
      `unstable_cache` с тегом `payload-content` (см. `src/lib/getSiteContent.ts`). Любое
      изменение глобалов и контентных коллекций (`services`, `solution-plans`,
      `portfolio-projects`, `media`) сбрасывает
      кэш автоматически через `afterChange`/`afterDelete` хуки (`src/lib/revalidate.ts`) — БД
      больше не нагружается на каждый запрос. Куки `NEXT_LOCALE` по-прежнему читаются вне кэша,
      поэтому запоминание языка не затронуто. `REVALIDATION_TOKEN` + ручной POST `/api/revalidate`
      оставлены как резервный способ сброса (например, из n8n).
- [x] **Import project script** (`scripts/import-project/`) — автонаполнение portfolio из папки;
      гайд `scripts/import-project/README.md`.
- [x] **Почта контактной формы.** Hostinger `order@erythro.ai`; MX/SPF/DKIM в **Cloudflare DNS**
      (после смены NS с Vercel); `SMTP_PASS` + `src/lib/contactNotification.ts`.
      Проверено 2026-08-14 (см. §13, PIT-020). Edge rate limit — §13.3.
- [ ] **RAG corpus ingest** — карта в `RAG_INDEX.md`; источник инцидентов `PITFALLS.md`.

---

## 7. Полезные команды

```bash
# Сгенерировать PAYLOAD_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Пересобрать лок-файл под текущий package.json (без установки)
pnpm install --lockfile-only

# Полная установка (Windows: если node_modules заблокирован dev-сервером — сначала его остановить)
pnpm install            # при no-TTY ошибке: $env:CI="true"; pnpm install

# Локальная прод-сборка (быстрый сигнал перед пушем)
pnpm run build

# Проверка доступности и пинг БД (keepalive)
pnpm db:ping

# Сидинг Supabase
pnpm exec tsx scripts/seed.ts

# Импорт портфолио-кейса из content/imports/<slug> (сначала --dry-run)
pnpm import:project -- content/imports/<slug> --dry-run
pnpm import:project -- content/imports/<slug>

# Idempotent schema fixes (prod/CI lag)
pnpm db:fix-portfolio-hero-mobile
pnpm db:fix-portfolio-subtitle
pnpm db:fix-portfolio-richtext
pnpm db:fix-site-settings-page-heroes

# После смены Payload plugins / Lexical client features
pnpm generate:importmap

# Локальный e2e: не давать drizzle push зависнуть на y/N (PIT-022)
# (playwright.config.ts выставляет PAYLOAD_DISABLE_PUSH=1 сам)
pnpm test:int
pnpm test:e2e
```

---

## 8. Медиа-хранилище (Vercel Blob)

Загрузки Payload (коллекция `media`) хранятся в Vercel Blob, а не на эфемерной ФС.

**AI Audit reports:** целевое хранилище — Cloudflare R2 bucket `erythro-audit-reports` (см. [`architecture/r2-audit-storage.md`](./architecture/r2-audit-storage.md)). Media Payload пока на Blob; cutover на R2 — отдельный шаг.

**Код:**
- Пакет `@payloadcms/storage-vercel-blob` (версия синхронна с ядром Payload — все `@payloadcms/*`
  и `payload` держим на одной версии, иначе peer-конфликт).
- Плагин в `src/payload.config.ts`:
  ```ts
  vercelBlobStorage({
    enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    collections: { media: true },
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  ```
  `enabled` завязан на токен: без токена (локально) Payload использует локальный диск и сборка
  не падает; в проде с токеном включается Blob.
- `next.config.ts` → `images.remotePatterns` разрешает `*.public.blob.vercel-storage.com`
  для `next/image`.

**Настройка в Vercel (однократно):**
1. Dashboard → **Storage** → **Create** → **Blob** → создать стор с доступом **Public**
   (тип доступа потом не меняется — для публичных медиа нужен именно Public) и **Connect**
   к проекту `erythro-ai`.
2. Скопировать `BLOB_READ_WRITE_TOKEN` из вкладки **Quickstart → .env.local** стора и
   добавить вручную в `Settings → Environment Variables` проекта. Адаптер
   `@payloadcms/storage-vercel-blob` требует именно R/W-токен (OIDC не поддерживает), и
   при создании стора он в переменные проекта автоматически **не** попадает.
3. **Redeploy** проекта (env-переменные применяются только к новым деплоям).
4. Локально для разработки/сидинга: `vercel env pull .env.local` или вписать токен в `.env`.

### 8.1. Чёрный/пустой экран в `/admin` после подключения Blob

**Симптом:** фронт работает, но `https://erythro.ai/admin` (и `/admin/login`) — пустая
страница: грузится оболочка и заголовок «Login/Dashboard - Payload», но нет ни формы, ни
дашборда. В консоли браузера при этом **нет** JS-ошибок, серверного error-digest тоже нет.

**Диагностика:** в DOM есть только каркас и портал уведомлений; форма входа отсутствует.
В серверных логах (локально воспроизводится на `pnpm build && pnpm start`) виден ключ:
```
getFromImportMap: PayloadComponent not found in importMap
  key: '@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler'
```

**Причина 1 — устаревший importMap.** Плагин Blob регистрирует клиентский компонент
`VercelBlobClientUploadHandler`, но его не было в `src/app/(payload)/admin/importMap.js`.
Payload не находит компонент и рендерит **пустую** админку (без явной ошибки).
**Фикс:** перегенерировать карту и закоммитить:
```bash
pnpm generate:importmap
```

**Причина 2 — серверный код в клиентском бандле (всплывает после фикса №1).** Добавленный в
importMap клиентский хендлер импортирует `getFileKey` из барреля
`@payloadcms/plugin-cloud-storage/utilities`, а тот же баррель реэкспортит **серверный**
`resolveSignedURLKey`, который тянет весь серверный `payload` → `undici` → `node:*` builtins.
Webpack не умеет собирать `node:`-схему для браузера → сборка падает:
```
Module build failed: UnhandledSchemeError: Reading from "node:console"/"node:os" is not handled
```
Tree-shaking не выбрасывает неиспользуемый реэкспорт (хотя у пакета `"sideEffects": false`).
**Фикс:** в `next.config.ts` для клиентского бандла подменить серверный модуль на заглушку
(этот код на клиенте никогда не выполняется):
```ts
// внутри webpack(), при !isServer
webpackConfig.plugins.push(
  new webpack.NormalModuleReplacementPlugin(
    /[\\/]resolveSignedURLKey(\.js)?$/,
    path.resolve(dirname, 'src/stubs/resolve-signed-url-key.client.js'),
  ),
)
```
Заглушка `src/stubs/resolve-signed-url-key.client.js` экспортирует одноимённую функцию,
которая на клиенте просто бросает ошибку.

> Проверять обе причины удобно локальной прод-сборкой: `pnpm build && pnpm start`, затем
> открыть `/admin/login` — должна появиться форма Payload, а в логах не должно быть
> `getFromImportMap: ... not found`.

### 8.2. Видео из Media не воспроизводится (Range → `200` вместо `206`)

**Симптом:** видео (`video/mp4`), загруженное в Media, не проигрывается. Файл при этом в Blob
есть и по прямой ссылке открывается.

**Причина:** по умолчанию плагин отдаёт медиа через прокси-роут Payload
`/api/media/file/<filename>`, который стримит файл из Blob. На Range-запрос (а `<video>` всегда
шлёт `Range`) связка «роут Payload + кэш Vercel CDN» возвращает **`HTTP 200`** с уже нарезанным
телом и `Content-Range`, вместо корректного **`206 Partial Content`**:
```
curl -D - -o NUL -H "Range: bytes=0-1023" https://erythro.ai/api/media/file/<file>.mp4
# -> HTTP/1.1 200 OK   Content-Length: 1024   Content-Range: bytes 0-1023/...
```
При статусе 200 браузер считает, что получил весь файл (а это 1 КБ) → видео не играет и не
перематывается; Safari/iOS вообще требует `206`.

**Фикс:** отдавать медиа напрямую с публичного Blob-URL (он нативно поддерживает `206`), а не
через прокси-роут. В `src/payload.config.ts` для коллекции включить
`disablePayloadAccessControl` (Media у нас публичная — `read: () => true`, поэтому контроль
доступа на файлах не нужен):
```ts
vercelBlobStorage({
  collections: {
    media: { disablePayloadAccessControl: true },
  },
  // ...
})
```
После этого `url` в `/api/media` становится `https://<store>.public.blob.vercel-storage.com/...`,
а проверка прямой ссылки даёт `206`:
```
curl -D - -o NUL -H "Range: bytes=0-1023" https://<store>.public.blob.vercel-storage.com/<file>.mp4
# -> HTTP/1.1 206 Partial Content
```
URL вычисляется в afterRead-хуке, так что ссылка чинится и для **уже загруженных** файлов —
перезаливать не нужно.

> Отдельно: в самой админке Payload для видео показывается иконка файла, а не плеер — это штатно
> (превью-плеера для video в document-view нет). Воспроизведение проверяется по ссылке / на фронте.

---

## 9. Грабли, специфичные для этого деплоя

1. **`engines.node` — только мажор (`24.x`)**, не открытые диапазоны с патчем (`>=24.15.0`):
   билд-образ Vercel может отставать по патч-версии → мгновенный фейл.
2. **Один лок-файл.** Держать только `pnpm-lock.yaml`; `package-lock.json` сбивает Vercel.
3. **Лок синхронен с `package.json`.** CI ставит `--frozen-lockfile`; после правок зависимостей
   обязательно пересобирать лок и коммитить.
4. **Vercel блокирует уязвимый Next.js** — это не warning, а fail. Версию выбирать на пересечении
   «патч от CVE» × «peer-окно Payload» (для Payload 3.85 удобно `~15.4.11`).
5. **Windows + pnpm install:** запущенный `pnpm dev` держит `node_modules` (`EPERM`/`lightningcss.node`)
   — остановить dev-сервер перед установкой; на no-TTY ошибку ставить `$env:CI="true"`.
6. **Supabase SSL:** `sslmode=no-verify` в `DATABASE_URL` (иначе self-signed cert chain).
7. **После подключения storage-плагина — `pnpm generate:importmap`.** Иначе админка молча
   рендерится пустой (см. §8.1). А клиентский upload-хендлер тянет серверный код в браузерный
   бандл (`node:*` → `UnhandledSchemeError`) — лечится заглушкой `resolveSignedURLKey` в
   `next.config.ts`.
8. **Видео/аудио из Media → `disablePayloadAccessControl: true`.** Прокси-роут Payload отдаёт
   Range как `200` (а не `206`), и медиа с перемоткой не играет (см. §8.2). Прямой публичный
   Blob-URL отдаёт `206` корректно. Подходит только для публичных файлов.

---

## 10. Что дальше по продукту (после этого журнала)

**v1 (2026-08-18) закрыта:** прод, CMS, формы+SMTP, CI-гейт. Журнал выше — инфра.
Продуктовый план повторения: **`PLAYBOOK.md` §3**. Хроника: **`PLAYBOOK.md` §9**.
Грабли: **`PITFALLS.md`**. RAG: **`RAG_INDEX.md`**.

Следующий трек — **масштабируемость**, не доделки v1.

---

## 11. CI: GitHub Actions → Vercel (тесты до прода)

Статус: **настроено и проверено** (smoke PR `ci/smoke-check`, оба job’а зелёные).

### Зачем
Автотесты должны проходить **до** продвижения деплоя на production-домен. Цепочка:

1. Push в feature-ветку / PR в `main`
2. GitHub Actions workflow **Tests** (`.github/workflows/test.yml`)
3. Merge в `main` — только если status checks зелёные (GitHub Ruleset)
4. Vercel собирает деплой и ждёт **Deployment Checks** перед alias на прод

> Прямой `git push origin main` **заблокирован** ruleset’ом, пока на коммите нет зелёных
> `Unit Tests` / `API Tests`. Рабочий путь — PR → merge.

### Workflow

| Job | Имя check (важно для Vercel) | Что гоняет |
|---|---|---|
| `unit` | **Unit Tests** | Vitest: `ctaNav`, `splash`, `sectionAutoSnap` (без БД) |
| `api` | **API Tests** | Vitest: `tests/int/api.int.spec.ts` (нужен `DATABASE_URL`) |

Скрипты: `pnpm test:int` / `pnpm test:ci`. E2E (Playwright) в CI пока не включены.

### GitHub Secrets

`Settings → Secrets and variables → Actions`:

| Secret | Назначение |
|---|---|
| `DATABASE_URL` | Postgres URI. Достаточно **Direct** (`db.<ref>.supabase.co`) — CI сам перепишет на Session pooler |
| `PAYLOAD_SECRET` | Любой длинный секрет для CI (может отличаться от Vercel) |

### Грабли Supabase + GitHub Actions (уже учтены в workflow)

| Симптом | Причина | Фикс в репо |
|---|---|---|
| `ENETUNREACH` IPv6 | Direct host IPv6-only, GHA — IPv4 | `scripts/ci-resolve-supabase-url.mjs` → session pooler |
| `tenant/user … not found` | Неверный pooler-кластер (`aws-0` vs `aws-1`/`aws-2`) | Скрипт пробует `aws-0`…`aws-2` |
| `self-signed certificate in certificate chain` | Node verify + Supabase cert | `DATABASE_SSL_INSECURE=1` → `ssl: { rejectUnauthorized: false }` только в CI |
| Hook timeout 90s на `getPayload` | `pushDevSchema` висит на pooler | `push: false` при `CI=true`, `NODE_ENV=test` |

Регион проекта: `ap-southeast-1` (зашит в workflow как `SUPABASE_REGION`).

### Vercel Deployment Checks

`Project → Settings → Build and Deployment → Deployment Checks`:

1. **Add Checks → GitHub**
2. Если список пуст — вставь SHA успешного прогона и включи **Show All Checks**
3. Добавь **Unit Tests** и **API Tests**
4. Бейдж **Production** = обязательны для продвижения в production

Ручной блок «Send workflow updates…» / `vercel/repository-dispatch` **не нужен** — job `name:` уже публикует GitHub checks с этими именами.

### GitHub Branch Ruleset

`Settings → Rules → Rulesets` (пример: `main protection`):

- Target: default branch / `main`
- Enforcement: **Active**
- Rule: **Require status checks to pass** → `Unit Tests`, `API Tests`

### Чеклист для нового проекта

- [ ] `.github/workflows/test.yml` с job names, совпадающими с Deployment Checks
- [ ] Secrets `DATABASE_URL` (+ опционально `PAYLOAD_SECRET`)
- [ ] Для Supabase: resolver pooler / `sslmode` / `push: false` в CI
- [ ] Vercel Deployment Checks → Unit + API → Production
- [ ] Branch ruleset на `main` с теми же status checks
- [ ] Smoke: PR → зелёные checks → merge (не прямой push в `main`)

---

## 12. Эволюция схемы на проде (миграции + fix-скрипты)

Исторически схема на Supabase выросла из dev `push`. Дальше изменения идут через
`src/migrations/*` и **`payload migrate` в `pnpm build`**. `prodMigrations` **не**
передаётся в serverless runtime: иначе `batch=-1` вешает `/admin` на интерактивном
промпте (Cloudflare 524, PIT-027). Когда прод или CI отстают, срабатывают
**idempotent** скрипты (безопасны при повторном запуске):

| Скрипт | Зачем |
|---|---|
| `pnpm db:fix-portfolio-hero-mobile` | Колонка `hero_media_mobile_id` |
| `pnpm db:fix-portfolio-subtitle` | Колонка subtitle (+ `$1::varchar` — PIT-005) |
| `pnpm db:fix-portfolio-richtext` | varchar → jsonb для Lexical полей |
| `pnpm db:fix-site-settings-page-heroes` | Page hero media FK в Site Settings |
| `pnpm db:fix-solution-feature-columns` | `home_only` + features `full` jsonb (PIT-028) |
| `pnpm db:fix-contact-submissions-audit-fields` | audit website / language / plan / status (PIT-030) |

Также без отдельного `db:fix-*` (только migration): `20260815_010000_site_settings_emails`
(адресная книга + notify/display selects).

**Правила (не повторять грабли):**

1. Новое поле CMS → migration **в том же PR**, что и код маппера/UI.
2. Если API tests или prod могут увидеть старую схему — добавить `db:fix-*` и вызов в CI
   **до** `api.int.spec`.
3. `push: false` при `CI=true` / `NODE_ENV=test` / `NODE_ENV=production` / `VERCEL=1` —
   иначе hang на pooler (PIT-006, PIT-012) или runtime 524 на `/admin` (PIT-027).
4. После Lexical/storage client features → `pnpm generate:importmap` и коммит
   `importMap.js` (PIT-001). Пример: TableFeature без import map = «таблиц в админке нет».
5. Смена формы закэшированных документов → bump cache key (PIT-015).
6. Сериализовать опасные миграции (portfolio categories) — параллельный migrate на Vercel
   давал race (см. коммит `8319779`).
7. Production deploy после merge обычно ~3–5 мин до `READY` — «не деплоится» часто = ещё
   `BUILDING`, не fail. Смотреть Deployments + inspector URL.

Каталог симптомов: **`PITFALLS.md`**. Продуктовый контракт portfolio: **`PORTFOLIO_CMS.md`**.

---

## 13. Почта контактной формы (Hostinger + Cloudflare DNS)

Проверено **2026-08-14**: входящие с Gmail и заказы с `https://erythro.ai` доходят на
`order@erythro.ai`. Заявка по-прежнему сохраняется в Payload (`contact-submissions`).
NS домена с тех пор на **Cloudflare** (записи перенесены; см. §14).

### 13.1. Куда писать DNS

Почтовые записи живут **у текущего DNS-хоста NS**, не в hPanel Hostinger.
Сейчас nameservers — **Cloudflare** → DNS → Records. Раньше (первый запуск почты) —
Vercel Domains → DNS. Автоподключение в hPanel не сработает, пока NS не Hostinger
(Hostinger: [manual domain setup](https://www.hostinger.com/support/8650765-set-up-a-domain-for-hostinger-email/)).
Записи сайта (CNAME/A на Vercel) не ломать.

| Type | Name | Priority | Value |
|---|---|---|---|
| MX | *(пусто)* | 5 | `mx1.hostinger.com` |
| MX | *(пусто)* | 10 | `mx2.hostinger.com` |
| TXT | *(пусто)* | — | `v=spf1 include:_spf.mail.hostinger.com ~all` |
| CNAME | `hostingermail-a._domainkey` | — | `hostingermail-a.dkim.mail.hostinger.com` |
| CNAME | `hostingermail-b._domainkey` | — | `hostingermail-b.dkim.mail.hostinger.com` |
| CNAME | `hostingermail-c._domainkey` | — | `hostingermail-c.dkim.mail.hostinger.com` |
| TXT | `_dmarc` | — | `v=DMARC1; p=quarantine; rua=mailto:order@erythro.ai; pct=100;` (was `p=none`; tighten to `p=reject` after a week of clean reports) |

В Name для DKIM только `hostingermail-a._domainkey`, без `.erythro.ai`. После сохранения —
Hostinger Emails → Mailboxes → Domain settings → **Check status** (до 24 ч на пропагацию).

### 13.2. Как сайт шлёт письмо

`POST /api/contact` (`src/app/api/contact/route.ts`):

1. Пишет документ в коллекцию `contact-submissions` (админка).
2. Читает Site Settings → Contacts → Email.
3. Шлёт SMTP **сотрудникам** через `src/lib/contactNotification.ts`: **from** `"Erythro.ai" <order@erythro.ai>`,
   **to** = Site Settings notify target(s), Reply-To = имя + email посетителя,
   `Auto-Submitted: auto-generated`.
4. Шлёт SMTP **клиенту** подтверждение «заявка принята» (`sendClientAcknowledgement`):
   **to** = email из формы, Reply-To = `order@erythro.ai`, `Auto-Submitted: auto-replied`.
   n8n IMAP на это не отвечает (From `@erythro.ai` + Auto-Submitted). Ошибка ack не валит `/api/contact`.

Транспорт: `smtp.hostinger.com:465` (fallback 587 STARTTLS). Пароль ящика — Vercel env
**`SMTP_PASS`** (Production + Preview). Опционально: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`CONTACT_FROM_EMAIL`, `CONTACT_NOTIFY_EMAIL`. Значение пароля в git не класть.

Если письмо есть, но в **Spam** Hostinger (а пересылка на Gmail работает) — это локальный
фильтр ящика, не DNS. См. PIT-021: пометить «не спам» / фильтр по From/Subject, либо
ставить notify на Gmail в Site Settings.

Если заявка есть в админке, а письма нет — смотреть Runtime Logs `[api/contact]` /
`[contactNotification]` (PIT-020). Payload warning «No email adapter provided» сам по себе
не отправляет почту: нужен наш SMTP-код на `main`, не адаптер Payload.

### 13.3. Защита `POST /api/contact`

Единственная точка приёма форм (модалка /contacts /audit / order) — изолированный route:

1. **App rate limit** по IP (`cf-connecting-ip` → `x-forwarded-for`), default **5 / 60s**
   (`CONTACT_RATE_LIMIT_MAX`, `CONTACT_RATE_LIMIT_WINDOW_MS`). Ответ `429` + `Retry-After`.
   In-memory per Vercel isolate — **не** общий счётчик по всем инстансам.
2. **Cloudflare Rate Limiting** (edge, до Vercel) — обязательное дополнение, см. ниже.
3. **Honeypot** (`hp_erythro_trap`; legacy `company_website` still dropped) — заполненный бот получает silent `200` без CMS/SMTP. Не называть поле company/website: iOS/Chrome autofill на мобилке ложно срабатывает.
4. **Turnstile siteverify** (`https://challenges.cloudflare.com/turnstile/v0/siteverify`):
   токен `cf-turnstile-response`, `success === true`, `action` = `source`
   (`contact` / `audit` / `order`), hostname из `TURNSTILE_HOSTNAMES`
   (локально по умолчанию `localhost,127.0.0.1`; прод — хост из `NEXT_PUBLIC_SITE_URL`,
   **без** localhost). Production без secret — fail-closed `403`.
   Виджет: `TurnstileField` (explicit render + `reset` в `finally`).
   CSP: `script-src` / `connect-src` / `frame-src` → `https://challenges.cloudflare.com`,
   плюс `worker-src 'self' blob:` (PIT-043).
5. **Sanitize + validate** (`contactSubmissionGuard`) до записи в Payload и SMTP:
   срез HTML/control chars, лимиты длины, строгий email/locale.
6. Затем CMS `contact-submissions` и SMTP notify.

#### Cloudflare Rate Limiting на `/api/contact`

**Статус (2026-08-16):** правило **Active**, слот Free **1/1**:
`Rate limit /api/contact (5/10s per IP)`.

| Слой | Лимит | Зачем |
|---|---|---|
| Cloudflare edge (Free) | **5 / 10s / IP**, Block **10s** | общий счётчик до Vercel; Free: period/mitigation только 10s; в expression — Path (не Method) |
| App (`contactRateLimit`) | **5 / 60s / IP** | sliding window в isolate; `429` + `Retry-After` |

**Dashboard** (если пересоздавать)

1. [Security rules](https://dash.cloudflare.com/?to=/:account/:zone/security/security-rules)
   → `erythro.ai` → **Create rule** → **Rate limiting rules**.
2. Name: `Rate limit /api/contact (5/10s per IP)`.
3. Expression: `(http.request.uri.path eq "/api/contact")`.
4. Characteristics → **IP**.
5. When rate exceeds → **5** / **10 seconds**.
6. Action → **Block**, Duration → **10 seconds**, Status → **Active**.
7. **Deploy**.

На Pro+ можно поднять period до 60s и добавить `http.request.method eq "POST"`.

**API / скрипт**

```bash
# Token: Zone WAF Write + Zone Read; Zone ID — Overview зоны
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ZONE_ID=...
pnpm cf:contact-rate-limit
# pnpm cf:contact-rate-limit -- --dry-run
```

Проверка: >5 быстрых запросов на `https://erythro.ai/api/contact` с одного IP → edge block
(до приложения). Security → Events.

---

## 15. AI visibility & Cloudflare robots (AI crawlers)

Полная документация: **[`docs/AI_VISIBILITY.md`](./AI_VISIBILITY.md)**.

Сканеры AI-видимости проверяют `llms.txt`, Organization schema, MCP manifest и доступ AI-ботов.

**В коде (Next.js):**

- `public/llms.txt` — канонические факты о бренде для LLM
- `/.well-known/mcp` — MCP discovery manifest (`src/app/.well-known/mcp/route.ts`)
- `/api/mcp` — read-only JSON с фактами о бренде
- `/about` — Brand Facts page
- Organization / FAQ JSON-LD — `src/components/StructuredData.tsx` + `src/lib/brandSchema.ts`
- Security headers — `next.config.ts` (`headers()`)
- GA4 Consent Mode stub в `<head>` — `src/components/AnalyticsBootstrap.tsx`
- AI referral dataLayer — `src/lib/aiReferral.ts` (после Accept cookies)
- `src/app/robots.txt/route.ts` — `Allow: /` для GPTBot/ClaudeBot/CCBot и др. +
  **Content Signals** (`ai-train=no, search=yes, ai-input=yes`)
- Homepage **Link** headers — `src/middleware.ts` + `src/lib/agentDiscovery.ts`
  (`api-catalog`, `service-desc`, `service-doc`, `describedby`)
- `/.well-known/api-catalog` — RFC 9727 linkset (`application/linkset+json`)
- `/openapi.json` — OpenAPI 3 для Brand API / MCP (`rel=service-desc`)
- Markdown negotiation — `Accept: text/markdown` → `src/app/api/markdown-negotiate/`
- ACP discovery — `/.well-known/acp.json` (и `/.well-known/acp`)

**Проверка после деплоя:**

```bash
curl -sI https://erythro.ai
curl -sI https://erythro.ai/ | findstr /i "^link:"
curl -s https://erythro.ai/llms.txt
curl -s https://erythro.ai/.well-known/mcp
curl -s https://erythro.ai/.well-known/api-catalog
curl -s https://erythro.ai/openapi.json
curl -s https://erythro.ai/about
curl -s https://erythro.ai/robots.txt
curl -s -H "Accept: text/markdown" https://erythro.ai/
```

**Cloudflare Managed robots (важно):**

На проде Cloudflare может **добавлять** в `robots.txt` блокировку AI-ботов
(`GPTBot`, `ClaudeBot`, `CCBot`, `Google-Extended` и др.) поверх правил из
`src/app/robots.txt/route.ts` (и затирать Content Signals). Это даёт
`severe_block=True` в AI-аудитах.

Чтобы разрешить индексацию AI-краулерами:

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → зона `erythro.ai`
2. **Security** → **Bots** (или **Scrape Shield** / **AI Crawl Control** — зависит от плана)
3. Отключить managed block для нужных AI-ботов **или** убрать «Cloudflare Managed content»
   из robots, если политика компании допускает AI-индексацию
4. Проверить: `curl https://erythro.ai/robots.txt` — не должно быть `Disallow: /` для
   `GPTBot` / `ClaudeBot`, если хотите AI-видимость; должны быть строки `Content-Signal:`

`src/app/robots.txt/route.ts` явно разрешает AI user-agents и объявляет Content Signals;
финальный `robots.txt` = Cloudflare + Next.

---

## 14. Sitemap + Google Search Console (после Cloudflare DNS)

### 14.1. Sitemap

- URL: `https://erythro.ai/sitemap.xml` (`src/app/sitemap.ts`).
- lastmod для `/services/*`, `/portfolio/*`, `/order/*` — Payload `updatedAt`.
- Legal (`/privacy`, `/terms`, `/accessibility`) — `statementDate` / `updatedAt` из globals.
- `/` и `/portfolio` берут max lastmod по связанному контенту; `/contacts` и `/about` включены.
- Инвалидация: hooks `revalidate` → tag `payload-content` + `revalidatePath('/sitemap.xml')`.

### 14.2. Search Console после смены NS на Cloudflare

1. Открыть [Google Search Console](https://search.google.com/search-console) → свойство `erythro.ai`.
2. Ownership: meta уже в `layout.tsx`; файл верификации —
   `https://erythro.ai/googlea9b1e6ba6a1fc012.html` (`public/…`). Если была DNS TXT-проверка
   на старых NS — подтвердить заново или опереться на meta/file.
3. Sitemaps → добавить / проверить `https://erythro.ai/sitemap.xml`.
4. Проверка URL главной → «Запросить индексирование» при необходимости.
5. Настройки → предпочтительный домен / следить за `www` vs apex (сейчас apex + www → Vercel).

Почтовые MX/SPF/DKIM в Cloudflare на индексацию не влияют.

---

## 13. Почта контактной формы (Hostinger + Vercel DNS)

Проверено **2026-08-14**: входящие с Gmail и заказы с `https://erythro.ai` доходят на
`order@erythro.ai`. Заявка по-прежнему сохраняется в Payload (`contact-submissions`).

### 13.1. Куда писать DNS

Nameservers домена — **Vercel**, не Hostinger. Записи почты добавляются в
**Vercel → Domains → `erythro.ai` → DNS**. Автоподключение в hPanel не сработает
(Hostinger: [manual domain setup](https://www.hostinger.com/support/8650765-set-up-a-domain-for-hostinger-email/)).
ALIAS/CAA сайта не трогать.

| Type | Name | Priority | Value |
|---|---|---|---|
| MX | *(пусто)* | 5 | `mx1.hostinger.com` |
| MX | *(пусто)* | 10 | `mx2.hostinger.com` |
| TXT | *(пусто)* | — | `v=spf1 include:_spf.mail.hostinger.com ~all` |
| CNAME | `hostingermail-a._domainkey` | — | `hostingermail-a.dkim.mail.hostinger.com` |
| CNAME | `hostingermail-b._domainkey` | — | `hostingermail-b.dkim.mail.hostinger.com` |
| CNAME | `hostingermail-c._domainkey` | — | `hostingermail-c.dkim.mail.hostinger.com` |
| TXT | `_dmarc` | — | `v=DMARC1; p=quarantine; rua=mailto:order@erythro.ai; pct=100;` (was `p=none`; tighten to `p=reject` after a week of clean reports) |

В Name для DKIM только `hostingermail-a._domainkey`, без `.erythro.ai`. После сохранения —
Hostinger Emails → Mailboxes → Domain settings → **Check status** (до 24 ч на пропагацию).

### 13.2. Как сайт шлёт письмо

`POST /api/contact` (`src/app/api/contact/route.ts`):

1. Пишет документ в коллекцию `contact-submissions` (админка).
2. Читает Site Settings → Contacts → Email.
3. Шлёт SMTP **сотрудникам** через `src/lib/contactNotification.ts`: **from** `"Erythro.ai" <order@erythro.ai>`
   (display name + mailbox), **to** = Site Settings notify target(s), Reply-To = имя + email посетителя,
   `Auto-Submitted: auto-generated`.
4. Шлёт SMTP **клиенту** подтверждение «заявка принята» (`sendClientAcknowledgement`):
   **to** = email из формы, Reply-To = `order@erythro.ai`, `Auto-Submitted: auto-replied`.
   n8n IMAP на это не отвечает (From `@erythro.ai` + Auto-Submitted). Ошибка ack не валит `/api/contact`.

Транспорт: `smtp.hostinger.com:465` (fallback 587 STARTTLS). Пароль ящика — Vercel env
**`SMTP_PASS`** (Production + Preview). Опционально: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`CONTACT_FROM_EMAIL`, `CONTACT_NOTIFY_EMAIL`. Значение пароля в git не класть.

Если письмо есть, но в **Spam** Hostinger (а пересылка на Gmail работает) — локальный фильтр
ящика, не DNS. См. PIT-021: «не спам» / фильтр, либо notify → Gmail в Site Settings.

Если заявка есть в админке, а письма нет — смотреть Runtime Logs `[api/contact]` /
`[contactNotification]` (PIT-020). Payload warning «No email adapter provided» сам по себе
не отправляет почту: нужен наш SMTP-код на `main`, не адаптер Payload.

### 13.3. Защита `POST /api/contact`

Единственная точка приёма форм (модалка /contacts /audit / order) — изолированный route:

1. **App rate limit** по IP (`cf-connecting-ip` → `x-forwarded-for`), default **5 / 60s**
   (`CONTACT_RATE_LIMIT_MAX`, `CONTACT_RATE_LIMIT_WINDOW_MS`). Ответ `429` + `Retry-After`.
   In-memory per Vercel isolate — **не** общий счётчик по всем инстансам.
2. **Cloudflare Rate Limiting** (edge, до Vercel) — обязательное дополнение, см. ниже.
3. **Honeypot** (`hp_erythro_trap`; legacy `company_website` still dropped) — заполненный бот получает silent `200` без CMS/SMTP. Не называть поле company/website: iOS/Chrome autofill на мобилке ложно срабатывает.
4. **Turnstile siteverify** (`https://challenges.cloudflare.com/turnstile/v0/siteverify`):
   токен `cf-turnstile-response`, `success === true`, `action` = `source`
   (`contact` / `audit` / `order`), hostname из `TURNSTILE_HOSTNAMES`
   (локально по умолчанию `localhost,127.0.0.1`; прод — хост из `NEXT_PUBLIC_SITE_URL`,
   **без** localhost). Production без secret — fail-closed `403`.
   Виджет: `TurnstileField` (explicit render + `reset` в `finally`).
   CSP: `script-src` / `connect-src` / `frame-src` → `https://challenges.cloudflare.com`,
   плюс `worker-src 'self' blob:` (PIT-043).
5. **Sanitize + validate** (`contactSubmissionGuard`) до записи в Payload и SMTP:
   срез HTML/control chars, лимиты длины, строгий email/locale.
6. Затем CMS `contact-submissions` и SMTP notify.

#### Cloudflare Rate Limiting на `/api/contact`

**Статус (2026-08-16):** правило **Active**, слот Free **1/1**:
`Rate limit /api/contact (5/10s per IP)`.

| Слой | Лимит | Зачем |
|---|---|---|
| Cloudflare edge (Free) | **5 / 10s / IP**, Block **10s** | общий счётчик до Vercel; Free: period/mitigation только 10s; в expression — Path (не Method) |
| App (`contactRateLimit`) | **5 / 60s / IP** | sliding window в isolate; `429` + `Retry-After` |

**Dashboard** (если пересоздавать)

1. [Security rules](https://dash.cloudflare.com/?to=/:account/:zone/security/security-rules)
   → `erythro.ai` → **Create rule** → **Rate limiting rules**.
2. Name: `Rate limit /api/contact (5/10s per IP)`.
3. Expression: `(http.request.uri.path eq "/api/contact")`.
4. Characteristics → **IP**.
5. When rate exceeds → **5** / **10 seconds**.
6. Action → **Block**, Duration → **10 seconds**, Status → **Active**.
7. **Deploy**.

На Pro+ можно поднять period до 60s и добавить `http.request.method eq "POST"`.

**API / скрипт**

```bash
# Token: Zone WAF Write + Zone Read; Zone ID — Overview зоны
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ZONE_ID=...
pnpm cf:contact-rate-limit
# pnpm cf:contact-rate-limit -- --dry-run
```

Проверка: >5 быстрых запросов на `https://erythro.ai/api/contact` с одного IP → edge block
(до приложения). Security → Events.

---

## 14. Sitemap + Google Search Console (после Cloudflare DNS)

### 14.1. Sitemap

- URL: `https://erythro.ai/sitemap.xml` (`src/app/sitemap.ts`).
- lastmod для `/services/*`, `/portfolio/*`, `/order/*` — Payload `updatedAt`.
- Legal (`/privacy`, `/terms`, `/accessibility`) — `statementDate` / `updatedAt` из globals.
- `/` и `/portfolio` берут max lastmod по связанному контенту; `/contacts` включён.
- Инвалидация: hooks `revalidate` → tag `payload-content` + `revalidatePath('/sitemap.xml')`.

### 14.2. Search Console после смены NS на Cloudflare

1. [Google Search Console](https://search.google.com/search-console) → свойство `erythro.ai`.
2. Ownership: meta в `layout.tsx`; файл —
   `https://erythro.ai/googlea9b1e6ba6a1fc012.html` (`public/…`). Если была DNS TXT на старых NS —
   подтвердить заново или опереться на meta/file.
3. Sitemaps → `https://erythro.ai/sitemap.xml`.
4. Проверка URL главной → «Запросить индексирование» при необходимости.
5. Следить за `www` vs apex (оба на Vercel через Cloudflare).

Почтовые MX/SPF/DKIM на индексацию не влияют.

---
