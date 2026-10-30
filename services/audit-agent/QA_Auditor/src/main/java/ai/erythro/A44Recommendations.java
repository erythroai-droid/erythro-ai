package ai.erythro;

final class A44Recommendations {

    private A44Recommendations() {}

    static String forCheck(String id, String status, String lang) {
        return forCheck(id, status, lang, null);
    }

    /** {@code variant}: the case inside the check (lead: no_form / unprotected / form_fields), null if unknown. */
    static String forCheck(String id, String status, String lang, String variant) {
        String s = status == null ? "" : status.toLowerCase();
        // Locale rows carry their cause: the text must answer it, not default to the RTL or SEO text
        if (id != null && id.startsWith("locale_") && variant != null && !variant.isBlank() && !"good".equals(s)) {
            String code = id.substring("locale_".length()).toUpperCase();
            switch (variant) {
                case "dir": return rtl(s, lang);
                case "overflow": return overflow(s, lang);
                case "lang": return ReportFindingsCatalog.tr(lang,
                        "html lang главной не совпадает с этой языковой версией (" + code + "). Укажите правильный lang "
                                + "в <html>, иначе поисковики и экранные чтецы считают страницу другим языком.",
                        "The homepage html lang does not match this language version (" + code + "). Set the right lang "
                                + "on <html>, or search engines and screen readers treat the page as another language.",
                        "html lang של עמוד הבית לא תואם לגרסת השפה הזו (" + code + "). הגדירו lang נכון "
                                + "ב-<html>, אחרת מנועי חיפוש וקוראי מסך מתייחסים לדף כשפה אחרת.");
                case "forms": return ReportFindingsCatalog.tr(lang,
                        "На главной этой версии (" + code + ") и на страницах воронки нет лид-формы. Добавьте короткую форму "
                                + "(имя, телефон, отправка) или заметную кнопку, которая её открывает.",
                        "Neither this version's homepage (" + code + ") nor the funnel pages have a lead form. Add a short form "
                                + "(name, phone, submit) or a visible button that opens one.",
                        "לא בעמוד הבית של הגרסה הזו (" + code + ") ולא בדפי המשפך יש טופס ליד. הוסיפו טופס קצר "
                                + "(שם, טלפון, שליחה) או כפתור בולט שפותח אותו.");
                default: break;
            }
        }
        return switch (recKey(id)) {
            case "overflow" -> overflow(s, lang);
            case "rtl" -> rtl(s, lang);
            case "lead" -> lead(s, lang, variant);
            case "llms" -> llms(s, lang);
            case "brand" -> brand(s, lang);
            case "robots" -> robots(s, lang);
            case "ga4" -> ga4(s, lang);
            case "content_signals" -> contentSignals(s, lang);
            case "markdown_neg" -> markdownNeg(s, lang);
            case "https" -> https(s, lang, variant);
            case "runtime" -> runtime(s, lang, variant);
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

    private static String lead(String status, String lang, String variant) {
        if ("entry".equals(variant)) {
            return ReportFindingsCatalog.tr(lang,
                    "Форма запуска ведёт посетителя к шагу, где он оставляет контакт (регистрация или вход). Защищать от ботов нужно этот шаг: "
                            + "Cloudflare Turnstile, reCAPTCHA или вход через Google / Apple.\n\n"
                            + "Убедитесь, что сервис не запускается до этого шага — иначе боты тратят ваши ресурсы без регистрации.",
                    "The start form leads the visitor to the step where they leave a contact (sign-up or sign-in). That step is the one to protect from bots: "
                            + "Cloudflare Turnstile, reCAPTCHA or Google / Apple sign-in.\n\n"
                            + "Make sure the service does not run before that step, or bots spend your resources without signing up.",
                    "טופס ההפעלה מוביל את המבקר לשלב שבו הוא משאיר פרטי קשר (הרשמה או התחברות). את השלב הזה צריך להגן מבוטים: "
                            + "Cloudflare Turnstile, ‏reCAPTCHA או התחברות עם Google / Apple.\n\n"
                            + "ודאו שהשירות לא מופעל לפני השלב הזה — אחרת בוטים מנצלים את המשאבים שלכם בלי להירשם.");
        }
        // Diagnostic/Pro submitted the start form and judged the step behind it
        if ("entry_protected".equals(variant)) {
            return ReportFindingsCatalog.tr(lang,
                    "Шаг с контактом после формы запуска защищён (антиспам или вход через Google / Apple).\n\n"
                            + "Не убирайте эту защиту в следующих релизах и не запускайте сервис до этого шага.",
                    "The contact step after the start form is protected (anti-spam or Google / Apple sign-in).\n\n"
                            + "Keep that protection in the next releases and do not run the service before that step.",
                    "שלב פרטי הקשר אחרי טופס ההפעלה מוגן (אנטי-ספאם או התחברות עם Google / Apple).\n\n"
                            + "שמרו על ההגנה הזו בריליסים הבאים ואל תריצו את השירות לפני השלב הזה.");
        }
        if ("entry_unprotected".equals(variant)) {
            return ReportFindingsCatalog.tr(lang,
                    "Шаг с контактом после формы запуска (регистрация, вход или форма) открыт для ботов. Добавьте на него Cloudflare Turnstile "
                            + "или вход через Google / Apple; для регистрации — подтверждение email до первого запуска сервиса.",
                    "The contact step after the start form (sign-up, sign-in or a form) is open to bots. Add Cloudflare Turnstile "
                            + "or Google / Apple sign-in to it; for sign-up, confirm the email before the service's first run.",
                    "שלב פרטי הקשר אחרי טופס ההפעלה (הרשמה, התחברות או טופס) פתוח לבוטים. הוסיפו לו Cloudflare Turnstile "
                            + "או התחברות עם Google / Apple; בהרשמה — אימות email לפני ההרצה הראשונה של השירות.");
        }
        if ("entry_started".equals(variant)) {
            return ReportFindingsCatalog.tr(lang,
                    "Форма запуска сразу запускает сервис — без регистрации и контакта. Поставьте Cloudflare Turnstile на форму "
                            + "и просите email (или вход через Google / Apple) до запуска: так боты не тратят ресурсы, а посетитель оставляет контакт.",
                    "The start form runs the service at once, with no sign-up or contact. Put Cloudflare Turnstile on the form "
                            + "and ask for an email (or Google / Apple sign-in) before the run: bots stop spending resources and the visitor leaves a contact.",
                    "טופס ההפעלה מריץ את השירות מיד, בלי הרשמה ובלי פרטי קשר. הוסיפו Cloudflare Turnstile לטופס "
                            + "ובקשו email (או התחברות עם Google / Apple) לפני ההרצה: כך בוטים לא מנצלים משאבים והמבקר משאיר פרטי קשר.");
        }
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "Лид-захват в норме: форма, антиспам и мгновенный канал на месте.\n\n"
                            + "Не убирайте honeypot, Turnstile/reCAPTCHA и wa.me (или чат) в следующих релизах — без них растёт спам и теряются заявки с мобильных.",
                    "Lead capture is in place: form, anti-spam and an instant channel.\n\n"
                            + "Do not drop the honeypot, Turnstile/reCAPTCHA or wa.me (or chat) in the next release — spam rises and mobile leads disappear.",
                    "לכידת לידים תקינה: טופס, אנטי-ספאם וערוץ מיידי במקום.\n\n"
                            + "אל תסירו honeypot, Turnstile/reCAPTCHA או wa.me (או צ'אט) בריליס הבא — הספאם עולה ולידים מהמובייל נעלמים.");
        }
        if ("no_form".equals(variant)) {
            return "warn".equals(status)
                    ? ReportFindingsCatalog.tr(lang,
                    "Формы нет: заявки идут только через мессенджер или чат. Добавьте короткую лид-форму (имя, телефон, отправка) рядом с кнопкой — "
                            + "часть посетителей не пишет в мессенджер, а форма даёт заявку с контактом прямо в CRM.\n\n"
                            + "Сразу защитите форму Cloudflare Turnstile или honeypot.",
                    "No form: leads come only through a messenger or chat. Add a short lead form (name, phone, submit) next to the button — "
                            + "some visitors never message, and a form sends a lead with contact details straight to CRM.\n\n"
                            + "Protect the form with Cloudflare Turnstile or a honeypot from day one.",
                    "אין טופס: פניות מגיעות רק במסנג׳ר או בצ׳אט. הוסיפו טופס ליד קצר (שם, טלפון, שליחה) ליד הכפתור — "
                            + "חלק מהמבקרים לא כותבים במסנג׳ר, וטופס מעביר ליד עם פרטי קשר ישר ל-CRM.\n\n"
                            + "הגנו על הטופס מהיום הראשון עם Cloudflare Turnstile או honeypot.")
                    : ReportFindingsCatalog.tr(lang,
                    "На странице нет ни формы, ни мессенджера: посетителю некуда оставить заявку. "
                            + "Добавьте короткую лид-форму (имя, телефон, отправка) и кнопку wa.me или чат.\n\n"
                            + "Сразу защитите форму Cloudflare Turnstile или honeypot.",
                    "The page has no form and no messenger: a visitor has nowhere to leave a lead. "
                            + "Add a short lead form (name, phone, submit) and a wa.me button or chat.\n\n"
                            + "Protect the form with Cloudflare Turnstile or a honeypot from day one.",
                    "בעמוד אין טופס ואין מסנג׳ר: למבקר אין איפה להשאיר פנייה. "
                            + "הוסיפו טופס ליד קצר (שם, טלפון, שליחה) וכפתור wa.me או צ׳אט.\n\n"
                            + "הגנו על הטופס מהיום הראשון עם Cloudflare Turnstile או honeypot.");
        }
        if ("unprotected".equals(variant)) {
            return ReportFindingsCatalog.tr(lang,
                    "Форма есть, но без антиспама. Защитите её Cloudflare Turnstile или honeypot и подключите AI-фильтрацию заявок Erythro.ai до CRM.",
                    "The form has no anti-spam. Protect it with Cloudflare Turnstile or a honeypot and add Erythro.ai AI lead filtering before CRM.",
                    "יש טופס, אבל בלי אנטי-ספאם. הגנו עליו עם Cloudflare Turnstile או honeypot וחברו סינון AI של Erythro.ai לפני CRM.");
        }
        if ("form_fields".equals(variant)) {
            return ReportFindingsCatalog.tr(lang,
                    "Форма защищена, но в ней нет поля email или телефона либо кнопки отправки. Добавьте контактное поле и явную кнопку отправки — иначе заявку не с чем обработать.",
                    "The form is protected but lacks an email or phone field, or a submit button. Add a contact field and a clear submit button, otherwise there is nothing to follow up.",
                    "הטופס מוגן, אבל חסר בו שדה אימייל או טלפון או כפתור שליחה. הוסיפו שדה קשר וכפתור שליחה ברור — אחרת אין עם מה לחזור לפונה.");
        }
        // Unknown case (old rows without rec_variant): the text must fit both "no form" and "form without anti-spam"
        return ReportFindingsCatalog.tr(lang,
                "Если формы нет — добавьте короткую лид-форму (имя, телефон, отправка) и кнопку wa.me или чат.\n\n"
                        + "Если форма есть — защитите её Cloudflare Turnstile или honeypot и подключите AI-фильтрацию заявок Erythro.ai до CRM.",
                "No form: add a short lead form (name, phone, submit) and a wa.me button or chat.\n\n"
                        + "Form in place: protect it with Cloudflare Turnstile or a honeypot and add Erythro.ai AI lead filtering before CRM.",
                "אין טופס — הוסיפו טופס ליד קצר (שם, טלפון, שליחה) וכפתור wa.me או צ'אט.\n\n"
                        + "יש טופס — הגנו עליו עם Cloudflare Turnstile או honeypot וחברו סינון AI של Erythro.ai לפני CRM.");
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
                    // No "in <head>" claim: the default may come from an app bundle or a consent plugin (MI-003)
                    "dataLayer и Consent Mode по умолчанию уже заданы. Не переносите gtag('consent','default') ниже баннера cookies — иначе Google не зафиксирует согласие.",
                    "dataLayer and the Consent Mode default are already set. Do not move gtag('consent','default') below the cookie banner — Google will miss consent.",
                    "dataLayer וברירת המחדל של Consent Mode כבר מוגדרים. אל תעבירו gtag('consent','default') מתחת לבאנר העוגיות — Google לא יתפוס הסכמה.");
        }
        return ReportFindingsCatalog.tr(lang,
                "Задайте Consent Mode по умолчанию в <head> до баннера cookies:\n\n"
                        + "window.dataLayer = window.dataLayer || [];\n"
                        + "function gtag(){dataLayer.push(arguments);}\n"
                        + "gtag('consent', 'default', {\n"
                        + "  ad_storage: 'denied',\n"
                        + "  analytics_storage: 'denied'\n"
                        + "});",
                "Set the Consent Mode default in <head> before the cookie banner:\n\n"
                        + "window.dataLayer = window.dataLayer || [];\n"
                        + "function gtag(){dataLayer.push(arguments);}\n"
                        + "gtag('consent', 'default', {\n"
                        + "  ad_storage: 'denied',\n"
                        + "  analytics_storage: 'denied'\n"
                        + "});",
                "הגדירו ברירת מחדל ל-Consent Mode ב-<head> לפני באנר העוגיות:\n\n"
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

    // Safe starting values: a strict CSP (default-src 'self') breaks third-party scripts, and HSTS
    // preload is a one-way commitment, so neither is suggested blindly
    private static final java.util.Map<String, String> HEADER_LINES = java.util.Map.of(
            "HSTS", "Strict-Transport-Security: max-age=63072000; includeSubDomains",
            "CSP", "Content-Security-Policy: frame-ancestors 'self'",
            "X-Frame-Options", "X-Frame-Options: SAMEORIGIN",
            "X-Content-Type-Options", "X-Content-Type-Options: nosniff",
            "Referrer-Policy", "Referrer-Policy: strict-origin-when-cross-origin",
            "Permissions-Policy", "Permissions-Policy: camera=(), microphone=(), geolocation=()");
    private static final java.util.List<String> HEADER_ORDER = java.util.List.of(
            "HSTS", "CSP", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy");

    /** {@code missing}: comma-joined labels of the absent headers; null for rows without the list. */
    private static String https(String status, String lang, String missing) {
        if ("good".equals(status)) {
            return ReportFindingsCatalog.tr(lang,
                    "HTTPS и security headers на месте. Не снимайте HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy и Permissions-Policy при деплое.",
                    "HTTPS and security headers are in place. Do not drop HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy or Permissions-Policy on deploy.",
                    "HTTPS וכותרות אבטחה במקום. אל תסירו HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy או Permissions-Policy בפריסה.");
        }
        java.util.List<String> absent = missing == null || missing.isBlank()
                ? HEADER_ORDER
                : HEADER_ORDER.stream().filter(h -> java.util.Arrays.asList(missing.split(",")).contains(h)).toList();
        if (absent.isEmpty()) {
            absent = HEADER_ORDER;
        }
        StringBuilder lines = new StringBuilder();
        for (String h : absent) {
            lines.append('\n').append(HEADER_LINES.get(h));
        }
        String cspNote = absent.contains("CSP")
                ? ReportFindingsCatalog.tr(lang,
                "\n\nПолную Content-Security-Policy собирают под сайт после проверки всех скриптов; frame-ancestors можно включить сразу.",
                "\n\nA full Content-Security-Policy is built per site after reviewing every script; frame-ancestors is safe to enable now.",
                "\n\nContent-Security-Policy מלאה נבנית לפי האתר אחרי בדיקת כל הסקריפטים; את frame-ancestors אפשר להפעיל כבר עכשיו.")
                : "";
        return ReportFindingsCatalog.tr(lang,
                "Добавьте недостающие заголовки (сервер, CDN или панель хостинга):\n",
                "Add the missing headers (server, CDN or hosting panel):\n",
                "הוסיפו את הכותרות החסרות (שרת, CDN או לוח הבקרה של האחסון):\n")
                + lines + cspNote;
    }

    /** {@code failed}: "status url" lines of the failing requests (Pro); null/blank for Free and old rows. */
    private static String runtime(String status, String lang, String failed) {
        if (!"good".equals(status) && failed != null && !failed.isBlank()) {
            return ReportFindingsCatalog.tr(lang,
                    "Запросы с ошибкой:\n" + failed + "\n\n"
                            + "Свой файл — верните его или поправьте ссылку. Сторонний ресурс (CDN, шрифт, скрипт) с 403/404 — "
                            + "замените ссылку на рабочую или отдавайте файл со своего сервера. После правки проверьте, что в консоли браузера нет ошибок.",
                    "Failing requests:\n" + failed + "\n\n"
                            + "Your own file: restore it or fix the link. A third-party resource (CDN, font, script) returning 403/404: "
                            + "point to a working URL or serve the file from your server. Then check the browser console is clean.",
                    "בקשות שנכשלו:\n" + failed + "\n\n"
                            + "קובץ שלכם — החזירו אותו או תקנו את הקישור. משאב חיצוני (CDN, גופן, סקריפט) שמחזיר 403/404 — "
                            + "החליפו לכתובת עובדת או הגישו את הקובץ מהשרת שלכם. אחרי התיקון ודאו שאין שגיאות בקונסול הדפדפן.");
        }
        return runtime(status, lang);
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
                    "На этой коммерческой странице нет CTA, формы и мгновенного канала. Поставьте кнопку заявки (в том числе модалку), wa.me или форму захвата — иначе пользователь уходит в меню наугад.",
                    "This commercial page has no CTA, form or instant channel. Add a lead button (including a modal), wa.me or a capture form — otherwise the visitor leaves through the menu.",
                    "בדף המסחרי הזה אין CTA, טופס או ערוץ מיידי. שימו כפתור פנייה (כולל מודאל), wa.me או טופס — אחרת המבקר יוצא דרך התפריט.");
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
