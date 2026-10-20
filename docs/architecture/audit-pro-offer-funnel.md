# Free audit → PRO offer ₪390

Акция для **всех** free-аудитов: и рекламный LP (`audit-*.erythro.ai` → `leadChannel=meta_ads`), и органика с `/audit` (`organic`).

## Воронка

1. Free audit → отчёт (`order@`).
2. **+15 минут:** сайт проверяет БД — есть ли у этого **email** заказ `audit-pro` / `audit-pro-ads` / `audit-diagnostic` со статусом оплаты `pending` или `paid`.
3. Если заказа нет → письмо с `team@`: тема **«Специальное предложение для {email}»**, только **Pro ₪390** (вместо 490), ссылка `/order/audit-pro-ads?lang=&t=` (HMAC на id free-заявки + expiry 72ч). Без `t` страница и `POST /api/payment/create` для этого плана — **404/403**. Без имени в теле.
4. **−24 часа до конца промо** (`expires − 24h`): urgency **«Осталось 24 часа…»** + тот же checkout.
5. **+72 часа** (конец промо): если Pro/Diagnostic всё ещё нет → **предложение о разработке** (ответ «новый сайт» / «автоматизация» / «консультация»).
6. **Walker / cron** подстраховывает все три шага (см. ниже). Футер: «Отписаться от рассылки» → `mail_unsubscribes`.

## Walker vs cron vs флаги

Таймеры и проверки оплаты живут в **Postgres + HMAC**, не в n8n Wait-нодах.

| Роль | Что делает |
|---|---|
| Worker | На `report_sent` (любой free) → `scheduleProOfferEmail` (`scheduled`, due +15m) |
| Сайт | `trySendAuditProOffer` / `Nudge` / `Reminder` — unpaid + unsub check перед каждой отправкой |
| Vercel Cron `*/2` | `POST/GET /api/audit/reconcile` — stuck jobs **и** due Pro/nudge/reminder |
| n8n **Pro Offer Walker** | Backup каждые 5 мин → тот же `/api/audit/reconcile` ([doc](../infrastructure/n8n-audit-pro-offer-walker.md)) |
| n8n **AI Audit reconcile** | Отдельный backup stuck-jobs каждые 10 мин ([doc](../infrastructure/n8n-audit-reconcile.md)) |

`AUDIT_PRO_OFFER_ENABLED` выкл. → reconcile/Walker крутятся, но commercial team@ **не шлёт**. Включать только по явной команде.

## Env / ops

| Переменная | Назначение |
|---|---|
| `TEAM_SMTP_PASS` | Пароль Hostinger **team@** (не `SMTP_PASS`); тот же пароль для SMTP и IMAP Sent APPEND |
| `IMAP_HOST` / `IMAP_PORT` | Опционально; по умолчанию `imap.hostinger.com:993` |
| `AUDIT_PRO_OFFER_ENABLED` | `1` / `true` — включить commercial team@ (Pro + nudge + 72h). **По умолчанию выкл.** до утверждения письма |

После успешного SMTP копия письма кладётся в Hostinger **Sent** (`IMAP APPEND`, `src/lib/teamMailSentAppend.ts`). Сбой APPEND только логируется — доставка клиенту уже прошла.

Миграции: `20261019_140000_…`, `20261019_190000_…` (reminder), `20261019_233000_…` (nudge).  
Seed: `audit-pro-ads`. Redeploy site + **audit-agent**.

Код: `src/lib/auditProOffer.ts` (`isAuditProOfferEnabled`), `src/lib/proOfferCheckoutAccess.ts`, worker `scheduleProOfferEmail`, reconcile.  
Статусы: `scheduled` → `sent` → `nudge_sent` → `reminder_sent` / `skipped`. Писать **SQL** (`patchProOfferFieldsSql`) — `payload.update` ломается на существующем `html_result` (PIT-113 / PIT-035).
