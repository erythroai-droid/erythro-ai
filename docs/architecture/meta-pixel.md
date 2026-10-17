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
- `eventID` = `submissionId` (для будущей дедупликации с Conversions API).
- Точки вызова: `/audit` (`AuditBody`) и `/order/audit-free` (`OrderClient`) через `trackFreeAuditLead`.

Тестовый прогон делать после «Принять» cookie.

## 3. CSP

`script-src`: `connect.facebook.net`.

`connect-src`: `www.facebook.com`, `connect.facebook.net`, `*.facebook.com`.

`img-src https:` уже закрывает noscript-пиксель.

## 4. Проверка

1. Задеплоить. В CSP продакшена должны быть хосты Facebook.
2. Meta Pixel Helper / Events Manager Test Events на странице кампании после «Принять».
3. Успех: `PageView` на загрузке; `Lead` после успешной отправки формы аудита.
4. Без согласия cookie `_fbp` / `_fbc` не должны ставиться; после Decline — очищаются.
