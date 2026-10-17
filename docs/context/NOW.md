# Latest changes

Обновлено: 2026-10-17  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Meta Pixel `2395401914532727`: базовый код в `<head>` (`AnalyticsBootstrap`), consent revoke→grant в `AnalyticsLoader`, Lead на успех free-audit (`trackFreeAuditLead` в `/audit` и `/order/audit-free`).
- CSP: `connect.facebook.net` + Facebook connect hosts; очистка `_fbp`/`_fbc` при Decline; тексты cookie/privacy; docs `architecture/meta-pixel.md` (+ Obsidian).

## Сейчас

1. Задеплоить → в Events Manager / Pixel Helper: PageView после Accept; Lead после тестовой отправки аудита.
2. В Meta настроить событие Lead на отправку формы (стандартное событие уже шлётся с сайта).
3. CORS Media / Home AI Audit migrate — по необходимости (с прошлой сессии).

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).
- Не добавлять второй `gtag/js` на страницу.
- Не включать PostgREST exposed schemas = `public` без RLS.

## Последняя эстафета

2026-10-17 — Cursor — Meta Pixel base + Lead на free-audit; деплой и проверка в Events Manager.
