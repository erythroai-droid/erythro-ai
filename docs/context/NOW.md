# Latest changes

Обновлено: 2026-11-03 (step4: Хорошо/Отлично + CWV + why с цифрами)  
Статус: Логика отчёта leak-calc обновлена в коде; нужен redeploy worker + Vercel

---

## 1. Сделано
- **1B:** chip «Отлично» только при loss=0; при loss>0 зелёный балл → «Хорошо» (`scoreLabelKey`).
- **Почему:** шаблоны с цифрами (LCP/CLS/Performance, SEO Lighthouse, score/%) — не полный чеклист.
- **Техподробности:** таблица CWV mobile+desktop, 10 метрик Lighthouse (как в SOW отчёта).
- Worker: `pickPagespeed` → `auditSummary.pagespeed`; API `/api/audit/report/[id]` отдаёт `pagespeed`.

## 2. Осталось
- Redeploy **audit-agent** (иначе у старых/текущих отчётов нет `pagespeed` → таблица CWV скрыта, why без LCP).
- Deploy фронта (Vercel).
- AUD-248 без `pagespeed` в CMS: why уже с score/%, таблица CWV появится после нового аудита (или backfill).

## 3. Следующий шаг
- Redeploy worker → новый leak-аудит с твоего IP → проверить step 4 (чипы, Почему, CWV).
