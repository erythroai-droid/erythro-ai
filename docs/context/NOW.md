# Latest changes

Обновлено: 2026-10-20  
Модель: Gemini  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- **GA4 Key Events (`qualify_lead`, `close_convert_lead`, `purchase`) + синхронный Consent Mode (PIT-116):**
  - В [`src/lib/adsConversion.ts`](../../src/lib/adsConversion.ts) добавлена `ensureAnalyticsConsentAndGaConfig()` (синхронный `gtag('consent', 'update', { ...granted })` + `gtag('config', 'G-F3BTVWGDRS')` с флагом `window.__ERYTHRO_GA_CONFIGURED__`, согласованным с [`src/components/AnalyticsLoader.tsx`](../../src/components/AnalyticsLoader.tsx)).
  - Добавлена отправка GA4 Key Events (`qualify_lead`, `close_convert_lead`, `purchase`) параллельно с Google Ads (`AW-18453652197`) и Meta Pixel (`Lead`).
  - Подключён трекинг во всех формах, где он отсутствовал: [`OrderClient.tsx`](../../src/app/(frontend)/order/[slug]/OrderClient.tsx) (`trackOrderLead` для `free-start`, `enterprise-custom` и др.), [`ContactModal.tsx`](../../src/components/ContactModal.tsx) и [`ContactsBody.tsx`](../../src/components/contacts/ContactsBody.tsx) (`trackContactLead`).
  - Добавлены интеграционные тесты [`tests/int/adsConversion.int.spec.ts`](../../tests/int/adsConversion.int.spec.ts).
  - Обновлены [`docs/architecture/google-ads-conversions.md`](../architecture/google-ads-conversions.md), [`docs/PITFALLS.md`](../PITFALLS.md) (PIT-116) и их зеркала в Obsidian.
- Ранее: First-visit locale from browser (`navigator.languages` when no `?lang=` / cookie / `localStorage`).

## Сейчас

- **Этап 2 аудита GA4 + GSC:** Связка Google Ads (`AW-18453652197`) с ресурсом GA4 (`543568002`), проверка автопометки (`gclid`) и устранение `(not set)` в `sessionCampaignName`.
- **Этап 3 аудита:** SEO-маршрутизация языковых версий (разделение URL для EN/RU/HE, `hreflang`, `sitemap.xml`).
- **Этап 4 аудита:** Оптимизация мобильного трафика из встроенного браузера Facebook (`m.facebook.com`).

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-20 — Gemini — исправлен нулевой трекинг Key Events в GA4 (PIT-116, `adsConversion.ts` + все 5 форм сайта).
