# Latest changes

Обновлено: 2026-10-19  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Письма воронки (локально): Pro без имени; −24h nudge; +72h разработка (RU/EN/HE).
- Миграция `20261019_233000_…_nudge` + reconcile/API `kind=nudge`.
- Unsubscribe + PIT-114 уже в prod.

## Сейчас

1. Утвердить copy → commit/push/deploy (+ migrate nudge).
2. Включить `AUDIT_PRO_OFFER_ENABLED=1` после OK письма.

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-19 — Cursor — 24h Pro nudge + copy updates ready (not deployed).
