# Latest changes

Обновлено: 2026-10-15  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Портфолио: импорт AI Auditor (#5) + AI Consultant (#6).
- PIT-109: trailing-space slugs + cache; нужен деплой.
- Алерт Supabase 17:45 UTC: транзиентный pool storm после Vercel deploy; не security-инцидент.
- **PIT-110:** узкий REVOKE на `public` для `anon`/`authenticated` + default privileges postgres + `REVOKE USAGE … FROM PUBLIC`. `storage`/`auth`/`service_role` не трогали. Проверено: anon SELECT/USAGE на public = false; service_role/postgres/storage OK.

## Сейчас

1. **Задеплоить** PIT-109 (Data Cache на Vercel ещё может держать slug с пробелом → 404).
2. После деплоя проверить `/portfolio/ai-audit-agent` и `/portfolio/ai-consultant`.
3. Card/hero медиа — по желанию.
4. Ads «Неактивно» / Grow→Make offline — не сейчас.
5. TS: `order/success/page.tsx:59`.

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).
- Не добавлять второй `gtag/js` на страницу.
- Не включать PostgREST exposed schemas = `public` без RLS.

## Последняя эстафета

2026-10-15 — Cursor — PIT-110 applied on Supabase; PIT-109 still needs deploy verify.
