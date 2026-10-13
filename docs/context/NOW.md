# Latest changes

Обновлено: 2026-10-13  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- **Free-audit intake limits restored:** `AUDIT_INTAKE_LIMITS_OPEN_FOR_QA = false`, cooldown **7 days** (IP / email / domain).
- API 429: `retryAfterSec` + `retryAfterLabel` (дни / часы / минуты) + локализованный текст.
- Модалка остатка: `AuditCooldownModal` на `/audit` и cooldown-view в order modal.
- Копирайт introNote 5→7; docs: `audit-rate-limiting.md`, `PLAN-deferred.md`, RAG_INDEX; тесты обновлены.

## Сейчас

1. Задеплоить и проверить повторную заявку Free: модалка с точным остатком.
2. На Vercel убедиться, что нет `AUDIT_SKIP_COOLDOWN=1` (иначе лимиты снова выключены).

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не зеркалировать этот файл в Obsidian.
- Не возвращать Delegate и не вешать Manual на Grow checkout.
- Не править тарифы в Audit Page `pricing.plans` — только Plans.

## Последняя эстафета

2026-10-13 — Cursor — free-audit 7d cooldown + remaining-time modal.
