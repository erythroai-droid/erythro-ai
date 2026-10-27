# Supabase / Postgres Row Level Security (RLS)

Источник: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) (+ [Securing your API](https://supabase.com/docs/guides/api/securing-your-api), [Secure your data](https://supabase.com/docs/guides/database/secure-data)).  
Связано: [[supabase-data-api-grants]], PIT-110, `docs/PITFALLS.md`.

Обновлено: 2026-10-19.

## Зачем это нужно

RLS — правила авторизации **внутри Postgres**. Политика фактически добавляет `WHERE` к каждому запросу. Это защита «на месте»: тот же контроль работает через PostgREST / Data API, GraphQL, supabase-js и сторонние инструменты, а не только в коде приложения.

**Оценка полезности**

| Тип проекта | Полезность | Почему |
|---|---|---|
| Browser / mobile → Data API (`anon` / `authenticated` key) | **Обязательно** | Publishable key не секрет. Без RLS + grants таблица в exposed schema открыта любому, у кого есть ключ. |
| B2B SaaS, multi-tenant, user-owned rows | **Обязательно** | Изоляция арендаторов и «свои строки» должна жить в БД, не только в API. |
| Server-only (Payload / Nest / workers) через `DATABASE_URL` как `postgres` | **Высокая как defense-in-depth** | Приложение не ходит как `anon`, но дефолтные GRANT + случайно включённый Data API = утечка (см. PIT-110). |
| Чистый self-hosted Postgres без PostgREST | Средняя | RLS полезен при нескольких ролях приложения; иначе достаточно app-layer ACL. |

Правило из доков Supabase: *таблица в exposed schema без RLS доступна любой роли с GRANT. Включай RLS на каждой такой таблице. Политики сами по себе не отзывают GRANT.*

## Два слоя: GRANT и policy

Postgres проверяет доступ в два шага:

1. **GRANT** — может ли роль вообще делать `SELECT` / `INSERT` / … на объект.
2. **RLS policy** — какие **строки** разрешены.

На старых проектах новая таблица в `public` часто получает полный набор привилегий для `anon`, `authenticated` и `service_role`. Добавление политик **не** снимает эти GRANT. Сначала `REVOKE`, потом узкий `GRANT`, потом политики.

| Роль | Типичное назначение |
|---|---|
| `anon` | Незалогиненный клиент Data API |
| `authenticated` | JWT пользователя (Supabase Auth) |
| `service_role` / secret key | Сервер; **обходит RLS** — только backend |

Отсутствие GRANT → ошибка `42501` до политик. Пустой результат при наличии GRANT часто значит, что `USING` отфильтровал строки (не ошибка).

## Процедура для таблицы в exposed schema

В одной миграции:

1. `ALTER TABLE … ENABLE ROW LEVEL SECURITY;`
2. `REVOKE ALL ON TABLE … FROM anon, authenticated;`
3. `GRANT` только нужные операции нужным ролям.
4. Отдельная policy на каждую операцию (`SELECT` / `INSERT` / `UPDATE` / `DELETE`) с явным `TO authenticated` (или `anon`).
5. Индекс на колонки фильтра политики (`user_id`, `team_id`, …).
6. pgTAP: `supabase/tests/<table>_rls.test.sql` → `supabase test db` (allow + deny для обеих ролей).

Пока тесты не зелёные — политики не считаются проверенными.

### Паттерны политик

- **SELECT:** `USING (…)`.
- **INSERT:** `WITH CHECK (…)`.
- **UPDATE:** и `USING` (какие строки видны), и `WITH CHECK` (каким может стать результат) — иначе пользователь может переписать `user_id`.
- **DELETE:** `USING (…)`.
- Для `UPDATE` нужна и SELECT-политика.
- Всегда указывай роль в `TO …`.
- Хелперы оборачивай в `(select auth.uid())` — initPlan кэширует вызов на statement, а не на каждую строку.
- Не клади авторизацию в `user_metadata` / `raw_user_meta_data` (пользователь может менять). Для ролей — `app_metadata` / своя таблица ролей.
- Views по умолчанию `security definer` и **обходят RLS** нижележащих таблиц. Postgres ≥15: `WITH (security_invoker = true)`.
- Рекурсивные политики (A читает B, B читает A) → `42P17`. Разрывать через `SECURITY DEFINER` в схеме `private` с `search_path = ''`.
- `service_role` / secret key обходит RLS. Никогда в браузере. Secret + user JWT → запрос идёт под политиками пользователя, не как bypass.

## Два рабочих режима на стеке Erythro / клиентах

### A. Клиентский доступ через Data API (supabase-js)

Полный цикл выше обязателен. Без RLS нельзя отдавать publishable / anon key.

### B. Payload CMS / server-only на Supabase Postgres (erythro.ai)

Сайт и админка ходят ролью `postgres` через `DATABASE_URL` (`@payloadcms/db-postgres`). Data API проект **не** использует. Payload Auth ≠ Supabase Auth → политики вида `auth.uid() = user_id` на таблицы CMS **не** модель доступа приложения.

Здесь правильный baseline (уже зафиксирован в PIT-110):

1. PostgREST **Exposed schemas** пустые (`pgrst_no_exposed_schemas` → 404 на `/rest/v1/…`).
2. `REVOKE ALL … FROM anon, authenticated` на schema `public` + `ALTER DEFAULT PRIVILEGES … REVOKE`.
3. `REVOKE USAGE ON SCHEMA public FROM PUBLIC` (явный `USAGE` только для `postgres` / `service_role` / `authenticator`).
4. Не ставить `GRANT` ролям Data API на таблицы Payload (см. [[supabase-data-api-grants]] — с 2026-10-30 новые таблицы без явного GRANT недоступны Data API; это в пользу режима B).
5. После новых коллекций Payload: `has_table_privilege('anon','public.<table>','SELECT')` = false.

RLS на чувствительных таблицах (`users`, заявки, сессии консультанта) без политик для `anon`/`authenticated` — опциональный второй замок: даже если кто-то снова откроет schema `public` в API settings, клиентские роли увидят ноль строк. Роль `postgres` / owner с `bypassrls` приложение не ломает. Не включать Data API на `public` «чтобы потестить» без полного набора политик.

## Антипаттерны

- Включить exposed schema `public` «на время отладки» без RLS.
- Считать, что «у нас только сервер» = grants не важны (PIT-110: hash/salt в `users`).
- Политика без `TO role` — лишняя работа и для `anon`.
- `auth.uid()` без `(select …)` на больших таблицах.
- `SECURITY DEFINER` в exposed schema.
- Доказывать успешный write через `lives_ok` (проходит при 0 затронутых строк) — нужен `RETURNING` + assert.

## Чеклист для нового проекта на Supabase

- [ ] Решить: Data API нужен или только server connection string?
- [ ] Если Data API: RLS + grants + тесты на **каждую** публичную таблицу/view.
- [ ] Если только server (Payload): revoke `anon`/`authenticated`, пустые exposed schemas, не копировать примеры `GRANT … TO anon` на CMS-таблицы.
- [ ] Secret / `service_role` только в env сервера.
- [ ] Индексы под фильтры политик.
- [ ] Views: `security_invoker` или вне exposed schema.
