# Latest changes

Обновлено: 2026-10-27  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Report host + PHP alert duplicate

- **Адрес в шапке:** шаблон вшивал `erythro.ai` в `.site`; `render-v2-reports.mjs` теперь подставляет hostname из `audit_data.target_url` (без fallback на erythro.ai).
- **Дубль PHP-алерта:** при повторном render старый `<p class="tech-php-alert">` оставался рядом с новым — теперь снимаем предыдущие siblings перед вставкой.
- VPS: `render-v2-reports.mjs` docker cp. Новые аудиты / re-queue подхватят.

### Очередь
- Commit + push правок `render-v2-reports.mjs` (по запросу).
