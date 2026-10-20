# Latest changes

Обновлено: 2026-10-20  
Модель: Gemini  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- **GA4 Key Events (`qualify_lead`, `close_convert_lead`, `purchase`) + синхронный Consent Mode + сохранение UTM (PIT-116):**
  - В [`src/lib/adsConversion.ts`](../../src/lib/adsConversion.ts) добавлена `ensureAnalyticsConsentAndGaConfig()` и `readCampaignConfigParams()`.
  - В [`src/components/AnalyticsBootstrap.tsx`](../../src/components/AnalyticsBootstrap.tsx) включён `gtag('set', 'url_passthrough', true)` и снимок стартовых UTM-параметров `window.__ERYTHRO_INITIAL_UTM__`.
  - В GA4 (`543568002`) через Admin API добавлено ключевое событие `form_submit` (`keyEvents/16167623633`), созданы Custom Dimensions `lead_source` (`16167737469`) и `plan_slug` (`16167737470`), увеличено хранение данных (`dataRetentionSettings`) с `TWO_MONTHS` до `FOURTEEN_MONTHS`, и завершена связка с Google Ads (`googleAdsLinks/16167871915` ↔ `106-795-7298`).
  - Через Google Ads API в аккаунте `106-795-7298` очищен конфликтующий `customer.tracking_url_template` (`{lpurl}?utm_source=...`).
- **Оптимизация мобильного трафика из Facebook / Meta Ads и атрибуции `fbclid` / `gclid` (PIT-117):**
  - В [`src/lib/splash.ts`](../../src/lib/splash.ts) и [`src/components/SplashHost.tsx`](../../src/components/SplashHost.tsx) добавлена `shouldSkipSplashSurface()`: полноэкранный `<SplashScreen />` отключён на `/audit`, `/order/*`, `/lp/audit/*`, `audit-*.erythro.ai` и при любом переходе с `fbclid`, `gclid`, `gbraid`, `wbraid`, `utm_*`.
  - В [`src/components/AnalyticsBootstrap.tsx`](../../src/components/AnalyticsBootstrap.tsx) и [`src/lib/adsConversion.ts`](../../src/lib/adsConversion.ts) добавлен автоматический fallback атрибуции (`fbclid` → `fb / paid`, `gclid` → `google / cpc`) и повторный `fbq('track', 'PageView')` после `fbq('consent', 'grant')`.
- **Чистка индекса GSC, `sitemap.xml`, 308-редиректы и фильтр dev-хостов в GA4 (PIT-118):**
  - Из `sitemap.xml` ([`src/lib/orderPlans.ts`](../../src/lib/orderPlans.ts), [`src/lib/portfolioProjects.ts`](../../src/lib/portfolioProjects.ts), [`src/lib/sitemapEntries.ts`](../../src/lib/sitemapEntries.ts), [`src/app/sitemap.ts`](../../src/app/sitemap.ts)) и выдачи портфолио ([`src/lib/cmsPages.ts`](../../src/lib/cmsPages.ts)) исключены `/order/audit-manual` (`checkoutMode === 'contact'`) и черновик `/portfolio/next-project`.
  - В [`src/lib/copyHygiene.ts`](../../src/lib/copyHygiene.ts) добавлена `sanitizeOrderHref()` (замена `/order/ai-business-card` → `/order/ai-smart-card` в меню и карточках), а в [`next.config.ts`](../../next.config.ts) и [`src/app/(frontend)/order/[slug]/page.tsx`](../../src/app/(frontend)/order/[slug]/page.tsx) настроены `308 Permanent Redirect` для `/order/ai-business-card` → `/order/ai-smart-card`, `/order/audit-manual` → `/audit`, `/portfolio/Interior` / `/portfolio/interior` → `/portfolio/pro-interior`, `/portfolio/next-project` → `/portfolio`.
  - В [`src/lib/vercelHost.ts`](../../src/lib/vercelHost.ts), [`src/components/AnalyticsBootstrap.tsx`](../../src/components/AnalyticsBootstrap.tsx) и [`src/components/AnalyticsLoader.tsx`](../../src/components/AnalyticsLoader.tsx) добавлена проверка `isProductionAnalyticsHost()` — dev/preview хосты (`localhost`, `172.*`, `192.168.*`, `*.vercel.app`) больше не отправляют хиты в боевой GA4 / Google Ads / Meta Pixel.

## Сейчас

- **Этап 3 аудита (отложен пользователем для отдельной поэтапной реализации):** SEO-маршрутизация языковых версий (разделение URL для EN/RU/HE, `hreflang`, `sitemap.xml`).

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-20 — Gemini — выполнен Этап 5 (чистка `sitemap.xml`, 308-редиректы `/order/ai-business-card` и `/portfolio/Interior`, исключение `/portfolio/next-project` и `/order/audit-manual`, защита GA4 от dev-хостов, Data Retention 14 месяцев; PIT-118).
