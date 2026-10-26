# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Analytics organic defer (готово к деплою)

- `needsEagerAdAnalytics` + `requestAnalyticsScripts` (`src/lib/analyticsEager.ts`).
- **Eager (как раньше):** `gclid`/`fbclid`/`utm_*`, ads LP host, `/lp/audit/*`, `/audit`, `/order/*` — gtag.js + Meta сразу в head, Consent Mode denied.
- **Organic** (`/`, `/portfolio`, services, …): stub only; сеть на Accept или первом conversion (`ensureAnalyticsConsentAndGaConfig`).
- Тесты `adsConversion.int.spec.ts` — 8/8. PIT-108 note обновлён.

### Проверить после деплоя
1. `/?gclid=test` — Network: `gtag/js` + `fbevents` без Accept.
2. `/` organic — те же скрипты **нет** до Accept; после Accept — есть.
3. Tag Assistant / Meta Pixel Helper на LP + lead/purchase.

### Очередь
1. Деплой + smoke выше.
2. Chunk `8261` — не трогаем.

## Параллельно (Claude Code): отчёты аудита — не удалять

- **Free, Diagnostic, Pro: HTML и PDF готовы на RU/EN/HE** во всех копиях, включая `public/samples/audit/*`. Free 12/12/11 стр., Diagnostic 11, Pro 21/20/20.
- Сборка из `C:\agents\website-auditor\erythro-ai\QA_Auditor`: `node scripts/render-v2-reports.mjs [--tier=…]`, затем `node scripts/render-v2-pdf.cjs [--tier=…]`. Перед сборкой закрыть отчёты/PDF в превью и просмотрщиках — Windows блокирует запись (PDF тогда кладётся рядом как `*.new.pdf`). Зеркало скриптов `services/audit-agent/QA_Auditor/scripts/` синхронизировано.
- Не сделано (решения владельца, сайт): формулировка «одна приоритетная правка» в карточках Pro (`orderPlans.ts`, `auditLp.ts`), «60+ проверок» против 230, публичный лендинг `audit-pro-ads` за ₪390.
- Тарифы, цены, подсчёт проверок, что сделано — [`docs/architecture/audit-report-tier-scope.md`](../architecture/audit-report-tier-scope.md).
