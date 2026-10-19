# Latest changes

Обновлено: 2026-10-19  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- RLS docs → KB (`docs/architecture/supabase-rls.md` + Obsidian); grants doc восстановлен в репо.
- Supabase RLS/grants hardening отложен в `PLAN-deferred` (**later**, не срочно).

## LP polish

- Form + packages/`?lang=` + Turnstile off.
- Шапка: плашка тема + EN/RU/HE → `/lp/audit/{locale}` (dev) или `audit-*.erythro.ai` (prod).
- Текстовый блок: 3 карточки с цветной верхней гранью (как Google/AI comparison).

## Сейчас

1. Smoke locale switch + form; деплой.
2. Ads Final URL на субдомены.

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).
- Не добавлять второй `gtag/js` на страницу.
- Не включать PostgREST exposed schemas = `public` без RLS.
- Не фиксировать язык LP через `Set-Cookie` в middleware (PIT-056 / PIT-112).
- Не копировать `GRANT … TO anon` на таблицы Payload.
- Не трогать RLS/grants hardening сейчас — пункт в `PLAN-deferred` (later).

## Последняя эстафета

2026-10-19 — Cursor — RLS в KB; hardening → `PLAN-deferred` later. Дальше: LP waiting `?lang=` / Ads Final URL.
