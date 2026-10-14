# Latest changes

Обновлено: 2026-10-14  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- PIT-107: site требует `?k=`; письмо #175 без `k` → 404 (старый worker на VPS).
- Фикс: admin/API подставляют `k`; миграция rewrite `report_url`; деплой audit-agent.

## Сейчас

1. Задеплоить Next (миграция rewrite + admin).
2. Для #175: в admin — **Status page** / поле `reportAccessToken` (не stale Open report URL до деплоя).
3. Переслать клиенту ссылку с `?k=` из admin после деплоя.

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не слать `/audit/report/[id]` без `?k=` (PIT-107).
- После смены gating всегда редеплоить `audit-agent` на VPS.

## Последняя эстафета

2026-10-14 — Cursor — Fix bare report URLs (worker redeploy + admin/API inject k).
