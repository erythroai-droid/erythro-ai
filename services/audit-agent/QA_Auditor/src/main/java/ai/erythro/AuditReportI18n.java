package ai.erythro;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Map;

/**
 * Локализация PDF/HTML-отчёта: ru (по умолчанию), en, he.
 * Локали аудита сайта (LOCALES=en,ru,he) — отдельно от языка отчёта (REPORT_LANG).
 */
public final class AuditReportI18n {

    public final String lang;
    public final String htmlLang;
    public final String htmlDirAttr;
    public final String htmlClassAttr;
    public final String docTitle;
    public final String metaDateLabel;
    public final String metaLocalesLabel;
    public final String gaugeSub;
    public final String h1Html;
    public final String diagTitleHtml;
    public final String chartSpeed;
    public final String chartSeo;
    public final String chartLead;
    public final String chartSec;
    public final String chartAi;
    public final String sectionTop3;
    public final String sectionMobile;
    public final String sectionSpeedHtml;
    public final String findingProblem;
    public final String findingImpact;
    public final String findingSolution;
    public final String thDevice;
    public final String thPerformance;
    public final String thAccessibility;
    public final String thBestPractices;
    public final String thSeo;
    public final String thFcp;
    public final String thLcp;
    public final String thCls;
    public final String thCheckParam;
    public final String thCheckResult;
    public final String thCheckStatus;
    public final String deviceMobile;
    public final String deviceDesktop;
    public final String ctaTitleHtml;
    public final String ctaSub;
    public final String ctaWhatsapp;
    public final String ctaTelegram;
    public final String ctaSite;
    public final String copyright;
    public final String yes;
    public final String no;
    public final String statusExcellent;
    public final String statusGood;
    public final String statusNorm;
    public final String statusWorks;
    public final String statusSecured;
    public final String statusStable;
    public final String statusOk;
    public final String statusPartial;
    public final String statusNeedsAttention;
    public final String statusCritical;
    public final String statusDanger;
    public final String checkOverflow;
    public final String checkRtl;
    public final String checkLead;
    public final String checkHttps;
    public final String checkRuntime;
    public final String checkLlmsMcp;
    public final String checkBrand;
    public final String checkRobotsAi;
    public final String checkGa4;
    public final String unlockReportBtn;
    public final String unlockReportUrl;
    public final String proposalDocTitle;
    public final String proposalPreviewBadge;
    public final String proposalPreviewNotice;
    public final String proposalUnlockSub;
    public final String proposalSolutionTeaser;
    public final String proposalFooterTitleHtml;
    public final String proposalFooterSub;
    public final String proposalFooterBtn;
    public final String proposalFooterLine;

    private AuditReportI18n(
            String lang,
            String htmlLang,
            String htmlDirAttr,
            String htmlClassAttr,
            String docTitle,
            String metaDateLabel,
            String metaLocalesLabel,
            String gaugeSub,
            String h1Html,
            String diagTitleHtml,
            String chartSpeed,
            String chartSeo,
            String chartLead,
            String chartSec,
            String chartAi,
            String sectionTop3,
            String sectionMobile,
            String sectionSpeedHtml,
            String findingProblem,
            String findingImpact,
            String findingSolution,
            String thDevice,
            String thPerformance,
            String thAccessibility,
            String thBestPractices,
            String thSeo,
            String thFcp,
            String thLcp,
            String thCls,
            String thCheckParam,
            String thCheckResult,
            String thCheckStatus,
            String deviceMobile,
            String deviceDesktop,
            String ctaTitleHtml,
            String ctaSub,
            String ctaWhatsapp,
            String ctaTelegram,
            String ctaSite,
            String copyright,
            String yes,
            String no,
            String statusExcellent,
            String statusGood,
            String statusNorm,
            String statusWorks,
            String statusSecured,
            String statusStable,
            String statusOk,
            String statusPartial,
            String statusNeedsAttention,
            String statusCritical,
            String statusDanger,
            String checkOverflow,
            String checkRtl,
            String checkLead,
            String checkHttps,
            String checkRuntime,
            String checkLlmsMcp,
            String checkBrand,
            String checkRobotsAi,
            String checkGa4,
            String unlockReportBtn,
            String unlockReportUrl,
            String proposalDocTitle,
            String proposalPreviewBadge,
            String proposalPreviewNotice,
            String proposalUnlockSub,
            String proposalSolutionTeaser,
            String proposalFooterTitleHtml,
            String proposalFooterSub,
            String proposalFooterBtn,
            String proposalFooterLine
    ) {
        this.lang = lang;
        this.htmlLang = htmlLang;
        this.htmlDirAttr = htmlDirAttr;
        this.htmlClassAttr = htmlClassAttr;
        this.docTitle = docTitle;
        this.metaDateLabel = metaDateLabel;
        this.metaLocalesLabel = metaLocalesLabel;
        this.gaugeSub = gaugeSub;
        this.h1Html = h1Html;
        this.diagTitleHtml = diagTitleHtml;
        this.chartSpeed = chartSpeed;
        this.chartSeo = chartSeo;
        this.chartLead = chartLead;
        this.chartSec = chartSec;
        this.chartAi = chartAi;
        this.sectionTop3 = sectionTop3;
        this.sectionMobile = sectionMobile;
        this.sectionSpeedHtml = sectionSpeedHtml;
        this.findingProblem = findingProblem;
        this.findingImpact = findingImpact;
        this.findingSolution = findingSolution;
        this.thDevice = thDevice;
        this.thPerformance = thPerformance;
        this.thAccessibility = thAccessibility;
        this.thBestPractices = thBestPractices;
        this.thSeo = thSeo;
        this.thFcp = thFcp;
        this.thLcp = thLcp;
        this.thCls = thCls;
        this.thCheckParam = thCheckParam;
        this.thCheckResult = thCheckResult;
        this.thCheckStatus = thCheckStatus;
        this.deviceMobile = deviceMobile;
        this.deviceDesktop = deviceDesktop;
        this.ctaTitleHtml = ctaTitleHtml;
        this.ctaSub = ctaSub;
        this.ctaWhatsapp = ctaWhatsapp;
        this.ctaTelegram = ctaTelegram;
        this.ctaSite = ctaSite;
        this.copyright = copyright;
        this.yes = yes;
        this.no = no;
        this.statusExcellent = statusExcellent;
        this.statusGood = statusGood;
        this.statusNorm = statusNorm;
        this.statusWorks = statusWorks;
        this.statusSecured = statusSecured;
        this.statusStable = statusStable;
        this.statusOk = statusOk;
        this.statusPartial = statusPartial;
        this.statusNeedsAttention = statusNeedsAttention;
        this.statusCritical = statusCritical;
        this.statusDanger = statusDanger;
        this.checkOverflow = checkOverflow;
        this.checkRtl = checkRtl;
        this.checkLead = checkLead;
        this.checkHttps = checkHttps;
        this.checkRuntime = checkRuntime;
        this.checkLlmsMcp = checkLlmsMcp;
        this.checkBrand = checkBrand;
        this.checkRobotsAi = checkRobotsAi;
        this.checkGa4 = checkGa4;
        this.unlockReportBtn = unlockReportBtn;
        this.unlockReportUrl = unlockReportUrl;
        this.proposalDocTitle = proposalDocTitle;
        this.proposalPreviewBadge = proposalPreviewBadge;
        this.proposalPreviewNotice = proposalPreviewNotice;
        this.proposalUnlockSub = proposalUnlockSub;
        this.proposalSolutionTeaser = proposalSolutionTeaser;
        this.proposalFooterTitleHtml = proposalFooterTitleHtml;
        this.proposalFooterSub = proposalFooterSub;
        this.proposalFooterBtn = proposalFooterBtn;
        this.proposalFooterLine = proposalFooterLine;
    }

  public static AuditReportI18n resolve(String lang) {
        if (lang == null || lang.isBlank()) {
            return RU;
        }
        switch (lang.trim().toLowerCase(Locale.ROOT)) {
            case "en":
                return EN;
            case "he":
                return HE;
            case "ru":
            default:
                return RU;
        }
    }

    public static String normalizeLang(String lang) {
        return resolve(lang).lang;
    }

    private static final String FOOTER_LOGO_SVG = loadFooterLogoSvg();

    private static String ctaWithLogo(String prefix) {
        return prefix + FOOTER_LOGO_SVG;
    }

    private static String loadFooterLogoSvg() {
        Path[] candidates = {
                Paths.get("templates/figma-assets/logo-footer.svg"),
                Paths.get("QA_Auditor/templates/figma-assets/logo-footer.svg"),
                Paths.get("../templates/figma-assets/logo-footer.svg")
        };
        for (Path p : candidates) {
            if (Files.isRegularFile(p)) {
                try {
                    return Files.readString(p).replaceAll("\\s+", " ").trim();
                } catch (IOException ignored) {
                    // try next candidate
                }
            }
        }
        return "<svg width=\"87\" height=\"19\" viewBox=\"0 0 87 19\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-label=\"Erythro.ai\"></svg>";
    }

    public String applyShellPlaceholders(String html) {
        String res = html;
        res = res.replace("{{HTML_LANG}}", htmlLang);
        res = res.replace("{{HTML_DIR_ATTR}}", htmlDirAttr);
        res = res.replace("{{HTML_CLASS}}", htmlClassAttr);
        res = res.replace("{{DOC_TITLE}}", docTitle);
        res = res.replace("{{META_DATE_LABEL}}", metaDateLabel);
        res = res.replace("{{META_LOCALES_LABEL}}", metaLocalesLabel);
        res = res.replace("{{GAUGE_SUB}}", gaugeSub);
        res = res.replace("{{H1_HTML}}", h1Html);
        res = res.replace("{{DIAG_TITLE_HTML}}", diagTitleHtml);
        res = res.replace("{{SECTION_TOP3}}", sectionTop3);
        res = res.replace("{{SECTION_MOBILE}}", sectionMobile);
        res = res.replace("{{SECTION_SPEED_HTML}}", sectionSpeedHtml);
        res = res.replace("{{CTA_TITLE_HTML}}", ctaTitleHtml);
        res = res.replace("{{CTA_SUB}}", ctaSub);
        res = res.replace("{{CTA_BTN_WHATSAPP}}", ctaWhatsapp);
        res = res.replace("{{CTA_BTN_TELEGRAM}}", ctaTelegram);
        res = res.replace("{{CTA_BTN_SITE}}", ctaSite);
        res = res.replace("{{COPYRIGHT}}", copyright);
        return res;
    }

    private static final AuditReportI18n RU = new AuditReportI18n(
            "ru", "ru", "", "",
            "Коммерческий QA и AI-аудит конверсии — Erythro.ai",
            "Дата", "Локали",
            "из 100 баллов",
            "КОММЕРЧЕСКИЙ QA И<br>AI-АУДИТ КОНВЕРСИИ",
            "<span>д</span>иагностика",
            "скорость и<br>мобильный UX",
            "Seo и видимость",
            "лидогенерация и формы",
            "безопасность и стабильность",
            "AI visibility &<br>brand discovery",
            "топ-3 уязвимости конверсии &amp; упущенная выгода",
            "МОБИЛЬНЫЙ UX, RTL, ФОРМЫ &amp; БЕЗОПАСНОСТЬ",
            "СКОРОСТЬ ЗАГРУЗКИ И<br>CORE WEB VITALS<br>(GOOGLE LIGHTHOUSE)",
            "Проблема:", "Потери бизнеса:", "Решение от Erythro.ai:",
            "УСТРОЙСТВО", "PERFOMANCE", "ACCESSEBILITY", "BEST PRACTICES", "SEO", "FCP", "LCP", "CLS",
            "ПАРАМЕТР АУДИТА", "РЕЗУЛЬТАТ ПРОВЕРКИ", "СТАТУС",
            "MOBILE (iPhone SE)", "DESKTOP",
            ctaWithLogo("Внедрите AI-автоматизацию и увеличьте конверсию сайта с "),
            "Запишитесь на бесплатный разбор с СТО Erythro.ai: оптимизируем CoreWeb Vitals до 90+, внедрим AI-агентов обработки заявок и ошибок, защитим от сбоев.",
            "Whatsapp консультация", "Telegram(@erythro_ai)", "Сайт (erythro.ai)",
            "© 2026 Erythro.ai - Hi-Load Web Development &amp; Ai Agents Automation | Commercial Executive Audit",
            "да", "нет",
            "Отлично", "В норме", "Норма", "Работает", "Защищено", "Стабильно", "В норме", "Частично", "Требует внимания", "Критично", "Опасно",
            "Паразитный боковой скролл (Overflow-X на смартфонах 375px)",
            "RTL-зеркалирование и верстка для Израиля (Иврит)",
            "Лид-формы, антиспам и мгновенный ответ",
            "HTTPS и HTTP-заголовки безопасности",
            "Стабильность рантайма (JS-ошибки и битые запросы)",
            "llms.txt и MCP discovery",
            "Brand facts: JSON-LD и /about",
            "Robots.txt: AI-боты и индексация",
            "GA4 / dataLayer readiness",
            "Разблокировать полный отчёт · 60+ проверок",
            "https://erythro.ai/audit",
            "Preview · Бесплатный коммерческий аудит — Erythro.ai",
            "PREVIEW · БЕСПЛАТНЫЙ АУДИТ",
            "Ключевые метрики и топ-3 уязвимости. Полный отчёт: 60+ проверок, Lighthouse desktop, AI Visibility и план на 3 языках.",
            "Остальные проверки (AI, HTTPS, robots, runtime) — в полном отчёте",
            "Пошаговый план исправления и приоритеты — в полном отчёте Erythro.ai.",
            "Получите полный коммерческий аудит",
            "Все проверки, Lighthouse desktop, PDF на 3 языках и разбор с CTO.",
            "Разблокировать полный отчёт · 60+ проверок",
            "Получите полный коммерческий аудит — все проверки, Lighthouse desktop, PDF на 3 языках и разбор с CTO."
    );

    private static final AuditReportI18n EN = new AuditReportI18n(
            "en", "en", "", "",
            "Commercial QA & AI Conversion Audit — Erythro.ai",
            "Date", "Locales",
            "out of 100 points",
            "COMMERCIAL QA &amp;<br>AI CONVERSION AUDIT",
            "<span>d</span>iagnostics",
            "speed &amp;<br>mobile UX",
            "SEO &amp; visibility",
            "lead gen &amp; forms",
            "security &amp; stability",
            "AI visibility &amp;<br>brand discovery",
            "top 3 conversion vulnerabilities &amp; missed revenue",
            "MOBILE UX, RTL, FORMS &amp; SECURITY",
            "LOAD SPEED &amp;<br>CORE WEB VITALS<br>(GOOGLE LIGHTHOUSE)",
            "Issue:", "Business impact:", "Erythro.ai solution:",
            "DEVICE", "PERFORMANCE", "ACCESSIBILITY", "BEST PRACTICES", "SEO", "FCP", "LCP", "CLS",
            "AUDIT PARAMETER", "CHECK RESULT", "STATUS",
            "MOBILE (iPhone SE)", "DESKTOP",
            ctaWithLogo("Deploy AI automation and lift site conversion with "),
            "Book a free review with the Erythro.ai CTO: Core Web Vitals to 90+, AI agents for leads and errors, uptime protection.",
            "WhatsApp consultation", "Telegram (@erythro_ai)", "Website (erythro.ai)",
            "© 2026 Erythro.ai — Hi-Load Web Development &amp; AI Agents Automation | Commercial Executive Audit",
            "yes", "no",
            "Excellent", "OK", "Normal", "Working", "Secured", "Stable", "OK", "Partial", "Needs attention", "Critical", "At risk",
            "Horizontal overflow (Overflow-X at 375px mobile)",
            "RTL layout for Israel (Hebrew)",
            "Lead forms, anti-spam & instant response",
            "HTTPS & security HTTP headers",
            "Runtime stability (JS errors & failed requests)",
            "llms.txt & MCP discovery",
            "Brand facts: JSON-LD & /about",
            "Robots.txt: AI crawlers & indexing",
            "GA4 / dataLayer readiness",
            "Unlock full report · 60+ checks",
            "https://erythro.ai/audit",
            "Preview · Free Commercial Audit — Erythro.ai",
            "PREVIEW · FREE AUDIT",
            "Key metrics and top 3 vulnerabilities. Full report: 60+ checks, desktop Lighthouse, AI Visibility and 3-language PDF.",
            "Remaining checks (AI, HTTPS, robots, runtime) — in the full report",
            "Step-by-step fix plan and priorities — in the full Erythro.ai report.",
            "Get the full commercial audit",
            "All checks, desktop Lighthouse, 3-language PDF and CTO review.",
            "Unlock full report · 60+ checks",
            "Get the full commercial audit — all checks, desktop Lighthouse, 3-language PDF and CTO review."
    );

    private static final AuditReportI18n HE = new AuditReportI18n(
            "he", "he", "dir=\"rtl\"", "rtl-report",
            "אודיט QA מסחרי וקונברסיית AI — Erythro.ai",
            "תאריך", "שפות",
            "מתוך 100 נקודות",
            "אודיט QA מסחרי<br>וקונברסיית AI",
            "<span>א</span>בחון",
            "מהירות &amp;<br>UX מובייל",
            "SEO &amp; נראות",
            "לידים &amp; טפסים",
            "אבטחה &amp; יציבות",
            "נראות AI &amp;<br>גילוי מותג",
            "3 פגיעויות קונברסיה &amp; הכנסה מוחמצת",
            "UX מובייל, RTL, טפסים &amp; אבטחה",
            "מהירות טעינה &amp;<br>CORE WEB VITALS<br>(GOOGLE LIGHTHOUSE)",
            "בעיה:", "השפעה עסקית:", "פתרון מ-Erythro.ai:",
            "מכשיר", "ביצועים", "נגישות", "Best Practices", "SEO", "FCP", "LCP", "CLS",
            "פרמטר בדיקה", "תוצאה", "סטטוס",
            "MOBILE (iPhone SE)", "DESKTOP",
            ctaWithLogo("הטמיעו אוטומציה AI והגדילו קונברסיה עם "),
            "קבעו שיחת אבחון חינם עם CTO של Erythro.ai: Core Web Vitals ל-90+, סוכני AI ללידים ושגיאות, הגנה מקריסות.",
            "ייעוץ WhatsApp", "Telegram (@erythro_ai)", "אתר (erythro.ai)",
            "© 2026 Erythro.ai — Hi-Load Web Development &amp; AI Agents Automation | Commercial Executive Audit",
            "כן", "לא",
            "מצוין", "בתוק", "תקין", "עובד", "מאובטח", "יציב", "בתוק", "חלקי", "דורש תשומת לב", "קריטי", "מסוכן",
            "גלילה אופקית (Overflow-X במובייל 375px)",
            "RTL ופריסה לישראל (עברית)",
            "טפסי ליד, אנטי-ספאם ותגובה מיידית",
            "HTTPS וכותרות אבטחה HTTP",
            "יציבות ריצה (שגיאות JS ובקשות כושלות)",
            "llms.txt ו-MCP discovery",
            "Brand facts: JSON-LD ו-/about",
            "Robots.txt: בוטים AI ואינדוקס",
            "GA4 / dataLayer readiness",
            "שחרר את הדוח המלא · 60+ בדיקות",
            "https://erythro.ai/audit",
            "Preview · אודיט מסחרי חינם — Erythro.ai",
            "PREVIEW · אודיט חינם",
            "מדדים מרכזיים ו-3 פגיעויות מובילות. דוח מלא: 60+ בדיקות, Lighthouse desktop, AI Visibility ו-PDF ב-3 שפות.",
            "שאר הבדיקות (AI, HTTPS, robots, runtime) — בדוח המלא",
            "תוכנית תיקון מפורטת וסדר עדיפויות — בדוח המלא של Erythro.ai.",
            "קבלו את האודיט המסחרי המלא",
            "כל הבדיקות, Lighthouse desktop, PDF ב-3 שפות ושיחה עם CTO.",
            "שחרר את הדוח המלא · 60+ בדיקות",
            "קבלו את האודיט המסחרי המלא — כל הבדיקות, Lighthouse desktop, PDF ב-3 שפות ושיחה עם CTO."
    );

    public static final Map<String, AuditReportI18n> ALL = Map.of("ru", RU, "en", EN, "he", HE);
}
