# Free audit → PRO offer ₪390 · Paid audit → development offer

Две воронки `team@`, один флаг `AUDIT_PRO_OFFER_ENABLED` и общие поля `proOffer*` на `contact_submissions`.

## A. Free → Pro ₪390

Акция для **всех** free-аудитов: и рекламный LP (`audit-*.erythro.ai` → `leadChannel=meta_ads`), и органика с `/audit` (`organic`).

1. Free audit → отчёт (`order@`).
2. **+15 минут:** сайт проверяет БД — есть ли у этого **email** заказ `audit-pro` / `audit-pro-ads` / `audit-diagnostic` со статусом оплаты `pending` или `paid`.
3. Если заказа нет → письмо с `team@`: тема **«Специальное предложение для {email}»**, только **Pro ₪390** (вместо 490), ссылка `/order/audit-pro-ads?lang=&t=` (HMAC на id free-заявки + expiry 72ч). Без `t` страница и `POST /api/payment/create` для этого плана — **404/403**. Без имени в теле.
4. **−24 часа до конца промо** (`expires − 24h`): urgency **«Осталось 24 часа…»** + тот же checkout.
5. **+72 часа** (конец промо): если Pro/Diagnostic всё ещё нет → **предложение о разработке** (ответ «новый сайт» / «автоматизация» / «консультация»).
6. **Walker / cron** подстраховывает все три шага (см. ниже). Футер: «Отписаться от рассылки» → `mail_unsubscribes`.

Статусы free: `scheduled` → `sent` → `nudge_sent` → `reminder_sent` / `skipped`.

## B. Pro / Diagnostic → development offer

После оплаченного **Diagnostic** / **Pro** / **Pro-ads**:

1. Отчёт уходит с `order@` (как сейчас).
2. **+15 минут:** `team@` — **предложение о разработке** (адаптация free-reminder): правки по аудиту **или** полная пересборка на новых технологиях + AI/автоматизация.
3. CTA: ответ «правки» / «новый сайт» / «консультация». Ссылка на отчёт в письме. Unsubscribe в футере.
4. Статусы: `scheduled` → `reminder_sent` (без Pro promo / nudge).

## Walker vs cron vs флаги

Таймеры и проверки оплаты живут в **Postgres + HMAC**, не в n8n Wait-нодах.

| Роль | Что делает |
|---|---|
| Worker | На `report_sent` (free **или** paid funnel) → `scheduleProOfferEmail` (`scheduled`, due +15m; kind `offer` / `paid_dev`) |
| Сайт | `trySendAuditProOffer` / `Nudge` / `Reminder` / `trySendPaidAuditDevOffer` — unpaid/unsub checks где нужно |
| Vercel Cron `*/2` | `POST/GET /api/audit/reconcile` — stuck jobs **и** due Pro/nudge/reminder/**paid_dev** |
| n8n **Pro Offer Walker** | Backup каждые 5 мин → тот же `/api/audit/reconcile` ([doc](../infrastructure/n8n-audit-pro-offer-walker.md)) |
| n8n **AI Audit reconcile** | Отдельный backup stuck-jobs каждые 10 мин ([doc](../infrastructure/n8n-audit-reconcile.md)) |

`AUDIT_PRO_OFFER_ENABLED` выкл. → reconcile/Walker крутятся, но commercial team@ **не шлёт**. Включать только по явной команде.

## Env / ops

| Переменная | Назначение |
|---|---|
| `TEAM_SMTP_PASS` | Пароль Hostinger **team@** (не `SMTP_PASS`); тот же пароль для SMTP и IMAP Sent APPEND |
| `IMAP_HOST` / `IMAP_PORT` | Опционально; по умолчанию `imap.hostinger.com:993` |
| `AUDIT_PRO_OFFER_ENABLED` | `1` / `true` — включить commercial team@ (free Pro + nudge + 72h **и** paid development). **По умолчанию выкл.** до утверждения письма |

После успешного SMTP копия письма кладётся в Hostinger **Sent** (`IMAP APPEND`, `src/lib/teamMailSentAppend.ts`). Сбой APPEND только логируется — доставка клиенту уже прошла.

Миграции: `20261019_140000_…`, `20261019_190000_…` (reminder), `20261019_233000_…` (nudge). Новых колонок для paid_dev нет — те же `pro_offer_*`.  
Seed: `audit-pro-ads`. Redeploy site + **audit-agent**.

Код: `src/lib/auditProOffer.ts` (`isAuditProOfferEnabled`, `trySendPaidAuditDevOffer`), `src/lib/proOfferCheckoutAccess.ts`, worker `scheduleProOfferEmail`, reconcile.  
**Защита от дублей (PIT-123):** перед SMTP каждая из четырёх функций делает атомарный захват `claimProOfferSend` — `UPDATE … SET pro_offer_lock_at = now() WHERE id=… AND <guard статуса> AND (lock IS NULL OR lock < now() − 10 мин) RETURNING id`. Не вернулась строка → `already_sent`, письмо не уходит. Lock снимается тем же SQL, что пишет итоговый статус; при сбое SMTP — освобождается; если процесс упал — истекает через 10 мин. Миграция `20261023_120000_…` (колонка `pro_offer_lock_at`). После таймаута на `DATA` повтор через порт 587 не делается.  
Писать **SQL** (`patchProOfferFieldsSql`) — `payload.update` ломается на существующем `html_result` (PIT-113 / PIT-035).
