# Latest changes

Обновлено: 2026-10-20  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Pro / Diagnostic → development offer (+15m, `kind=paid_dev`): адаптация «Предложение о разработке», worker + reconcile, docs/Obsidian.
- Ранее: Pro ₪390 for all free audits (`f6443f7`); worker redeployed.

## Сейчас

1. Merge / deploy site (Vercel) + redeploy **audit-agent** (worker schedule для paid).
2. Убедиться `AUDIT_PRO_OFFER_ENABLED=1` на Vercel и worker (иначе commercial не шлётся).
3. Optional: merge `fix/pro-offer-sql-status` если ещё не в production.

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-20 — Cursor — paid Pro/Diagnostic → team@ development offer (+15m); await deploy site + worker.
