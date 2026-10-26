# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## В работе: mobile perf — сжатие header images на services

### Сделано (ждёт деплоя)
- Compressed strip WebP в `public/images/service-headers/` (~21–86 KiB vs CMS JPEG ~230–320 KiB).
- `resolveServiceHeaderSrc` мапит `header_14/9/10.jpg` и старые square fallbacks → WebP; неизвестные JPEG идут через next/image.
- Правки: `ServiceHero`, `cmsPages`, `servicePages` fallbacks, тест `serviceHeaderImage.int`.

### Уже на проде
- Splash только на `/`. PSI mobile: portfolio **81**, services **78**, home **64**.

### Очередь после деплоя headers
1. Перемерить PSI `/services/ai-automation`.
2. Позже: ISR `/services/*`.
3. Не трогать пока: аналитика, chunk `8261`.

## Параллельно (Claude Code): отчёты аудита — не удалять

- Free HTML / tier-scope — см. предыдущую эстафету; не смешивать с mobile-perf.
