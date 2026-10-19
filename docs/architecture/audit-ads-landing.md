# Ads landing: AI Audit (fixed locale subdomains)

Отдельные посадочные для Google Ads / Meta с **жёстко зафиксированным** языком UI. Не путать с `/audit` (там язык из cookie / переключателя).

## Хосты (Final URL)

| Host | Locale | Internal route |
|------|--------|----------------|
| `https://audit-en.erythro.ai/` | `en` | `/lp/audit/en` |
| `https://audit-rus.erythro.ai/` | `ru` | `/lp/audit/ru` |
| `https://audit-he.erythro.ai/` | `he` | `/lp/audit/he` |

DNS: Cloudflare CNAME → `cname.vercel-dns.com` (Proxied). Vercel Project → Domains: все три.

`audit-ru.erythro.ai` остаётся alias в middleware (если DNS оживёт), но Final URL для Ads — **`audit-rus`**: Hotnet и др. ISP иногда кэшируют NXDOMAIN на `audit-ru` после первого lookup до появления записи.

## Почему не cookie

На основном сайте `NEXT_LOCALE` / `localStorage` могут переключить RU→EN (или наоборот) у пользователя с другой кампании. Middleware **не** пишет `Set-Cookie` (PIT-056 — CDN HTML). Локаль LP:

1. Middleware: host → rewrite на `/lp/audit/{locale}` (URL в браузере остаётся субдоменом).
2. `LOCALE_BOOTSTRAP_SCRIPT`: host/path lock → `html[lang]` / `dir` до paint, **игнор** cookie.
3. `useSitePrefs({ lockedLocale })`: не читает storage, `setLocale` — no-op.
4. Язык отчёта в форме = локаль страницы.
5. Переключатель EN/RU/HE в шапке → другая LP-страница (`audit-*.erythro.ai` / локально `/lp/audit/{locale}`), без cookie.

## Что на LP

Отдельный UI (`AuditLpClient`): бренд, короткий hero, 3 буллета, форма free-audit, cookie banner, ссылки privacy/terms на `erythro.ai`. Без полного Navbar, FAQ, табов pricing, splash.

Форма → тот же `POST /api/contact` + `trackFreeAuditLead`. Ссылка на отчёт после успеха — абсолютный URL на `https://erythro.ai/audit/report/…?k=…&lang={locale}` (`lang` обязателен: cookie/localStorage LP-хоста не видны на apex).

**Turnstile:** временно выключен на LP (`AUDIT_LP_TURNSTILE_ENABLED` в `auditLp.ts` + skip siteverify когда `Host` = audit-*). Honeypot `ContactHoneypotField` + rate limit остаются. Вернуть: флаг → `true`.

## SEO / robots

`noindex, nofollow` (middleware `X-Robots-Tag` + metadata). Каноникал — свой субдомен. Органика остаётся на `/audit`.

## Локальная проверка без DNS

`https://localhost:3000/lp/audit/ru` (и `en` / `he`) — path lock в bootstrap + `lockedLocale`.

## Деплой checklist

1. Domains в Vercel + DNS.
2. **Cloudflare Turnstile → Widget → Domains:** добавить `audit-en.erythro.ai`, `audit-rus.erythro.ai`, `audit-he.erythro.ai` (и alias `audit-ru` при необходимости). Без этого виджет не выдаёт токен / siteverify падает — форма «не работает».
3. `TURNSTILE_HOSTNAMES` на Vercel: код сам подмешивает LP-хосты; в env достаточно apex + www.
4. Ads Final URL = нужный субдомен.
5. Tag Assistant на субдомене после «Принять» cookie.
6. HE: RTL, шрифт Heebo.
7. Не ставить второй `gtag/js` (см. `google-ads-conversions.md`).
