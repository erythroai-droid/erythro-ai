# Latest changes

Обновлено: 2026-11-03 (step 4: score badge + stages sync + pillars parse)  
Статус: Локально; нужен commit → deploy

---

## 1. Step 4 правки (CalcReport / revenueLeak / API)
- Hero: уровень оценки («Отлично» / «Требует внимания» / «Критично») на цветной плашке green/orange/red.
- «Куда уходят» и «Почему это происходит» — один и тот же список этапов (только loss > 0).
- Техподробности: SEO impact по уровню; `parsePillars` / `pillarsFromAuditSummary` читают и short keys, и `executive_scorecard` (чтобы шкалы не были одинаковыми при fallback).

## 2. Следующий шаг
- Commit + deploy; смоук step 4 на leak-ru.
