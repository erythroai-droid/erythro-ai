# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## PIT-136 — v2 pipeline restored

- **Причина старого шаблона:** при выравнивании Java к HEAD перед PIT-135 redeploy сняли `generateV2Reports` + PRO `a44-audit-report_*` naming → worker отдавал сырой A4-4.
- **Сделано (локально):** восстановлены `AuditCollector.generateV2Reports`, `RegenerateA44ReportsFromData` a44- naming, `RenderV2Pdf.java`, `apply-v2-polish.cjs`. Fingerprint/PHP alert (PIT-135) сохранены.
- **Осталось:** commit → push → VPS redeploy → re-queue → подтвердить v2 HTML (не A4-4) + tech chips.

### Очередь
1. Commit/push PIT-136 + redeploy audit-agent.
2. Re-queue аудита → письмо клиенту с v2.
