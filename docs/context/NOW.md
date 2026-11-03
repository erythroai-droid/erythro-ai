# Latest changes

Обновлено: 2026-11-03 (fix revenueLeak parsePillars test)  
Статус: Локально; нужен commit → push

---

## 1. CI
- Упал `tests/int/revenueLeak.int.spec.ts`: старый кейс ждал `null` на `speed: '40'`.
- После step-4 фикса `parsePillars` принимает числовые строки + long keys scorecard.
- Тест обновлён; `vitest run tests/int/revenueLeak.int.spec.ts` — 20/20.

## 2. Следующий шаг
- Commit + push фикса теста.
