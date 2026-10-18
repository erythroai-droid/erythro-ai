# Latest changes

Обновлено: 2026-10-18  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Ads LP AI Audit с жёсткой локалью (без cookie): `audit-{en|ru|he}.erythro.ai` → rewrite `/lp/audit/{locale}`.
- Ads LP AI Audit (locale lock, PIT-112): UI зафиксирован — text|form, how below, списки, sample под Free-бейджем.
- Docs: `docs/architecture/audit-ads-landing.md`; тест `tests/int/auditLp.int.spec.ts`.

## Сейчас

1. Закоммитить LP (по просьбе) → деплой.
2. Vercel Domains + Cloudflare DNS: `audit-en|ru|he.erythro.ai`.
3. Ads Final URL → субдомены (не `/audit`); Tag Assistant после cookie Accept.
4. Smoke: форма, sample report, WhatsApp, locale не прыгает.

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).
- Не добавлять второй `gtag/js` на страницу.
- Не включать PostgREST exposed schemas = `public` без RLS.
- Не фиксировать язык LP через `Set-Cookie` в middleware (PIT-056 / PIT-112).

## Последняя эстафета

2026-10-18 — Cursor — LP UI ок; дальше коммит/деплой + DNS/domains + Ads Final URL.
