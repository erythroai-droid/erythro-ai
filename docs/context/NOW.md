# Latest changes

Обновлено: 2026-10-19  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Письма воронки в ветке `417e7bb`: Pro / −24h nudge / +72h разработка (RU/EN/HE), без имени.
- Unsubscribe + PIT-114 уже в prod.
- n8n **Pro Offer Walker** в репо (inactive): workflow + deploy script + docs. Таймеры на сайте; n8n = cron → `/api/audit/reconcile` каждые 5 мин.

## Сейчас

1. Merge/deploy ветки (+ migrate nudge) — по команде.
2. Импорт Walker на VPS: `py -3 scripts/deploy_n8n_audit_pro_offer_walker.py` (останется inactive).
3. Рассылку / `AUDIT_PRO_OFFER_ENABLED=1` + Activate Walker — **только по явной команде**.

## Не делать

- **Не включать commercial team@ и не слать Pro/nudge/KP без явной команды.**
- Не Activate Walker в n8n до go.
- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-19 — Cursor — n8n Pro Walker ready in repo (inactive); mail stay off until user says go.
