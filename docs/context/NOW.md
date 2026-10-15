# Latest changes

Обновлено: 2026-10-15  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Ads «не находит тег»: AW был только после Accept → Google не видел в HTML.
- Фикс: один Google tag в `<head>` (`AnalyticsBootstrap`) — `gtag/js?id=AW-18453652197` + `config`, Consent Mode denied.
- `AnalyticsLoader` больше не грузит второй gtag.js; после Accept — consent grant + GA4 config.
- Конверсия «Покупка» (`AW-18453652197/-mcPCMys6Z0dEOXFsd9E`): `src/lib/adsConversion.ts`, вызов в `PaymentReturn`, когда статус = `paid`; `transaction_id` = id заявки, `value` = `paymentAmount` (ILS), один раз на браузер.
- Конверсия «Отправка формы» (`AW-18453652197/L4VgCMWPhZ4dEOXFsd9E`): `trackAdsLead` после успешной заявки `audit-free` на `/audit` и `/order/audit-free`, value 1 ILS, один раз на заявку.
- CSP пропускает конверсию Ads: `script-src` `googleads.g.doubleclick.net` + `googleadservices.com`; `connect-src` `ad.doubleclick.net`.

## Сейчас

1. Tag Assistant: событие `conversion` есть, запрос `www.google.com/pagead/1p-conversion` режется редиректом (часто `google.co.il`). CSP расширен. После деплоя — ещё одна заявка с другого IP/email/домена; в консоли не должно быть этой блокировки.
2. Если покупатель не возвращается с Grow — офлайн-конверсия через Make (не сделано).
3. Старая TS-ошибка: `order/success/page.tsx:59` (`doc.source` может быть `null`).

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).
- Не добавлять второй `gtag/js` на страницу.

## Последняя эстафета

2026-10-15 — Cursor — Google Ads tag always in head (Consent Mode); fix verification miss.
