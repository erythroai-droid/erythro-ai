# Latest changes

Обновлено: 2026-10-15  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Ads «не находит тег»: AW был только после Accept → Google не видел в HTML.
- Фикс: один Google tag в `<head>` (`AnalyticsBootstrap`) — `gtag/js?id=AW-18453652197` + `config`, Consent Mode denied.
- `AnalyticsLoader` больше не грузит второй gtag.js; после Accept — consent grant + GA4 config.

## Сейчас

1. Deploy / push — затем в Google Ads «Проверить тег» (без Accept; тег в View Source).
2. Tag Assistant: после Accept — ad_storage granted + GA4.

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).
- Не добавлять второй `gtag/js` на страницу.

## Последняя эстафета

2026-10-15 — Cursor — Google Ads tag always in head (Consent Mode); fix verification miss.
