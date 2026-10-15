# Latest changes

Обновлено: 2026-10-15  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Портфолио через `pnpm import:project`: **AI Website Auditor** (`ai-audit-agent`, #5) и **AI Consultant** (`ai-consultant`, #6), категория `ai` создана.
- Брифы: `content/imports/<slug>/brief.yaml`; кейсы: `docs/cases/ai-*.md` (+ Obsidian `cases/`).
- PIT-109: `fetchPortfolioProjects` без `overrideAccess` → 404 на `/portfolio/[slug]`; фикс в `cmsPages.ts` (cache key v9).
- Ads: один Google tag в head + конверсии Purchase / Lead (PIT-108).

## Сейчас

1. **Задеплоить** фикс PIT-109, затем Save в admin или revalidate `/portfolio` + `/portfolio/ai-audit-agent` + `/portfolio/ai-consultant`.
2. Добавить card/hero в `content/imports/<slug>/` и import без `--skip-media`.
3. Для import-скриптов: `--env-file=.env` (у `.env.production.local` битый short `DATABASE_URL` после vercel pull).
4. Ads «Неактивно» может смениться через несколько часов; Grow→Make offline — не сделано.
5. TS: `order/success/page.tsx:59` (`doc.source` null).

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).
- Не добавлять второй `gtag/js` на страницу.

## Последняя эстафета

2026-10-15 — Cursor — portfolio import AI Auditor + Consultant; PIT-109 overrideAccess fix (needs deploy).
