# Latest changes

Обновлено: 2026-10-19  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- **PIT-114:** unpaid Grow checkout больше не уходит в audit via reconcile (`isUnpaidAuditCheckout`).
- Pro commercial paused on prod; gating/arrows still on branch until merge.

## Сейчас

1. **Срочно:** commit/push/merge PIT-114 на prod (иначе pending Pro → отчёт через ~2 мин).
2. Merge остального `fix/pro-offer-sql-status` (gate `?t=`, no arrows).
3. После утверждения письма: `AUDIT_PRO_OFFER_ENABLED=1`.

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не включать Pro-offer без утверждения письма.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-19 — Cursor — PIT-114 fix ready; needs deploy ASAP.
