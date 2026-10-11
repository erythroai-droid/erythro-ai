# Latest changes

Обновлено: 2026-10-12  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- **Единый источник тарифов аудита:** Plans `kind: audit` (Free / Diagnostic / Pro / Manual).
- Поля Plans: `planId`, `checkoutMode`, `cardPriceNote`, `ctaLabel` (+ migration `20261012_010000_audit_plan_checkout_fields`).
- `/audit` карточки: `getAuditPricingPlans()` → `fetchAuditPage` (global `pricing.plans` игнорируется / hidden в admin).
- Manual: `checkoutMode: contact`, CTA `#contact-modal`; `/order/audit-manual` → redirect `/audit`; payment create → 400.
- Скрипты: `pnpm db:migrate-audit-plans-unify` (one-shot upsert), `pnpm db:fix-audit-pricing` (sync Plans only).
- Тесты: `tests/int/auditPricingPlans.int.spec.ts`. Cache keys: `audit-page-v10-plans-sot`, `order-plans-v7-audit-checkout`.

## Сейчас

1. На проде/локали с БД: `PAYLOAD_DISABLE_PUSH=1 pnpm db:migrate` → `pnpm db:migrate-audit-plans-unify`.
2. SQL-миграция `20261012_010000_audit_plan_checkout_fields` проверена: только ADD COLUMN IF NOT EXISTS + узкий UPDATE по slug; xact lock (PIT-086). Безопасна для схемы.
3. Deploy + revalidate.

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не возвращать intake-лимиты, пока нет живого списания.
- Не зеркалировать этот файл в Obsidian.
- Не возвращать Delegate и не вешать Manual на Grow checkout.
- Не править тарифы в Audit Page `pricing.plans` — только Plans.

## Последняя эстафета

2026-10-12 — Cursor — тарифы аудита SoT = Plans; Audit Page только intro Pricing. После деплоя прогнать migrate-unify.
