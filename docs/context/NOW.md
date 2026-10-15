# Latest changes

Обновлено: 2026-10-15  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Портфолио: импорт AI Auditor (#5) + AI Consultant (#6).
- PIT-109: 404 на `/portfolio/[slug]` — у импортированных slug был **хвостовой пробел** (`"ai-audit-agent "`); карточки жили, детальные URL — нет. В CMS пробелы сняты (`scripts/fix-portfolio-slugs.ts`).
- Код: trim slug в `mapPortfolioDoc`, per-doc map, cache v10/v3, `slug.trim()` в import, beforeValidate на коллекции.

## Сейчас

1. **Задеплоить** этот коммит (без деплоя Data Cache на Vercel всё ещё держит старые slug с пробелом → 404).
2. После деплоя проверить `/portfolio/ai-audit-agent` и `/portfolio/ai-consultant`.
3. Card/hero медиа — по желанию.
4. Ads «Неактивно» / Grow→Make offline — не сейчас.
5. TS: `order/success/page.tsx:59`.

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).
- Не добавлять второй `gtag/js` на страницу.

## Последняя эстафета

2026-10-15 — Cursor — PIT-109: trailing-space slugs fixed in CMS; deploy cache v10 needed.
