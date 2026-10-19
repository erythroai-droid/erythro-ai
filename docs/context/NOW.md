# Latest changes

Обновлено: 2026-10-19  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Ads LP funnel: +15m Pro-only KP (₪390 / 72h) → +72h modernization/AI if no paid order.
- User: site deployed (Vercel).

## Сейчас (ops — добить)

1. Подтвердить `TEAM_SMTP_PASS` на Production (+ Preview).
2. Миграции `20261019_140000` + `20261019_190000` на прод DB (если ещё не накатились с деплоем).
3. Seed `audit-pro-ads`: `pnpm exec tsx scripts/seed-audit-order-plans.ts`
4. Redeploy **audit-agent** на VPS (schedule +15m).
5. Smoke: free с `audit-ru` → ~15м письмо Pro → (опц.) 72ч services letter.

## Не делать

- Не печатать `TEAM_SMTP_PASS` / `SMTP_PASS` / `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-19 — Cursor — сайт задеплоен. Дальше: env/migrate/seed/worker smoke.
