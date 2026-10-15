# Latest changes

Обновлено: 2026-10-15  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Google Ads gtag `AW-18453652197` в `AnalyticsLoader` (после Accept, вместе с GA4).
- Consent Mode: на Accept выдаются `ad_storage` / `ad_user_data` / `ad_personalization`.
- CSP `connect-src` для Ads; очистка `_gcl_*` при Decline; privacy copy обновлена.

## Сейчас

1. Merge/deploy Next — чтобы Ads-тег появился на проде.
2. В Google Ads: проверить тег / conversion (Tag Assistant после Accept на cookie).

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).

## Последняя эстафета

2026-10-15 — Cursor — Google Ads AW-18453652197 wired through AnalyticsLoader + consent.
