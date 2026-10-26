# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Home perf: always quick splash

- Cold `/` (mobile + desktop) → всегда `quick` (~0.9 с). `full` только по клику на логотип (`navigateHomeWithFullSplash`).
- Ужат quick: appear 0.45 / hold 0.15 / fade 0.3; убран мобильный delay 800 ms в `refreshScrollLayout`.
- Тесты `splash.int.spec.ts` обновлены.

### Очередь
1. Задеплоить → PSI `/` mobile + desktop.
2. Chunk `8261` без явного OWNER не трогать.
3. Параллельно (не блокирует): /audit SEO revalidate + деплой схемы (см. ниже).

## /audit SEO — AI Visibility (не задеплоено / кеш)

- CMS title в БД обновлён; Vercel cache может быть старым — Save в Admin или revalidate.
- В коде: WebApplication JSON-LD, form intro AI Visibility.

## Параллельно (Claude Code): отчёты аудита — не удалять

Шаблоны Free / Diagnostic / Pro утверждены. См. `docs/architecture/audit-report-tier-scope.md`.
