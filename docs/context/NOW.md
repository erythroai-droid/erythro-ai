# Latest changes

Обновлено: 2026-11-03 (mobile: пустые плитки цифр в футере calc LP)  
Статус: В работе (нужен деплой)

---

## 1. Calc LP mobile — пустые блоки в ряду цифр
- **Симптом:** на мобилке внизу hero (CalcHeroStatsBar) периодически пустые ячейки / залипает отрисовка.
- **Причина:** `animate-hero-up` с `animation-fill-mode: both` стартует с `opacity: 0`; на Safari рядом с `backdrop-blur` + animated blobs слой часто не дорисовывается. Плюс вечный `will-change`.
- **Фикс:**
  - убран `animate-hero-up` с цифр в `CalcReport.tsx`;
  - на `max-width: 1023px` отключены hero entrance + pan/blob motion;
  - убран permanent `will-change` у `.animate-hero-*`;
  - форма: `backdrop-blur-sm` на мобилке, `xl` с `lg+`.
- **Следующий шаг:** commit → deploy → проверить `leak-ru` на телефоне.

---

## 2. Ранее
- Hosts `leak-*`, kicker «AI Audit Online», worker ok, cooldown 7 дней on.
