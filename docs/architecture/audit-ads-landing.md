# Ads landing: AI Audit (fixed locale subdomains)

Отдельные посадочные для Google Ads / Meta с **жёстко зафиксированным** языком UI. Не путать с `/audit` (там язык из cookie / переключателя).

Три продукта: **Free** (экспресс), **Diagnostic** (₪99), **Pro** (₪490). UI-шелл общий (`AuditLpClient` + `product`).

## Хосты (Final URL)

### Free

| Host | Locale | Internal route |
|------|--------|----------------|
| `https://audit-en.erythro.ai/` | `en` | `/lp/audit/en` |
| `https://audit-ru.erythro.ai/` | `ru` | `/lp/audit/ru` |
| `https://audit-he.erythro.ai/` | `he` | `/lp/audit/he` |

### Diagnostic (₪99)

| Host | Locale | Internal route |
|------|--------|----------------|
| `https://audit-diag-en.erythro.ai/` | `en` | `/lp/audit/diagnostic/en` |
| `https://audit-diag-ru.erythro.ai/` | `ru` | `/lp/audit/diagnostic/ru` |
| `https://audit-diag-he.erythro.ai/` | `he` | `/lp/audit/diagnostic/he` |

### Pro (₪490)

| Host | Locale | Internal route |
|------|--------|----------------|
| `https://audit-pro-en.erythro.ai/` | `en` | `/lp/audit/pro/en` |
| `https://audit-pro-ru.erythro.ai/` | `ru` | `/lp/audit/pro/ru` |
| `https://audit-pro-he.erythro.ai/` | `he` | `/lp/audit/pro/he` |

DNS: Cloudflare CNAME → `cname.vercel-dns.com` (Proxied). Vercel Project → Domains: все девять.

Публичный RU free-хост — **`audit-ru`**. Label `audit-rus` в коде только как alias middleware (DNS на него не публиковался → NXDOMAIN).

Парсинг хоста: `audit-pro-*` / `audit-diag-*` **до** короткого `audit-*` (`src/lib/auditLp.ts`).

## Почему не cookie

На основном сайте `NEXT_LOCALE` / `localStorage` могут переключить RU→EN (или наоборот) у пользователя с другой кампании. Middleware **не** пишет `Set-Cookie` (PIT-056 — CDN HTML). Локаль LP:

1. Middleware: host → rewrite на `/lp/audit[/{product}]/{locale}` (URL в браузере остаётся субдоменом).
2. `LOCALE_BOOTSTRAP_SCRIPT`: host/path lock → `html[lang]` / `dir` до paint, **игнор** cookie.
3. `useSitePrefs({ lockedLocale })`: не читает storage, `setLocale` — no-op.
4. Язык отчёта в форме по умолчанию = локаль страницы.
5. Переключатель EN/RU/HE в шапке → sibling-хост **того же продукта** (`audit-pro-ru` ↔ `audit-pro-en`, …), без cookie.

## Что на LP

Отдельный UI (`AuditLpClient`): бренд, короткий hero, 3 карточки, 3 шага, cookie banner, ссылки privacy/terms на `erythro.ai`. Без полного Navbar, FAQ, табов pricing, splash.

| Product | Форма | API |
|---------|--------|-----|
| Free | `AuditLpForm` (email + website) | `POST /api/contact` + `trackFreeAuditLead` |
| Diagnostic / Pro | `AuditLpPaidForm` (name, email, phone, website, язык отчёта) | `POST /api/payment/create` → Grow `paymentUrl` |

Free: ссылка на отчёт после успеха — абсолютный URL на `https://erythro.ai/audit/report/…?k=…&lang={locale}` (`lang` обязателен: cookie/localStorage LP-хоста не видны на apex).

Paid: редирект на hosted Grow; лаборатория стартует после оплаты (как `/order/audit-diagnostic` / `/order/audit-pro`). Промо `audit-pro-ads` (₪390) на этих LP **не** используется.

**Turnstile:** временно выключен на всех ads LP (`AUDIT_LP_TURNSTILE_ENABLED` в `auditLp.ts` + skip siteverify на `/api/contact` и `/api/payment/create` когда `Host` = audit-*). Honeypot + rate limit остаются. Вернуть: флаг → `true`.

## SEO / robots

`noindex, nofollow` (middleware `X-Robots-Tag` + metadata). Каноникал — свой субдомен. Органика остаётся на `/audit` и `/order/…`.

## Локальная проверка без DNS

- Free: `/lp/audit/ru` (и `en` / `he`)
- Pro: `/lp/audit/pro/ru`
- Diagnostic: `/lp/audit/diagnostic/he`

Path lock в bootstrap + `lockedLocale`.

## Деплой checklist

1. Domains в Vercel + DNS (9 хостов).
2. **Cloudflare Turnstile → Widget → Domains:** все `audit-*.erythro.ai` (free + pro + diag). Без этого виджет не выдаёт токен / siteverify падает — форма «не работает».
3. `TURNSTILE_HOSTNAMES` на Vercel: код сам подмешивает LP-хосты (`AUDIT_LP_ALL_HOSTS`); в env достаточно apex + www.
4. Ads Final URL = нужный субдомен продукта + языка.
5. Tag Assistant на субдомене после «Принять» cookie.
6. HE: RTL, шрифт Heebo.
7. Не ставить второй `gtag/js` (см. `google-ads-conversions.md`).
