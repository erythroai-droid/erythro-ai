# Latest changes

Обновлено: 2026-10-19  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Pro commercial paused until approval: `AUDIT_PRO_OFFER_ENABLED` default off.
- DB: cancelled scheduled #187 (`skipped`).
- Worker: schedule paused (redeploy). Site send gate needs deploy.

## Сейчас

1. Commit/push + merge/deploy site (send/reconcile kill switch).
2. After letterhead approved: set `AUDIT_PRO_OFFER_ENABLED=1` on Vercel + worker `.env`, redeploy both.

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не включать Pro-offer без утверждения письма.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-19 — Cursor — Pro emails paused (DB + worker); site deploy of kill switch still required.
