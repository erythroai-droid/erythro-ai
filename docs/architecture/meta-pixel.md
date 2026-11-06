# Meta Pixel (Facebook)

Эталон на erythro.ai: `AnalyticsBootstrap`, `AnalyticsLoader`, `src/lib/adsConversion.ts` (`trackMetaLead` / `trackFreeAuditLead`), CSP в `next.config.ts`.

Pixel ID: `2395401914532727`.

## 1. Базовый код

1. Один раз в `<head>` сырыми `<script>`, чтобы Events Manager видел пиксель в HTML.
2. Сразу после загрузчика `fbevents.js`: `fbq('consent', 'revoke')`, затем `fbq('init', '…')`, `fbq('track', 'PageView')`.
3. По «Принять» — `fbq('consent', 'grant')`. По «Отклонить» — `revoke` и очистка `_fbp` / `_fbc`.
4. Для уже принявших согласие вызвать `grant` при загрузке, не только по клику на баннер.

## 2. Событие Lead

Вызывать только после успеха на сервере (бесплатный аудит), один раз на заявку.

- Стандартное событие Meta: `fbq('track', 'Lead', …)`.
- `eventID` = `submissionId` — общий с Conversions API, Meta убирает дубль.
- Точки вызова: `/audit` (`AuditBody`), `/order/audit-free` (`OrderClient`), LP аудита и калькулятора (`AuditLpForm`) через `trackFreeAuditLead`.
- `content_name` (общий хелпер `metaLeadContentName` в `src/lib/metaLead.ts`): `free_audit` — аудит, `leak_calc` — калькулятор (`leak-{en,ru,he}`), slug плана — заказ, `source` — контактные формы. В GA4 `qualify_lead.lead_source`: `audit` / `leak_calc`.
- Google Ads конверсия «Отправка формы» общая для аудита и калькулятора; разделять по кампании / URL.

## 2a. Conversions API (сервер)

- `src/lib/metaCapi.ts`, вызов в `/api/contact` после сохранения заявки, через `after()` (ответ форме не ждёт Meta).
- Тот же `event_id` = `submissionId`, тот же `content_name`, `action_source: website`.
- `user_data`: SHA-256 email и телефона (цифры с кодом страны), IP (`cf-connecting-ip`), User-Agent, `_fbp`, `_fbc` (или `fb.1.<ms>.<fbclid>` из Referer).
- Не отправляется, если cookie `cookie_consent=declined` или нет `META_CAPI_ACCESS_TOKEN`.
- Env (Vercel, Production): `META_CAPI_ACCESS_TOKEN`; для проверки — временно `META_CAPI_TEST_EVENT_CODE`.
- Ошибки — в логах Vercel: `[api/contact] Meta CAPI Lead failed`.

Тестовый прогон делать после «Принять» cookie.

## 3. CSP

`script-src`: `connect.facebook.net`.

`connect-src`: `www.facebook.com`, `connect.facebook.net`, `*.facebook.com`.

`form-action`: `'self'`, `https://www.facebook.com`, `https://*.facebook.com` (Meta Pixel submits telemetry / fallback data via dynamic form POST).

`frame-src`: `https://challenges.cloudflare.com`, `https://www.facebook.com`, `https://*.facebook.com` (Meta Pixel hidden iframe transport).

`img-src https:` уже закрывает noscript-пиксель.

## 4. Проверка

1. Задеплоить. В CSP продакшена должны быть хосты Facebook.
2. Meta Pixel Helper / Events Manager Test Events на странице кампании после «Принять».
3. Успех: `PageView` на загрузке; `Lead` после успешной отправки формы аудита.
4. Без согласия cookie `_fbp` / `_fbc` не должны ставиться; после Decline — очищаются.
5. CAPI: задать `META_CAPI_TEST_EVENT_CODE`, отправить заявку — в Test Events один `Lead` с пометкой «Браузер и сервер» (deduplicated). Затем удалить test code и передеплоить.
