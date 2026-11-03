# Latest changes

Обновлено: 2026-11-03 (deep-link email → step 4, не fake step 3)  
Статус: Локально в calc2; нужен commit → deploy

---

## 1. Баг: письмо открывало шаг 3 (анализ)
- **Причина:** `?report=&k=` сразу ставил `waiting` + первый poll через 8 с → UI «идёт анализ» даже когда отчёт уже `report_sent`.
- **Фикс (`AuditCalcFlow.tsx`):**
  - deep-link → стадия `opening` («Открываем результаты…»);
  - первый fetch сразу;
  - при `report_sent` → сразу step 4;
  - `waiting` только если статус ещё in progress;
  - fallback pillars если score/pillars пустые;
  - lang switcher сохраняет query.

## 2. Ранее
- Бейдж «1 домен / 7 дней» под субзаголовком (шаг 1–2), убран из-под кнопки.

## 3. Следующий шаг
- Commit + push + Vercel (leak LP).
- Смоук: старая ссылка из письма → шаг 4 с результатами.
