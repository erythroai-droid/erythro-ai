# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## В работе: mobile perf — R2 headers + PIT-133

### Сделано
- Headers на R2 WebP; `media.url` указывает на них.
- **PIT-133:** после SQL-сжатия `_objectkey=filename` давал URL `…/file.webp/file.webp` (404). `_objectkey` обнулён; `generateFileURL` защищён от удвоения; скрипт больше не пишет `_objectkey` для flat keys.

### Нужно от пользователя
- **Revalidate / Save** любой Media или Service в админке (или `/api/revalidate`) — иначе ISR ещё отдаёт удвоенный URL из кэша. Локальный revalidate secret в env отсутствует.

### Очередь после revalidate
1. Проверить img src = `…/header_14.webp` (без дубля), PSI `/services/ai-automation`.
2. Позже: ISR services; аналитику / chunk не трогать.

## Параллельно (Claude Code): отчёты аудита — не удалять

- Free HTML / tier-scope — не смешивать с mobile-perf.
