# Latest changes

Обновлено: 2026-10-19  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Unsubscribe для КП/Pro: футер письма → «Отписаться от рассылки» → `/unsubscribe` confirm → `mail_unsubscribes` → skip offer+reminder.
- Миграция `20261019_220000_mail_unsubscribes` (deploy: migrate).
- PIT-114 harden v2 уже в ветке (trigger/contact/create/report).
- Fix CI: `auditAgentTrigger` мокает `assertAuditMayRun` (раньше `lookup_failed` без Payload).

## Сейчас

1. После merge: `payload migrate` на prod (`mail_unsubscribes`).
2. Проверка: письмо → футер unsubscribe → confirm → повторный send skipped `unsubscribed`.

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-19 — Cursor — commercial mail unsubscribe ready (page + gate + footer).
