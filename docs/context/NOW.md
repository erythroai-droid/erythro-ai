# Latest changes

Обновлено: 2026-11-03 (leak client email → step 4 deep link)  
Статус: В работе (нужен деплой сайта + воркера)

---

## 1. Письмо клиенту с калькулятора → шаг 4 LP
- **Было:** report-ready mail всегда на `erythro.ai/audit/report/{id}?k=…` (A44).
- **Стало (leak_calc):** `https://leak-{locale}.erythro.ai/?report={id}&k={token}&rev=&clients=`
- **LP:** `AuditCalcFlow` читает query в prod и открывает waiting→ready (шаг 4).
- **Intake:** `calcRevenue` / `calcClients` в `auditSummary` (для money mode в письме).
- **Воркер:** `runAudit.js` + copy в `mail.js` («расчёт утечек»). Нужен **редеплой audit-agent** на VPS, не только Vercel.
- **Следующий шаг:** commit → deploy Next → redeploy worker Docker.
