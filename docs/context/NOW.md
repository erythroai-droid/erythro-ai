# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Ads LP H1: тариф в заголовке (локально)

- `sectionTitle`: Free → `AI Audit Free`, Pro → `AI Audit Pro`, Diagnostic → `AI Audit Diagnostic` (RU/HE с тем же суффиксом).
- Tab/OG title: Free/Pro/Diagnostic metadata берут `sectionTitle`.
- Файлы: `src/lib/auditLp.ts`, `lp/audit/{,pro/,diagnostic/}[locale]/page.tsx`.

### Очередь
1. Деплой + визуально на audit-en / audit-pro-en / audit-diag-en.
2. Chunk `8261` — не трогаем.

## Параллельно (Claude Code): отчёты аудита — не удалять
