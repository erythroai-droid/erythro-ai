# Latest changes

Обновлено: 2026-10-25  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии (2026-10-25)

- **Pro v2 — полировка дизайна (Claude, две итерации):** в конец `<style>` всех v2-копий (RU/EN/HE: `QA_Auditor/templates/audit_template_v2_*`, `reports/pro-v2/*`, `services/audit-agent/.../reports/pro-v2/*`, `public/samples/audit/pro-*-v2.html` и `pro-*.html`) добавлены блоки `design polish 2026-10-25` и `design polish 2 (2026-10-25)` (селекторы `:root:root:root` перебивают прежние `!important`). Чеклист: аккордеон, полоска 3px цвета статуса, шеврон по центру круга, без тени. Действия: нейтральные белые карточки, цвет только у полоски 3px, залитый бейдж только у P1 (крит.). Топ-3: чёрная плашка 01–03 с золотыми цифрами внутри заголовка карточки, цветной верхний край. Чипы технологий — без hover. PDF пересобраны `RenderV2Pdf`. Правишь шаблон в одной копии — синхронизируй остальные (блоки идемпотентны по маркеру).

- **PIT-126 — Facebook `?fbclid=` → вечный красный splash (откат лидов):** воспроизведено на `https://erythro.ai/portfolio/rosso-garage?fbclid=…` — HTTP 200, контент под оверлеем, `.splash-bg` orphan без React fiber. Причина: ISR-layout SSR’ит splash без query; клиент с `fbclid` делает `skip=true` → hydration mismatch. Фикс:
  - `SplashHost` → `useSearchParams()` + `Suspense`, передаёт `?…` в `shouldSkipSplashSurface`
  - `SPLASH_SKIP_BOOTSTRAP_SCRIPT` + `html[data-erythro-skip-splash]` CSS hide до paint
  - `sweepOrphanedSplashPlates()` при skip
  - тесты `splash.int` / `adsConversion.int`; PIT-126 в `docs/PITFALLS.md` + Obsidian

## Осталось / следующий шаг

- **Задеплоить на Vercel** — без деплоя FB-ссылки с `fbclid` всё ещё показывают красный экран на проде.
- После деплоя: открыть `https://erythro.ai/portfolio/rosso-garage?fbclid=test` и убедиться, что `.splash-bg` нет и кейс виден сразу.
- Опционально: в Meta Ads добавить `url_tags` с `utm_source=fb&utm_medium=paid&utm_campaign=…` (PIT-117), не только голый `fbclid`.
