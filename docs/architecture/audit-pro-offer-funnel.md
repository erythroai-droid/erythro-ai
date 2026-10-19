# Free audit (ads LP) → PRO offer ₪390

Только лиды с **рекламного лендинга** (`audit-en|ru|he.erythro.ai` → `leadChannel=meta_ads`).

## Воронка

1. Free audit → отчёт (`order@`).
2. **+15 минут:** сайт проверяет БД — есть ли у этого **email** заказ `audit-pro` / `audit-pro-ads` / `audit-diagnostic` со статусом оплаты `pending` или `paid`.
3. Если заказа нет → письмо с `team@`: тема **«Специальное предложение для {email}»**, только **Pro ₪390** (вместо 490), ссылка `/order/audit-pro-ads?lang=&t=` (HMAC на id free-заявки + expiry 72ч). Без `t` страница и `POST /api/payment/create` для этого плана — **404/403**. Без имени в теле.
4. **−24 часа до конца промо** (`expires − 24h`): urgency **«Осталось 24 часа…»** + тот же checkout.
5. **+72 часа** (конец промо): если Pro/Diagnostic всё ещё нет → **предложение о разработке** (ответ «новый сайт» / «автоматизация» / «консультация»).
6. Cron `/api/audit/reconcile` подстраховывает все три шага. Футер: «Отписаться от рассылки» → `mail_unsubscribes`.

Органические free с `/audit` — **не** входят в эту воронку (`skipped`).

## Env / ops

| Переменная | Назначение |
|---|---|
| `TEAM_SMTP_PASS` | Пароль Hostinger **team@** (не `SMTP_PASS`) |
| `AUDIT_PRO_OFFER_ENABLED` | `1` / `true` — включить commercial team@ (Pro + nudge + 72h). **По умолчанию выкл.** до утверждения письма |

Миграции: `20261019_140000_…`, `20261019_190000_…` (reminder), `20261019_233000_…` (nudge).  
Seed: `audit-pro-ads`. Redeploy site + **audit-agent**.

Код: `src/lib/auditProOffer.ts` (`isAuditProOfferEnabled`), `src/lib/proOfferCheckoutAccess.ts`, worker `scheduleProOfferEmail`, reconcile.  
Статусы: `scheduled` → `sent` → `nudge_sent` → `reminder_sent` / `skipped`. Писать **SQL** (`patchProOfferFieldsSql`) — `payload.update` ломается на существующем `html_result` (PIT-113 / PIT-035).
