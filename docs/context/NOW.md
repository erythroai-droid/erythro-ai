# Latest changes

Обновлено: 2026-10-19  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Pro commercial paused; letterhead; ₪490→₪390 previews.
- Make→Grow: readable productName; ads order без ProjectNav; без orphan `*`.
- `/order/audit-pro-ads` gated: HMAC `?t=` from email only (page 404 + payment 403 without token).

## Сейчас

1. Merge/deploy `fix/pro-offer-sql-status` (+ gating + checkout tweaks).
2. После деплоя: `pnpm exec tsx scripts/seed-audit-order-plans.ts`.
3. After approval: `AUDIT_PRO_OFFER_ENABLED=1` on Vercel + worker.

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не включать Pro-offer без утверждения письма.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-19 — Cursor — audit-pro-ads closed without signed email `t`.
