package ai.erythro;

final class A44Recommendations {

    private A44Recommendations() {}

    static String forCheck(String id, String status, String lang) {
        String s = status == null ? "" : status.toLowerCase();
        return switch (recKey(id)) {
            case "overflow" -> overflow(s, lang);
            case "rtl" -> rtl(s, lang);
            case "lead" -> lead(s, lang);
            case "llms" -> llms(s, lang);
            case "brand" -> brand(s, lang);
            case "robots" -> robots(s, lang);
            case "ga4" -> ga4(s, lang);
            case "content_signals" -> contentSignals(s, lang);
            case "markdown_neg" -> markdownNeg(s, lang);
            case "https" -> https(s, lang);
            case "runtime" -> runtime(s, lang);
            case "seo" -> seo(s, lang);
            case "a11y" -> a11y(s, lang);
            case "ttfb" -> ttfb(s, lang);
            case "agent" -> agent(s, lang);
            default -> "good".equals(s)
                    ? ReportFindingsCatalog.tr(lang,
                    "Результат в норме. Закрепите проверку в регрессии следующего релиза, чтобы статус не откатился.",
                    "This result is in good shape. Lock a regression check in the next release so the status does not slip.",
                    "התוצאה תקינה. נעלו בדיקת רגרסיה בריליס הבא כדי שהסטטוס לא ייסוג.")
                    : ReportFindingsCatalog.tr(lang,
                    "Сверьте результат с приоритетами Erythro.ai и закрепите регрессию в следующем релизе.",
                    "Match this result to Erythro.ai priorities and lock a regression check in the next release.",
                    "התאימו את התוצאה לסדרי העדיפויות של Erythro.ai ונעלו בדיקת רגרסיה בריליס הבא.");
        };
    }

    private static String recKey(String id) {
        if (id == null || id.isBlank()) {
            return "";
        }
        String k = id.toLowerCase();
        if ("overflow".equals(k)) {
            return "overflow";
        }
        if ("rtl".equals(k)) {
            return "rtl";
        }
        if ("lead".equals(k)) {
            return "lead";
        }
        if ("llms".equals(k)) {
            return "llms";
        }
        if ("brand".equals(k)) {
            return "brand";
        }
        if ("robots".equals(k)) {
            return "robots";
        }
        if ("ga4".equals(k)) {
            return "ga4";
        }
        if ("content_signals".equals(k)) {
            return "content_signals";
        }
        if ("markdown_neg".equals(k)) {
            return "markdown_neg";
        }
        if ("runtime".equals(k)) {
            return "runtime";
        }
        if ("https".equals(k)) {
            return "https";
        }
        if ("seo_og".equals(k) || (k.startsWith("locale_") && !"locale_he".equals(k) && !"locale_iw".equals(k))) {
            return "seo";
        }
        if ("locale_he".equals(k) || "locale_iw".equals(k)) {
            return "rtl";
        }
        if ("a11y".equals(k)) {
            return "a11y";
        }
        if ("ttfb".equals(k)) {
            return "ttfb";
        }
        if (k.startsWith("agent")) {
            return "agent";
        }
        return "";
    }

    static String lighthouse(String lang, String mobilePerf, String mobileLcp, String mobileFcp,
                             String desktopPerf, String desktopLcp) {
        return ReportFindingsCatalog.tr(lang,
                "Мобильный Lighthouse " + mobilePerf + "/100: FCP " + mobileFcp + ", LCP " + mobileLcp
                        + " (цель ≤ 2.5 s). Desktop " + desktopPerf + "/100, LCP " + desktopLcp + ".\n\n"
                        + "Приоритет Erythro.ai — довести Performance до 90+ и LCP < 2.5 s:\n"
                        + "- WebP/AVIF и preload для LCP-изображения\n"
                        + "- критический CSS, отложенный JS\n"
                        + "- CDN-кэш и сжатие на 4G\n\n"
                        + "Каждая секунда LCP на смартфоне сжигает рекламный бюджет Google Ads / Meta.",
                "Mobile Lighthouse " + mobilePerf + "/100: FCP " + mobileFcp + ", LCP " + mobileLcp
                        + " (target ≤ 2.5 s). Desktop " + desktopPerf + "/100, LCP " + desktopLcp + ".\n\n"
                        + "Erythro.ai priority — Performance 90+ and LCP < 2.5 s:\n"
                        + "- WebP/AVIF and preload for the LCP image\n"
                        + "- critical CSS, deferred JS\n"
                        + "- CDN cache and 4G compression\n\n"
                        + "Each extra second of mobile LCP burns Google Ads / Meta budget.",
                "Lighthouse מובייל " + mobilePerf + "/100: FCP " + mobileFcp + ", LCP " + mobileLcp
                        + " (יעד ≤ 2.5 s). Desktop " + desktopPerf + "/100, LCP " + desktopLcp + ".\n\n"
                        + "עדיפות Erythro.ai — Performance ל-90+ ו-LCP < 2.5 s:\n"
                        + "- WebP/AVIF ו-preload לתמונת LCP\n"
                        + "- CSS קריטי, JS דחוי\n"
                        + "- מטמון CDN ודחיסה ב-4G\n\n"
                        + "כל שנייה נוספת של LCP במובייל שורפת תקציב Google Ads / Meta.");
    }

    private static String overflow(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "Overflow-X в норме: 0px на 375px (iPhone SE).\n\n"
                            + "Закрепите регрессию мобильной сетки 375–430px в релизах: блоки, слайдеры и абсолютные элементы не должны выходить за viewport. Повторяйте замер на всех локалях.",
                    "Overflow-X is clean: 0px at 375px (iPhone SE).\n\n"
                            + "Lock a 375–430px grid regression in releases so blocks, sliders and absolute layers stay inside the viewport. Re-measure on every locale.",
                    "Overflow-X תקין: 0px ב-375px (iPhone SE).\n\n"
                            + "נעלו רגרסיית גריד 375–430px בריליסים: בלוקים, סליידרים ושכבות absolute לא ייצאו מה-viewport. מדדו שוב בכל שפה.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Адаптивная переверстка под 375–430px и регрессионные проверки мобильной сетки от Erythro.ai.",
                "Responsive reflow for 375–430px and mobile grid regression checks by Erythro.ai.",
                "ריספונסיב ל-375–430px ובדיקות רגרסיה מובייל מ-Erythro.ai.");
    }

    private static String rtl(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "RTL заявлен корректно. Сохраните dir=\"rtl\" на html/lang=he и зеркалирование меню, слайдеров и форм при следующих релизах.",
                    "RTL is declared correctly. Keep html dir=\"rtl\" / lang=he and mirrored menus, sliders and forms in future releases.",
                    "RTL מוצהר נכון. שמרו html dir=\"rtl\" / lang=he ושיקוף תפריטים, סליידרים וטפסים בריליסים הבאים.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Полноценная RTL-адаптация верстки, меню и слайдеров под израильский рынок от Erythro.ai.\n\n"
                        + "На локали he документ остаётся LTR. Нужно:\n"
                        + "- html lang=\"he\" dir=\"rtl\"\n"
                        + "- зеркалирование навигации, слайдеров, форм и отступов\n"
                        + "- text-align и иконки «назад/вперёд» по направлению чтения\n\n"
                        + "<html lang=\"he\" dir=\"rtl\">",
                "Full RTL adaptation of layout, menus and sliders for Israel by Erythro.ai.\n\n"
                        + "Locale he is still LTR. Required:\n"
                        + "- html lang=\"he\" dir=\"rtl\"\n"
                        + "- mirrored navigation, sliders, forms and spacing\n"
                        + "- text-align and back/forward icons following reading direction\n\n"
                        + "<html lang=\"he\" dir=\"rtl\">",
                "התאמת RTL מלאה לפריסה, תפריטים וסליידרים לישראל מ-Erythro.ai.\n\n"
                        + "ב-he המסמך נשאר LTR. נדרש:\n"
                        + "- html lang=\"he\" dir=\"rtl\"\n"
                        + "- שיקוף ניווט, סליידרים, טפסים ומרווחים\n"
                        + "- text-align ואייקוני קדימה/אחורה לפי כיוון הקריאה\n\n"
                        + "<html lang=\"he\" dir=\"rtl\">");
    }

    private static String lead(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "Лид-захват в норме: форма, антиспам и мгновенный канал на месте.\n\n"
                            + "Не убирайте honeypot, Turnstile/reCAPTCHA и wa.me (или чат) в следующих релизах — без них растёт спам и теряются заявки с мобильных.",
                    "Lead capture is in place: form, anti-spam and an instant channel.\n\n"
                            + "Do not drop the honeypot, Turnstile/reCAPTCHA or wa.me (or chat) in the next release — spam rises and mobile leads disappear.",
                    "לכידת לידים תקינה: טופס, אנטי-ספאם וערוץ מיידי במקום.\n\n"
                            + "אל תסירו honeypot, Turnstile/reCAPTCHA או wa.me (או צ'אט) בריליס הבא — הספאם עולה ולידים מהמובייל נעלמים.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Подключите Cloudflare Turnstile и AI-фильтрацию заявок Erythro.ai до попадания лида в CRM.\n\n"
                        + "Добавьте honeypot-поле и кнопку wa.me на ключевых страницах воронки, если нет чата или мессенджера.",
                "Add Cloudflare Turnstile and Erythro.ai AI lead filtering before CRM.\n\n"
                        + "Add a honeypot field and a wa.me button on key funnel pages if there is no chat or messenger.",
                "חברו Cloudflare Turnstile וסינון AI של Erythro.ai לפני CRM.\n\n"
                        + "הוסיפו honeypot וכפתור wa.me בדפי משפך מרכזיים אם אין צ'אט או מסנג'ר.");
    }

    private static String llms(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "/llms.txt и MCP discovery проходят. Держите манифест JSON (mcp_version + endpoints) на /.well-known/mcp — не отдавайте HTML на эти URL.",
                    "/llms.txt and MCP discovery pass. Keep a JSON manifest (mcp_version + endpoints) at /.well-known/mcp — do not serve HTML on those URLs.",
                    "/llms.txt ו-MCP discovery עוברים. שמרו מניפסט JSON (mcp_version + endpoints) ב-/.well-known/mcp — אל תגישו HTML בכתובות האלה.");
        }
        return ReportFindingsCatalog.tr(lang,
                "/llms.txt проходит проверку. GET /.well-known/mcp должен возвращать JSON:\n\n"
                        + "{\n"
                        + "  \"mcp_version\": \"0.1\",\n"
                        + "  \"name\": \"Brand\",\n"
                        + "  \"url\": \"https://example.com/\",\n"
                        + "  \"endpoints\": { \"sse\": \"https://example.com/api/mcp\" }\n"
                        + "}",
                "/llms.txt passes. GET /.well-known/mcp must return JSON:\n\n"
                        + "{\n"
                        + "  \"mcp_version\": \"0.1\",\n"
                        + "  \"name\": \"Brand\",\n"
                        + "  \"url\": \"https://example.com/\",\n"
                        + "  \"endpoints\": { \"sse\": \"https://example.com/api/mcp\" }\n"
                        + "}",
                "/llms.txt עובר. GET /.well-known/mcp צריך להחזיר JSON:\n\n"
                        + "{\n"
                        + "  \"mcp_version\": \"0.1\",\n"
                        + "  \"name\": \"Brand\",\n"
                        + "  \"url\": \"https://example.com/\",\n"
                        + "  \"endpoints\": { \"sse\": \"https://example.com/api/mcp\" }\n"
                        + "}");
    }

    private static String brand(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "JSON-LD Organization и /about на месте. Сохраните name, url, sameAs и contactPoint при правках шаблона — без них ассистенты путают бренд.",
                    "JSON-LD Organization and /about are in place. Keep name, url, sameAs and contactPoint when editing the template — assistants confuse the brand without them.",
                    "JSON-LD Organization ו-/about במקום. שמרו name, url, sameAs ו-contactPoint בעריכת התבנית — בלי זה עוזרים מבלבלים את המותג.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Опубликуйте /about с фактами бренда и контактами.\n\n"
                        + "JSON-LD Organization / LocalBusiness: name, url, sameAs, contactPoint.",
                "Publish /about with brand facts and contacts.\n\n"
                        + "JSON-LD Organization / LocalBusiness: name, url, sameAs, contactPoint.",
                "פרסמו /about עם עובדות מותג ופרטי קשר.\n\n"
                        + "JSON-LD Organization / LocalBusiness: name, url, sameAs, contactPoint.");
    }

    private static String robots(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "AI-боты в Allow, robots.txt и sitemap.xml на 200 OK.\n\n"
                            + "Не включайте Cloudflare Managed robots.txt с Disallow: / — это severe_block для GPTBot и соседей.",
                    "AI crawlers are Allow, robots.txt and sitemap.xml return 200.\n\n"
                            + "Do not turn on Cloudflare Managed robots.txt with Disallow: / — that is a severe_block for GPTBot and peers.",
                    "בוטי AI ב-Allow, robots.txt ו-sitemap.xml על 200.\n\n"
                            + "אל תפעילו Cloudflare Managed robots.txt עם Disallow: / — זה severe_block ל-GPTBot ולשאר.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Не закрывайте корень Disallow: / для GPTBot, ClaudeBot, CCBot и Google-Extended — это severe_block для AI Visibility.\n"
                        + "Держите robots.txt и sitemap.xml на 200 OK.",
                "Do not add Disallow: / for GPTBot, ClaudeBot, CCBot or Google-Extended — that is a severe_block for AI Visibility.\n"
                        + "Keep robots.txt and sitemap.xml at 200 OK.",
                "אל תסגרו Disallow: / ל-GPTBot, ClaudeBot, CCBot ו-Google-Extended — זה severe_block לנראות AI.\n"
                        + "שמרו robots.txt ו-sitemap.xml על 200 OK.");
    }

    private static String ga4(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "dataLayer и Consent Mode stub уже в <head>. Не переносите gtag('consent','default') ниже баннера cookies — иначе Google не зафиксирует согласие.",
                    "dataLayer and the Consent Mode stub are already in <head>. Do not move gtag('consent','default') below the cookie banner — Google will miss consent.",
                    "dataLayer ו-Consent Mode stub כבר ב-<head>. אל תעבירו gtag('consent','default') מתחת לבאנר העוגיות — Google לא יתפוס הסכמה.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Добавьте Consent Mode stub в <head> до баннера cookies:\n\n"
                        + "window.dataLayer = window.dataLayer || [];\n"
                        + "function gtag(){dataLayer.push(arguments);}\n"
                        + "gtag('consent', 'default', {\n"
                        + "  ad_storage: 'denied',\n"
                        + "  analytics_storage: 'denied'\n"
                        + "});",
                "Add a Consent Mode stub in <head> before the cookie banner:\n\n"
                        + "window.dataLayer = window.dataLayer || [];\n"
                        + "function gtag(){dataLayer.push(arguments);}\n"
                        + "gtag('consent', 'default', {\n"
                        + "  ad_storage: 'denied',\n"
                        + "  analytics_storage: 'denied'\n"
                        + "});",
                "הוסיפו Consent Mode stub ב-<head> לפני באנר העוגיות:\n\n"
                        + "window.dataLayer = window.dataLayer || [];\n"
                        + "function gtag(){dataLayer.push(arguments);}\n"
                        + "gtag('consent', 'default', {\n"
                        + "  ad_storage: 'denied',\n"
                        + "  analytics_storage: 'denied'\n"
                        + "});");
    }

    private static String contentSignals(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "Content-Signal задан: агенты понимают, можно ли цитировать сайт в ответах и нельзя ли обучать модель.\n\n"
                            + "Не включайте Cloudflare Managed robots.txt — он затирает директиву.",
                    "Content-Signal is set: agents know whether they may cite the site in answers vs train on it.\n\n"
                            + "Keep Cloudflare Managed robots.txt off — it strips the directive.",
                    "Content-Signal מוגדר: סוכנים יודעים אם לצטט באתר בתשובות או לאמן עליו.\n\n"
                            + "השאירו Cloudflare Managed robots.txt כבוי — הוא מוחק את ההנחיה.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Добавьте в robots.txt директиву Content-Signal (contentsignals.org):\n\n"
                        + "Content-Signal: search=yes, ai-input=yes, ai-train=no\n\n"
                        + "Без неё ChatGPT и Perplexity не знают, можно ли цитировать бренд в ответах или кормить модель — чаще просто пропускают сайт.",
                "Add a Content-Signal directive to robots.txt (contentsignals.org):\n\n"
                        + "Content-Signal: search=yes, ai-input=yes, ai-train=no\n\n"
                        + "Without it ChatGPT and Perplexity cannot tell cite-in-answers from train-the-model — they usually skip the site.",
                "הוסיפו ל-robots.txt הנחיית Content-Signal (contentsignals.org):\n\n"
                        + "Content-Signal: search=yes, ai-input=yes, ai-train=no\n\n"
                        + "בלי זה ChatGPT ו-Perplexity לא יודעים אם לצטט את המותג או לאמן את המודל — בדרך כלל מדלגים על האתר.");
    }

    private static String markdownNeg(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "Markdown negotiation работает: та же URL отдаёт text/markdown по Accept и HTML браузеру.\n\n"
                            + "Держите Vary: Accept на CDN, иначе кэш смешает форматы.",
                    "Markdown negotiation works: the same URL serves text/markdown on Accept and HTML to browsers.\n\n"
                            + "Keep Vary: Accept on the CDN or cache will mix formats.",
                    "Markdown negotiation עובד: אותו URL מחזיר text/markdown לפי Accept ו-HTML לדפדפן.\n\n"
                            + "שמרו Vary: Accept ב-CDN, אחרת המטמון יערבב פורמטים.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Отдавайте text/markdown по Accept: text/markdown с той же URL, что HTML (не обязательно *.md).\n\n"
                        + "Без этого ChatGPT и Perplexity тянут HTML+JS, путают бренд и сжигают токены. Добавьте Sitemap: в robots.txt с валидным XML и <loc>.",
                "Serve text/markdown on Accept: text/markdown at the same URL as HTML (no *.md suffix required).\n\n"
                        + "Without this ChatGPT and Perplexity fetch HTML+JS, confuse the brand and burn tokens. Add Sitemap: in robots.txt with valid XML and <loc>.",
                "הגישו text/markdown לפי Accept: text/markdown באותו URL כמו HTML (אין חובה ל-*.md).\n\n"
                        + "בלי זה ChatGPT ו-Perplexity מושכים HTML+JS, מבלבלים את המותג ושורפים טוקנים. הוסיפו Sitemap: ב-robots.txt עם XML תקין ו-<loc>.");
    }

    private static String https(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "HTTPS и security headers на месте. Не снимайте HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy и Permissions-Policy при деплое.",
                    "HTTPS and security headers are in place. Do not drop HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy or Permissions-Policy on deploy.",
                    "HTTPS וכותרות אבטחה במקום. אל תסירו HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy או Permissions-Policy בפריסה.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Добавьте недостающие заголовки:\n\n"
                        + "Content-Security-Policy: default-src 'self'\n"
                        + "X-Frame-Options: SAMEORIGIN\n"
                        + "Referrer-Policy: strict-origin-when-cross-origin\n"
                        + "Permissions-Policy: camera=(), microphone=(), geolocation=()",
                "Add the missing headers:\n\n"
                        + "Content-Security-Policy: default-src 'self'\n"
                        + "X-Frame-Options: SAMEORIGIN\n"
                        + "Referrer-Policy: strict-origin-when-cross-origin\n"
                        + "Permissions-Policy: camera=(), microphone=(), geolocation=()",
                "הוסיפו את הכותרות החסרות:\n\n"
                        + "Content-Security-Policy: default-src 'self'\n"
                        + "X-Frame-Options: SAMEORIGIN\n"
                        + "Referrer-Policy: strict-origin-when-cross-origin\n"
                        + "Permissions-Policy: camera=(), microphone=(), geolocation=()");
    }

    private static String runtime(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "Рантайм стабилен: нет PageError и ответов 4xx/5xx на просмотренных URL.\n\n"
                            + "Оставьте мониторинг console / PageError на воронке, чтобы регресс не дошёл до рекламного трафика.",
                    "Runtime is stable: no PageError or 4xx/5xx on visited URLs.\n\n"
                            + "Keep console / PageError monitoring on the funnel so a regression never hits paid traffic.",
                    "הריצה יציבה: אין PageError או 4xx/5xx ב-URL שנבדקו.\n\n"
                            + "השאירו ניטור console / PageError במשפך כדי שרגרסיה לא תגיע לטראפיק ממומן.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Аудит и исправление фронтенд-ошибок, покрытие критичных сценариев автотестами Playwright от Erythro.ai.",
                "Frontend fixes and Playwright coverage for critical flows by Erythro.ai.",
                "תיקון פרונטאנד ובדיקות Playwright לזרימות קריטיות מ-Erythro.ai.");
    }

    private static String seo(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "Мета и превью этой проверки в норме. Сохраните уникальные title/description, og:image и html lang при контентных правках.",
                    "Meta and previews for this check are in place. Keep unique title/description, og:image and html lang when content changes.",
                    "מטא ותצוגות מקדימות של הבדיקה תקינים. שמרו title/description ייחודיים, og:image ו-html lang בשינויי תוכן.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Закройте превью в WhatsApp/Telegram/LinkedIn: уникальные title и description на каждой локали, og:image 1200×630, canonical и hreflang между языками.\n\n"
                        + "html lang должен совпадать с языком страницы.",
                "Lock messenger previews: unique title and description per locale, og:image 1200×630, canonical and hreflang between languages.\n\n"
                        + "html lang must match the page language.",
                "סגרו תצוגה מקדימה ב-WhatsApp/Telegram/LinkedIn: title ו-description לכל שפה, og:image 1200×630, canonical ו-hreflang.\n\n"
                        + "html lang חייב להתאים לשפת העמוד.");
    }

    private static String a11y(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "axe-core и разметка проходят WCAG 2.1 AA / IS 5568. Не выкатывайте информативные img без alt и кнопки-иконки без aria-label.",
                    "axe-core and markup meet WCAG 2.1 AA / IS 5568. Do not ship informative images without alt or icon buttons without aria-label.",
                    "axe-core והסימון עומדים ב-WCAG 2.1 AA / IS 5568. אל תפרסמו img משמעותי בלי alt או כפתור-אייקון בלי aria-label.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Закройте WCAG 2.1 AA и IS 5568: alt у всех информативных img, aria-label у кнопок-иконок, контраст и фокус.\n\n"
                        + "Повторяйте axe-core на 375px перед релизом.",
                "Close WCAG 2.1 AA and IS 5568: alt on informative images, aria-label on icon buttons, contrast and focus.\n\n"
                        + "Re-run axe-core at 375px before release.",
                "סגרו WCAG 2.1 AA ו-IS 5568: alt לכל img משמעותי, aria-label לכפתורי-אייקון, ניגודיות ופוקוס.\n\n"
                        + "הריצו axe-core ב-375px לפני ריליס.");
    }

    private static String ttfb(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "TTFB в целевом диапазоне. Держите CDN и тёплый origin, чтобы первый байт не вырос после релиза.",
                    "TTFB is in the target range. Keep the CDN and a warm origin so the first byte does not grow after a release.",
                    "TTFB בטווח היעד. שמרו CDN ו-origin חם כדי שהבייט הראשון לא יעלה אחרי ריליס.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Цель TTFB ≤ 800 ms на 4G: CDN, edge-кэш HTML, сжатие и тёплый origin.\n\n"
                        + "Медленный первый байт сжигает рекламный бюджет ещё до LCP.",
                "Target TTFB ≤ 800 ms on 4G: CDN, HTML edge cache, compression and a warm origin.\n\n"
                        + "A slow first byte burns ad budget before LCP.",
                "יעד TTFB ≤ 800 ms ב-4G: CDN, מטמון HTML בקצה, דחיסה ו-origin חם.\n\n"
                        + "בייט ראשון איטי שורף תקציב פרסום עוד לפני LCP.");
    }

    private static String agent(String status, String lang) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "Страница воронки живая: HTTP 200, CTA или форма на месте.\n\n"
                            + "Не убирайте кнопку заявки / WhatsApp в следующих релизах. Меню оставляйте только на существующие URL.",
                    "This funnel page is live: HTTP 200, CTA or form in place.\n\n"
                            + "Do not remove the lead / WhatsApp button in the next release. Keep menu links on real URLs only.",
                    "דף המשפך חי: HTTP 200, CTA או טופס במקום.\n\n"
                            + "אל תסירו את כפתור הפנייה / WhatsApp בריליס הבא. השאירו קישורי תפריט רק ל-URL קיימים.");
        }
        if ("warn".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "На этой коммерческой странице нет CTA и формы. Поставьте кнопку заявки, wa.me или форму захвата — иначе пользователь уходит в меню наугад.",
                    "This commercial page has no CTA and no form. Add a lead button, wa.me or a capture form — otherwise the visitor leaves through the menu.",
                    "בדף המסחרי הזה אין CTA ואין טופס. שימו כפתור פנייה, wa.me או טופס — אחרת המבקר יוצא דרך התפריט.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Почините этот URL воронки (редирект 301 или восстановление страницы).\n\n"
                        + "Меню не должно вести в soft-404: это прямая потеря заявки.",
                "Fix this funnel URL (301 or restore the page).\n\n"
                        + "The menu must not land on a soft-404 — that is a lost lead.",
                "תקנו את ה-URL הזה במשפך (301 או שחזור עמוד).\n\n"
                        + "התפריט לא יוביל ל-soft-404: זו אובדן ליד ישיר.");
    }
}
