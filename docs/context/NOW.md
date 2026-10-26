# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## PIT-134: CTA из HE-отчёта открывал RU order

- **Причина:** в HTML были `https://erythro.ai/order/audit-pro` без `?lang=` → cookie/prefs = RU.
- **Исправлено:** samples + templates free/diagnostic + `render-v2-reports.mjs` (`orderCheckoutUrl`) + `AuditReportI18n.unlockProUrl(lang)`.
- HE: `/order/audit-pro?lang=he`, diagnostic аналогично; EN/RU тоже с `?lang=`.

### Очередь
1. Commit + push samples/templates/Java/script + PIT-134.
2. Redeploy **audit-agent** на VPS — иначе живые клиентские отчёты ещё без `?lang=`.
3. Site deploy — чтобы публичные `/samples/audit/*` тоже с правильными CTA.
