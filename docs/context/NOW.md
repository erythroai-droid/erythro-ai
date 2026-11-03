# Latest changes

Обновлено: 2026-11-03 (prod check deep-link + PIT-155)  
Статус: Deep-link UI на prod OK; API 500→404 фикс локально, нужен deploy

---

## 1. Проверка prod
- **Vercel production:** PR **#367** READY (`67a274c` / merge deep-link fix).
- **leak-ru:** `?report=&k=` показывает «Открываем результаты…» (не CalcWaiting «идёт анализ»).
- **Баг на смоуке:** несуществующий id → Payload `findByID` Not Found → API **500** → poll крутится. Реальные id из письма должны давать 200/`report_sent` → step 4.

## 2. Фикс PIT-155 (локально, не задеплоен)
- `findAuditSubmission`: catch Not Found → `null` → HTTP 404.
- Документ в `docs/PITFALLS.md` + Obsidian.

## 3. Следующий шаг
- Commit + deploy PIT-155.
- Смоук реальной ссылки из письма → step 4.
