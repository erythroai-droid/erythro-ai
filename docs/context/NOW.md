# Latest changes

Обновлено: 2026-10-16  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- **Home AI Audit** под Hero + CMS global `home-ai-audit` (Sections), миграция `20261016_180000_home_ai_audit_cms` с сидом EN/RU/HE.
- `getSiteContent` мержит global; cache key `site-content-v17-home-ai-audit`.
- UI: dark-gradient, clip-open, BorderBeam carousel, «AI вас видит?», цифры gold-500.
- Mobile: больший нижний отступ после «Сравнить все тарифы» перед Cases (`pb-36`).

## Сейчас

1. После деплоя: `payload migrate` → Admin → Sections → Home AI Audit.
2. Проверить главную EN/RU/HE + карусель.
3. **Задеплоить** PIT-109.
4. Ads / Grow→Make — не сейчас.

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).
- Не добавлять второй `gtag/js` на страницу.
- Не включать PostgREST exposed schemas = `public` без RLS.

## Последняя эстафета

2026-10-16 — Cursor — Home AI Audit CMS global + migrate seed; commit/push.
