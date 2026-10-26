# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## /audit SEO — AI Visibility

- **CMS title обновлён в БД** (`audit_page_locales`): EN `Free AI Website Audit & AI Visibility Tool`, RU/HE аналоги. Description не трогал.
- **Кеш Vercel ещё старый** — SQL не триггерит Payload hooks. Нужен Save в Admin → audit-page **или** `POST /api/revalidate?secret=…&path=/audit` (в local `.env` токен-заглушка `YOUR…`, прод-секрет в env не найден через MCP).
- В коде (не задеплоено): WebApplication JSON-LD, form intro AI Visibility, twitter=page meta, fallbacks title/description.

### Очередь
1. Сбросить кеш (Save в admin / revalidate) → проверить `<title>` на `/audit`.
2. Задеплоить код (схема + form intro).
3. Perf: PSI; chunk `8261` без явного ОК не трогать.

## Параллельно (Claude Code): отчёты аудита — не удалять

**Состояние на 2026-10-26 17:30 UTC.** Шаблоны Free / Diagnostic / Pro (RU/EN/HE) утверждены. Рабочие отчёты erythro.ai собраны локально.

Подробности — [`docs/architecture/audit-report-tier-scope.md`](../architecture/audit-report-tier-scope.md); v2 — [`docs/architecture/audit-report-pro-v2.md`](../architecture/audit-report-pro-v2.md).
