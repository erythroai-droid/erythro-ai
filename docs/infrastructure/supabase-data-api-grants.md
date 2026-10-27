# Supabase Data API — явные GRANT с 30 октября 2026

Отмечено 2026-09-24 (письмо Supabase). Дедлайн: **30 октября 2026**.

Зеркало: `D:\Obsidian\Knowledge-Base\infrastructure\supabase-data-api-grants.md`.  
Связано: [[supabase-rls]], PIT-110.

## Что меняется

С этой даты Supabase перестаёт автоматически выдавать Data API доступ **новым** таблицам в схеме `public` у существующих проектов.

Существующие таблицы не трогают: текущие `GRANT` остаются, `supabase-js`, PostgREST, GraphQL и другие клиентские библиотеки продолжают работать. Чтобы текущее приложение не отвалилось, ничего делать не нужно.

Новая таблица в `public` без явного `GRANT` недоступна через Data API: API вернёт `permission denied` и текст нужного `GRANT`. То же для миграций, новых проектов, preview branches и локального `supabase db reset`.

Проверять список таблиц, открытых в Data API, — в настройках проекта Supabase.

## Erythro.ai

Сайт и админка ходят в Postgres ролью `postgres` через `DATABASE_URL` и Payload (`@payloadcms/db-postgres`). Data API (`anon` / `authenticated` / `service_role`, supabase-js, PostgREST, GraphQL) проект не использует.

Новые таблицы CMS, которые создаёт миграция Payload, для сайта и админки продолжают работать без этих `GRANT`.

Пример из письма **не** копировать на таблицы Payload (`contact_submissions`, сессии консультанта и остальные). `GRANT` роли `anon` открывает таблицу через Data API.

## Когда GRANT нужен

Только если таблица намеренно отдаётся через Data API. В той же миграции, которая её создаёт, и только тем ролям, которым доступ действительно нужен:

```sql
grant select
on public.your_table
to anon;

grant select, insert, update, delete
on public.your_table
to authenticated;

grant select, insert, update, delete
on public.your_table
to service_role;
```

Поверх `GRANT` по-прежнему действует RLS. Шире, чем нужно, не выдавать. Полный регламент: `docs/architecture/supabase-rls.md`.
