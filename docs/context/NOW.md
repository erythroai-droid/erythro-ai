# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Home perf: mobile LCP squeeze (не задеплоено)

Аккуратный дожим после always-quick splash:

- **Quick splash:** plate начинает fade с ~0.2 с параллельно с logo (LCP не ждёт весь бренд-бит). reduced-motion — короткий sequential.
- **Hero still:** intrinsic 1080×1920, `decoding="sync"`, preload `type="image/webp"`. Новый меньший ассет на R2 не добавляли (~50 KiB уже компактный; srcset без второго файла бессмысленен).
- `8261` не трогали.

### Очередь
1. Задеплоить → PSI `/` mobile (сравнить LCP с ~4.8 с).
2. Если LCP всё ещё >4 с — отдельный меньший mobile WebP на R2 + `imagesrcset` на preload.
3. Chunk `8261` без OWNER не трогать.

## /audit SEO — AI Visibility

CMS title в БД; кеш/деплой схемы — параллельно, не блокирует perf.
