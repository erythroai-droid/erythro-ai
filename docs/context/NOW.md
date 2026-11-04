# Latest changes

Обновлено: 2026-11-04 (calc LP hero плашки + простой язык)  
Статус: Локально на ветке `feat/calc-hero-badges-copy` (от `origin/main`)

---

## 1. Calc LP — плашки hero + copy
- **Плашки** (`LossHero` в `CalcReport.tsx`): красные → «Потеря/Loss»; зелёные → «Прирост/Gain»; оценка — `levelLabel` с цветом по баллу; оранжевые этапы → «Слабые места».
- **Порядок:** green → orange → red (severity 0/1/2). RU/EN одинаково LTR; HE зеркалит через `dir=rtl`. Оценка встаёт в группу по цвету бейджа.
- **Why/этапы** (`auditCalcCopy.ts`): убран техсленг (сбой, тапы, маска, антиспам, Schema/CSP/HSTS в клиентском тексте).
- **Следующий шаг:** визуально проверить step 4 на `leak-ru` / `leak-en` / `leak-he`; коммит/PR — по просьбе.
