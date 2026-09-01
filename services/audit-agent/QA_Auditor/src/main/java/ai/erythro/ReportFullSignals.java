package ai.erythro;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Paid (Pro) checklist: diagnostic aggregated cards plus commercial extras
 * that show real audit volume without exploding into 50+ micro-signals.
 */
final class ReportFullSignals {

    private ReportFullSignals() {}

    static List<Map<String, String>> expand(
            List<Map<String, String>> diagnosticRows,
            Map<String, Object> report,
            AuditReportI18n i18n,
            List<String> locales,
            int pageCap) {
        List<Map<String, String>> rows = new ArrayList<>(diagnosticRows == null ? List.of() : diagnosticRows);
        Map<String, Object> infra = map(report.get("infrastructure_and_security"));
        Map<String, Object> localesMap = map(report.get("audits_by_locale"));
        Map<String, Object> agent = map(report.get("agent_browse"));
        List<String> locOrder = LocalePresence.forReport(
                locales == null || locales.isEmpty() ? List.copyOf(localesMap.keySet()) : locales,
                report);
        locOrder = locOrder.stream()
                .filter(loc -> localesMap.get(loc) instanceof Map<?, ?>)
                .toList();

        addSeoOg(rows, i18n, localesMap, locOrder);
        addAccessibility(rows, i18n, localesMap, locOrder);
        addTtfb(rows, i18n, infra);
        addLocales(rows, i18n, localesMap, locOrder);
        addAgent(rows, i18n, agent, pageCap);
        return rows;
    }

    @SuppressWarnings("unchecked")
    private static void addSeoOg(
            List<Map<String, String>> rows, AuditReportI18n i18n,
            Map<String, Object> localesMap, List<String> locOrder) {
        List<String> bits = new ArrayList<>();
        boolean missingMeta = false;
        boolean missingOg = false;
        boolean missingHreflang = locOrder.size() > 1;
        boolean missingFavicon = false;
        for (String loc : locOrder) {
            Object raw = localesMap.get(loc);
            if (!(raw instanceof Map<?, ?>)) {
                continue;
            }
            Map<String, Object> locMap = (Map<String, Object>) raw;
            Map<String, Object> seo = map(locMap.get("seo"));
            Map<String, Object> assets = map(locMap.get("seo_assets"));
            boolean title = present(seo.get("title"));
            boolean desc = present(seo.get("description"));
            boolean ogImg = present(seo.get("ogImage"));
            boolean canonical = present(seo.get("canonical"));
            if (!title || !desc) {
                missingMeta = true;
            }
            if (!ogImg) {
                missingOg = true;
            }
            List<?> hreflang = assets.get("hreflangs") instanceof List<?> h ? h : List.of();
            if (!hreflang.isEmpty()) {
                missingHreflang = false;
            }
            if (!present(assets.get("favicon"))) {
                missingFavicon = true;
            }
            bits.add(loc.toUpperCase() + ": title " + yn(i18n, title)
                    + ", description " + yn(i18n, desc)
                    + ", og:image " + yn(i18n, ogImg)
                    + ", canonical " + yn(i18n, canonical));
        }
        String status = (missingMeta || missingOg) ? "bad" : ((missingHreflang || missingFavicon) ? "warn" : "good");
        String extra = "";
        if (missingHreflang) {
            extra += ReportFindingsCatalog.tr(i18n.lang, "; hreflang не задан", "; hreflang missing", "; hreflang חסר");
        }
        if (missingFavicon) {
            extra += ReportFindingsCatalog.tr(i18n.lang, "; favicon не найден", "; favicon missing", "; favicon חסר");
        }
        add(rows, i18n, "seo_og",
                n(i18n,
                        "SEO, OpenGraph и превью в мессенджерах",
                        "SEO, OpenGraph and messenger preview",
                        "SEO, OpenGraph ותצוגה מקדימה במסנג'רים"),
                String.join(". ", bits) + extra,
                status);
    }

    @SuppressWarnings("unchecked")
    private static void addAccessibility(
            List<Map<String, String>> rows, AuditReportI18n i18n,
            Map<String, Object> localesMap, List<String> locOrder) {
        int img = 0;
        int buttons = 0;
        int axe = 0;
        for (String loc : locOrder) {
            Object raw = localesMap.get(loc);
            if (!(raw instanceof Map<?, ?>)) {
                continue;
            }
            Map<String, Object> locMap = (Map<String, Object>) raw;
            List<?> a11y = locMap.get("dom_a11y_issues") instanceof List<?> a ? a : List.of();
            for (Object issue : a11y) {
                String t = String.valueOf(issue);
                if (t.contains("изображен") || t.contains("без атрибута alt")) {
                    img = Math.max(img, extractCount(t));
                } else if (t.contains("кнопок") || t.contains("aria-label")) {
                    buttons = Math.max(buttons, extractCount(t));
                }
            }
            List<?> axeList = locMap.get("axe_wcag_violations") instanceof List<?> x ? x : List.of();
            axe = Math.max(axe, axeList.size());
        }
        boolean clean = img == 0 && buttons == 0 && axe == 0;
        String status = axe > 0 ? "bad" : (clean ? "good" : "warn");
        add(rows, i18n, "a11y",
                n(i18n,
                        "Доступность WCAG 2.1 AA / IS 5568",
                        "Accessibility WCAG 2.1 AA / IS 5568",
                        "נגישות WCAG 2.1 AA / IS 5568"),
                n(i18n,
                        "img без alt: " + img + "; кнопки без подписи: " + buttons + "; axe-core: " + axe,
                        "img without alt: " + img + "; unlabeled buttons: " + buttons + "; axe-core: " + axe,
                        "img בלי alt: " + img + "; כפתורים בלי תווית: " + buttons + "; axe-core: " + axe),
                status);
    }

    private static void addTtfb(List<Map<String, String>> rows, AuditReportI18n i18n, Map<String, Object> infra) {
        long ttfb = num(infra.get("ttfb_ms"), -1);
        String server = str(infra.get("server"));
        String ttfbText = ttfb < 0 ? "—" : ttfb + " ms";
        String status = ttfb < 0 ? "warn" : (ttfb <= 800 ? "good" : (ttfb <= 1800 ? "warn" : "bad"));
        String result = "TTFB " + ttfbText;
        if (!server.isBlank()) {
            result += ", Server: " + server;
        }
        add(rows, i18n, "ttfb",
                n(i18n, "TTFB и ответ сервера", "TTFB and server response", "TTFB ותגובת השרת"),
                result, status);
    }

    @SuppressWarnings("unchecked")
    private static void addLocales(
            List<Map<String, String>> rows, AuditReportI18n i18n,
            Map<String, Object> localesMap, List<String> locOrder) {
        for (String loc : locOrder) {
            Object raw = localesMap.get(loc);
            if (!(raw instanceof Map<?, ?>)) {
                continue;
            }
            Map<String, Object> locMap = (Map<String, Object>) raw;
            Map<String, Object> seo = map(locMap.get("seo"));
            Map<String, Object> mobile = map(locMap.get("mobile_layout_audit"));
            Map<String, Object> lead = map(locMap.get("lead_capture"));
            String htmlLang = str(seo.get("htmlLang"));
            String dir = str(seo.get("dir"));
            boolean overflow = bool(mobile.get("hasHorizontalOverflow"));
            long px = num(mobile.get("overflowPx"), 0);
            int forms = (int) num(lead.get("formsCount"), 0);
            boolean langOk = htmlLang.toLowerCase().startsWith(loc.toLowerCase());
            boolean dirOk = !LocalePresence.isRtlLocale(loc) || "rtl".equalsIgnoreCase(dir);
            String status = overflow || !dirOk ? "bad" : (!langOk || forms == 0 ? "warn" : "good");
            add(rows, i18n, "locale_" + loc,
                    n(i18n,
                            "Локаль " + loc.toUpperCase() + " · главная",
                            "Locale " + loc.toUpperCase() + " · homepage",
                            "שפה " + loc.toUpperCase() + " · דף הבית"),
                    "html lang=" + (htmlLang.isBlank() ? "—" : htmlLang)
                            + ", dir=" + (dir.isBlank() ? "—" : dir)
                            + ", overflow-x " + px + "px"
                            + ", forms=" + forms,
                    status);
        }
    }

    @SuppressWarnings("unchecked")
    private static void addAgent(
            List<Map<String, String>> rows, AuditReportI18n i18n, Map<String, Object> agent, int pageCap) {
        List<Map<String, Object>> all = listOfMaps(agent.get("pages"));
        if (all.isEmpty()) {
            return;
        }
        int cap = Math.max(1, pageCap);
        List<Map<String, Object>> pages = all.size() <= cap ? all : all.subList(0, cap);
        int visited = pages.size();
        int broken = 0;
        int cta = 0;
        int forms = 0;
        for (Map<String, Object> page : pages) {
            boolean ok = bool(page.get("ok"));
            int http = (int) num(page.get("http_status"), 0);
            if (!ok || http >= 400 || bool(page.get("soft404"))) {
                broken++;
            }
            if (bool(page.get("hasCta"))) {
                cta++;
            }
            forms += (int) num(page.get("formsCount"), 0);
        }
        String status = broken > 0 ? "bad" : (cta == 0 ? "warn" : "good");
        add(rows, i18n, "agent",
                n(i18n,
                        "Агентный обход воронки (" + visited + " URL)",
                        "Agent funnel crawl (" + visited + " URLs)",
                        "סריקת משפך (" + visited + " URL)"),
                n(i18n,
                        "Открыто " + visited + ", недоступны: " + broken
                                + ", с CTA: " + cta + ", форм на внутренних: " + forms,
                        "Opened " + visited + ", broken: " + broken
                                + ", with CTA: " + cta + ", inner forms: " + forms,
                        "נפתחו " + visited + ", שבורים: " + broken
                                + ", עם CTA: " + cta + ", טפסים פנימיים: " + forms),
                status);

        int i = 0;
        for (Map<String, Object> page : pages) {
            i++;
            String url = str(page.get("url"));
            String path = pathOf(url);
            boolean ok = bool(page.get("ok"));
            int http = (int) num(page.get("http_status"), 0);
            boolean soft = bool(page.get("soft404"));
            boolean hasCta = bool(page.get("hasCta"));
            int pageForms = (int) num(page.get("formsCount"), 0);
            int words = (int) num(page.get("wordCount"), 0);
            String pageStatus;
            if (!ok || http >= 400 || soft) {
                pageStatus = "bad";
            } else if (!hasCta && pageForms == 0) {
                pageStatus = "warn";
            } else {
                pageStatus = "good";
            }
            String result;
            if (!ok) {
                result = clip(str(page.get("error")), 160);
                if (result.isBlank()) {
                    result = "HTTP " + http;
                }
            } else {
                result = "HTTP " + http
                        + " · CTA " + yn(i18n, hasCta)
                        + " · forms " + pageForms
                        + " · " + words + " "
                        + n(i18n, "слов", "words", "מילים");
                if (soft) {
                    result += " · soft-404";
                }
            }
            add(rows, i18n, "agent_" + i,
                    n(i18n,
                            "Страница воронки · " + path,
                            "Funnel page · " + path,
                            "דף משפך · " + path),
                    result, pageStatus);
        }
    }

    private static void add(
            List<Map<String, String>> rows, AuditReportI18n i18n,
            String id, String param, String result, String status) {
        String label = switch (status) {
            case "good" -> i18n.statusExcellent;
            case "warn" -> i18n.statusNeedsAttention;
            default -> i18n.statusCritical;
        };
        rows.add(ReportTemplateGenerator.checkRow(param, result, status, label, id));
    }

    private static String n(AuditReportI18n i18n, String ru, String en, String he) {
        return ReportFindingsCatalog.tr(i18n.lang, ru, en, he);
    }

    private static String yn(AuditReportI18n i18n, boolean v) {
        return v ? i18n.yes : i18n.no;
    }

    private static String pathOf(String url) {
        if (url == null || url.isBlank()) {
            return "/";
        }
        try {
            String path = java.net.URI.create(url).getPath();
            return path == null || path.isBlank() ? "/" : path;
        } catch (Exception e) {
            return url.replaceFirst("^https?://[^/]+", "");
        }
    }

    private static int extractCount(String text) {
        if (text == null) {
            return 1;
        }
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)").matcher(text);
        return m.find() ? Integer.parseInt(m.group(1)) : 1;
    }

    private static String clip(String s, int max) {
        if (s == null) {
            return "";
        }
        String t = s.replace('\n', ' ').trim();
        return t.length() <= max ? t : t.substring(0, max - 1) + "…";
    }

    private static boolean present(Object o) {
        return o != null && !String.valueOf(o).isBlank() && !"null".equalsIgnoreCase(String.valueOf(o));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Object o) {
        return o instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of();
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> listOfMaps(Object o) {
        if (!(o instanceof List<?> list)) {
            return List.of();
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> m) {
                out.add((Map<String, Object>) m);
            }
        }
        return out;
    }

    private static boolean bool(Object o) {
        return Boolean.TRUE.equals(o);
    }

    private static String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    private static long num(Object o, long fallback) {
        if (o instanceof Number n) {
            return n.longValue();
        }
        if (o != null) {
            try {
                return Long.parseLong(String.valueOf(o).replaceAll("[^0-9\\-]", "").replaceAll("(?<!^)-", ""));
            } catch (Exception ignored) {
                return fallback;
            }
        }
        return fallback;
    }
}
