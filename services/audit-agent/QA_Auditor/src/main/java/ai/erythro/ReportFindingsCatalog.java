package ai.erythro;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Бизнес-находки для Top-3 и scorecard — ru / en / he.
 */
public final class ReportFindingsCatalog {

    public record BizFinding(
            int severity,
            String title,
            String issue,
            String impact,
            String solution,
            boolean aiDiscovery,
            boolean israelOnly
    ) {
        public BizFinding(int severity, String title, String issue, String impact, String solution) {
            this(severity, title, issue, impact, solution, false, false);
        }

        public BizFinding(int severity, String title, String issue, String impact, String solution, boolean aiDiscovery) {
            this(severity, title, issue, impact, solution, aiDiscovery, false);
        }
    }

    public record Context(
            boolean hasForms,
            boolean isProtected,
            long formsCount,
            boolean hasOverflow,
            long overflowPx,
            String overflowSelector,
            boolean localesIncludeHe,
            boolean heRtlDeclared,
            String heComputedDirection,
            int seriousA11y,
            long ttfbMs,
            int speedScore,
            int mobilePerformance,
            String mobileLcpDisplay,
            boolean hasInstantChannel,
            boolean hasRobots,
            boolean hasSitemap,
            int headersPresent,
            int headersTotal,
            List<String> missingHeaders,
            boolean hasOgImage,
            boolean ogImageMissing,
            boolean infraPresent,
            boolean aiLlmsApplies,
            boolean aiMcpApplies,
            boolean aiDomApplies,
            boolean aiRobotsApplies,
            boolean aiLlmsOk,
            Object aiLlmsStatus,
            boolean aiMcpOk,
            Object aiMcpStatus,
            boolean aiOrgSchema,
            boolean aiRobotsSevereBlock,
            Object aiBlockedBots,
            boolean aiDataLayer,
            int failedNetworkCount,
            int uncaughtErrorCount,
            int agentBroken,
            int agentVisited,
            int agentCtaInner,
            int agentCandidates,
            int aiVisScore,
            boolean aiAboutApplies,
            boolean aiAboutOk,
            boolean aiLlmsDescribedby,
            boolean aiVercelApplies,
            boolean aiContentSignalsOk,
            boolean aiMarkdownNegOk,
            boolean aiSitemapAgentOk
    ) {}

    public static List<BizFinding> buildAll(Context ctx, String reportLang) {
        String lang = AuditReportI18n.normalizeLang(reportLang);
        List<BizFinding> findings = new ArrayList<>();

        if (ctx.aiVisScore < 80 || (ctx.aiVercelApplies && (
                !ctx.aiContentSignalsOk || !ctx.aiMarkdownNegOk || !ctx.aiSitemapAgentOk))) {
            List<String> gaps = new ArrayList<>();
            if (ctx.aiLlmsApplies && !ctx.aiLlmsOk) {
                gaps.add("/llms.txt");
            }
            if (ctx.aiMcpApplies && !ctx.aiMcpOk) {
                gaps.add("MCP /.well-known/mcp");
            }
            if (ctx.aiAboutApplies && !ctx.aiAboutOk) {
                gaps.add("/about");
            }
            if (ctx.aiDomApplies && !ctx.aiOrgSchema) {
                gaps.add("JSON-LD Organization");
            }
            if (ctx.aiDomApplies && !ctx.aiLlmsDescribedby) {
                gaps.add("link rel=describedby");
            }
            if (ctx.aiRobotsApplies && ctx.aiRobotsSevereBlock) {
                gaps.add("robots Disallow: / для AI-ботов");
            }
            if (ctx.aiVercelApplies && !ctx.aiContentSignalsOk) {
                gaps.add(tr(lang, "Content-Signal в robots.txt",
                        "Content-Signal in robots.txt", "Content-Signal ב-robots.txt"));
            }
            if (ctx.aiVercelApplies && !ctx.aiMarkdownNegOk) {
                gaps.add(tr(lang, "Markdown negotiation (Accept: text/markdown)",
                        "Markdown negotiation (Accept: text/markdown)",
                        "Markdown negotiation (Accept: text/markdown)"));
            }
            if (ctx.aiVercelApplies && !ctx.aiSitemapAgentOk) {
                gaps.add(tr(lang, "Sitemap для агентов",
                        "Sitemap for agents", "Sitemap לסוכנים"));
            }
            if (!gaps.isEmpty() || ctx.aiVisScore < 70) {
                int sev = ctx.aiRobotsSevereBlock ? 97 : 94;
                findings.add(new BizFinding(sev,
                        tr(lang, "ИИ-ассистенты не находят ваш сайт",
                                "AI assistants cannot find your site",
                                "עוזרי AI לא מוצאים את האתר"),
                        tr(lang,
                                "AI Visibility " + ctx.aiVisScore + "/100. ChatGPT, Claude и Gemini не видят бренд: "
                                        + (gaps.isEmpty() ? "неполный контур AI-discovery." : String.join(", ", gaps) + "."),
                                "AI Visibility " + ctx.aiVisScore + "/100. ChatGPT, Claude and Gemini miss the brand: "
                                        + (gaps.isEmpty() ? "incomplete AI-discovery surface." : String.join(", ", gaps) + "."),
                                "AI Visibility " + ctx.aiVisScore + "/100. ChatGPT, Claude ו-Gemini לא רואים את המותג: "
                                        + (gaps.isEmpty() ? "משטח AI-discovery חלקי." : String.join(", ", gaps) + ".")),
                        tr(lang,
                                "Клиент спрашивает ИИ «кто делает это в моём городе» — в ответе конкуренты. Сайт не попадает в рекомендации ChatGPT, Claude и Perplexity, рекламный бюджет не компенсирует потерянный AI-трафик.",
                                "A buyer asks AI “who does this in my city” — rivals get named. The site never appears in ChatGPT, Claude or Perplexity, so ad spend cannot replace lost AI traffic.",
                                "לקוח שואל את ה-AI «מי עושה את זה בעיר שלי» — עולה המתחרה. האתר לא נכנס להמלצות ChatGPT, Claude ו-Perplexity, ותקציב הפרסום לא מחליף תנועת AI שאבדה."),
                        tr(lang,
                                "Erythro.ai закрывает контур AI Visibility: /llms.txt, MCP, /about, JSON-LD, Allow для AI-ботов, Content-Signal и markdown negotiation.",
                                "Erythro.ai closes the AI Visibility loop: /llms.txt, MCP, /about, JSON-LD, Allow for AI bots, Content-Signal and markdown negotiation.",
                                "Erythro.ai סוגר את מעגל AI Visibility: /llms.txt, MCP, /about, JSON-LD, Allow לבוטי AI, Content-Signal ו-markdown negotiation."),
                        true));
            }
        }

        if (ctx.hasForms && !ctx.isProtected) {
            findings.add(new BizFinding(96,
                    tr(lang, "Лид-формы открыты для ботов и спам-заявок",
                            "Lead forms are open to bots and spam submissions",
                            "טפסי ליד פתוחים לבוטים וספאם"),
                    tr(lang,
                            "Найдено форм: " + ctx.formsCount + " — ни одна не защищена Cloudflare Turnstile, reCAPTCHA или honeypot-ловушкой.",
                            "Forms found: " + ctx.formsCount + " — none protected by Turnstile, reCAPTCHA or honeypot.",
                            "נמצאו " + ctx.formsCount + " טפסים — אף אחד לא מוגן Turnstile, reCAPTCHA או honeypot."),
                    tr(lang,
                            "Менеджеры разбирают спам вместо звонков реальным клиентам, а email-рассылки уходят в папку «Спам».",
                            "Managers sift spam instead of calling real clients; email deliverability drops.",
                            "מנהלים מטפלים בספאם במקום בלקוחות; מיילים עלולים ללכת לספאם."),
                    tr(lang,
                            "Подключение Cloudflare Turnstile и AI-фильтрации заявок Erythro.ai перед попаданием лида в CRM.",
                            "Cloudflare Turnstile plus Erythro.ai AI lead filtering before CRM.",
                            "Cloudflare Turnstile וסינון AI של Erythro.ai לפני CRM.")));
        }
        if (!ctx.hasForms) {
            findings.add(new BizFinding(99,
                    tr(lang, "На сайте нет формы захвата заявок",
                            "No lead capture form on the site",
                            "אין טופס לכידת ליד באתר"),
                    tr(lang,
                            "Аудит не нашел ни одной формы с полем контакта и кнопкой отправки на главной странице.",
                            "No form with contact field and submit button found on the homepage.",
                            "לא נמצא טופס עם שדה קשר וכפתור שליחה בעמוד הראשי."),
                    tr(lang,
                            "Весь трафик уходит без следа: посетитель не может оставить заявку, даже если готов купить.",
                            "Traffic leaves without a trace — visitors cannot submit a lead when ready to buy.",
                            "תנועה נעלמת: מבקרים לא יכולים להשאיר ליד כשמוכנים לקנות."),
                    tr(lang,
                            "Внедрение конверсионной лид-формы с мгновенной доставкой заявки в WhatsApp и CRM силами Erythro.ai.",
                            "Conversion lead form with instant WhatsApp and CRM delivery by Erythro.ai.",
                            "טופס ליד עם משלוח מיידי ל-WhatsApp ו-CRM מ-Erythro.ai.")));
        }
        if (ctx.uncaughtErrorCount > 0) {
            findings.add(new BizFinding(92,
                    tr(lang, "JavaScript падает в браузере и блокирует кнопки",
                            "JavaScript crashes block buttons and forms",
                            "JavaScript קורס וחוסם כפתורים"),
                    tr(lang,
                            "Зафиксировано необработанных JS-исключений: " + ctx.uncaughtErrorCount + " (PageError в рантайме).",
                            "Uncaught JS exceptions: " + ctx.uncaughtErrorCount + " (runtime PageError).",
                            "שגיאות JS לא מטופלות: " + ctx.uncaughtErrorCount + " (PageError)."),
                    tr(lang,
                            "Кнопки и отправка форм могут не срабатывать — заявка не доходит до отдела продаж.",
                            "Buttons and forms may fail — leads never reach sales.",
                            "כפתורים וטפסים עלולים לא לעבוד — לידים לא מגיעים למכירות."),
                    tr(lang,
                            "Аудит и исправление фронтенд-ошибок, покрытие критичных сценариев автотестами Playwright от Erythro.ai.",
                            "Frontend fixes and Playwright coverage for critical flows by Erythro.ai.",
                            "תיקון פרונטאנד ובדיקות Playwright לזרימות קריטיות מ-Erythro.ai.")));
        }
        if (ctx.hasOverflow) {
            String overflowExtra = ctx.overflowSelector == null ? "" : tr(lang,
                    " (источник: " + ctx.overflowSelector + ")",
                    " (source: " + ctx.overflowSelector + ")",
                    " (מקור: " + ctx.overflowSelector + ")");
            findings.add(new BizFinding(88,
                    tr(lang, "Паразитный боковой скролл ломает мобильную верстку",
                            "Horizontal scroll breaks mobile layout",
                            "גלילה אופקית שוברת מובייל"),
                    tr(lang,
                            "На экране 375px контент выходит за границы на " + ctx.overflowPx + "px" + overflowExtra + ".",
                            "At 375px content overflows by " + ctx.overflowPx + "px" + overflowExtra + ".",
                            "ב-375px תוכן חורג ב-" + ctx.overflowPx + "px" + overflowExtra + "."),
                    tr(lang,
                            "Мобильные посетители видят «сломанный» сайт и уходят, сжигая бюджет Google Ads и Meta Ads.",
                            "Mobile users see a broken site and bounce, wasting Google / Meta ad spend.",
                            "משתמשי מובייל רואים אתר שבור ועוזבים — תקציב פרסום נשרף."),
                    tr(lang,
                            "Адаптивная переверстка под 375–430px и регрессионные проверки мобильной сетки от Erythro.ai.",
                            "Responsive reflow for 375–430px and mobile grid regression checks by Erythro.ai.",
                            "ריספונסיב ל-375–430px ובדיקות רגרסיה מובייל מ-Erythro.ai.")));
        }
        if (ctx.localesIncludeHe && !ctx.heRtlDeclared) {
            findings.add(new BizFinding(86,
                    tr(lang, "Иврит выводится в левостороннем макете (нет RTL)",
                            "Hebrew rendered in LTR layout (no RTL)",
                            "עברית בממשק LTR (ללא RTL)"),
                    tr(lang,
                            "В версии he отсутствует dir=\"rtl\": направление документа — "
                                    + ctx.heComputedDirection + ".",
                            "Locale he lacks dir=\"rtl\"; document direction is "
                                    + ctx.heComputedDirection + ".",
                            "ב-he חסר dir=\"rtl\"; כיוון המסמך — " + ctx.heComputedDirection + "."),
                    tr(lang,
                            "Израильская аудитория воспринимает сайт как непрофессиональный перевод и не оставляет заявки.",
                            "Israeli audience perceives the site as unprofessional and skips leads.",
                            "קהל ישראלי רואה תרגום לא מקצועי ולא משאיר לידים."),
                    tr(lang,
                            "Полноценная RTL-адаптация верстки, меню и слайдеров под израильский рынок от Erythro.ai.",
                            "Full RTL adaptation of layout, menus and sliders for Israel by Erythro.ai.",
                            "התאמת RTL מלאה לפריסה, תפריטים וסליידרים לישראל מ-Erythro.ai."),
                    false,
                    true));
        }
        if (ctx.seriousA11y > 0) {
            findings.add(new BizFinding(78,
                    tr(lang, "Нарушения доступности (WCAG 2.1 AA / IS 5568)",
                            "Accessibility violations (WCAG 2.1 AA / IS 5568)",
                            "הפרות נגישות (WCAG 2.1 AA / IS 5568)"),
                    tr(lang,
                            "axe-core обнаружил критичных и серьезных нарушений: " + ctx.seriousA11y + ".",
                            "axe-core found critical/serious violations: " + ctx.seriousA11y + ".",
                            "axe-core מצא הפרות קריטיות/חמורות: " + ctx.seriousA11y + "."),
                    tr(lang,
                            "В Израиле доступность регулируется IS 5568 — нарушения несут юридический риск и штрафы.",
                            "In Israel IS 5568 applies — violations carry legal risk and fines.",
                            "בישראל IS 5568 — הפרות = סיכון משפטי וקנסות."),
                    tr(lang,
                            "Приведение контрастности, alt-текстов и семантики к WCAG 2.1 AA с протоколом от Erythro.ai.",
                            "WCAG 2.1 AA contrast, alt text and semantics with compliance protocol from Erythro.ai.",
                            "WCAG 2.1 AA: ניגודיות, alt וסמנטיקה עם תיעוד מ-Erythro.ai.")));
        }
        if (ctx.ttfbMs > 1500) {
            findings.add(new BizFinding(76,
                    tr(lang, "Сервер отвечает медленно (TTFB " + ctx.ttfbMs + " ms)",
                            "Slow server response (TTFB " + ctx.ttfbMs + " ms)",
                            "שרת איטי (TTFB " + ctx.ttfbMs + " ms)"),
                    tr(lang,
                            "Время до первого байта " + ctx.ttfbMs + " ms при целевом значении до 600 ms.",
                            "Time to first byte " + ctx.ttfbMs + " ms vs target 600 ms.",
                            "זמן עד byte ראשון " + ctx.ttfbMs + " ms (יעד 600 ms)."),
                    tr(lang,
                            "Каждая секунда ожидания снижает конверсию рекламного трафика и повышает стоимость лида.",
                            "Each second of wait lowers ad conversion and raises cost per lead.",
                            "כל שנייה המתנה מורידה קונברסיה ומעלה עלות ליד."),
                    tr(lang,
                            "Перенос на быстрый хостинг, CDN-кэширование и серверная оптимизация от Erythro.ai.",
                            "Fast hosting, CDN caching and server tuning by Erythro.ai.",
                            "אחסון מהיר, CDN ואופטימיזציה שרת מ-Erythro.ai.")));
        }
        if (ctx.speedScore < 60) {
            String lcpPart = ctx.mobileLcpDisplay == null ? "" : tr(lang,
                    ", LCP " + ctx.mobileLcpDisplay,
                    ", LCP " + ctx.mobileLcpDisplay,
                    ", LCP " + ctx.mobileLcpDisplay);
            findings.add(new BizFinding(74,
                    tr(lang, "Медленная загрузка на смартфонах сжигает рекламный бюджет",
                            "Slow mobile load burns ad budget",
                            "טעינה איטית במובייל שורפת תקציב פרסום"),
                    tr(lang,
                            "Мобильный балл Lighthouse: " + ctx.mobilePerformance + "/100" + lcpPart + ".",
                            "Mobile Lighthouse score: " + ctx.mobilePerformance + "/100" + lcpPart + ".",
                            "ציון Lighthouse מובייל: " + ctx.mobilePerformance + "/100" + lcpPart + "."),
                    tr(lang,
                            "25–40% посетителей закрывают страницу до первого экрана.",
                            "25–40% of visitors leave before the first screen loads.",
                            "25–40% מהמבקרים עוזבים לפני המסך הראשון."),
                    tr(lang,
                            "Оптимизация Core Web Vitals: Next-Gen изображения, критический CSS и предзагрузка LCP-элемента.",
                            "Core Web Vitals: next-gen images, critical CSS and LCP preload.",
                            "Core Web Vitals: תמונות next-gen, CSS קריטי ו-preload ל-LCP.")));
        }
        if (!ctx.hasInstantChannel) {
            findings.add(new BizFinding(64,
                    tr(lang, "Нет канала мгновенного ответа на заявку",
                            "No instant response channel for leads",
                            "אין ערוץ תגובה מיידית ללידים"),
                    tr(lang,
                            "На странице не найдено ни чат-виджета, ни прямых ссылок в WhatsApp или Telegram.",
                            "No chat widget or direct WhatsApp/Telegram links found.",
                            "לא נמצא צ'אט או קישורים ישירים ל-WhatsApp/Telegram."),
                    tr(lang,
                            "Горячий лид остывает: без ответа в первые 15 минут вероятность сделки падает в разы.",
                            "Hot leads cool off: no reply within 15 minutes sharply lowers close rate.",
                            "ליד חם נקר: ללא תגובה ב-15 דקות סיכוי לסגירה צונח."),
                    tr(lang,
                            "Подключение AI-агентов n8n/CRM Erythro.ai с мгновенным ответом в WhatsApp и Telegram 24/7.",
                            "Erythro.ai n8n/CRM AI agents with instant WhatsApp/Telegram reply 24/7.",
                            "סוכני AI n8n/CRM של Erythro.ai עם תגובה מיידית ב-WhatsApp/Telegram 24/7.")));
        }
        if (ctx.infraPresent && (!ctx.hasRobots || !ctx.hasSitemap)) {
            findings.add(new BizFinding(58,
                    tr(lang, "Отсутствуют служебные файлы индексации",
                            "Missing indexing files",
                            "חסרים קבצי אינדוקס"),
                    tr(lang,
                            missingList(ctx.hasRobots ? null : "robots.txt", ctx.hasSitemap ? null : "sitemap.xml")
                                    + " недоступны для поисковых роботов.",
                            missingList(ctx.hasRobots ? null : "robots.txt", ctx.hasSitemap ? null : "sitemap.xml")
                                    + " not available to crawlers.",
                            missingList(ctx.hasRobots ? null : "robots.txt", ctx.hasSitemap ? null : "sitemap.xml")
                                    + " לא זמינים לרובוטים."),
                    tr(lang,
                            "Google медленнее находит страницы — сайт теряет позиции и бесплатный трафик.",
                            "Google indexes slower — rankings and organic traffic suffer.",
                            "Google מאנדקס לאט — דירוג ותנועה אורגנית נפגעים."),
                    tr(lang,
                            "Настройка карты сайта, директив индексации и мониторинга Search Console от Erythro.ai.",
                            "Sitemap, indexing directives and Search Console monitoring by Erythro.ai.",
                            "Sitemap, כללי אינדוקס וניטור Search Console מ-Erythro.ai.")));
        }
        if (ctx.infraPresent && ctx.missingHeaders.size() >= 3) {
            findings.add(new BizFinding(52,
                    tr(lang, "Не настроены HTTP-заголовки безопасности",
                            "Security HTTP headers not configured",
                            "כותרות אבטחה HTTP חסרות"),
                    tr(lang,
                            "Настроено " + ctx.headersPresent + " из " + ctx.headersTotal
                                    + ", отсутствуют: " + String.join(", ", ctx.missingHeaders) + ".",
                            "Configured " + ctx.headersPresent + " of " + ctx.headersTotal
                                    + "; missing: " + String.join(", ", ctx.missingHeaders) + ".",
                            "מוגדר " + ctx.headersPresent + " מתוך " + ctx.headersTotal
                                    + "; חסר: " + String.join(", ", ctx.missingHeaders) + "."),
                    tr(lang,
                            "Сайт уязвим к встраиванию в чужие фреймы и подмене контента.",
                            "Site is exposed to clickjacking and content spoofing.",
                            "אתר חשוף ל-clickjacking וזיוף תוכן."),
                    tr(lang,
                            "Внедрение HSTS, CSP и X-Frame-Options с проверкой на регресс силами Erythro.ai.",
                            "HSTS, CSP and X-Frame-Options with regression checks by Erythro.ai.",
                            "HSTS, CSP ו-X-Frame-Options עם בדיקות רגרסיה מ-Erythro.ai.")));
        }
        if (ctx.ogImageMissing) {
            findings.add(new BizFinding(46,
                    tr(lang, "Ссылка на сайт выглядит непрезентабельно в мессенджерах",
                            "Link previews look poor in messengers",
                            "תצוגת קישור גרועה במסרים"),
                    tr(lang,
                            "Не задан og:image — WhatsApp, Telegram и LinkedIn показывают ссылку без превью.",
                            "No og:image — WhatsApp, Telegram and LinkedIn show links without preview.",
                            "אין og:image — WhatsApp, Telegram ו-LinkedIn ללא תצוגה מקדימה."),
                    tr(lang,
                            "Пересылаемые ссылки получают меньше переходов.",
                            "Shared links get fewer clicks.",
                            "קישורים משותפים מקבלים פחות קליקים."),
                    tr(lang,
                            "Настройка OpenGraph-разметки и брендированных превью для всех локалей от Erythro.ai.",
                            "OpenGraph and branded previews for all locales by Erythro.ai.",
                            "OpenGraph ותצוגות מקדימות ממותגות לכל השפות מ-Erythro.ai.")));
        }
        if (ctx.aiLlmsApplies && !ctx.aiLlmsOk) {
            findings.add(new BizFinding(68,
                    tr(lang, "ChatGPT не видит бренд: нет /llms.txt",
                            "ChatGPT cannot see the brand: no /llms.txt",
                            "ChatGPT לא רואה את המותג: אין /llms.txt"),
                    tr(lang,
                            "Файл /llms.txt недоступен или не соответствует спецификации llmstxt.org.",
                            "/llms.txt missing or not per llmstxt.org spec.",
                            "/llms.txt חסר או לא תואם llmstxt.org."),
                    tr(lang,
                            "ИИ-ассистенты не загружают карточку бренда — сайт не всплывает в ответах ChatGPT и Perplexity.",
                            "AI assistants never load a brand card — the site does not appear in ChatGPT or Perplexity answers.",
                            "עוזרי AI לא טוענים כרטיס מותג — האתר לא מופיע בתשובות ChatGPT ו-Perplexity."),
                    tr(lang,
                            "Создайте /llms.txt по спецификации llmstxt.org.",
                            "Publish /llms.txt per llmstxt.org.",
                            "פרסם /llms.txt לפי llmstxt.org."),
                    true));
        }
        if (ctx.aiAboutApplies && !ctx.aiAboutOk) {
            findings.add(new BizFinding(72,
                    tr(lang, "ИИ не находит бренд: нет /about",
                            "AI cannot find the brand: no /about",
                            "AI לא מוצא את המותג: אין /about"),
                    tr(lang,
                            "GET /about не отдаёт страницу с фактами бренда, контактами и Organization.",
                            "GET /about does not return a brand-facts page with contacts and Organization.",
                            "GET /about לא מחזיר עמוד עובדות מותג, אנשי קשר ו-Organization."),
                    tr(lang,
                            "ChatGPT и Gemini не могут подтвердить, кто вы и как с вами связаться — в ответах появляются конкуренты.",
                            "ChatGPT and Gemini cannot confirm who you are or how to contact you — rivals get named instead.",
                            "ChatGPT ו-Gemini לא יכולים לאשר מי אתם ואיך ליצור קשר — במקום זה עולים מתחרים."),
                    tr(lang,
                            "Страница /about с Brand Facts, контактами и JSON-LD Organization от Erythro.ai.",
                            "/about with Brand Facts, contacts and JSON-LD Organization by Erythro.ai.",
                            "/about עם Brand Facts, אנשי קשר ו-JSON-LD Organization מ-Erythro.ai."),
                    true));
        }
        if (ctx.aiMcpApplies && !ctx.aiMcpOk) {
            findings.add(new BizFinding(66,
                    tr(lang, "AI-агенты не обнаруживают сайт (нет MCP)",
                            "AI agents cannot discover the site (no MCP)",
                            "סוכני AI לא מגלים את האתר (אין MCP)"),
                    tr(lang,
                            "GET /.well-known/mcp не возвращает JSON с mcp_version и endpoints.",
                            "GET /.well-known/mcp does not return JSON with mcp_version and endpoints.",
                            "GET /.well-known/mcp לא מחזיר JSON עם mcp_version ו-endpoints."),
                    tr(lang,
                            "Агенты Cursor, Claude и ChatGPT не находят API и страницы бренда автоматически.",
                            "Cursor, Claude and ChatGPT agents cannot auto-find brand APIs and pages.",
                            "סוכני Cursor, Claude ו-ChatGPT לא מוצאים API ודפי מותג אוטומטית."),
                    tr(lang,
                            "Добавьте GET /.well-known/mcp (JSON manifest).",
                            "Add GET /.well-known/mcp JSON manifest.",
                            "הוסף GET /.well-known/mcp JSON manifest."),
                    true));
        }
        if (ctx.aiVercelApplies && !ctx.aiContentSignalsOk) {
            findings.add(new BizFinding(64,
                    tr(lang, "Агенты не знают, как использовать контент (нет Content-Signal)",
                            "Agents do not know how to use your content (no Content-Signal)",
                            "סוכנים לא יודעים איך להשתמש בתוכן (אין Content-Signal)"),
                    tr(lang,
                            "В robots.txt нет директивы Content-Signal (search / ai-input / ai-train).",
                            "robots.txt has no Content-Signal directive (search / ai-input / ai-train).",
                            "ב-robots.txt אין הנחיית Content-Signal (search / ai-input / ai-train)."),
                    tr(lang,
                            "ChatGPT и Perplexity не отличают «можно цитировать в ответе» от «можно обучать модель» — бренд либо игнорируют, либо используют против вашей политики.",
                            "ChatGPT and Perplexity cannot tell “cite in answers” from “train the model” — they skip the brand or use it against your policy.",
                            "ChatGPT ו-Perplexity לא מבחינים בין ציטוט בתשובה לאימון המודל — המותג נדחק או בשימוש בניגוד למדיניות."),
                    tr(lang,
                            "Добавьте Content-Signal: search=yes, ai-input=yes, ai-train=no (политика сайта) в robots.txt.",
                            "Add Content-Signal: search=yes, ai-input=yes, ai-train=no (site policy) to robots.txt.",
                            "הוסיפו Content-Signal: search=yes, ai-input=yes, ai-train=no (מדיניות האתר) ל-robots.txt."),
                    true));
        }
        if (ctx.aiVercelApplies && !ctx.aiMarkdownNegOk) {
            findings.add(new BizFinding(65,
                    tr(lang, "ИИ тянет HTML+JS вместо текста (нет markdown)",
                            "AI fetches HTML+JS instead of text (no markdown)",
                            "AI מושך HTML+JS במקום טקסט (אין markdown)"),
                    tr(lang,
                            "GET главной с Accept: text/markdown не возвращает text/markdown.",
                            "GET homepage with Accept: text/markdown does not return text/markdown.",
                            "GET לדף הבית עם Accept: text/markdown לא מחזיר text/markdown."),
                    tr(lang,
                            "ChatGPT и Perplexity парсят HTML и скрипты, путают бренд и сжигают токены — в ответах появляются конкуренты.",
                            "ChatGPT and Perplexity parse HTML and scripts, confuse the brand and burn tokens — rivals get named instead.",
                            "ChatGPT ו-Perplexity מפרשים HTML וסקריפטים, מבלבלים את המותג ושורפים טוקנים — במקום זה עולים מתחרים."),
                    tr(lang,
                            "Отдавайте text/markdown по Accept: text/markdown с той же URL, что и HTML (content negotiation).",
                            "Serve text/markdown on Accept: text/markdown at the same URL as HTML (content negotiation).",
                            "הגישו text/markdown לפי Accept: text/markdown באותו URL כמו HTML (content negotiation)."),
                    true));
        }
        if (ctx.aiDomApplies && !ctx.aiOrgSchema) {
            findings.add(new BizFinding(62,
                    tr(lang, "ИИ не связывает бренд с сайтом (нет JSON-LD)",
                            "AI cannot link the brand to the site (no JSON-LD)",
                            "AI לא מקשר מותג לאתר (אין JSON-LD)"),
                    tr(lang,
                            "На главной не найден JSON-LD Organization/LocalBusiness с name и url.",
                            "Homepage lacks JSON-LD Organization/LocalBusiness with name and url.",
                            "בעמוד הראשי חסר JSON-LD Organization/LocalBusiness עם name ו-url."),
                    tr(lang,
                            "AI-поисковики и Google Knowledge Panel хуже связывают бренд с сайтом.",
                            "AI search and Knowledge Panel link brand poorly to the site.",
                            "חיפוש AI ו-Knowledge Panel מקשרים המותג לאתר בקושי."),
                    tr(lang,
                            "JSON-LD Organization в layout с name, url, logo, sameAs, contactPoint.",
                            "JSON-LD Organization in layout: name, url, logo, sameAs, contactPoint.",
                            "JSON-LD Organization ב-layout: name, url, logo, sameAs, contactPoint."),
                    true));
        }
        if (ctx.aiRobotsApplies && ctx.aiRobotsSevereBlock) {
            findings.add(new BizFinding(80,
                    tr(lang, "Robots.txt скрывает сайт от ChatGPT и Claude",
                            "Robots.txt hides the site from ChatGPT and Claude",
                            "Robots.txt מסתיר את האתר מ-ChatGPT ו-Claude"),
                    tr(lang,
                            "Disallow: / для ботов: " + ctx.aiBlockedBots + ".",
                            "Disallow: / for bots: " + ctx.aiBlockedBots + ".",
                            "Disallow: / לבוטים: " + ctx.aiBlockedBots + "."),
                    tr(lang,
                            "GPTBot, ClaudeBot и Google-Extended не индексируют сайт — ИИ отвечает, что бренда нет.",
                            "GPTBot, ClaudeBot and Google-Extended cannot index the site — AI answers as if the brand does not exist.",
                            "GPTBot, ClaudeBot ו-Google-Extended לא מאנדקסים — ה-AI עונה כאילו המותג לא קיים."),
                    tr(lang,
                            "Отключите Cloudflare Managed robots.txt или добавьте Allow: / для AI-ботов.",
                            "Disable Cloudflare Managed robots.txt or Allow: / for AI bots.",
                            "כבה Cloudflare Managed robots או Allow: / לבוטי AI."),
                    true));
        }
        if (ctx.aiDomApplies && !ctx.aiDataLayer) {
            findings.add(new BizFinding(42,
                    tr(lang, "Нет GA4 / dataLayer bootstrap",
                            "No GA4 / dataLayer bootstrap",
                            "אין GA4 / dataLayer bootstrap"),
                    tr(lang,
                            "window.dataLayer или consent stub не найден в head до cookie banner.",
                            "window.dataLayer or consent stub missing in head before cookie banner.",
                            "window.dataLayer או consent stub חסר ב-head לפני באנר עוגיות."),
                    tr(lang,
                            "Без Consent Mode stub теряются сигналы конверсии и атрибуция рекламы.",
                            "Without Consent Mode stub conversion signals and ad attribution degrade.",
                            "ללא Consent Mode stub — אותות קונברסיה ואטריביושן נפגעים."),
                    tr(lang,
                            "Добавьте GA4 Consent Mode stub в head до cookie banner.",
                            "Add GA4 Consent Mode stub in head before cookie banner.",
                            "הוסף GA4 Consent Mode stub ב-head לפני באנר עוגיות.")));
        }
        if (ctx.failedNetworkCount > 0) {
            findings.add(new BizFinding(44,
                    tr(lang, "Битые сетевые запросы на странице",
                            "Broken network requests on the page",
                            "בקשות רשת שבורות בעמוד"),
                    tr(lang,
                            "Ответов со статусом 4xx/5xx: " + ctx.failedNetworkCount + ".",
                            "4xx/5xx responses: " + ctx.failedNetworkCount + ".",
                            "תגובות 4xx/5xx: " + ctx.failedNetworkCount + "."),
                    tr(lang,
                            "Часть ресурсов не загружается: страница неполная, аналитика искажена.",
                            "Resources fail to load — incomplete page and skewed analytics.",
                            "משאבים לא נטענים — עמוד חלקי ואנליטיקה מעוותת."),
                    tr(lang,
                            "Ревизия сетевых запросов и удаление битых интеграций от Erythro.ai.",
                            "Network audit and removal of broken integrations by Erythro.ai.",
                            "ביקורת רשת והסרת אינטגרציות שבורות מ-Erythro.ai.")));
        }
        if (ctx.agentBroken > 0) {
            findings.add(new BizFinding(82,
                    tr(lang, "Агентный просмотр нашел битые или пустые страницы",
                            "Agent browse found broken or empty pages",
                            "סריקת אגנט מצאה עמודים שבורים"),
                    tr(lang,
                            "Из " + ctx.agentVisited + " открытых страниц недоступны или soft-404: " + ctx.agentBroken + ".",
                            "Of " + ctx.agentVisited + " pages visited, broken or soft-404: " + ctx.agentBroken + ".",
                            "מתוך " + ctx.agentVisited + " עמודים — שבורים או soft-404: " + ctx.agentBroken + "."),
                    tr(lang,
                            "Посетитель уходит с тупика в меню — трафик не доходит до заявки.",
                            "Visitors hit dead ends — traffic never reaches a lead form.",
                            "מבקרים נתקעים — תנועה לא מגיעה לטופס ליד."),
                    tr(lang,
                            "Ремонт битых маршрутов, редиректы и агентный обход ключевых страниц от Erythro.ai.",
                            "Fix routes, redirects and agent regression on key pages by Erythro.ai.",
                            "תיקון נתיבים, רידיירקטים וסריקת אגנט לעמודים מרכזיים מ-Erythro.ai.")));
        }
        if (ctx.agentVisited > 1 && ctx.agentCtaInner == 0 && !ctx.hasForms) {
            findings.add(new BizFinding(70,
                    tr(lang, "На внутренних страницах нет пути к заявке",
                            "Inner pages lack a path to submit a lead",
                            "בעמודים פנימיים אין מסלול לליד"),
                    tr(lang,
                            "Агент обошел " + ctx.agentVisited + " страниц: на внутренних нет CTA и форм.",
                            "Agent visited " + ctx.agentVisited + " pages: no CTA or forms on inner pages.",
                            "אגנט ביקר ב-" + ctx.agentVisited + " עמודים: אין CTA או טפסים פנימיים."),
                    tr(lang,
                            "Пользователь читает услуги, но не находит, куда оставить контакт.",
                            "Users read services but cannot find how to contact you.",
                            "משתמשים קוראים שירותים אך לא מוצאים איך ליצור קשר."),
                    tr(lang,
                            "Сквозные CTA и форма/WhatsApp на ключевых посадочных от Erythro.ai.",
                            "Sitewide CTAs and form/WhatsApp on key landing pages by Erythro.ai.",
                            "CTA רוחבי וטופס/WhatsApp בדפי נחיתה מרכזיים מ-Erythro.ai.")));
        }
        if (ctx.agentCandidates <= 1 && ctx.agentVisited <= 1) {
            findings.add(new BizFinding(48,
                    tr(lang, "Сайт почти одностраничный — узкая воронка",
                            "Near single-page site — narrow funnel",
                            "אתר כמעט דף יחיד — צינור צר"),
                    tr(lang,
                            "Агент нашел всего " + ctx.agentCandidates + " внутренних URL для обхода.",
                            "Agent found only " + ctx.agentCandidates + " internal URLs to browse.",
                            "אגנט מצא רק " + ctx.agentCandidates + " כתובות פנימיות."),
                    tr(lang,
                            "Нет посадочных под услуги: сложнее ранжироваться и закрывать сегменты трафика.",
                            "No service landing pages — weaker SEO and segment conversion.",
                            "אין דפי שירות — SEO וקונברסיה לסגמנטים נפגעים."),
                    tr(lang,
                            "Структура из ключевых посадочных и карта сайта от Erythro.ai.",
                            "Key landing pages and sitemap structure by Erythro.ai.",
                            "דפי נחיתה מרכזיים ומבנה sitemap מ-Erythro.ai.")));
        }

        return findings;
    }

    public static List<BizFinding> growthPads(String reportLang) {
        String lang = AuditReportI18n.normalizeLang(reportLang);
        return List.of(
                new BizFinding(0,
                        tr(lang, "Ускорение Core Web Vitals и мобильного LCP",
                                "Accelerate Core Web Vitals and mobile LCP",
                                "האצת Core Web Vitals ו-LCP מובייל"),
                        tr(lang,
                                "Даже при хороших средних баллах мобильные LCP и INP можно довести до целевых 1.5 s и 200 ms.",
                                "Even with good averages, mobile LCP and INP can reach 1.5s and 200ms targets.",
                                "אפילו עם ציונים טובים, LCP ו-INP מובייל יכולים להגיע ל-1.5s ו-200ms."),
                        tr(lang,
                                "Каждые +100 ms задержки снижают конверсию и увеличивают стоимость лида.",
                                "Each +100ms delay lowers conversion and raises cost per lead.",
                                "כל +100ms מוריד קונברסיה ומעלה עלות ליד."),
                        tr(lang,
                                "Сжатие Next-Gen изображений, критический CSS и CDN-кэширование от Erythro.ai.",
                                "Next-gen images, critical CSS and CDN caching by Erythro.ai.",
                                "תמונות next-gen, CSS קריטי ו-CDN מ-Erythro.ai.")),
                new BizFinding(0,
                        tr(lang, "AI-квалификация входящих заявок",
                                "AI qualification of inbound leads",
                                "AI לסיווג לידים נכנסים"),
                        tr(lang,
                                "Заявки обрабатываются вручную, без автоматической квалификации и распределения.",
                                "Leads handled manually without auto-qualification and routing.",
                                "לידים מטופלים ידנית ללא סיווג וניתוב אוטומטי."),
                        tr(lang,
                                "Время первого ответа растет, заявки теряются между почтой и CRM.",
                                "First response time grows; leads lost between email and CRM.",
                                "זמן תגובה ראשון גדל; לידים נעלמים בין מייל ו-CRM."),
                        tr(lang,
                                "AI-агенты n8n/CRM Erythro.ai: квалификация, авторассылка и задачи 24/7.",
                                "Erythro.ai n8n/CRM AI agents: qualify, route and task 24/7.",
                                "סוכני AI n8n/CRM של Erythro.ai: סיווג, ניתוב ומשימות 24/7.")),
                new BizFinding(0,
                        tr(lang, "Расширение мультиязычной воронки",
                                "Expand multilingual funnel",
                                "הרחבת צינור רב-לשוני"),
                        tr(lang,
                                "Локали работают, но нет отдельных сценариев прогрева под каждый рынок.",
                                "Locales work but lack per-market nurture flows and landings.",
                                "שפות עובדות אך חסרים תרחישי חימום ודפי נחיתה לכל שוק."),
                        tr(lang,
                                "Единый оффер для разных рынков конвертирует хуже локализованных сценариев.",
                                "One offer for all markets converts worse than localized journeys.",
                                "הצעה אחת לכל השווקים מנצחת פחות ממסלולים מקומיים."),
                        tr(lang,
                                "Кросс-культурная адаптация посадочных и офферов под RU / EN / HE от Erythro.ai.",
                                "Cross-cultural landings and offers for RU / EN / HE by Erythro.ai.",
                                "דפי נחיתה והצעות ל-RU / EN / HE מ-Erythro.ai."))
        );
    }

    public static List<Map<String, String>> toTopVulnerabilities(List<BizFinding> sortedFindings, String reportLang) {
        List<BizFinding> picked = new ArrayList<>();
        for (BizFinding f : sortedFindings) {
            if (f.israelOnly()) {
                continue;
            }
            if (picked.size() == 3) {
                break;
            }
            picked.add(f);
        }
        boolean hasAi = picked.stream().anyMatch(BizFinding::aiDiscovery);
        if (!hasAi) {
            sortedFindings.stream().filter(BizFinding::aiDiscovery).findFirst().ifPresent(ai -> {
                if (picked.size() < 3) {
                    picked.add(ai);
                } else {
                    int minIdx = 0;
                    for (int i = 1; i < picked.size(); i++) {
                        if (picked.get(i).severity() < picked.get(minIdx).severity()) {
                            minIdx = i;
                        }
                    }
                    picked.set(minIdx, ai);
                    picked.sort(Comparator.comparingInt(BizFinding::severity).reversed());
                }
            });
        }
        List<Map<String, String>> top = new ArrayList<>();
        for (BizFinding f : picked) {
            top.add(Map.of("title", f.title(), "issue", f.issue(), "impact", f.impact(), "solution", f.solution()));
        }
        for (BizFinding pad : growthPads(reportLang)) {
            if (top.size() == 3) {
                break;
            }
            top.add(Map.of("title", pad.title(), "issue", pad.issue(), "impact", pad.impact(), "solution", pad.solution()));
        }
        return top;
    }

    public static String tr(String lang, String ru, String en, String he) {
        if ("en".equals(lang)) return en;
        if ("he".equals(lang)) return he;
        return ru;
    }

    private static String missingList(String... parts) {
        List<String> missing = new ArrayList<>();
        for (String p : parts) {
            if (p != null) missing.add(p);
        }
        return String.join(", ", missing);
    }
}
