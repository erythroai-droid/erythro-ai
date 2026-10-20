# Latest changes

Обновлено: 2026-10-20  
Модель: Gemini  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- **GA4 Key Events (`qualify_lead`, `close_convert_lead`, `purchase`) + синхронный Consent Mode + сохранение UTM (PIT-116):**
  - В [`src/lib/adsConversion.ts`](../../src/lib/adsConversion.ts) добавлена `ensureAnalyticsConsentAndGaConfig()` и `readCampaignConfigParams()`.
  - В [`src/components/AnalyticsBootstrap.tsx`](../../src/components/AnalyticsBootstrap.tsx) включён `gtag('set', 'url_passthrough', true)` и снимок стартовых UTM-параметров `window.__ERYTHRO_INITIAL_UTM__`.
  - В GA4 (`543568002`) через Admin API добавлено ключевое событие `form_submit` (`keyEvents/16167623633`), созданы Custom Dimensions `lead_source` (`16167737469`) и `plan_slug` (`16167737470`), а также завершена связка с Google Ads (`googleAdsLinks/16167871915` ↔ `106-795-7298`).
  - Через Google Ads API в аккаунте `106-795-7298` очищен конфликтующий `customer.tracking_url_template` (`{lpurl}?utm_source=...`), который дублировал второй `?` поверх `ad.finalUrls`.
- **Оптимизация мобильного трафика из Facebook / Meta Ads и атрибуции `fbclid` / `gclid` (PIT-117):**
  - В [`src/lib/splash.ts`](../../src/lib/splash.ts) и [`src/components/SplashHost.tsx`](../../src/components/SplashHost.tsx) добавлена `shouldSkipSplashSurface()`: полноэкранный `<SplashScreen />` отключён на `/audit`, `/order/*`, `/lp/audit/*`, `audit-*.erythro.ai` и при любом переходе с рекламными метками (`fbclid`, `gclid`, `gbraid`, `wbraid`, `utm_*`), чтобы мобильный In-App Browser (Facebook/Instagram) открывал страницу без 1.5–3.5с задержки.
  - В [`src/components/AnalyticsBootstrap.tsx`](../../src/components/AnalyticsBootstrap.tsx) и [`src/lib/adsConversion.ts`](../../src/lib/adsConversion.ts) добавлен автоматический fallback атрибуции: `fbclid` → `fb / paid`, `gclid` → `google / cpc`, если нет явных `utm_source` / `utm_medium`.
  - В [`src/components/AnalyticsLoader.tsx`](../../src/components/AnalyticsLoader.tsx) и `ensureAnalyticsConsentAndGaConfig()` добавлена отправка `fbq('track', 'PageView')` после `fbq('consent', 'grant')`.
  - Обновлены [`docs/architecture/google-ads-conversions.md`](../architecture/google-ads-conversions.md), [`docs/PITFALLS.md`](../PITFALLS.md) (PIT-116, PIT-117) и их зеркала в Obsidian.

## Сейчас

- **Этап 3 аудита (отложен пользователем для отдельной поэтапной реализации):** SEO-маршрутизация языковых версий (разделение URL для EN/RU/HE, `hreflang`, `sitemap.xml`).

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-20 — Gemini — исправлены Key Events в GA4, связка Google Ads ↔ GA4, отключение SplashScreen на рекламном трафике и авто-атрибуция `fbclid`/`gclid` (PIT-116, PIT-117).
