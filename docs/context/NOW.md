# Latest changes

Обновлено: 2026-10-18  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Ads LP (PIT-112) задеплоен в production (`main` merge #255, READY).
- UI/docs/тест: host lock, text|form, how below.

## Сделано (домены)

- Vercel Domains: `audit-en|ru|he.erythro.ai` verified.
- CF CNAME Proxied → `cname.vercel-dns.com` (все три в UI).
- Hotnet NXDOMAIN на `audit-ru` → публичный RU-хост сменён на `audit-rus.erythro.ai` (код + Vercel domain). Alias `audit-ru` оставлен.

## Сделано (perf LP)

- Chip: GSAP только при `pin` (dynamic import) — LP `pin={false}` без gsap.
- Turnstile LP: `deferUntilInteraction` (скрипт после focus/pointer в форме).
- Desktop logo: CSS `bg-[url]` вместо `<img>` — без preload SVG на mobile.

## Сделано (CSP / legal links)

- LP: privacy/terms → абсолютные `erythro.ai` (`<a>`, не Next Link soft-nav).
- CSP `connect-src`: `https://erythro.ai` + `https://*.erythro.ai` (PSI console CSP на `/privacy`).

## Сделано (theme)

- LP: переключатель light/dark в шапке (справа от лого); страница и форма реагируют на тему.
- Light LP выровнен с `/audit`: `solution-light-bg`, gold-900 accents, logo on-light, `cursor-pointer` на toggle.

## Сейчас

1. Smoke light/dark на LP; задеплоить.
2. Ads Final URL на субдомены.

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).
- Не добавлять второй `gtag/js` на страницу.
- Не включать PostgREST exposed schemas = `public` без RLS.
- Не фиксировать язык LP через `Set-Cookie` в middleware (PIT-056 / PIT-112).

## Последняя эстафета

2026-10-18 — Cursor — LP perf на production (#256); дальше PSI + Ads Final URL.
