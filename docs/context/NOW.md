# Latest changes

Обновлено: 2026-10-16  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Портфолио: импорт AI Auditor (#5) + AI Consultant (#6).
- PIT-109: trailing-space slugs + cache; нужен деплой.
- Алерт Supabase 17:45 UTC: транзиентный pool storm после Vercel deploy; не security-инцидент.
- **PIT-110:** узкий REVOKE на `public` для `anon`/`authenticated` + default privileges postgres + `REVOKE USAGE … FROM PUBLIC`. `storage`/`auth`/`service_role` не трогали. Проверено: anon SELECT/USAGE на public = false; service_role/postgres/storage OK.
- Алерт `gemini_api_outage` 22:05 UTC: пустой `{'error': ''}`, внешний probe. Google/StatusGator up; Vercel без ошибок consult; `/api/consult` 204. Ложный/транзиентный — не трогать.
- **Free audit form:** убраны поля Имя и Телефон на `/audit` и `/order/audit-free`. API guard + валидация: name/phone обязательны только для платных планов. CMS `contact-submissions.name` — optional. Тесты обновлены.

## Сейчас

1. **Задеплоить** PIT-109 (Data Cache на Vercel ещё может держать slug с пробелом → 404).
2. После деплоя проверить `/portfolio/ai-audit-agent` и `/portfolio/ai-consultant`.
3. Проверить free audit на `/audit` и `/order/audit-free` (только email / сайт / язык отчёта).
4. Card/hero медиа — по желанию.
5. Ads «Неактивно» / Grow→Make offline — не сейчас.
6. TS: `order/success/page.tsx:59`.

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).
- Не добавлять второй `gtag/js` на страницу.
- Не включать PostgREST exposed schemas = `public` без RLS.

## Последняя эстафета

2026-10-16 — Cursor — free audit: removed name/phone fields; API allows empty name/phone for audit-free.
