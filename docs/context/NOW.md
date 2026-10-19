# Latest changes

Обновлено: 2026-10-19  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Pro commercial paused (на prod: merge #267).
- Letterhead / gating / Make productName — в ветке `fix/pro-offer-sql-status` (`ee5bd4c`), **ещё не на main/prod**.
- Ads order: не рендерить ProjectNav, если нет prev/next (серые стрелки убраны).

## Сейчас

1. Commit/push + PR/merge ветки (gate `?t=` + no arrows) → prod.
2. Seed `seed-audit-order-plans.ts` после merge.
3. После утверждения письма: `AUDIT_PRO_OFFER_ENABLED=1` на Vercel + worker.

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не включать Pro-offer без утверждения письма.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-19 — Cursor — hide ProjectNav on ads when no neighbors; still needs commit/merge.
