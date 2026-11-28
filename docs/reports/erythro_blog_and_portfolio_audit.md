# 📊 Полный аудит локализации блога и портфолио Erythro.ai (`RU` — эталон / `EN` / `HE`)

**Дата аудита:** 28 ноября 2026 г.  
**Охват:**
- **Блог (`https://erythro.ai/blog`):** все **22 опубликованные статьи** (`ID 1–22`, включая 2 новые статьи `ID 21` и `ID 22`), страницы пагинации `/blog/page/2..4`, метаданные (`title`, `excerpt`, `seoTitle`, `seoDescription`, `cover.alt`), `tags`, `relatedLinks` и полный текст каждого блока тела в локалях **RU (основа)**, **EN** и **HE**.
- **Портфолио (`https://erythro.ai/portfolio`):** все **11 кейсов** (`ID 1, 2, 5, 6, 7, 8, 9, 10, 11, 12, 13`), метаданные (`title`, `categoryLabel`, `description`, `summary`, `subtitle`, `seoTitle`, `seoDescription`), `highlights`, `relatedServiceLabel`, `relatedAuditLabel/Href`, `stack`, `performanceScores` и все секции `body` в локалях **RU (основа)**, **EN** и **HE**.

---

## 🧭 Исполнительное резюме (Executive Summary)

### Что улучшилось в блоге после предыдущего аудита (25.11.2026)
Большая часть критических технических проблем из прошлого отчёта исправлена: починены подписи `relatedLinks` в `ID 2–19`, убраны счётчики LinkedIn (`51 показ`, `121 показ`, `91 показ`, `93 показа`, `+2`), исправлена обрезка `seoDescription` посреди слова, поправлены грубые ошибки в иврите (`שוער AI` → `קונסיירז' AI`, `שדרוג חומרה` → `האצת חומרה`, `צינור אנימציה` → `פייפליין אנימציה`, BiDi-код и месяцы в ID 4) и ряд ошибок в английском.

### Главные критические дефекты, найденные сейчас (Блог + Портфолио)

#### 🔴 Блог (`https://erythro.ai/blog` — 22 статьи)
1. **Сломанные ссылки `relatedLinks` в ID 20:** первые 4 ссылки («Живое демо PSB Consulting» и 3 ссылки на AI-аудит) имеют `"href": "/"` и ведут на главную страницу вместо демо и аудита.
2. **Неверные ссылки после автозамены LinkedIn CTA (ID 3, 7, 9, 17):** в `EN`/`HE` фразы «Живое демо в первом комментарии» / «Ссылки в первом комментарии» заменились на **`https://erythro.ai/audit`** (например, *«Live demo at https://erythro.ai/audit»* для ORIGIN Coffee и ORA 60A, *«Links at https://erythro.ai/audit»* для подборки Awwwards), при этом в `RU` в 7 статьях (`ID 3, 5, 7, 9, 15, 17, 18, 19`) и местами в `EN`/`HE` (`ID 1, 3, 5, 6, 9`) всё ещё висят CTA про LinkedIn, профиль и комментарии.
3. **Зашитый английский URL аудита в новых статьях ID 21 и ID 22:** в `body` и `relatedLinks` для `RU` и `HE` стоит **`https://ai-audit-en.erythro.ai/`** вместо `ai-audit-ru` / `ai-audit-he` (или `/audit`).
4. **Рассинхрон структуры и остаточный дубль ошибочного H1 в ID 12 (`RU`):** в `body[0]` русской версии остался дубль **старого ошибочного заголовка** (*«какую цену платит за скорость»*), из-за чего в `RU` 9 абзацев против 8 в `EN`/`HE`.
5. **Недоисправленные правки между `body` и `excerpt`/`seoDescription`:** в `body` исправили, а в `excerpt` и `seoDescription` остались старые ошибки: `כמפתח` (ID 1 HE), `handsome menu` (ID 3 EN), `issues are set` (ID 11 EN), `(2016 year)` (ID 13 EN), `layout design` (ID 17 EN), пропущенная точка перед `Enter` (ID 15 EN).
6. **Нерешённые ошибки в конкретных локалях:** `7 Barba scenarios` при списке из 6 в ID 5 (`EN`); непереведённые заголовки п. 1–3 на английском в ID 7 (`HE`); инверсия смысла *«платить за скорость загрузки»* осталась в ID 14 (`RU` и `HE`, исправлена только в `EN`); не переведены 5 шкал аудита в ID 19 (`RU`) и `Mobile`/`Desktop` в ID 16 (`RU`); `cover.alt` только на `EN` в ID 20, 21, 22.

#### 🔴 Портфолио (`https://erythro.ai/portfolio` — 11 кейсов)
1. **Не локализовано `categoryLabel` в 9 из 11 кейсов:** везде стоит строчное английское `"websites"` (а в `pro-interior` — `"website"` в EN/HE и `"websites"` в RU), хотя для AI-проектов сделано корректно (`AI-агенты` / `AI Agents` / `סוכני AI`).
2. **Пустое поле `relatedAuditLabel.he` (`""`) и рассинхрон `relatedAuditHref.he` (`"/audit"`) в `origin-coffee` (ID 13).**
3. **Полностью отсутствуют `seoTitle` и `seoDescription` в `pro-interior` (ID 2)** (а `stack` склеен в одну строку).
4. **Ошибка подписи `highlights` в RU в `ember` (ID 11) и `psb-consulting` (ID 12):** вместо `"Поставка"` стоит `"CI"` (в EN `"Delivery"`, в HE `"מסירה"`).
5. **Массовый машинный перевод (Google Translate) с грубыми искажениями в `pro-interior` (ID 2):**
   - **16 невидимых символов `\u200b` (ZWSP)** в EN и HE (`PageSpeed ​​95+`);
   - `натяжные потолки` → `suspended ceiling` (EN) → **`סטודיו עם תקרה תלויה`** («студия с подвесным потолком в офисе», HE);
   - `строгая типизация (Strong typing)` → **`הקלדה חזקה`** («сильное печатание на клавиатуре», HE);
   - `валидация полей` → **`אימות שטח`** («проверка местности», HE);
   - `защита релизов` → **`הגנה מפני שחרור`** («защита ОТ релиза», HE);
   - `токены` → `אסימוני טיפוגרפיה` («жетоны»); несуществующая глагольная форма `ולאוטומטי`.
6. **Грубые смысловые курьёзы в иврите (HE) в других кейсах:**
   - `Живой стенд` → **`דוכן חי`** («торговый ларёк/лоток на рынке» в `psb-consulting` и `origin-coffee`, а в EN `psb-consulting` — русизм `Live stand`);
   - `Скролл-скраббинг (scrub)` → **`קרצוף בדסקטופ`** / `פריימים שנקרצפים` («мытьё/оттирание щёткой» в `ora-60a`);
   - `круговой прелоадер` → **`מטעין מעגלי`** («круглое зарядное устройство» в `ora-60a`);
   - `отсечка (redline)` → **`סלאם`** («слэм/привет» в `mustang-6663rt`);
   - `wide desktop` → **`שולחן רחב`** («широкий стол» в `montblanc`);
   - `portrait-пакет` → **`חבילת דיוקן`** («художественный портрет» в `ember` и `origin-coffee`);
   - `сухая выдержка (dry-aging)` → **`ייבוש יבש`** («сухая сушка» в `ember`);
   - `self-hosted шрифты` → **`גופנים מארחים עצמית`** («шрифты, принимающие гостей» в `la-scala` и `mustang-6663rt`);
   - `урезанный на 40–50% иврит` в `ai-audit-agent` и `ai-consultant`.
7. **Баги в английском и русском оригиналах портфолио:**
   - Утечка английского слова **`visitors`** в русский текст `mustang-6663rt` (`body[1].ru`);
   - Опечатка **`Ai & Automation`** (строчная `i`) в `ai-audit-agent` и `ai-consultant`;
   - Кальки в EN: `TZ briefs` (непонятный транслит «ТЗ» в `ai-consultant`), `contested IT terms` (`ai-consultant`), `SMTP dollars escaped` + утечка внутреннего кода `PIT-031` (`ai-audit-agent`), `Live stand` (`psb-consulting`), `italian` со строчной (`montblanc`);
   - Русские кавычки-ёлочки `«...»` в текстах `EN` и `HE` (в 6 кейсах);
   - Двойной пробел в `seoDescription.ru` в `ember`;
   - Противоречие между блоком `performanceScores` и текстом («баллы не приводятся») в `la-scala`, `mustang-6663rt`, `origin-coffee`.
8. **UI-виджет на обеих страницах (`/blog` и `/portfolio`):** в иврите по-прежнему осталось **`הזוחל`** («рептилия/пресмыкающееся») вместо **`הזחלן`** (веб-краулер).

---

# ЧАСТЬ I. БЛОГ (`https://erythro.ai/blog` — 22 статьи)

## 📋 Сводная таблица по всем 22 статьям блога

| ID | Статья (slug) | Тех. / Ссылочные баги | Ошибки EN (vs RU) | Ошибки HE (vs RU) | Замечания к RU (основа) |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `then-and-now-the-psb-consulting-site...` | HE `body[10]` без ссылки (LinkedIn CTA) | `the same` vs «аналогичный»; `a design`; `take to a request`; регистр `"request a call"` | **`כמפתח`** в `excerpt` и `seoDescription`; `לוגו סמל`; `ביקורות` vs `המלצות`; LinkedIn CTA в `body[10]` | Повтор в `body[10]`: *«бесплатный ИИ-аудит сайта. Бесплатный AI-аудит:»*; смешение `ИИ`/`AI` |
| **2** | `free-ai-website-audit-what-holds-growth-back...` | Ок | Ок | `body[9]`: обращение на «ты» (`ברצונך`, `הפעל`) вместо «вы» | `Erythro AI` vs `Erythro.ai` |
| **3** | `erythro-ai-case-study-origin-coffee...` | **`body[9]` EN/HE ведёт на `/audit` вместо демо ORIGIN!** | **`handsome menu`** в `excerpt`/`seoDesc`; `demonstrational`; `on a computer`; `AI systems`; LinkedIn CTA в `body[8]` | `מהגרגר` vs `מפרי`; `נעצרים` (старая калька `blocks stop`); `ציון חיפוש`; **`סרטון הקפה`** (противоречит 220 WebP); `מערכות AI` | LinkedIn CTA в `body[8]` и `body[9]` (*«в шапке профиля»*, *«в первом комментарии»*) |
| **4** | `modern-web-guidance-chrome-teaches-ai-coding...` | Ок | Ок (очень чисто) | Ок (BiDi и месяцы исправлены!) | `ИИ-агентов` (единообразие с `AI-`) |
| **5** | `the-transition-that-sells-a-portfolio...` | Пустые `tags: []`; LinkedIn CTA в `body[12]` | **`7 Barba scenarios`** (в списке 6; в RU/HE уже `6`!) | Ок (кроме `קישור בפרופיל` в `body[12]`) | `Ссылка в профиле` в `body[12]` |
| **6** | `ember-an-immersive-3d-website-for-a-steakhouse` | `body[9]` LinkedIn CTA (*«напишите мне здесь»*) | **`Link at https://erythro.ai/audit.`** в `body[10]` (обрубок автозамены) | `350 g`/`1.2 kg` вместо `גרם`/`ק"ג`; `שלחו לי הודעה כאן` | `напишите мне здесь` в `body[9]` |
| **7** | `top-3-designs-of-the-week-coffee-storytelling...` | **`body[8]` EN/HE: «Links at `/audit`» вместо ссылок на 3 сайта Awwwards!** | `watch manufacture` (нужно `watchmaker`) | **Заголовки п. 1–3 на английском** (`Bürocratik studio`, `Nov 13..15`); `קישורים בכתובת /audit` | `Ссылки в первом комментарии` в `body[8]`; `Erythro AI` |
| **8** | `erythro-ai-case-study-an-ai-consultant...` | Ок | Ок | `כאשר רכיב קורס` (узко); `לסגור` (калька с «закрывать») | `ИИ-консультант` + `Erythro AI` |
| **9** | `a-premium-interactive-website-for-your-brand` | **`body[6]` EN/HE ведёт на `/audit` вместо демо ORA 60A!** | `body[7]`: всё ещё **`here on LinkedIn`** и `in the comments` | `title`: `למותג שלך` («ты») vs `שלכם` («вы»); `body[7]`: **`ב־LinkedIn`** и `בתגובות` | `body[6]` *«в первом комментарии»*; `body[7]` *«в комментариях»* |
| **10** | `cyera-ai-guardian-webgl-without-three-js...` | Ок | Тавтология **`move the shield and shield the crystal`** (`body[2]`); `five scales` | `טקסטורות העבודה`; `Erythro.ai` vs `Erythro AI` в RU/EN | `Erythro AI` в `body[6]` |
| **11** | `15-years-in-web-300-projects-7-questions...` | Ок | **`issues are set`** осталось в `excerpt`/`seoDesc` (в `body[0]` уже `originate`) | `נקבעות` (калька со старого EN `are set`) | `Erythro AI` |
| **12** | `how-auge-experience-builds-page-transitions...` | **Рассинхрон блоков: RU=9, EN=8, HE=8** | Ок | Ок | **В `body[0]` остался дубль старого ошибочного H1** (*«платит за скорость»*)! |
| **13** | `then-and-now-the-la-scala-restaurant-website...` | Ок | **`(2016 year)`** осталось в `excerpt`/`seoDesc` (в `body[0]` исправлено) | `אז ועכשיו` (vs `אז והיום` в ID 1) | `Было и стало` (vs `Тогда и сейчас` в ID 1) |
| **14** | `top-3-designs-of-the-week-how-animations...` | Пустые `tags: []` | Ок (исправили инверсию и `scrubs`!) | **Инверсия смысла в `body[0]`:** `עבור מהירות טעינת העמוד` | **Инверсия смысла в `body[0]`:** *«платить за скорость загрузки»* (не исправлено!) |
| **15** | `where-could-your-website-be-losing-revenue` | Пустые `tags: []`; рассинхрон CTA в `body[7]` | Пропущена точка в `excerpt` перед `Enter your website` | Грамматика в `body[7]`: **`דרך הביקורת AI בחינם`** (лишний артикль `ה` в смехуте) | `по ссылке в первом комментарии` в `body[7]` |
| **16** | `agrumea-farm-hybrid-packaging-visualization...` | Пустые `tags: []` | Ок | `body[12]`: **`מחסניות טכנולוגיות`** («картриджи» вместо `סטאקים טכנולוגיים`) | `body[7]–[10]`: `Mobile`/`Desktop`, `Lab Score`, `Real-User` не переведены |
| **17** | `15-years-in-web-development-what-300-projects...` | `body[12]`: EN/HE «Links at `/audit`» | **`layout design`** осталось в `excerpt`/`seoDesc` | **`מעיצוב פריסה`** (везде) вместо «вёрстка макетов»; `העסק שלך` vs `יש לכם` | `Ссылки в первом комментарии` в `body[12]` |
| **18** | `awwwards-anatomy-delivering-120-fps...` | Рассинхрон CTA в `body[16]` | Ок | Ок (`האצת חומרה` исправлено!) | `в первом комментарии` в `body[16]` |
| **19** | `free-ai-website-audit-5-scales-and-a-score...` | Рассинхрон CTA в `body[8]` | `5 Scales` / `five scales` (калька) | `אודיט` + `5 סקלות` (vs `ביקורת AI` + `5 מדדים` в других статьях) | **Названия всех 5 шкал `[2]–[6]` на английском**; `в первом комментарии` в `[8]` |
| **20** | `psb-consulting-demo-site-from-first-screen...` | **4 из 5 `relatedLinks` ведут на `"/"`!**; `cover.alt` и видео `alt` только на EN | Ок | Ок (очень естественный HE) | `Erythro AI` в тексте vs `Erythro.ai` в SEO |
| **21** *(новая)* | `polpharma-biologics-page-transitions...` | **`body[13]` и `relatedLinks` ведут на `ai-audit-en.erythro.ai` в RU и HE!**; `cover.alt` только на EN | `colour` (UK в `body[8]`, на остальном сайте US `color`); `placeholders` vs «фигуры» (`[10]`) | Ок (очень качественный перевод!) | `Erythro AI` в `body[12]`; запятая в дробях (`7,36`) vs точка (`7.33`) в ID 1–19 |
| **22** *(новая)* | `15-years-300-projects-6-things-i-no-longer-do` | **`body[15]` и `relatedLinks` ведут на `ai-audit-en.erythro.ai` в RU и HE!**; `cover.alt` только на EN | Ок (очень чистый EN!) | `body[5]`: `מסירת העבודה` («сдача») вместо «приёмка» (`בדיקת קבלה`); `ברשת` vs `בווב` (ID 11/17) | `Erythro AI` в `body[14]` |

---

## 🔧 1. Критические исправления по блогу (готовые тексты и ссылки)

### 1.1. Сломанные ссылки в `ID 20`, `ID 21`, `ID 22` и после автозамены CTA (`ID 3, 6, 7, 9, 17`)
- **ID 20 (`relatedLinks`):** сейчас первые 4 элемента имеют `"href": "/"`. Заменить на:
  - `Live demo: the PSB Consulting site` → `"https://psb.erythro.ai/"`
  - Аудит (или оставить 1 локализованную ссылку `/audit`, как в ID 1–19) → `"https://ai-audit-en.erythro.ai/"`, `"https://ai-audit-ru.erythro.ai/"`, `"https://ai-audit-he.erythro.ai/"`.
- **ID 21 (`body[13]` и `relatedLinks`) и ID 22 (`body[15]` и `relatedLinks`):**
  - В `RU` заменить `https://ai-audit-en.erythro.ai/` → `https://ai-audit-ru.erythro.ai/` (или `/audit`);
  - В `HE` заменить `https://ai-audit-en.erythro.ai/` → `https://ai-audit-he.erythro.ai/` (или `/audit`).
- **ID 3 (`body[9]` — ORIGIN Coffee):**
  - Сейчас в EN/HE: `Live demo at https://erythro.ai/audit.` / `דמו חי בכתובת https://erythro.ai/audit.` (ведёт на аудит вместо кофейни!).
  - Исправление:
    - RU: `Живое демо: https://origin.erythro.ai/`
    - EN: `Live demo: https://origin.erythro.ai/`
    - HE: `דמו חי: https://origin.erythro.ai/`
- **ID 9 (`body[6]` и `body[7]` — ORA 60A):**
  - Сейчас `body[6]` EN/HE ведёт на `/audit`, а `body[7]` EN/HE всё ещё зовёт в LinkedIn и комментарии.
  - Исправление `body[6]`:
    - RU: `Живое демо ORA 60A: https://ora60a.erythro.ai`
    - EN: `Live ORA 60A demo: https://ora60a.erythro.ai`
    - HE: `דמו חי של ORA 60A: https://ora60a.erythro.ai`
  - Исправление `body[7]`:
    - RU: `А как работает ваш сайт: активно генерирует заявки или выполняет лишь роль витрины? Если вашему бренду требуется решение подобного уровня, напишите нам: https://erythro.ai/contacts или напрямую через WhatsApp на сайте.`
    - EN: `What about you: is your website actively generating leads today, or just sitting like a showcase? If you want a website like this for your brand, contact us at https://erythro.ai/contacts or directly via WhatsApp on the site.`
    - HE: `ומה איתכם: האתר שלכם היום מביא פניות, או רק משמש כוויטרינה? אם אתם רוצים אתר כזה למותג שלכם, צרו איתנו קשר בכתובת https://erythro.ai/contacts או ישירות ב-WhatsApp מתוך האתר.`
- **ID 6 (`body[10]` EN):** `Link at https://erythro.ai/audit.` → `Free AI audit: https://erythro.ai/audit` (а в `body[9]` убрать *«напишите мне здесь»* / *«message me here»* / *«שלחו לי הודעה כאן»* → ссылка на `/contacts`).
- **ID 7 (`body[8]`):** вместо *«Ссылки в первом комментарии»* / *«Links at https://erythro.ai/audit»* либо дать прямые ссылки на сайты Delta Cafés, Preymaker, SANTAL, либо переформулировать под аудит:
  - RU: `Хотите проверить скорость и производительность своего сайта? Бесплатный AI-аудит: https://erythro.ai/audit.`
  - EN: `Want to check your website's speed and performance? Free AI audit: https://erythro.ai/audit.`
  - HE: `רוצים לבדוק את המהירות והביצועים של האתר שלכם? ביקורת AI חינמית: https://erythro.ai/audit.`
- **ID 1 (`body[10]`):**
  - RU (убрать повтор): `Узнайте, где ваш сайт теряет лиды — бесплатный AI-аудит: https://erythro.ai/audit.`
  - HE (убрать LinkedIn): `גלו היכן האתר שלכם מאבד לידים — ביקורת AI חינמית לאתר: https://erythro.ai/audit.`
- **ID 3 (`body[8]`), ID 5 (`body[12]`), ID 15 (`body[7]`), ID 17 (`body[12]`), ID 18 (`body[16]`), ID 19 (`body[8]`):** убрать оставшиеся упоминания *«в шапке профиля»*, *«в первом комментарии»*, *«в личные сообщения»* и заменить на единый CTA со ссылкой на `/audit` (в ID 15 HE также исправить `דרך הביקורת AI בחינם` → `באמצעות ביקורת ה-AI החינמית: https://erythro.ai/audit`).

### 1.2. Ошибки содержания и перевода в блоге (RU / EN / HE)

| ID | Поле / Локаль | Сейчас | Исправление |
| :-: | :--- | :--- | :--- |
| **12** | `body[0]` **RU** | Дубль старого заголовка: `Как AUGE Experience реализует переходы между страницами — и какую цену платит за скорость` | **Удалить `body[0]` в RU** (в EN/HE его уже нет; станет 8 блоков во всех локалях). |
| **14** | `body[0]` **RU** / **HE** | RU: `...платить за скорость загрузки страниц.`<br>HE: `...עבור מהירות טעינת העמוד.` | RU: `...и какую цену в скорости загрузки страниц за них приходится платить.`<br>HE: `...ומהו המחיר שאנימציות אלו גובות ממהירות טעינת העמוד.` |
| **5** | `body[3]` **EN** | `2. 7 Barba scenarios (...)` *(в списке 6)* | `2. 6 Barba scenarios (...)` *(синхронно с RU и HE)* |
| **7** | `body[1],[3],[5]` **HE** | `1. Delta Cafés — Bürocratik studio (7.33/10, SOTD Nov 13)` *(и п. 2, 3)* | `1. Delta Cafés — סטודיו Bürocratik (7.33/10, SOTD ב-13 בנובמבר)` *(и аналогично `ב-14 בנובמבר`, `ב-15 בנובמבר`)* |
| **1** | `excerpt`, `seoDesc` **HE** | `מכירת חברות מדף כמפתח` | `מכירת חברות מדף מקצה לקצה` *(как уже исправлено в `body[0]`)* |
| **3** | `excerpt`, `seoDesc` **EN** | `a handsome menu` | `a polished menu` *(как уже исправлено в `body[0]`)* |
| **3** | `title`, `seoTitle` **HE** | `מהגרגר לכוס` | `מפּרי הקפה לכוס` *(единообразно с `מפרי בשל` в `body[0]`)* |
| **3** | `body[3]`, `[6]`, `[7]` **HE** | `הבלוקים נעצרים בזה אחר זה`; `ציון חיפוש`; `סרטון הקפה` | `הבלוקים מקובעים בזה אחר זה`; `ציון SEO`; `רצף הקפה` *(не видео!)* |
| **10** | `body[2]` **EN** | `move the shield and shield the crystal` | `move the shield to protect the crystal` |
| **11** | `excerpt`, `seoDesc` **EN** | `Most project issues are set not in the code` | `Most project issues originate not in the code` *(как в `body[0]`)* |
| **13** | `excerpt`, `seoDesc` **EN** | `(2016 year)` | `(from 2016)` *(как в `body[0]`)* |
| **15** | `excerpt` **EN** | `...and Perplexity Enter your website...` | `...and Perplexity. Enter your website...` |
| **16** | `body[12]` **HE** | `מחסניות טכנולוגיות` | `סטאקים טכנולוגיים` |
| **16** | `body[7]–[10]` **RU** | `Mobile` / `Desktop`, `Lab Score`, `Real-User` | `Мобильные` / `Десктоп` *(или единообразно с остальными статьями)* |
| **17** | `excerpt`, `seoDesc` **EN** | `layout design` | `slicing mockups` *(как в `body[0]`)* |
| **17** | `excerpt`, `seoDesc`, `body[0]` **HE** | `מעיצוב פריסה` | `מקידוד תבניות` *(от «вёрстка макетов», не «дизайн макетов»)* |
| **19** | `body[2]–[6]` **RU** | `Speed & Mobile UX, 27%` *(и ещё 4 шкалы на EN)* | Перевести названия всех 5 шкал на русский *(как уже сделано в HE)* |
| **21** | `body[8]` **EN** | `change colour one by one` | `change color one by one` *(US English по всему сайту)* |
| **2, 9, 17** | `HE` | Смешение «ты» и «вы» (`ברצונך/הפעל`, `למותג שלך`, `העסק שלך`) | Унифицировать на «вы»: `ברצונכם/הפעילו`, `למותג שלכם`, `העסק שלכם` |
| **20, 21, 22** | `cover.alt` *(и видео в ID 20)* | Только на `EN` | Локализовать `alt` для `RU` и `HE` |

---

# ЧАСТЬ II. ПОРТФОЛИО (`https://erythro.ai/portfolio` — 11 кейсов)

## 📋 Сводная таблица по всем 11 кейсам портфолио

| ID | Кейс (`slug`) | Критические / Тех. дефекты | Ошибки EN (vs RU) | Ошибки HE (vs RU) | Замечания к RU (основа) |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `montblanc` | `categoryLabel` = `"websites"` (RU/EN/HE) | `italian` со строчной (`description`) | **`משולחן רחב`** («от широкого стола» вместо desktop!); `ערימת UI`; `מיילים HTML` → `מיילי HTML`; `שמאונדקס לאט` vs «плохо» | Ок |
| **2** | `pro-interior` | **Нет `seoTitle`/`seoDescription`**; `categoryLabel` (`websites`/`website`/`website`); `stack` склеен в 1 строку; **16× `\u200b` (ZWSP)**; ведущий пробел в `client` | **`suspended ceiling`** вместо `stretch ceiling`; ёлочки `«PRO Interior»`; `micro-interface`; `ESLint code review`; `Business Effect` | **Машинный Google Translate:** `סטודיו עם תקרה תלויה`; **`הקלדה חזקה`** («печатание» вместо strong typing!); **`אימות שטח`** («проверка местности»); **`הגנה מפני שחרור`**; `אסימוני טיפוגרפיה`; `ולאוטומטי`; `אדריכלות`; `צינור CI/CD`; `חתיכות`; ёлочки | Заголовки в Title Case (`Вызовы и Задачи Проекта`); `микроинтерфейсных` вместо «микроинтеракций» |
| **5** | `ai-audit-agent` | `relatedServiceLabel.en`: **`Ai & Automation`** | **`SMTP dollars escaped`** + утечка `PIT-031`; `five scales` | **`הפסק הדין`** (двойной артикль!); `צינור`; `ערימת UI`; **текст `body[2]–[4]` урезан на ~40% относительно RU/EN** | Утечка внутреннего кода `(PIT-031)`; проверьте `A44` (не опечатка ли `A4`?) |
| **6** | `ai-consultant` | `relatedServiceLabel.en`: **`Ai & Automation`** | **`TZ briefs`** / `TZ-{id}` (транслит «ТЗ»); **`contested IT terms`** | **`בריפי TZ`**; **`להכשיר ולחנך`**; ёлочки `«צ׳אט הזמנה»`; `ערימת UI`; **текст `body[1]–[4]` урезан на ~50%** | Ок |
| **7** | `rosso-garage` | `categoryLabel` = `"websites"`; сырые бэктики `` `--cover` ``; нет `/` в `relatedAuditHref.he`; `\n` в `summaryRich` | Ок (чистый EN) | Опечатка **`הלועדר`** → `הלואדר`/`preloader`; `צינור פריימים`; ёлочки `«צור קשר עם המוכר»` | Бэктики `` `--cover` `` в plain text |
| **8** | `ora-60a` | `categoryLabel` = `"websites"`; кириллическое имя файла `Без-имени-1.jpg` | `640 KiB` vs `6.6 MB` | **`קרצוף בדסקטופ`** и `שנקרצפים` («мытьё щёткой» вместо scrubbing!); **`מטעין מעגלי`** («зарядка» вместо preloader!); **`והאנשי קשר`** (артикль в смехуте!); `לפני הציור הראשון` | Порядок языков в `HL[0].ru` не совпадает с EN/HE |
| **9** | `la-scala` | `categoryLabel` = `"websites"`; сырые бэктики `` `useStack` ``; **противоречие `performanceScores` (92/100) vs текст («балл не приводится»)**; нет `/` в `relatedAuditHref.he` | `roubles` (UK vs US `rubles`) | **`גופנים מארחים עצמית`** («шрифты принимают гостей»!); ёлочки `«חורים»` | Год макета `2015` (в Блоге ID 13 — `2016`); противоречие с `performanceScores` |
| **10** | `mustang-6663rt` | `categoryLabel` = `"websites"`; противоречие `performanceScores` (82) vs «без цифры»; нет `/` в `relatedAuditHref.he` | Ок (чистый EN) | **`דף נחיתה לרכב כהה`** («тёмная машина» вместо «тёмный лендинг»); **`הגלילה מרים`** (род!); **`וסלאם`** («слэм» вместо redline/отсечка!); **`שלוש רוחבי`** (род!); **`גופנים מארחים עצמית`**; ёлочки | **Утечка английского слова `visitors` в RU (`body[1]`)!** |
| **11** | `ember` | `categoryLabel` = `"websites"`; **`HL[4].label.ru` = `"CI"` вместо `"Поставка"`**; двойной пробел в `seoDesc.ru`; `agentBrowse: "2"` вместо `"2/2"` | `centre-cropped` (UK vs US `center-cropped`) | **`ייבוש יבש`** / `ימי ייבוש` («сушка» вместо вызревания `יישון`!); **`חבילת דיוקן`** («портрет» вместо `אנכית/portrait`!); **`לא ממתיחים`** (неверный биньян → `לא מותחים`) | Двойной пробел в `seoDescription.ru`; дефис `-` вместо тире в `body[4].ru` |
| **12** | `psb-consulting` | `categoryLabel` = `"websites"`; **`HL[3].label.ru` = `"CI"` вместо `"Поставка"`**; нет `/` в `relatedAuditHref.he` | **`Live stand`** (русизм для «живой стенд»); `Required a modern...` (нет подлежащего) | **`דוכן חי`** («торговый ларёк» от «стенд»!); `חברות מוכנות` вместо `חברות מדף`; `ערימת UI`; `מחסנית הטכנולוגיות`; `ביקורות`; ёлочки; стрелки `←` | `герой-слайдер` / `герой` (лучше `hero`) |
| **13** | `origin-coffee` | `categoryLabel` = `"websites"`; **пустой `relatedAuditLabel.he: ""`**; `relatedAuditHref.he: "/audit"` (vs поддомен в RU/EN); противоречие `performanceScores` (87) vs «баллы не выдумываем» | `Required a specialty...` (нет подлежащего) | **`דוכן חי`** («торговый ларёк»!); `מהגרגר` / `גרגר, פול` («зерно, зерно» вместо «ягода, зерно»); **`חבילת דיוקן`** (vs `Portrait` в `body`); `ערימת UI` | Противоречие `performanceScores` (87, 2/2) с текстом и с Блогом ID 3 (93, 3/3) |

---

## 🚨 2. Детальный разбор критических технических багов портфолио

### 2.1. Нелокализованный `categoryLabel` (9 из 11 кейсов)
Сейчас в CMS для всех сайтов (кроме AI-агентов) в поле `categoryLabel` записана английская строка:
```json
// Сейчас (ID 1, 7, 8, 9, 10, 11, 12, 13):
"categoryLabel": {"ru": "websites", "en": "websites", "he": "websites"}

// Сейчас (ID 2 — pro-interior):
"categoryLabel": {"ru": "websites", "en": "website", "he": "website"}

// Исправление (для всех 9 проектов):
"categoryLabel": {"ru": "Сайты", "en": "Websites", "he": "אתרים"}
```

### 2.2. Пропущенные поля и сломанные метаданные
- **ID 13 (`origin-coffee`):**
  - `relatedAuditLabel.he`: сейчас `""` → заполнить `"אודיט AI חינמי לאתר"` (или `"ביקורת AI חינמית לאתר"` — по выбранному стандарту).
  - `relatedAuditHref.he`: сейчас `"/audit"` → привести к `"https://ai-audit-he.erythro.ai/"` (как в RU/EN и остальных кейсах).
- **ID 2 (`pro-interior`):**
  - Добавить `seoTitle`:
    - RU: `PRO Interior — лендинг студии натяжных потолков на Next.js | Erythro.ai`
    - EN: `PRO Interior — Stretch Ceiling Studio Landing Page on Next.js | Erythro.ai`
    - HE: `PRO Interior — דף נחיתה לסטודיו לתקרות מתיחה ב-Next.js | Erythro.ai`
  - Добавить `seoDescription`:
    - RU: `Кейс Erythro.ai: лендинг студии натяжных потолков PRO Interior на Next.js и GSAP с калькулятором стоимости, динамическим каталогом и CI/CD.`
    - EN: `Erythro.ai case study: PRO Interior stretch ceiling studio landing page built with Next.js and GSAP, featuring a cost calculator, dynamic catalog, and CI/CD.`
    - HE: `קייס של Erythro.ai: דף נחיתה לסטודיו לתקרות מתיחה PRO Interior ב-Next.js ו-GSAP, כולל מחשבון עלויות, קטלוג דינמי ו-CI/CD.`
  - `client`: убрать ведущий пробел и ёлочки → `"PRO Interior"`.
  - `stack`: разбить `["Figma, Next.js, TypeScript, GSAP, Vercel"]` на `["Figma", "Next.js", "TypeScript", "GSAP", "Vercel"]`.
  - Удалить **16 невидимых символов `\u200b` (Zero-Width Space)** из `body[1].en`, `body[2].en` и `body[2].he`.
- **ID 11 (`ember`) и ID 12 (`psb-consulting`):**
  - В `highlights` заменить `label.ru`: `"CI"` → `"Поставка"` (в `ember` — `HL[4]`, в `psb-consulting` — `HL[3]`).
- **ID 5 (`ai-audit-agent`) и ID 6 (`ai-consultant`):**
  - `relatedServiceLabel.en`: `"Ai & Automation"` → `"AI & Automation"`.
- **ID 11 (`ember`):**
  - `seoDescription.ru`: убрать двойной пробел (`"Стейкхаус  на Next.js"` → `"Стейкхаус на Next.js"`).
  - `performanceScores.agentBrowse`: `"2"` → `"2/2"`.
- **ID 7, 9, 10, 12:** добавить trailing slash в `relatedAuditHref.he` (`https://ai-audit-he.erythro.ai/`), как в `ora-60a` и `ember`.

---

## 🇮🇱 3. Критические и смысловые ошибки в иврите портфолио (HE vs RU)

| ID | Кейс / Место | Русский оригинал (RU) | Текущий иврит (HE) | Диагностика | Рекомендованный иврит (HE) |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **2** | `pro-interior` `summary` | *Landing page студии натяжных потолков* | `דף נחיתה לסטודיו עם תקרה תלויה` | **Искажение смысла:** «лендинг для студии, у которой висит потолок» (и `תלויה` = подвесной, а не натяжной). | `דף נחיתה לסטודיו לתקרות מתיחה` |
| **2** | `pro-interior` `body[2]` | *Строгая типизация (TypeScript): ... полностью типизированы* | `הקלדה חזקה (TypeScript): ... מוקלדים במלואם` | **Грубый машинный ляп:** «сильное печатание на клавиатуре / полностью напечатаны». | `טיפוסיות חזקה (TypeScript): נתוני הקטלוג ומצבי החלונות האינטראקטיביים מוגדרי טיפוסים במלואם` |
| **2** | `pro-interior` `body[3]` | *Автоматизированная защита релизов* / *с валидацией полей* | `הגנה אוטומטית מפני שחרור` / `עם אימות שטח` | **Антоним + курьёз:** «защита ОТ выпуска» и «проверка местности». | `הגנה אוטומטית על ריליסים (CI/CD)` / `עם אימות שדות` |
| **2** | `pro-interior` `body[2]` | *автоматизации поставки* / *токены типографики* / *Архитектура* | `ולאוטומטי את אספקת...` / `אסימוני טיפוגרפיה` / `אדריכלות` | Несуществующий глагол; «жетоны» вместо токенов; строительная «архитектура». | `ולהפוך את אספקת העדכונים לאוטומטית` / `טוקנים של טיפוגרפיה` / `ארכיטקטורה` |
| **12, 13** | `psb-consulting`, `origin-coffee` `body[5]` | *Живой стенд на psb.erythro.ai* / *origin.erythro.ai* | `דוכן חי ב־psb.erythro.ai` / `דוכן חי ב־origin.erythro.ai` | **Грубый курьёз:** `דוכן` = торговый лоток/ларёк на рынке. | `אתר דמו חי ב־psb.erythro.ai` / `אתר דמו חי ב־origin.erythro.ai` |
| **8** | `ora-60a` `HL[2]`, `body[5]` | *Скролл-сборка на десктопе* / *покадровой прокрутки* | `קרצוף בדסקטופ` / `בפריימים שנקרצפים בגלילה` | **Грубый курьёз:** `קרצוף` = мытьё/оттирание щёткой (буквалка от `scrub`). | `הרכבה בגלילה בדסקטופ` / `בפריימים המסונכרנים לגלילה` |
| **8** | `ora-60a` `body[3]` | *круговой прелоадер* | `מטעין מעגלי` | **Ошибка слова:** `מטעין` = зарядное устройство / погрузчик. | `preloader מעגלי` |
| **8** | `ora-60a` `summary` | *Тексты, веса и контакты* | `הטקסטים, המשקלים והאנשי קשר` | **Грамматика (смехут):** артикль `ה` ставится перед вторым словом. | `הטקסטים, המשקלים ואנשי הקשר` |
| **10** | `mustang-6663rt` `body[3]` | *карточки разгона, запаса хода и отсечки* | `כרטיסי תאוצה, טווח וסלאם` | **Бессмыслица:** `סלאם` («слэм/салам») вместо `redline` (отсечка/красная зона). | `כרטיסי תאוצה, טווח וקו אדום (redline)` |
| **10** | `mustang-6663rt` `desc`, `summary`, `body[4]` | *Тёмный автомобильный лендинг*; *скролл снимает*; *Три ширины* | `דף נחיתה לרכב כהה`; `הגלילה מרים`; `שלוש רוחבי` | Смещение смысла («тёмное авто») + ошибки грамматического рода (`גלילה` ж.р., `רוחב` м.р.). | `דף נחיתה כהה לרכב`; `הגלילה מרימה`; `שלושה רוחבי פריימים` |
| **1** | `montblanc` `body[1]` | *от wide desktop до mobile* | `משולחן רחב עד מובייל` | **Калька:** «от широкого (обеденного) стола до мобильного». | `מדסקטופ רחב ועד מובייל` |
| **11** | `ember` `desc`, `body[1]`, `[3]`, `[4]` | *сухой выдержки*; *дни выдержки*; *не растягивают* | `ייבוש יבש`; `ימי ייבוש`; `לא ממתיחים` | «Сухая сушка» вместо вызревания мяса; неверный биньян глагола. | `סטייקהאוס בשר מיושן (Dry-Aged)`; `ימי יישון`; `לא מותחים` |
| **11, 13** | `ember`, `origin-coffee` `HL`, `body` | *portrait-пакет 540* | `דיוקן 540` / `חבילת דיוקן` | **Курьёз:** `דיוקן` = художественный портрет, не вертикальная ориентация. | `חבילה אנכית (portrait) 540` |
| **9, 10** | `la-scala`, `mustang` `body[4]` | *Самохостящиеся шрифты* | `גופנים מארחים עצמית` | **Ошибка залога:** «шрифты, которые сами принимают гостей». | `גופנים המאוחסנים מקומית` |
| **5** | `ai-audit-agent` `summary` | *коммерческий вердикт* | `הפסק הדין המסחרי` | **Грамматика (смехут):** двойной определённый артикль `ה`. | `פסק הדין המסחרי` |
| **6** | `ai-consultant` `subtitle`, `body[0]` | *ТЗ*; *Квалифицировать и обучать* | `בריפי TZ`; `להכשיר ולחנך` | Непонятный транслит `TZ`; `להכשיר` ≠ «квалифицировать лид». | `בריפי אפיון`; `לסנן וללוות לידים באנונימיות` |
| **7** | `rosso-garage` `body[3]` | *не оставляет лоадер висеть* | `לא משאיר את הלועדר תקוע` | **Орфографическая ошибка** (`ע` вместо `א`). | `לא משאיר את ה-preloader תקוע` |
| **13** | `origin-coffee` `desc`, `seoTitle`, `body[1]`, `[3]` | *от ягоды до чашки*; *ягода, зерно* | `מהגרגר ועד לכוס`; `גרגר, פול` | `גרגר` = «зерно/крупинка», дублирует `פול` («кофейное зерно»). | `מפּרי הקפה ועד לכוס`; `פרי הקפה, פול` |
| **12** | `psb-consulting` `summary`, `body` | *готовые фирмы* / *отзывы* | `חברות מוכנות` / `ביקורות` | Рассинхрон с правильным термином из Блога ID 1/20. | `חברות מדף` / `המלצות` |
| **1, 2, 5, 6, 7, 12, 13** | Разные места | *Стек UI* / *Пайплайн* / кавычки `«...»` | `ערימת UI`, `מחסנית`, `צינור`, `«...»` | Системные кальки и русские кавычки в иврите. | `סטאק UI`, `סטאק טכנולוגי`, `פייפליין`, стандартные кавычки `"..."` |
| **5, 6** | `ai-audit-agent`, `ai-consultant` `body[1]–[4]` | Полные технические описания | Сокращённые абзацы (минус 40–50% инфо) | В иврите пропущена почти половина технических фактов по сравнению с RU/EN. | Доперевести опущенные пункты по русскому оригиналу. |

---

## 🇺🇸 4. Ошибки и русизмы в английском портфолио (EN vs RU)

| ID | Кейс / Место | Русский оригинал (RU) | Текущий английский (EN) | Диагностика | Рекомендованный английский (EN) |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `montblanc` `description` | *Интернет-магазин итальянских продуктов* | `Online store of italian quality products` | **`italian` с маленькой буквы** + неидиоматичный порядок слов. | `Online store for quality Italian products` |
| **2** | `pro-interior` `description`, `summary` | *Студия натяжных потолков «PRO Interior»* | `Stretch ceiling studio «PRO Interior»` / `suspended ceiling studio` | Русские ёлочки `«»`; **`suspended ceiling`** (подвесной) противоречит `stretch ceiling` (натяжной). | `PRO Interior Stretch Ceiling Studio` / `Landing page for a stretch ceiling studio` |
| **2** | `pro-interior` `body[1]–[5]` | *микроинтерфейсных*; *проверки ESLint*; *Бизнес-Эффект* | `micro-interface animations`; `ESLint code review`; `Results and Business Effect`; 10× `\u200b` | Кальки + невидимые символы из переводчика. | `micro-interaction animations`; `ESLint linting`; `Results and business impact` (и убрать `\u200b`) |
| **5** | `ai-audit-agent` `body[3]` | *экранирование `$` в `SMTP_PASS` для Compose (PIT-031)* | `SMTP dollars escaped in Compose (PIT-031)` | **Буквализм:** «доллары SMTP» вместо знака `$` + утечка внутреннего тикета `PIT-031`. | `Escaping $ signs in SMTP_PASS for Docker Compose` *(убрать внутренний код `PIT-031` в RU и EN)* |
| **6** | `ai-consultant` `subtitle`, `body[0],[4]` | *ТЗ*; *спорных IT-терминов* | `TZ briefs`; `contested IT terms` | Транслит `TZ` непонятен в EN; `contested` = «оспариваемые» (в Блоге ID 8 уже исправлено). | `project briefs` (или `technical specs`); `ambiguous IT terms` |
| **12** | `psb-consulting` `body[5]`, `[1]` | *Живой стенд на psb.erythro.ai*; *Нужен современный...* | `Live stand at psb.erythro.ai`; `Required a modern widescreen website...` | **Русизм `Live stand`**; обрывочное предложение без подлежащего. | `Live demo at psb.erythro.ai`; `The brief called for a modern widescreen website...` |
| **13** | `origin-coffee` `body[1]` | *Нужна атмосфера specialty-кофе...* | `Required a specialty coffee ambiance...` | Обрывочное предложение без подлежащего. | `The project called for a specialty coffee ambiance...` |
| **5, 6** | `relatedServiceLabel` | *ИИ и автоматизация* | `Ai & Automation` | Опечатка регистра аббревиатуры. | `AI & Automation` |
| **9, 11** | `la-scala`, `ember` | *в рублях*; *centre-cropped* | `roubles`; `centre-cropped` | UK-орфография на фоне US English на всём сайте. | `rubles`; `center-cropped` |

---

## 🇷🇺 5. Замечания к русскому оригиналу портфолио и системные нестыковки

1. **Утечка английского слова в RU (`mustang-6663rt`, `body[1]`):**
   - Сейчас: `а телефоны и visitors с уменьшенной анимацией получают статику`
   - Исправление: `а телефоны и посетители с включённой настройкой уменьшенной анимации получают статику`.
2. **Ошибочные ярлыки `highlights` в RU (`ember` `HL[4]`, `psb-consulting` `HL[3]`):**
   - Сейчас: `"CI"` → Исправление: `"Поставка"`.
3. **Противоречия между карточкой `performanceScores` и текстом `body` (во всех 3 локалях):**
   - **`la-scala`:** в `performanceScores` указано `Performance 92, Accessibility 100, BP 100, SEO 100`, в `body[4]` написано *«Публичный лабораторный балл здесь не приводится (HTTP 429)»*, а в Блоге ID 13 — `Performance 100 mobile / 95 desktop, Accessibility 97`.
   - **`mustang-6663rt`:** в `performanceScores` стоит `Performance 82`, а в `body[4]` написано *«без выдуманной цифры»*.
   - **`origin-coffee`:** в `performanceScores` стоит `Performance 87, Agent Browse 2/2`, в `body[1]` — *«Лабораторные баллы не выдумываем»*, а в Блоге ID 3 — `Performance 93, Agent View 3 из 3`.
   - **Рекомендация:** синхронизировать текст с актуальными замерами `performanceScores`.
4. **Двойной пробел в `ember` (`seoDescription.ru`):** `Стейкхаус  на Next.js` → `Стейкхаус на Next.js`.
5. **Опечатки и стиль в `pro-interior` (RU):** убрать англоязычный Title Case в заголовках секций (`Вызовы и Задачи Проекта` → `Вызовы и задачи проекта` и т.д.), `микроинтерфейсных` → `микроинтеракций`.
6. **Общий баг UI-виджета на `/blog` и `/portfolio` (HE):**
   - В ивритском UI по-прежнему отображается **`הזוחל`** («рептилия/пресмыкающееся») → заменить на **`הזחלן`** (веб-краулер).
7. **Унификация глоссария между Блогом и Портфолио:**
   - **Бренд:** выбрать единое написание — `Erythro.ai` или `Erythro AI`.
   - **Иврит «AI-аудит»:** в блоге преимущественно `ביקורת AI` (кроме ID 19 `אודיט`), а в портфолио — везде `אודיט AI חינמי לאתר`. Рекомендуется привести к одному варианту.
   - **Иврит «стек» и «пайплайн»:** везде `סטאק טכנולוגי` и `פייפליין` (вычистить все `ערימת UI`, `מחסנית`, `צינור`).
   - **Кавычки:** вычистить все русские кавычки-ёлочки `«...»` из английских и ивритских текстов.
