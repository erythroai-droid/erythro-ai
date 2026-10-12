# Latest changes

Обновлено: 2026-10-12  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- **Единый источник тарифов аудита:** Plans `kind: audit` (Free / Diagnostic / Pro / Manual).
- Поля Plans: `planId`, `checkoutMode`, `cardPriceNote`, `ctaLabel`, **`cardName`** (+ migrations `20261012_010000_*`, `20261012_020000_audit_plan_card_name`).
- `/audit` карточки: `getAuditPricingPlans()` → бейдж из **Card name** (не Title); Title = `/order` + список в admin.
- Manual: `checkoutMode: contact`, CTA `#contact-modal`; `/order/audit-manual` → redirect `/audit`; payment create → 400.
- Скрипты: `pnpm db:migrate-audit-plans-unify`, `pnpm db:fix-audit-pricing` пишут `cardName`.
- Тесты: `tests/int/auditPricingPlans.int.spec.ts`. Cache: `audit-page-v11-card-name`, `order-plans-v8-card-name`.

## Сейчас

1. Локально / после деплоя: `pnpm db:migrate` → при необходимости `pnpm db:migrate-audit-plans-unify` (заполнит Card name: Free / Diagnostic / Pro / Manual).
2. В admin: Content → Plans → AI Audit план → **Card name (Pricing badge)** EN/RU/HE — это «РУЧНОЙ» и остальные бейджи.
3. Title не трогать ради бейджа — он для order page / списка.

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не возвращать intake-лимиты, пока нет живого списания.
- Не зеркалировать этот файл в Obsidian.
- Не возвращать Delegate и не вешать Manual на Grow checkout.
- Не править тарифы в Audit Page `pricing.plans` — только Plans.

## Последняя эстафета

2026-10-12 — Cursor — бейдж карточки = Plans.`cardName`; хардкод shortName убран (fallback остаётся). После деплоя migrate + unify.
