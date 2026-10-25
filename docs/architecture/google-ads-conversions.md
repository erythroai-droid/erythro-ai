# Google Ads & GA4: порядок подключения конверсий

Чеклист для следующего сайта. Эталон на erythro.ai: `AnalyticsBootstrap`, `AnalyticsLoader`, `src/lib/adsConversion.ts`, CSP в `next.config.ts`.

Один тег Google на сайт. События конверсий — отдельные вызовы `gtag('event', ...)` в момент успеха, не при открытии страницы.

## 1. В Google Ads и GA4

1. **Google Ads:** «Цели» → «Конверсии» → источник «Конверсии на сайте». Телефонные звонки не включать, если их не отслеживаем.
2. Категория по смыслу: «Покупка» только для оплаты, «Отправка формы для потенциальных клиентов» для заявки. Не вешать покупку на загрузку лендинга.
3. Создание: **«Вручную, с добавлением кода»**. «Автоматически, без кода» считает заход на URL, а не успешную отправку.
4. На каждое действие в Google Ads одно основное. Импорт из GA4 в Google Ads переключить в **«Дополнительные»**, чтобы два основных в одной цели не давали «Неверная конфигурация» / «Требуется действие».
5. Из сниппета Google Ads забрать только `send_to` (`AW-…/метка`). Базовый тег второй раз не вставлять.
6. **В GA4 (`G-F3BTVWGDRS`):** в разделе *Admin → Key events* настроены ключевые события `qualify_lead`, `close_convert_lead`, `purchase`, `form_submit`. Срок хранения данных (`Data Retention`) выставлен в `FOURTEEN_MONTHS`. Важно: вызов `gtag('event', 'conversion', { send_to: 'AW-…' })` уходит **только в Google Ads** и не попадает в GA4. Поэтому при успехе заявки/оплаты обязательно параллельно вызывать GA4-события с `send_to: 'G-…'`.

## 2. Тег в коде и Consent Mode

1. Один раз в `<head>`, сырыми `<script>`, чтобы проверка Ads видела `gtag/js?id=AW-…` в HTML. `next/script` и загрузка только после «Принять» проверку не проходят.
2. **Фильтр dev/preview хостов (`isProductionAnalyticsHost` в `src/lib/vercelHost.ts`, PIT-118):** отправка живых хитов в GA4, Google Ads и Meta Pixel разрешена только на `erythro.ai` и `*.erythro.ai`. На `localhost`, локальных IP (`172.*`, `192.168.*`, `10.*`) и `*.vercel.app` функции `window.gtag` и `window.fbq` работают в режиме no-op, чтобы локальная разработка и превью не засоряли статистику.
3. Сразу после загрузчика: `dataLayer`, `gtag`, Consent Mode **default denied** (`ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`), `gtag('set', 'url_passthrough', true)`, `gtag('js', new Date())`, `gtag('config', 'AW-…')`.
4. Второй `gtag/js` не грузить. GA4 `gtag('config', 'G-…')` — после согласия, тем же `gtag` (с защитой флагом `window.__ERYTHRO_GA_CONFIGURED__`, чтобы не дублировать `config`).
5. По «Принять» — `gtag('consent', 'update', …)` со всеми четырьмя хранилищами `granted`. По «Отклонить» — `denied` и очистка `_ga*`, `_gcl_*`.
6. **Критично при отправке формы или успешной оплате (`ensureAnalyticsConsentAndGaConfig`):** если посетитель поставил галочку согласия в самой форме (не нажимая до этого cookie-баннер), нельзя ждать асинхронного рендера React (`AnalyticsLoader`). Перед отправкой события конверсии синхронно вызывается `gtag('consent', 'update', { ...granted })` и (если ещё не вызван) `gtag('config', 'G-F3BTVWGDRS')`.

## 3. События конверсий (`src/lib/adsConversion.ts`)

Вызывать только после успеха на сервере, один раз на заявку/оплату (дедупликация по `transaction_id` в `localStorage` отдельно для `erythro:ads-*`, `erythro:ga-*`, `erythro:meta-*`):

- **Бесплатный AI-аудит (`/audit`, `/lp/audit/{locale}`, `/order/audit-free`):** `trackFreeAuditLead(submissionId)` → шлёт Google Ads Lead (`AW-…`), GA4 `qualify_lead` (`lead_source: 'audit'`, `plan_slug: 'audit-free'`) и Meta Pixel `Lead`.
- **Заказ пакета без мгновенной оплаты (`/order/free-start`, `/order/enterprise-custom`):** `trackOrderLead(submissionId, plan.slug)` → шлёт Google Ads Lead (`AW-…`), GA4 `qualify_lead` + `close_convert_lead` (`lead_source: 'order'`, `plan_slug`) и Meta Pixel `Lead`.
- **Контактные формы (`/contacts` в `ContactsBody` и модальное окно `ContactModal`):** `trackContactLead(leadId, source)` → шлёт Google Ads Lead (`AW-…`), GA4 `qualify_lead` (`lead_source: source`) и Meta Pixel `Lead`.
- **Успешная оплата (`/order/success` в `PaymentReturn`, когда `status === 'paid'`):** `trackAdsPurchase(submissionId, amount)` → шлёт Google Ads Purchase (`AW-…`), а также GA4 `purchase` и `close_convert_lead` (`value`, `currency: 'ILS'`).

## 4. CSP

Разрешить цепочку, не только `googletagmanager.com`. Chrome в отчёте пишет **первый** URL, а блокирует редирект (для Израиля часто `www.google.co.il`).

`script-src`: `www.googletagmanager.com`, `www.google-analytics.com`, `www.google.com`, `www.google.co.il`, `www.googleadservices.com`, `googleads.g.doubleclick.net`.

`connect-src`: те же плюс `www.googletagmanager.com`, `*.google.com`, `www.google.ru`, `*.g.doubleclick.net`, `stats.g.doubleclick.net`, `pagead2.googlesyndication.com`, `ad.doubleclick.net`, региональный хост Analytics.

`img-src https:` уже закрывает пиксели.

## 5. Текст политики

В политике cookie написать, что тег Google на сайте всегда, а измерительные cookie Ads/Analytics включаются только после согласия.

## 6. Проверка

1. Задеплоить. На проде в заголовке CSP должны быть новые хосты.
2. Tag Assistant на **странице кампании**, в новом окне, после «Принять» (или при отправке формы с галочкой согласия).
3. Успех: в списке событие `conversion` (для `AW-…`) и `qualify_lead` (для `G-…`), консоль без CSP.
4. «Просмотр страницы», «Ремаркетинг» и «Consent Update» конверсией не являются.
5. В таблице Ads статус «Неактивно» и предупреждение кампании «Не завершена настройка» держатся несколько часов, иногда до суток. Дата в отчёте часто не включает сегодня.
6. Пока идёт обучение ставок, кампанию и цели не переключать. Повторные тестовые заявки не слать: они портят обучение, а на бесплатном аудите ещё и упираются в лимит (один домен / email / IP на 7 дней).

## 7. Если покупатель не вернулся на сайт

Событие со страницы «спасибо» не сработает. Тогда офлайн-конверсия из платёжного вебхука (Make). На erythro.ai это не сделано.

## 8. Атрибуция платного трафика (`fbclid` / `gclid`) и отключение Splash на посадочных (PIT-117)

1. **Автоматический fallback источника (`readCampaignConfigParams` и `AnalyticsBootstrap.tsx`):**
   - Если в URL есть `fbclid` без явных `utm_source` / `utm_medium`, автоматически выставляются `campaign_source: 'fb', campaign_medium: 'paid'`.
   - Если в URL есть `gclid` / `gbraid` / `wbraid` без явных `utm_source` / `utm_medium`, автоматически выставляются `campaign_source: 'google', campaign_medium: 'cpc'`.
2. **Мгновенный первый экран (`shouldSkipSplashSurface` в `src/lib/splash.ts`, PIT-117 / PIT-126):**
   - Полноэкранный `<SplashScreen />` отключён не только на `/lp/audit/*` (`audit-*.erythro.ai`), но и на `/audit`, `/order/*`, а также при любом переходе с параметрами `fbclid`, `gclid`, `gbraid`, `wbraid`, `utm_source`, `utm_campaign`, `utm_medium`.
   - `SplashHost` обязан передавать `useSearchParams()` (layout ISR-static не видит query на SSR). Дополнительно: `SPLASH_SKIP_BOOTSTRAP_SCRIPT` + CSS `html[data-erythro-skip-splash]` + `sweepOrphanedSplashPlates()` — иначе hydration orphan оставляет вечный красный экран (PIT-126).
3. **Meta Pixel `PageView` после согласия:**
   - При вызове `fbq('consent', 'grant')` (в `AnalyticsLoader.tsx` или `ensureAnalyticsConsentAndGaConfig()`) однократно досылается `fbq('track', 'PageView')` (`window.__ERYTHRO_META_PAGEVIEW_SENT__`), чтобы Meta Ads фиксировал `landing_page_view`.
