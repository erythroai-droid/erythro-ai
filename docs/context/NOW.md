# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## PIT-137 — no double client mail on re-queue + PHP focus

- **Дубли adi_g@maabarot.com:** наши re-queue слали отчёт снова (`notifyClient` default true) и сбрасывали pro-offer. Fix: admin `notifyClient:false`, worker skip SMTP, `scheduleProOfferEmail` skip если status ≠ none/skipped. AUD-209: `pro_offer_status=sent`, в `audit_summary` дописаны tech chips.
- **Пустые «Выявленные технологии»:** у anipet в HTML чипы есть (Shopify…); в CMS `detectedTechnologies` был null — теперь пишется в summary на каждом run + backfill 209.
- **PHP CTA:** `.tech-php-cta { display:block }` в `render-v2-reports.mjs`.
- **Письмо модернизации:** `withPhpStackRiskFocus` для reminder/paid_dev при PHP в stack.

### Очередь
- VPS audit-agent: docker cp + restart done (notifyClient / schedule skip / PHP CTA).
- Сайт (Vercel): `notifyClient:false` на requeue + PHP-акцент в reminder/paid_dev — нужен commit + deploy.
