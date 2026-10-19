# Free audit (ads LP) → PRO offer ₪390

Только лиды с **рекламного лендинга** (`audit-en|ru|he.erythro.ai` → `leadChannel=meta_ads`).

## Воронка

1. Free audit → отчёт (`order@`).
2. **+15 минут:** сайт проверяет БД — есть ли у этого **email** заказ `audit-pro` / `audit-pro-ads` / `audit-diagnostic` со статусом оплаты `pending` или `paid`.
3. Если заказа нет → письмо с `team@`: тема **«Специальное предложение для {email}»**, только **Pro ₪390** (вместо 490), ссылка `/order/audit-pro-ads`, срок **72 часа**. Без блока модернизации.
4. **+72 часа**: если Pro/Diagnostic всё ещё нет → второе письмо: **модернизация сайта, AI-агенты, автоматизация** (ответ «новый сайт» / «созвон»).
5. Cron `/api/audit/reconcile` подстраховывает оба шага.

Органические free с `/audit` — **не** входят в эту воронку (`skipped`).

## Env / ops

| Переменная | Назначение |
|---|---|
| `TEAM_SMTP_PASS` | Пароль Hostinger **team@** (не `SMTP_PASS`) |

Миграции: `20261019_140000_…`, `20261019_190000_…` (reminder fields).  
Seed: `audit-pro-ads`. Redeploy site + **audit-agent**.

Код: `src/lib/auditProOffer.ts`, worker `scheduleProOfferEmail`, reconcile.  
Статусы воронки писать **SQL** (`patchProOfferFieldsSql`) — `payload.update` ломается на существующем `html_result` (PIT-113 / PIT-035).
