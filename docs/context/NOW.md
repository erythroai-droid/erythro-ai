# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## В работе: mobile perf — service headers на R2

### Сделано
- Сжатые strip WebP залиты в **R2** `erythro-media` и обновлены строки `media`:
  - `header_14.webp` (ai-automation, id 65) ~84 KiB
  - `header_9.webp` (design, id 59) ~86 KiB
  - `header_10.webp` (development, id 60) ~53 KiB
  - `header_87.webp` (enterprise-engineering, id 58) ~48 KiB
- Локальный маппинг `/images/service-headers/` убран — шапки только с R2 через CMS.
- Скрипт: `node scripts/compress-service-headers-r2.mjs` (`--apply`).

### Очередь
1. Deploy кода (fallback URLs в `servicePages` → R2 webp) + убедиться, что ISR/revalidate подхватил новые `media.url`.
2. PSI mobile `/services/ai-automation`.
3. Позже: ISR `/services/*`; аналитику / chunk `8261` не трогать.

## Параллельно (Claude Code): отчёты аудита — не удалять

- Free HTML / tier-scope — не смешивать с mobile-perf.
