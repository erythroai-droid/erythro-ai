# Latest changes

Обновлено: 2026-11-03 (heroKicker → AI Audit Online; worker/cooldown check)  
Статус: В работе (нужен деплой copy-fix + DNS уже жив для leak-*)

---

## 1. Calc LP — заголовок и инфраструктура
- **Live `leak-ru.erythro.ai`:** уже отвечает 200 (DNS подключён). На странице был kicker **«AI-онлайн-аудит»** / EN «AI Online Audit».
- **Фикс (локально, эта ветка):** `auditCalcCopy.ts` → EN `AI Audit Online`, RU `AI-аудит онлайн`, HE `AI Audit אונליין`.
- **Worker:** `https://agent-api.erythro.ai/health` → `{"ok":true,"service":"audit-agent"}`. На Vercel есть `AUDIT_AGENT_URL` + `AGENT_SECRET_TOKEN` (prod/preview).
- **Cooldown 7 дней:** **включён.** `AUDIT_INTAKE_LIMITS_OPEN_FOR_QA = false`; env `AUDIT_SKIP_COOLDOWN` на Vercel не задан. Free audit: один домен / email / IP раз в 7 дней (`checkFreeAuditCooldown` в `/api/contact`).
- **Следующий шаг:** закоммитить/задеплоить copy-fix (+ предыдущий rename hosts `leak-*`, если ещё не в main).

---

## 2. Хосты
- Vercel: `leak-en|ru|he.erythro.ai` verified. DNS Cloudflare — уже резолвится (проверено на leak-ru).
