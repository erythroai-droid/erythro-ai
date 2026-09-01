package ai.erythro;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * A requested locale (LOCALES=en,ru,he) is not the same as a live language version.
 * Hebrew/RTL findings must run only when the site actually serves Hebrew.
 */
final class LocalePresence {

    private static final Pattern HEBREW = Pattern.compile("[\\u0590-\\u05FF]");
    private static final Pattern ARABIC = Pattern.compile("[\\u0600-\\u06FF]");
    private static final Pattern CYRILLIC = Pattern.compile("[\\u0400-\\u04FF]");
    private static final Set<String> RTL_LOCALES = Set.of("he", "iw", "ar");

    private LocalePresence() {}

    static boolean isRtlLocale(String loc) {
        return loc != null && RTL_LOCALES.contains(loc.trim().toLowerCase(Locale.ROOT));
    }

    @SuppressWarnings("unchecked")
    static List<String> forReport(List<String> requested, Map<String, Object> report) {
        Map<String, Object> audits = map(report == null ? null : report.get("audits_by_locale"));
        List<String> source = new ArrayList<>();
        appendCodes(source, requested);
        if (source.isEmpty()) {
            appendCodes(source, report == null ? null : report.get("locales_audited"));
        }
        if (source.isEmpty()) {
            appendCodes(source, report == null ? null : report.get("locales"));
        }
        if (source.isEmpty()) {
            source.addAll(audits.keySet());
        }

        List<String> out = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (String loc : source) {
            String code = normalize(loc);
            if (code.isEmpty() || !seen.add(code)) {
                continue;
            }
            Object raw = audits.get(code);
            if (isRtlLocale(code) && !isActive(code, raw)) {
                continue;
            }
            out.add(code);
        }
        if (out.isEmpty() && !source.isEmpty()) {
            out.add(normalize(source.get(0)));
        }
        return out;
    }

    static boolean hebrewActive(Map<String, Object> report) {
        Map<String, Object> audits = map(report == null ? null : report.get("audits_by_locale"));
        return isActive("he", audits.get("he")) || isActive("iw", audits.get("iw"));
    }

    static boolean isActive(String loc, Object localeAudit) {
        if (!(localeAudit instanceof Map<?, ?> raw)) {
            return false;
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> audit = (Map<String, Object>) raw;
        if (Boolean.FALSE.equals(audit.get("locale_present"))) {
            return false;
        }
        if (Boolean.TRUE.equals(audit.get("locale_present"))) {
            return true;
        }
        return inferActive(normalize(loc), audit);
    }

    static void annotate(String loc, Map<String, Object> localeResult) {
        if (localeResult == null) {
            return;
        }
        boolean present = inferActive(normalize(loc), localeResult);
        localeResult.put("locale_present", present);
    }

    private static boolean inferActive(String loc, Map<String, Object> audit) {
        if (loc.isEmpty() || audit == null) {
            return false;
        }
        Map<String, Object> seo = map(audit.get("seo"));
        String htmlLang = str(seo.get("htmlLang"));
        if (langMatches(htmlLang, loc)) {
            return true;
        }
        if (hreflangMatches(map(audit.get("seo_assets")).get("hreflangs"), loc)) {
            return true;
        }
        if (isRtlLocale(loc)) {
            Map<String, Object> rtl = map(audit.get("rtl_audit"));
            if (Boolean.TRUE.equals(rtl.get("isRtlDeclared"))) {
                return true;
            }
            if ("rtl".equalsIgnoreCase(str(rtl.get("computedDirection")))
                    || "rtl".equalsIgnoreCase(str(seo.get("dir")))) {
                return true;
            }
        }
        return textsMatchScript(loc, audit.get("extracted_texts"));
    }

    private static boolean langMatches(String htmlLang, String loc) {
        if (htmlLang == null || htmlLang.isBlank() || "null".equalsIgnoreCase(htmlLang)) {
            return false;
        }
        String lang = htmlLang.trim().toLowerCase(Locale.ROOT).replace('_', '-');
        String code = loc.equals("iw") ? "he" : loc;
        String langCode = lang.startsWith("iw") ? "he" + lang.substring(2) : lang;
        return langCode.equals(code) || langCode.startsWith(code + "-");
    }

    private static boolean hreflangMatches(Object raw, String loc) {
        if (!(raw instanceof List<?> list)) {
            return false;
        }
        for (Object item : list) {
            if (langMatches(String.valueOf(item), loc)) {
                return true;
            }
        }
        return false;
    }

    private static boolean textsMatchScript(String loc, Object extracted) {
        String blob = joinTexts(extracted);
        if (blob.isBlank()) {
            return false;
        }
        return switch (loc) {
            case "he", "iw" -> HEBREW.matcher(blob).find();
            case "ar" -> ARABIC.matcher(blob).find();
            case "ru" -> CYRILLIC.matcher(blob).find();
            default -> false;
        };
    }

    private static String joinTexts(Object extracted) {
        if (extracted instanceof List<?> list) {
            StringBuilder sb = new StringBuilder();
            for (Object item : list) {
                if (item != null) {
                    sb.append(item).append('\n');
                }
            }
            return sb.toString();
        }
        return extracted == null ? "" : String.valueOf(extracted);
    }

    private static void appendCodes(List<String> target, Object raw) {
        if (!(raw instanceof List<?> list)) {
            return;
        }
        for (Object item : list) {
            if (item != null) {
                target.add(String.valueOf(item));
            }
        }
    }

    private static String normalize(String loc) {
        return loc == null ? "" : loc.trim().toLowerCase(Locale.ROOT);
    }

    private static String str(Object value) {
        return value == null || "null".equals(String.valueOf(value)) ? "" : String.valueOf(value);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Object raw) {
        return raw instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of();
    }
}
