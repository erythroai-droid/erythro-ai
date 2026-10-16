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
- **Navbar:** `LanguageLiquidSwitch` рядом с бургером — флаг + `en`/`ru`/`he`, без обводки/заливки; цвет текста от `menuOnDark`; флаги +20%.
- **/audit:** ссылка на пример HTML-отчёта в free-форме и на карточках Free/Diagnostic/Pro (locale-matched `/samples/audit/…`); на карточках — compact `11px` в одну строку.
- **/audit form:** текст про защиту данных под полями над Turnstile; под кнопкой — чекбокс → «* обязательное поле».

## Сейчас

1. **Задеплоить** PIT-109 (Data Cache на Vercel ещё может держать slug с пробелом → 404).
2. После деплоя проверить `/portfolio/ai-audit-agent` и `/portfolio/ai-consultant`.
3. Проверить free audit на `/audit` и `/order/audit-free` (только email / сайт / язык отчёта).
4. Проверить language switch рядом с Menu на mobile/desktop.
5. Проверить ссылку «пример отчёта» на `/audit`.
6. Card/hero медиа — по желанию.
7. Ads «Неактивно» / Grow→Make offline — не сейчас.
8. TS: `order/success/page.tsx:59`.

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).
- Не добавлять второй `gtag/js` на страницу.
- Не включать PostgREST exposed schemas = `public` без RLS.

## Последняя эстафета

2026-10-16 — Cursor — /audit: sample HTML report links on free form + pricing cards.
