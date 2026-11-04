# Latest changes

Обновлено: 2026-11-04 (calc sprint price = integer zones from UI)  
Статус: PR #380 в main; follow-up — цена от округлённых зон

---

## 1. Calc LP — сумма исправлений
- **Прод:** #380 задеплоен; фикс ₪2200 ушёл.
- **Баг:** `computeLeak` брал сырой `leakBreakdown` (visibility 0.3% считалась зоной) → ₪1800 при двух пунктах в «Что исправим».
- **Фикс:** `sprintPrice` / окупаемость от integer `losses` (те же зоны, что на экране). Для report=258 → 2×₪600 = ₪1200.
- **Следующий шаг:** закоммитить/смержить follow-up.
