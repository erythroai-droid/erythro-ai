# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Portfolio media → R2 WebP (сделано)

- Скрипт `scripts/compress-portfolio-media-r2.mjs` (strip + cards + heavy mobile heroes).
- Flat WebP на R2, `media._objectkey = null` (PIT-133).
- PSI mobile `/portfolio`: Perf **69**, **LCP 5.0s** (было ~8s). Картинки ок; остаток main-thread / `8261` / аналитика.

## Home LCP — замер (без правок)

- PSI mobile `/`: Perf **63**, LCP **5.1s**, TTFB 20ms. Hero_Mobile.webp ~50KB — не bottleneck.
- Heavy transfers: GTM 162KB, fbevents 116KB, fonts ~186KB, chunk `8261` (~framer/payload) + main-thread Style&Layout **2.3s**.
- Картинки/ISR уже выжаты; дальше только аналитика или `8261` — **не трогаем** по плану.

### Очередь
1. (опционально) Commit `scripts/compress-portfolio-media-r2.mjs` + NOW.
2. Стоп по perf-плану, пока не разрешат аналитику / `8261`.
3. Если где-то ещё jpg на portfolio — Save Site Settings (локальный `REVALIDATION_TOKEN` непригоден).

## Параллельно (Claude Code): отчёты аудита — не удалять
