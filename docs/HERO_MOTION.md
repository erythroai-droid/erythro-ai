# Hero Motion — кинематографические заголовки

Документ описывает утверждённую анимацию вращающихся headline-фраз в Hero.
Компонент: `src/components/HeroMotionText.tsx`. Подключение: `HeroSection` → `HeroMotionText`.

---

## 1. Обзор

На полноэкранном cinematic-слое (portal в `document.body`, `fixed`, `z-index: 100`) по кругу проигрываются фразы. Navbar выше слоя (`z-index: 110`), чтобы бургер-меню перекрывал анимацию.

| Слой | Назначение |
|---|---|
| Foreground (`fgEl`) | Основной текст кадра |
| Outline (`outlineEl`) | Фоновая обводка (masked SVG stroke) |
| Inline slot | Невидимый layout-слот + запасной текст при stop |

Цикл останавливается, когда hero-секция уходит из viewport (`IntersectionObserver` на `[data-hero-scroll-root]`). Opacity stage синхронизирован со scrub ScrollTrigger и на десктопе (`end: bottom bottom`), и на мобиле (`end: bottom top`) — иначе `fixed` portal оставался поверх следующих блоков из‑за sticky hero.

Stage portal всегда `dir="ltr"` (математика transform). RTL-скрипт / страница Hebrew задают `direction` на текстовых хостах FG и на рядах outline.

### Мобиле (`< lg`)

- Фоновый outline **отключён**.
- Передний текст крупнее (`clamp(28px, 9.2vw, 48px)` + `motionHeadlineFontPx`), разрешён **перенос строк**.
- Fade при прокрутке обязателен (portal `fixed`).

`prefers-reduced-motion: reduce` или одна фраза → статичный текст без цикла.

---

## 2. Контент (CMS + фолбэк)

Фразы: Global **Hero** → массив `words` / `motionHeadings`.

| Поле | Смысл |
|---|---|
| `word` / `text` | Основной (foreground) текст |
| `outline` | Текст фоновой обводки (если пусто — берётся основной) |

Фолбэки: `src/translations/index.ts` → `hero.motionHeadings` (`en` / `ru` / `he`).

Порядок кадров = порядок фраз в массиве (сейчас 4 утверждённых кадра).

---

## 3. Кадры (утверждено)

Ниже — поведение **LTR** (`en` / `ru`). Для иврита см. §4 RTL.

### Кадр 1 — «ENGINEERING FUTURE»

1. Огромный FG (~144vh) появляется сразу (без влёта).
2. Плавно садится в слот заголовка через анимацию **`fontSize`** (не `scale` — иначе рваные края глифов).
3. После settle обводка: **первое слово слева**, **второе справа** (выезд навстречу).
4. Hold → слова обводки уходят обратно на свои стороны; FG — `kineticSlamOut` (разлёт + blur).

### Кадр 2 — «AI AUTOMATION»

1. Первое слово растёт в центре.
2. Тонкая красная линия (`--erythro-500`) вырастает по высоте слова, затем раскрывается **вправо** в плашку; на плашке белое второе слово.
3. Короткая пауза → красная плашка **сворачивается вправо**; только второе слово **заливается красным** сверху вниз. Первое слово без изменений.
4. Буквы второго слова делают **переворот в плоскости экрана** (`scaleX` 1→0→1, смена цвета в нуле) и становятся `gold-500`.
5. Outline проявляется при полном «первое + второе слово» без плашки.
6. Вся фраза держится, затем **исчезает вместе** с blur на всём ряде (без разбиения на буквы — иначе рывок перед выходом).
7. Gap между словами (`0.18em`).

### Кадр 3 — «SCALABLE SYSTEMS»

1. Первая буква летит «издалека» **к камере** (пик ~3×, perspective через `scale`+`z`; подлёт с **замедлением** `power3.out`) → мягкий отъезд назад в слот без пружины. Layout на стабильном `fontSize`, чтобы не уезжало вниз. **Без blur.**
2. Буква уезжает **влево** на финальную позицию в центрированной фразе (left-anchored layout).
3. Остаток первого слова — горизонтальная «шторка» **вправо**.
4. Второе слово — проявление снизу вверх (wipe / «возрастание»), целиком.
5. Outline: **первое слово справа**, **второе слева** (зеркально кадру 1); уход обратно на свои стороны.
6. Выход FG: `kineticSlamOut` по буквам.

### Кадр 4 — «INTELLIGENT CODE»

1. Красная рамка 3px без заливки растягивается из центра на **всю** ширину фразы.
2. Заливка сверху вниз; белый текст лежит **внутри** fill-слоя (`overflow: hidden`) и открывается вместе с заливкой.
3. Короткая пауза → красная подложка **уезжает сверху вниз**; текст **заливается красным** сверху вниз.
4. Каждая буква делает **переворот в плоскости экрана** (`scaleX` 1→0→1) и становится `gold-500`; рамка гаснет.
5. Outline разрезан пополам по высоте: верх — справа, низ — слева; стыкуются в центре. Каждая половина — **отдельный** `buildMaskedOutline` (не `innerHTML`-клон масок).
6. Выход: блок текста уходит с blur (`exitBlockBlur`), без explode букв.
7. Вертикаль outline выравнивается по центру глифов FG (box-center SVG ≠ ink-center HTML).

---

## 4. RTL / иврит (`he`)

Страница: `html[dir=rtl]`, шрифт стека с **Heebo** (`src/lib/fonts.ts` — у Inter в `next/font` нет hebrew subset).

| Кадр | Зеркалирование |
|---|---|
| 1 | Влёт outline-слов через `outlineEntranceX(..., rtl)` |
| 2 | Красная плашка растёт **справа → влево**; сворачивается к **левому** краю |
| 3 | После камеры буква паркуется к **правому** краю фразы; остаток слова раскрывается **влево** (сдвиг `x` синхронно с `width`, иначе box-model якорится слева). Второе слово: компенсация `x` на ширину gap+word2. Финальный recenter на слот — **только RTL** (на EN/RU даёт рывок влево) |
| 4 | Половинки outline: направления влёта зеркалятся |

FG / ряды с ивритом: `direction: rtl` + Heebo (`resolveHeeboStack`). SVG outline остаётся в LTR-координатах; ивритские глифы с отрицательным `getBBox().x` **переякоряются** через атрибут `x` (не `transform` — иначе mask desync).

---

## 5. Технические договорённости

### Цвета (все темы)

| Слой | Цвет |
|---|---|
| FG (основной текст) | всегда **`gold-500`** (`#FFE9C7`) — `getGold500Color()`, `hero-heading` тоже `text-gold-500` |
| Outline | прозрачный fill + stroke **`gold-900`** (`#6B6254`) — `getOutlineStrokeColor()` |

### Обводка (outline)

- SVG `<text>` со `stroke`, `fill="none"`.
- Luminance-mask: белый rect + чёрный glyph punch → только внешнее кольцо, без внутренних пересечений (например у «R»).
- Толщина: `max(2, fontPx * 0.016)`.
- Подгонка под viewport: `maxW` / `maxH` вокруг позиции заголовка.
- Кегль ограничен `clampOutlineFontPx()` (~22vh / 10vw, cap 280px), чтобы короткие HE-фразы не раздувались сильнее длинных.

### Смена локали

- В `HomeClient.setLocale` **сразу** выставляются `document.documentElement.lang` / `dir` (до React-эффектов), иначе кадры меряют layout со старым направлением.
- При stop/restart: полный сброс transform/`fontSize`/width у `fgEl` и `outlineEl`.
- Перед циклом: `document.fonts.ready` + double `rAF`.

### Адаптив

- CSS на `h1.hero-heading`: `clamp` для мобилки и десктопа.
- В каждом кадре `fitFontPx()` / `motionHeadlineFontPx()` уменьшает кегль, если фраза шире экрана.
- Длинные локали (`ru` / `he`) должны оставаться в пределах viewport.

### Рендер текста

- Крупные изменения размера — через **`fontSize`**, не через `transform: scale` (иначе мыло / рваные края).
- `will-change` / лишний `force3D` на глифах избегать — провоцируют blur на GPU-слое.

### Z-index

| Элемент | z-index |
|---|---|
| Hero motion stage | `100` |
| Navbar / burger header | `110` |
| Mobile menu overlay (внутри header) | `60` (ниже кнопки Close `70`) |

### Выходы

| Контекст | Приём |
|---|---|
| Свободный текст (кадры 1, 3) | `kineticSlamOut` — stagger, skew, blur |
| Красная плашка / рамка (2, 4) | Уход **целым блоком** (opacity; без explode букв в `overflow: hidden`) |

---

## 6. Ключевые файлы

| Файл | Роль |
|---|---|
| `src/components/HeroMotionText.tsx` | Кадры, outline, цикл, portal |
| `src/components/HeroSection.tsx` | Сборка фраз, стили `h1` |
| `src/components/HeroAnimation.tsx` | Scroll-обёртка hero / scrub fade |
| `src/app/(frontend)/HomeClient.tsx` | Locale/`dir` sync |
| `src/lib/fonts.ts` | Inter + Heebo + Roboto Mono |
| `src/globals/Hero.ts` | CMS-поля |
| `src/translations/index.ts` | Дефолтные `motionHeadings` |
| `src/lib/getSiteContent.ts` | Выдача контента на фронт |
| `src/components/Navbar.tsx` | z-index меню над анимацией |

---

## 7. Как менять

1. **Новая фраза / текст** — CMS Hero или `translations` → `motionHeadings`.
2. **Новый кадр** — `playFrameN` + ветка `index === N` в цикле; пока нет дизайна — `playPlaceholderFrame`.
3. **Цвет обводки** — `getOutlineStrokeColor()` (`gold-900`); FG — `getGold500Color()`.
4. **RTL-поведение** — проверять зеркала кадров 2–3 и outline entrances; не делать финальный recenter на LTR.
5. **Не утверждать кадр в проде**, пока выход внутри красных блоков не проверен: blur/skew + `overflow: hidden` дают вертикальные рывки.

---

## 8. Статус

- Кадры **1–4** утверждены (LTR + RTL mirrors).
- Мобильный fit кегля включён.
- FG: `gold-500` во всех темах; outline: `gold-900`.
- Heebo для Hebrew; смена локали без съезда layout.
- Дальнейшие фразы (если появятся в массиве) идут через placeholder kinetic slam, пока не спроектированы shot-by-shot.
