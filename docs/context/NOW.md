# Latest changes

Обновлено: 2026-10-19  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Ads LP funnel: +15m Pro-only KP (₪390 / 72h) → +72h modernization/AI if no paid order.
- Fix sitemap test: hide `audit-pro-ads` (expected out of sitemap).

## Сейчас (ops — добить)

1. Push test fix; merge PR.
2. `TEAM_SMTP_PASS`; миграции; seed `audit-pro-ads`; redeploy audit-agent.
3. Smoke с `audit-ru`.

## Не делать

- Не печатать `TEAM_SMTP_PASS` / `SMTP_PASS` / `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-19 — Cursor — сайт задеплоен. Дальше: env/migrate/seed/worker smoke.
