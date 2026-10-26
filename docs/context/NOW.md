# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## В работе: ISR `/services/[slug]` (ждёт деплоя)

### Сделано
- `force-static` + `revalidate=60`, убраны `cookies()` / `getRequestPrefs`.
- `ServiceClient` + `clientHydratePrefs` (локаль/тема после mount).
- Metadata SSR как EN (как contacts/home).

### После деплоя проверить
- `Cache-Control: s-maxage=60`, второй запрос `x-vercel-cache: HIT`.
- PSI mobile `/services/ai-automation` (TTFB должен упасть с ~180ms).

### Очередь дальше
1. Portfolio LCP / картинки на R2.
2. Home LCP / main-thread.
3. Не трогать: аналитика, chunk `8261`.

## Параллельно (Claude Code): отчёты аудита — не удалять
