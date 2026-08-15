# Деплой Erythro.ai: Supabase + Vercel

Журнал боевого деплоя проекта на прод. Описывает **что настроено**, **какие ошибки сборки
встретились и как починены**, и **что осталось на будущее**. Дополняет `PLAYBOOK.md`
(там — про разработку; здесь — про инфраструктуру и деплой).

Статус: **сайт задеплоен и работает** (Production, Vercel, Node.js 24.x, БД — Supabase).

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
Деплой триггерится автоматически при каждом push в `main`.

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
- [ ] **Миграции схемы Payload.** Сейчас схема в Supabase появилась через dev `push`. Для прод-эволюции
      схемы настроить нормальные миграции (`payload migrate:create` / `payload migrate`), а не push.
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
- [x] **Почта контактной формы.** Hostinger `order@erythro.ai`; MX/SPF/DKIM в Vercel DNS;
      `SMTP_PASS` + `src/lib/contactNotification.ts`. Проверено 2026-08-14 (см. §13, PIT-020).

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

# Сидинг Supabase
pnpm exec tsx scripts/seed.ts
```

---

## 8. Медиа-хранилище (Vercel Blob)

Загрузки Payload (коллекция `media`) хранятся в Vercel Blob, а не на эфемерной ФС.

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

Инфраструктурный журнал выше закрывает боевой деплой + Blob + видео Range.
Последующие продуктовые изменения (splash/contact modal, Hero/Services/Cases video из CMS,
mobile stacking на главной, страница `/portfolio` и её GSAP/бургер) зафиксированы в
**`PLAYBOOK.md` §9 — «Хроника после базового деплоя»**.

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
| TXT | `_dmarc` | — | `v=DMARC1; p=none; rua=mailto:order@erythro.ai` |

В Name для DKIM только `hostingermail-a._domainkey`, без `.erythro.ai`. После сохранения —
Hostinger Emails → Mailboxes → Domain settings → **Check status** (до 24 ч на пропагацию).

### 13.2. Как сайт шлёт письмо

`POST /api/contact` (`src/app/api/contact/route.ts`):

1. Пишет документ в коллекцию `contact-submissions` (админка).
2. Читает Site Settings → Contacts → Email.
3. Шлёт SMTP через `src/lib/contactNotification.ts`: **from** `"Erythro.ai" <order@erythro.ai>`
   (display name + mailbox), **to** = Site Settings notify target(s), Reply-To = имя + email посетителя.

Транспорт: `smtp.hostinger.com:465` (fallback 587 STARTTLS). Пароль ящика — Vercel env
**`SMTP_PASS`** (Production + Preview). Опционально: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`CONTACT_FROM_EMAIL`, `CONTACT_NOTIFY_EMAIL`. Значение пароля в git не класть.

Если письмо есть, но в **Spam** Hostinger (а пересылка на Gmail работает) — локальный фильтр
ящика, не DNS. См. PIT-021: «не спам» / фильтр, либо notify → Gmail в Site Settings.

Если заявка есть в админке, а письма нет — смотреть Runtime Logs `[api/contact]` /
`[contactNotification]` (PIT-020). Payload warning «No email adapter provided» сам по себе
не отправляет почту: нужен наш SMTP-код на `main`, не адаптер Payload.

---
