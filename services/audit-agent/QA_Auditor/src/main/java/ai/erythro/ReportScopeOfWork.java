package ai.erythro;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Coverage protocol for PDF/Markdown. Numbers follow AuditCollector / AGENTS.md:
 * unique signal types plus locale- and page-multiplied observations.
 */
public final class ReportScopeOfWork {

    static final int NET = 13;
    static final int INDEX = 6;
    static final int AI_HTTP = 4;
    static final int AI_DOM = 7;
    static final int L1 = 5;
    static final int PSI_METRICS = 10;
    static final int LOCALE_TYPES = 28;
    static final int AGENT_PER_PAGE = 9;
    static final int AI_BOTS = 8;
    static final int SEC_HEADERS = 6;
    static final int AI_SCORE = 7;
    static final int UNIQUE_TYPES = NET + INDEX + AI_HTTP + AI_DOM + L1 + PSI_METRICS + LOCALE_TYPES;

    private ReportScopeOfWork() {}

    public static final class Stats {
        public final String host;
        public final String localesStr;
        public final int localeCount;
        public final boolean hebrew;
        public final boolean spellcheck;
        public final int uniqueTypes;
        public final int observations;
        public final int labPages;
        public final int pagesOk;
        public final int candidates;
        public final int sitemapLocs;
        public final int psiDevices;
        public final int localeObs;
        public final int summaryCards;
        public final int proCards;

        Stats(
                String host, String localesStr, int localeCount, boolean hebrew, boolean spellcheck,
                int uniqueTypes, int observations, int labPages, int pagesOk,
                int candidates, int sitemapLocs, int psiDevices, int localeObs,
                int summaryCards, int proCards
        ) {
            this.host = host;
            this.localesStr = localesStr;
            this.localeCount = localeCount;
            this.hebrew = hebrew;
            this.spellcheck = spellcheck;
            this.uniqueTypes = uniqueTypes;
            this.observations = observations;
            this.labPages = labPages;
            this.pagesOk = pagesOk;
            this.candidates = candidates;
            this.sitemapLocs = sitemapLocs;
            this.psiDevices = psiDevices;
            this.localeObs = localeObs;
            this.summaryCards = summaryCards;
            this.proCards = proCards;
        }

        static Stats from(Map<String, Object> report, List<String> locales, String host) {
            List<String> locs = LocalePresence.forReport(locales, report);
            if (locs == null || locs.isEmpty()) {
                locs = List.of("en");
            }
            int n = locs.size();
            boolean he = false;
            boolean spell = false;
            for (String loc : locs) {
                String c = loc.trim().toLowerCase(Locale.ROOT);
                if ("he".equals(c) || "iw".equals(c)) {
                    he = true;
                }
                if ("en".equals(c) || "ru".equals(c)) {
                    spell = true;
                }
            }
            Map<String, Object> agent = map(report == null ? null : report.get("agent_browse"));
            int lab = num(agent.get("pages_visited"), 0);
            int ok = num(agent.get("pages_ok"), lab);
            int cand = num(agent.get("candidates_total"), 0);
            Map<String, Object> psi = map(report == null ? null : report.get("pagespeed_insights"));
            int psiDev = 0;
            if (!map(psi.get("mobile")).isEmpty()) {
                psiDev++;
            }
            if (!map(psi.get("desktop")).isEmpty()) {
                psiDev++;
            }
            if (psiDev == 0) {
                psiDev = 2;
            }
            int sitemap = sitemapLocs(report);
            int localeObs = LOCALE_TYPES * n;
            int obs = NET + INDEX + AI_HTTP + AI_DOM + L1
                    + PSI_METRICS * psiDev
                    + localeObs
                    + AGENT_PER_PAGE * Math.max(lab, 1);
            int summary = he ? 11 : 10;
            int agentPages = Math.min(Math.max(lab, 1), A44Tier.PRO.pageCap);
            int pro = summary + 3 + n + 1 + agentPages;
            String localesStr = String.join(", ", locs).toUpperCase(Locale.ROOT);
            return new Stats(
                    host == null || host.isBlank() ? "—" : host,
                    localesStr, n, he, spell,
                    UNIQUE_TYPES, obs, Math.max(lab, 1), Math.max(ok, 0),
                    cand, sitemap, psiDev, localeObs,
                    summary, pro
            );
        }

        static Stats from(AuditReportView view) {
            if (view == null) {
                return from(Map.of(), List.of("en"), "—");
            }
            if (view.scope != null) {
                return view.scope;
            }
            return from(Map.of(), parseLocales(view.localesStr), view.displayUrl).withLab(
                    view.pagesVisited, view.pagesOk,
                    view.checkRows == null ? 0 : view.checkRows.size(),
                    view.fullSignalRows == null ? 0 : view.fullSignalRows.size()
            );
        }

        Stats withCounts(int summary, int pro) {
            return new Stats(
                    host, localesStr, localeCount, hebrew, spellcheck,
                    uniqueTypes, observations, labPages, pagesOk,
                    candidates, sitemapLocs, psiDevices, localeObs,
                    summary > 0 ? summary : summaryCards,
                    pro > 0 ? pro : proCards
            );
        }

        private Stats withLab(int lab, int ok, int summary, int pro) {
            int labPages = Math.max(lab, 1);
            int localeObs = LOCALE_TYPES * localeCount;
            int obs = NET + INDEX + AI_HTTP + AI_DOM + L1
                    + PSI_METRICS * psiDevices
                    + localeObs
                    + AGENT_PER_PAGE * labPages;
            return new Stats(
                    host, localesStr, localeCount, hebrew, spellcheck,
                    uniqueTypes, obs, labPages, Math.max(ok, 0),
                    candidates, sitemapLocs, psiDevices, localeObs,
                    summary > 0 ? summary : summaryCards,
                    pro > 0 ? pro : proCards
            );
        }

        @SuppressWarnings("unchecked")
        private static int sitemapLocs(Map<String, Object> report) {
            if (report == null) {
                return 0;
            }
            Map<String, Object> ai = map(report.get("ai_visibility"));
            Map<String, Object> l1 = map(ai.get("vercel_level1"));
            Map<String, Object> sm = map(l1.get("sitemap"));
            int loc = num(sm.get("loc_count"), 0);
            if (loc > 0) {
                return loc;
            }
            Map<String, Object> idx = map(report.get("indexing"));
            if (idx.isEmpty()) {
                idx = map(report.get("seo_index"));
            }
            return num(idx.get("sitemap_urls_count"),
                    num(idx.get("sitemap_url_count"), num(idx.get("url_count"), 0)));
        }

        @SuppressWarnings("unchecked")
        private static Map<String, Object> map(Object raw) {
            return raw instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of();
        }

        private static int num(Object raw, int fallback) {
            if (raw instanceof Number n) {
                return n.intValue();
            }
            if (raw != null) {
                try {
                    return Integer.parseInt(String.valueOf(raw).trim());
                } catch (NumberFormatException ignored) {
                    return fallback;
                }
            }
            return fallback;
        }

        private static List<String> parseLocales(String localesStr) {
            List<String> out = new ArrayList<>();
            if (localesStr == null || localesStr.isBlank()) {
                return List.of("en");
            }
            for (String part : localesStr.split("[,/|]")) {
                String t = part.trim();
                if (!t.isEmpty()) {
                    out.add(t.toLowerCase(Locale.ROOT));
                }
            }
            return out.isEmpty() ? List.of("en") : out;
        }
    }

    public static String inject(String html, String lang, String localesStr) {
        return inject(html, lang, Stats.from(Map.of(), parseList(localesStr), "—"));
    }

    public static String inject(String html, AuditReportView view) {
        if (view == null) {
            return html;
        }
        return inject(html, view.i18n == null ? "ru" : view.i18n.lang, Stats.from(view));
    }

    public static String inject(String html, String lang, Stats stats) {
        if (html == null || html.isBlank()) {
            return html;
        }
        int styleEnd = html.lastIndexOf("</style>");
        if (styleEnd >= 0) {
            html = html.substring(0, styleEnd) + CSS + html.substring(styleEnd);
        }
        String section = htmlSection(lang, stats, A44Tier.PRO, null);
        String marker = "<!-- {{SCOPE_OF_WORK}} -->";
        if (html.contains(marker)) {
            return html.replace(marker, section);
        }
        String needleLf = "    </div>\n        </td></tr></tbody>";
        String needleCrlf = "    </div>\r\n        </td></tr></tbody>";
        int pos = html.lastIndexOf(needleCrlf);
        String needle = needleCrlf;
        if (pos < 0) {
            pos = html.lastIndexOf(needleLf);
            needle = needleLf;
        }
        if (pos >= 0) {
            return html.substring(0, pos) + section + needle + html.substring(pos + needle.length());
        }
        return html;
    }

    public static String sectionRow(AuditReportView view, A44Tier tier) {
        A44Tier t = tier == null ? A44Tier.PRO : tier;
        String unlock = (view != null && view.i18n != null && t != A44Tier.PRO)
                ? view.i18n.unlockReportUrl : null;
        return htmlSection(
                view == null || view.i18n == null ? "ru" : view.i18n.lang,
                Stats.from(view),
                t,
                unlock
        );
    }

    public static String sectionRow(String lang, String localesStr) {
        return htmlSection(lang, Stats.from(Map.of(), parseList(localesStr), "—"), A44Tier.PRO, null);
    }

    public static String sectionRow(String lang, String localesStr, int pageCap) {
        return sectionRow(lang, localesStr, pageCap, pageCap, A44Tier.PRO);
    }

    public static String sectionRow(String lang, String localesStr, int labPages, int disclosedPages, A44Tier tier) {
        Stats base = Stats.from(Map.of(), parseList(localesStr), "—");
        Stats stats = new Stats(
                base.host, base.localesStr, base.localeCount, base.hebrew, base.spellcheck,
                base.uniqueTypes,
                NET + INDEX + AI_HTTP + AI_DOM + L1 + PSI_METRICS * base.psiDevices
                        + LOCALE_TYPES * base.localeCount + AGENT_PER_PAGE * Math.max(labPages, 1),
                Math.max(labPages, 1), base.pagesOk, base.candidates, base.sitemapLocs, base.psiDevices,
                LOCALE_TYPES * base.localeCount, base.summaryCards, base.proCards
        );
        return htmlSection(lang, stats, tier == null ? A44Tier.PRO : tier, null);
    }

    public static String markdown(String lang, List<String> locales) {
        return markdown(lang, Stats.from(Map.of(), locales, "—"));
    }

    public static String markdown(String lang, Map<String, Object> report, List<String> locales, String host) {
        return markdown(lang, Stats.from(report, locales, host));
    }

    public static String markdown(String lang, Stats stats) {
        Copy copy = copyFor(lang);
        int shown = stats.labPages;
        StringBuilder sb = new StringBuilder();
        sb.append("\n## ").append(copy.mdTitle).append("\n\n");
        sb.append(plain(fill(copy.lead, stats, shown, A44Tier.PRO))).append("\n\n");
        for (String chip : chips(copy, stats, A44Tier.PRO)) {
            sb.append("**").append(chip).append("**  \n");
        }
        sb.append("\n");
        for (String item : coverageItems(copy, stats, shown, A44Tier.PRO)) {
            sb.append("- ").append(item).append("\n");
        }
        sb.append("\n").append(plain(fill(copy.closing, stats, shown, A44Tier.PRO))).append("\n");
        return sb.toString();
    }

    private static String htmlSection(String lang, Stats stats, A44Tier tier, String unlockUrl) {
        Copy copy = copyFor(lang);
        int shown = disclosed(stats.labPages, tier);
        String lead = fill(leadFor(copy, tier), stats, shown, tier);
        String closing = fill(closingFor(copy, tier), stats, shown, tier);
        StringBuilder chips = new StringBuilder();
        chips.append("<div class=\"scope-stats\">");
        for (String chip : chips(copy, stats, tier)) {
            chips.append(chipHtml(chip));
        }
        chips.append("</div>");
        StringBuilder items = new StringBuilder();
        items.append("<ul class=\"scope-items\">");
        for (String item : coverageItems(copy, stats, shown, tier)) {
            items.append(itemHtml(item));
        }
        items.append("</ul>");
        String cta = "";
        if (tier != A44Tier.PRO && unlockUrl != null && !unlockUrl.isBlank()) {
            cta = "                    <p class=\"scope-cta\">"
                    + "<a class=\"scope-cta-btn\" href=\"" + esc(unlockUrl) + "\">"
                    + esc(copy.ctaPro) + "</a></p>\n";
        }

        return "\n        <div class=\"section-row section-scope\">\n"
                + "            <div class=\"section-toc\">\n"
                + "                <div class=\"toc-item\">\n"
                + "                    <div class=\"toc-bar\"></div>\n"
                + "                    <div class=\"toc-text\">" + copy.tocHtml + "</div>\n"
                + "                </div>\n"
                + "            </div>\n"
                + "            <div class=\"section-content\">\n"
                + "                <div class=\"scope\">\n"
                + "                    <p class=\"scope-lead\">" + lead + "</p>\n"
                + chips
                + items
                + "                    <p class=\"scope-note\">" + closing + "</p>\n"
                + cta
                + "                </div>\n"
                + "            </div>\n"
                + "        </div>\n";
    }

    private static int disclosed(int labPages, A44Tier tier) {
        int lab = Math.max(1, labPages);
        if (tier == A44Tier.FREE) {
            return 1;
        }
        return Math.min(lab, tier.pageCap);
    }

    private static String leadFor(Copy copy, A44Tier tier) {
        if (tier == A44Tier.FREE) {
            return copy.leadPreview;
        }
        if (tier == A44Tier.DIAGNOSTIC) {
            return copy.leadDiagnostic;
        }
        return copy.lead;
    }

    private static String closingFor(Copy copy, A44Tier tier) {
        if (tier == A44Tier.FREE) {
            return copy.closingPreview;
        }
        if (tier == A44Tier.DIAGNOSTIC) {
            return copy.closingDiagnostic;
        }
        return copy.closing;
    }

    private static List<String> chips(Copy copy, Stats stats, A44Tier tier) {
        int shown = disclosed(stats.labPages, tier);
        List<String> out = new ArrayList<>();
        out.add(fill(copy.chipTypes, stats, shown, tier));
        out.add(fill(copy.chipObs, stats, shown, tier));
        if (tier == A44Tier.PRO) {
            out.add(fill(copy.chipLocales, stats, shown, tier));
        }
        out.add(fill(copy.chipPsi, stats, shown, tier));
        out.add(fill(copy.chipFunnel, stats, shown, tier));
        if (shown < stats.labPages) {
            out.add(fill(copy.chipDisclosed, stats, shown, tier));
        }
        return out;
    }

    private static List<String> coverageItems(Copy copy, Stats stats, int shown, A44Tier tier) {
        List<String> out = new ArrayList<>();
        if (tier == A44Tier.FREE) {
            for (String item : copy.itemsFree) {
                out.add(fill(item, stats, shown, tier));
            }
            return out;
        }
        if (tier == A44Tier.DIAGNOSTIC) {
            for (String item : copy.itemsDiagnostic) {
                out.add(fill(item, stats, shown, tier));
            }
            return out;
        }
        for (String item : copy.itemsCore) {
            out.add(fill(item, stats, shown, tier));
        }
        if (stats.hebrew) {
            out.add(fill(copy.itemRtl, stats, shown, tier));
        }
        if (stats.spellcheck) {
            out.add(fill(copy.itemSpell, stats, shown, tier));
        }
        out.add(fill(copy.itemFunnel, stats, shown, tier));
        out.add(fill(copy.itemPackPro, stats, shown, tier));
        return out;
    }

    private static String fill(String template, Stats stats, int shown, A44Tier tier) {
        if (template == null) {
            return "";
        }
        return template
                .replace("{{HOST}}", esc(stats.host))
                .replace("{{LOCALES}}", esc(stats.localesStr))
                .replace("{{N}}", String.valueOf(stats.localeCount))
                .replace("{{UNIQUE}}", String.valueOf(stats.uniqueTypes))
                .replace("{{OBS}}", String.valueOf(stats.observations))
                .replace("{{LAB}}", String.valueOf(stats.labPages))
                .replace("{{OK}}", String.valueOf(stats.pagesOk))
                .replace("{{SHOWN}}", String.valueOf(shown))
                .replace("{{CAND}}", String.valueOf(Math.max(stats.candidates, stats.labPages)))
                .replace("{{SITEMAP}}", String.valueOf(stats.sitemapLocs))
                .replace("{{PSI}}", String.valueOf(stats.psiDevices))
                .replace("{{LOC_OBS}}", String.valueOf(stats.localeObs))
                .replace("{{LOC_TYPES}}", String.valueOf(LOCALE_TYPES))
                .replace("{{NET}}", String.valueOf(NET))
                .replace("{{BOTS}}", String.valueOf(AI_BOTS))
                .replace("{{HEADERS}}", String.valueOf(SEC_HEADERS))
                .replace("{{L1}}", String.valueOf(L1))
                .replace("{{AI_SCORE}}", String.valueOf(AI_SCORE))
                .replace("{{PSI_M}}", String.valueOf(PSI_METRICS))
                .replace("{{AGENT}}", String.valueOf(AGENT_PER_PAGE))
                .replace("{{SUM}}", String.valueOf(stats.summaryCards))
                .replace("{{PRO}}", String.valueOf(stats.proCards))
                .replace("{{SCALES}}", "5")
                .replace("{{TIER_CAP}}", String.valueOf(tier.pageCap));
    }

    private static List<String> parseList(String localesStr) {
        return Stats.parseLocales(localesStr);
    }

    private static String plain(String html) {
        return html == null ? "" : html.replaceAll("<[^>]+>", "");
    }

    private static String chipHtml(String chip) {
        if (chip == null || chip.isEmpty()) {
            return "<span class=\"scope-chip\"></span>";
        }
        int i = 0;
        while (i < chip.length() && Character.isDigit(chip.charAt(i))) {
            i++;
        }
        if (i > 0 && i < chip.length()) {
            return "<span class=\"scope-chip\"><span class=\"scope-chip-n\">"
                    + esc(chip.substring(0, i)) + "</span>" + esc(chip.substring(i)) + "</span>";
        }
        return "<span class=\"scope-chip\">" + esc(chip) + "</span>";
    }

    private static String itemHtml(String item) {
        if (item == null || item.isEmpty()) {
            return "<li></li>";
        }
        int pos = -1;
        int sepLen = 0;
        for (String sep : new String[]{" — ", " – ", " - "}) {
            int i = item.indexOf(sep);
            if (i > 0 && i <= 48) {
                pos = i;
                sepLen = sep.length();
                break;
            }
        }
        if (pos < 0) {
            return "<li><span class=\"scope-item-v\">" + esc(item) + "</span></li>";
        }
        return "<li><span class=\"scope-item-k\">" + esc(item.substring(0, pos))
                + "</span><span class=\"scope-item-v\">" + esc(item.substring(pos + sepLen))
                + "</span></li>";
    }

    private static String esc(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private static Copy copyFor(String lang) {
        if (lang == null) return RU;
        return switch (lang.trim().toLowerCase(Locale.ROOT)) {
            case "en" -> EN;
            case "he" -> HE;
            default -> RU;
        };
    }

    private record Copy(
            String tocHtml,
            String mdTitle,
            String lead,
            String leadDiagnostic,
            String leadPreview,
            String closing,
            String closingDiagnostic,
            String closingPreview,
            String chipTypes,
            String chipObs,
            String chipLocales,
            String chipPsi,
            String chipFunnel,
            String chipDisclosed,
            String[] itemsCore,
            String itemRtl,
            String itemSpell,
            String itemFunnel,
            String itemPackPro,
            String itemPackDiagnostic,
            String itemPackFree,
            String[] itemsFree,
            String[] itemsDiagnostic,
            String ctaPro
    ) {}

    private static final String CSS = """

    .section-row.section-scope {
        page-break-inside: avoid;
        break-inside: avoid;
    }
    .section-scope .scope,
    .section-scope .section-content {
        page-break-inside: avoid;
        break-inside: avoid;
    }
    .section-scope .section-toc {
        padding-top: 20rem;
    }
    .section-scope .toc-item {
        align-items: stretch;
        min-height: 72rem;
    }
    .section-scope .toc-bar {
        height: auto;
        min-height: 72rem;
        margin-top: 0;
        align-self: stretch;
    }
    .section-scope .toc-text {
        line-height: 24rem;
    }
    .section-scope .section-content {
        width: 379rem;
        margin: 20rem;
        padding: 30rem;
        background: #ffffff;
        box-sizing: border-box;
    }
    .scope {
        width: auto;
        margin: 0;
    }
    .scope-lead {
        font-size: 8rem;
        font-weight: 400;
        line-height: 14rem;
        color: #1e1e1e;
        margin: 0 0 12rem 0;
    }
    .scope-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 6rem;
        margin: 0 0 14rem 0;
    }
    .scope-chip {
        font-size: 7rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        line-height: 10rem;
        text-transform: uppercase;
        color: #ffffff;
        background: #1e1e1e;
        border-radius: 4rem;
        padding: 5rem 9rem;
    }
    .scope-chip-n { font-weight: 800; letter-spacing: 0; }
    .scope-items {
        list-style: none;
        margin: 0 0 12rem 0;
        padding: 0;
        border-top: 1rem solid #e8e8e8;
    }
    .scope-items li {
        font-size: 8rem;
        line-height: 14rem;
        color: #1e1e1e;
        margin: 0;
        padding: 8rem 0 8rem 12rem;
        border-bottom: 1rem solid #e8e8e8;
        position: relative;
    }
    .scope-items li::before {
        content: "";
        position: absolute;
        left: 0;
        top: 13rem;
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        background: #e52421;
    }
    .scope-item-k {
        display: block;
        font-weight: 700;
        line-height: 14rem;
        color: #1e1e1e;
        margin: 0 0 2rem;
    }
    .scope-item-v {
        display: block;
        font-weight: 400;
        line-height: 14rem;
        color: #3f3f3f;
    }
    .scope-note {
        font-size: 7rem;
        line-height: 14rem;
        color: #3f3f3f;
        margin: 0;
        padding: 8rem 10rem;
        background: #f7f7f7;
        border-left: 3rem solid #e52421;
        box-sizing: border-box;
    }
    html.rtl-report .scope-items {
        padding: 0;
    }
    html.rtl-report .scope-items li {
        padding: 8rem 12rem 8rem 0;
    }
    html.rtl-report .scope-items li::before {
        left: auto;
        right: 0;
    }
    html.rtl-report .scope-note {
        border-left: none;
        border-right: 3rem solid #e52421;
    }
    html.rtl-report .scope-stats {
        direction: rtl;
    }
    .scope-cta {
        margin: 16rem 0 0;
        text-align: center;
    }
    .scope-cta-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 220rem;
        max-width: 100%;
        min-height: 28rem;
        padding: 6rem 14rem;
        border-radius: 16rem;
        background: #e52421;
        color: #fff;
        font-size: 8rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        text-decoration: none;
        text-align: center;
        line-height: 12rem;
        box-sizing: border-box;
    }
    html.rtl-report .scope-cta-btn { direction: rtl; }
    @media print {
        .section-row.section-scope {
            display: table;
            width: 595rem;
            table-layout: fixed;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .section-row.section-scope > .section-toc,
        .section-row.section-scope > .section-content {
            display: table-cell;
            vertical-align: top;
        }
        .section-scope .scope,
        .section-scope .section-content {
            page-break-inside: avoid;
            break-inside: avoid;
        }
    }
""";

    private static final Copy RU = new Copy(
            "протокол<br>выполненного<br>аудита",
            "9. Протокол выполненного аудита",
            "Лаборатория Erythro.ai проверила <strong>{{HOST}}</strong> в локалях <strong>{{LOCALES}}</strong> "
                    + "на мобильном (iPhone SE 375×667) и десктопе. {{SCALES}} шкал scorecard и {{AI_SCORE}} баллов "
                    + "AI Visibility — это свод, не объём лаборатории.",
            "Лаборатория выполнена полностью: <strong>{{HOST}}</strong>, локали <strong>{{LOCALES}}</strong>, "
                    + "мобильный и десктоп. В диагностический пакет входят свод и {{SUM}} карточек статуса; "
                    + "пошаговый план — в Pro.",
            "Лаборатория уже выполнена на <strong>{{HOST}}</strong> (локали <strong>{{LOCALES}}</strong>). "
                    + "Это превью: цифры scorecard и топ-3. Полный протокол и чеклист — в платном отчёте.",
            "В этот PDF входят executive scorecard ({{SCALES}} шкал), топ-3 уязвимости конверсии, "
                    + "чеклист из {{PRO}} строк, Lighthouse mobile+desktop и {{SHOWN}} страниц воронки. "
                    + "Сырой JSON — по запросу, не часть публикуемого файла.",
            "В этот PDF входят scorecard, топ-3, {{SUM}} сводных карточек чеклиста (отлично → внимание → критично), "
                    + "Lighthouse и {{SHOWN}} URL воронки. Полный чеклист {{PRO}} строк и рекомендации — в Pro.",
            "В превью: scorecard, топ-3 и Lighthouse. Чеклист {{PRO}} строк и {{LAB}} URL воронки лаборатория уже сняла — "
                    + "они раскрываются в Diagnostic / Pro.",
            "{{UNIQUE}} типов сигналов",
            "{{OBS}} наблюдений",
            "{{N}} локали · {{LOC_OBS}} проверок",
            "Lighthouse × {{PSI}}",
            "лаборатория {{LAB}} URL",
            "в этом PDF {{SHOWN}} URL",
            new String[]{
                    "Сеть и безопасность — {{NET}} параметров: HTTPS, HTTP-статус главной, TTFB, Server, "
                            + "{{HEADERS}} заголовков (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, "
                            + "Referrer-Policy, Permissions-Policy), ответы 4xx/5xx и runtime JS (console / PageError)",
                    "Индексация — robots.txt, sitemap.xml ({{SITEMAP}} URL в карте), директива Sitemap:; "
                            + "правила для {{BOTS}} AI-ботов (GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, "
                            + "CCBot, Google-Extended, Applebot-Extended, PerplexityBot) и флаг severe_block",
                    "AI Visibility — GET /llms.txt, /.well-known/mcp, /api/mcp, /about; JSON-LD Organization/FAQ, "
                            + "link rel=describedby, dataLayer и consent stub. {{AI_SCORE}} критериев входят в балл scorecard; "
                            + "это не весь объём блока",
                    "Agent Readiness Level 1 — {{L1}} отдельных проверок (валидный robots, sitemap для агентов, "
                            + "правила ботов, Content-Signal, markdown negotiation). Балл L1 не входит в {{AI_SCORE}} критериев AI Visibility",
                    "Google PageSpeed Insights — {{PSI_M}} метрик × {{PSI}} устройств (Performance, Accessibility, "
                            + "Best Practices, SEO, FCP, LCP, CLS, TBT, Speed Index, TTI)",
                    "На каждой локали — {{LOC_TYPES}} сигналов × {{N}} = {{LOC_OBS}}: title, description, OpenGraph, "
                            + "canonical, hreflang, favicon, заголовки, overflow-x на 375px, формы и антиспам, "
                            + "axe-core WCAG 2.1 AA / IS 5568"
            },
            "Иврит / RTL — dir на html/body, computed direction, выравнивание заголовков для аудитории Израиля",
            "Орфография — LanguageTool на локалях EN и RU (с словарём исключений Erythro.ai)",
            "Агентный обход воронки — {{CAND}} кандидатов из sitemap и навигации; открыто {{LAB}} URL "
                    + "(успешно {{OK}}). На каждую страницу {{AGENT}} сигналов: HTTP, title, h1, формы, CTA, "
                    + "soft-404, lang, dir, объём текста. В этом отчёте раскрыто {{SHOWN}}",
            "Пакет Pro — {{PRO}} строк чеклиста, {{SHOWN}} URL воронки, scorecard и топ-3",
            "Пакет Diagnostic — {{SUM}} сводных карточек и {{SHOWN}} URL; {{PRO}} строк полного чеклиста — в Pro",
            "Превью — раскрывает главную; лаборатория уже обошла {{LAB}} URL и {{UNIQUE}} типов сигналов",
            new String[]{
                    "Превью — scorecard ({{SCALES}} шкал), топ-3 уязвимости и Lighthouse. Карточки чеклиста и рекомендации скрыты.",
                    "Лаборатория — {{UNIQUE}} типов сигналов и {{OBS}} наблюдений ({{LAB}} URL воронки). Построчный список {{PRO}} проверок — в пакете Pro."
            },
            new String[]{
                    "Пакет Diagnostic — scorecard, топ-3, {{SUM}} сводных карточек и {{SHOWN}} URL воронки. Не полный чеклист из {{PRO}} строк.",
                    "Лаборатория — {{UNIQUE}} типов / {{OBS}} наблюдений. Весь аудит и рекомендации — в пакете Pro."
            },
            "Открыть весь аудит с пакетом Pro"
    );

    private static final Copy EN = new Copy(
            "completed<br>audit protocol",
            "9. Completed audit protocol",
            "Erythro.ai lab tested <strong>{{HOST}}</strong> in locales <strong>{{LOCALES}}</strong> "
                    + "on mobile (iPhone SE 375×667) and desktop. The {{SCALES}} scorecard scales and "
                    + "{{AI_SCORE}} AI Visibility score points summarise the lab — they are not the lab.",
            "Full lab already ran on <strong>{{HOST}}</strong> (locales <strong>{{LOCALES}}</strong>). "
                    + "This diagnostic pack shows the rollup and {{SUM}} status cards; the fix plan is in Pro.",
            "The lab already ran on <strong>{{HOST}}</strong> (locales <strong>{{LOCALES}}</strong>). "
                    + "This preview shows the scorecard and top-3. The full protocol and checklist are in the paid report.",
            "This PDF includes the {{SCALES}}-scale scorecard, top-3 conversion gaps, "
                    + "a {{PRO}}-row checklist, Lighthouse mobile+desktop and {{SHOWN}} funnel URLs. "
                    + "Raw JSON is on request — not in this file.",
            "This PDF includes the scorecard, top-3, {{SUM}} summary checklist cards (excellent → attention → critical), "
                    + "Lighthouse and {{SHOWN}} funnel URLs. The {{PRO}}-row checklist and recommendations are in Pro.",
            "This preview includes the scorecard, top-3 and Lighthouse. The lab already captured the {{PRO}}-row checklist "
                    + "and {{LAB}} funnel URLs — disclosed in Diagnostic / Pro.",
            "{{UNIQUE}} signal types",
            "{{OBS}} observations",
            "{{N}} locales · {{LOC_OBS}} checks",
            "Lighthouse × {{PSI}}",
            "lab {{LAB}} URLs",
            "in this PDF {{SHOWN}} URL",
            new String[]{
                    "Network & security — {{NET}} parameters: HTTPS, homepage HTTP status, TTFB, Server, "
                            + "{{HEADERS}} headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, "
                            + "Referrer-Policy, Permissions-Policy), 4xx/5xx and runtime JS (console / PageError)",
                    "Indexing — robots.txt, sitemap.xml ({{SITEMAP}} URLs in the map), Sitemap: directive; "
                            + "rules for {{BOTS}} AI crawlers (GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, "
                            + "CCBot, Google-Extended, Applebot-Extended, PerplexityBot) and severe_block",
                    "AI Visibility — GET /llms.txt, /.well-known/mcp, /api/mcp, /about; JSON-LD Organization/FAQ, "
                            + "rel=describedby, dataLayer and consent stub. {{AI_SCORE}} criteria feed the scorecard score; "
                            + "that is not the whole block",
                    "Agent Readiness Level 1 — {{L1}} checks (valid robots, agent sitemap, crawler rules, "
                            + "Content-Signal, markdown negotiation). The L1 score is not part of the {{AI_SCORE}} AI Visibility criteria",
                    "Google PageSpeed Insights — {{PSI_M}} metrics × {{PSI}} devices (Performance, Accessibility, "
                            + "Best Practices, SEO, FCP, LCP, CLS, TBT, Speed Index, TTI)",
                    "Per locale — {{LOC_TYPES}} signals × {{N}} = {{LOC_OBS}}: title, description, OpenGraph, "
                            + "canonical, hreflang, favicon, headings, overflow-x at 375px, forms and anti-spam, "
                            + "axe-core WCAG 2.1 AA / IS 5568"
            },
            "Hebrew / RTL — html/body dir, computed direction, heading alignment for the Israel audience",
            "Spelling — LanguageTool on EN and RU (with the Erythro.ai exception lexicon)",
            "Funnel crawl — {{CAND}} candidates from sitemap and nav; opened {{LAB}} URLs "
                    + "({{OK}} ok). {{AGENT}} signals per page: HTTP, title, h1, forms, CTA, "
                    + "soft-404, lang, dir, word count. This report discloses {{SHOWN}}",
            "Pro pack — {{PRO}} checklist rows, {{SHOWN}} funnel URLs, scorecard and top-3",
            "Diagnostic — {{SUM}} summary cards and {{SHOWN}} URLs; the {{PRO}}-row checklist is in Pro",
            "Preview — homepage only; the lab already crawled {{LAB}} URLs and {{UNIQUE}} signal types",
            new String[]{
                    "Preview — scorecard ({{SCALES}} scales), top-3 gaps and Lighthouse. Checklist cards and recommendations stay locked.",
                    "Lab — {{UNIQUE}} signal types and {{OBS}} observations ({{LAB}} funnel URLs). The {{PRO}}-row checklist is in the Pro pack."
            },
            new String[]{
                    "Diagnostic pack — scorecard, top-3, {{SUM}} summary cards and {{SHOWN}} funnel URLs. Not the full {{PRO}}-row checklist.",
                    "Lab — {{UNIQUE}} types / {{OBS}} observations. The full audit and recommendations are in Pro."
            },
            "Open the full audit with the Pro pack"
    );

    private static final Copy HE = new Copy(
            "פרוטוקול<br>האודיט<br>שבוצע",
            "9. פרוטוקול האודיט שבוצע",
            "המעבדה של Erythro.ai בדקה את <strong>{{HOST}}</strong> בשפות <strong>{{LOCALES}}</strong> "
                    + "במובייל (iPhone SE 375×667) ובדסקטופ. {{SCALES}} סולמות ה-scorecard ו-{{AI_SCORE}} נקודות "
                    + "AI Visibility הם סיכום, לא היקף המעבדה.",
            "המעבדה המלאה כבר רצה על <strong>{{HOST}}</strong> (שפות <strong>{{LOCALES}}</strong>). "
                    + "חבילת האבחון מציגה סיכום ו-{{SUM}} כרטיסי סטטוס; תוכנית התיקון ב-Pro.",
            "המעבדה כבר רצה על <strong>{{HOST}}</strong> (שפות <strong>{{LOCALES}}</strong>). "
                    + "זו תצוגה מקדימה: scorecard ו-3 פערים. הפרוטוקול המלא ורשימת הבדיקות — בדוח בתשלום.",
            "ה-PDF כולל scorecard בן {{SCALES}} סולמות, 3 פערים, "
                    + "רשימת {{PRO}} שורות, Lighthouse מובייל+דסקטופ ו-{{SHOWN}} URL במשפך. "
                    + "JSON גולמי לפי בקשה — לא בקובץ הזה.",
            "ה-PDF כולל scorecard, 3 פערים, {{SUM}} כרטיסי סיכום (מצוין → תשומת לב → קריטי), "
                    + "Lighthouse ו-{{SHOWN}} URL. רשימת {{PRO}} השורות וההמלצות — ב-Pro.",
            "התצוגה המקדימה כוללת scorecard, 3 פערים ו-Lighthouse. המעבדה כבר תפסה {{PRO}} שורות "
                    + "ו-{{LAB}} URL — נחשפים ב-Diagnostic / Pro.",
            "{{UNIQUE}} סוגי אותות",
            "{{OBS}} תצפיות",
            "{{N}} שפות · {{LOC_OBS}} בדיקות",
            "Lighthouse × {{PSI}}",
            "מעבדה {{LAB}} URL",
            "ב-PDF זה {{SHOWN}} URL",
            new String[]{
                    "רשת ואבטחה — {{NET}} פרמטרים: HTTPS, סטטוס HTTP, TTFB, Server, "
                            + "{{HEADERS}} כותרות (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, "
                            + "Referrer-Policy, Permissions-Policy), 4xx/5xx ו-JS בזמן ריצה",
                    "אינדוקס — robots.txt, sitemap.xml ({{SITEMAP}} URL במפה), הנחיית Sitemap:; "
                            + "כללים ל-{{BOTS}} בוטי AI (GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, "
                            + "CCBot, Google-Extended, Applebot-Extended, PerplexityBot) ו-severe_block",
                    "AI Visibility — GET /llms.txt, /.well-known/mcp, /api/mcp, /about; JSON-LD, "
                            + "rel=describedby, dataLayer ו-consent. {{AI_SCORE}} קריטריונים לציון; זה לא כל הבלוק",
                    "Agent Readiness Level 1 — {{L1}} בדיקות (robots, sitemap לסוכנים, כללי בוטים, "
                            + "Content-Signal, markdown negotiation). ציון L1 לא חלק מ-{{AI_SCORE}} קריטריוני AI Visibility",
                    "Google PageSpeed Insights — {{PSI_M}} מדדים × {{PSI}} מכשירים (Performance, Accessibility, "
                            + "Best Practices, SEO, FCP, LCP, CLS, TBT, Speed Index, TTI)",
                    "לכל שפה — {{LOC_TYPES}} אותות × {{N}} = {{LOC_OBS}}: title, description, OpenGraph, "
                            + "canonical, hreflang, favicon, כותרות, overflow-x ב-375px, טפסים ואנטי-ספאם, "
                            + "axe-core WCAG 2.1 AA / IS 5568"
            },
            "עברית / RTL — dir ב-html/body, direction מחושב, יישור כותרות לקהל בישראל",
            "איות — LanguageTool ב-EN ו-RU (עם לקסיקון החריגים של Erythro.ai)",
            "סריקת משפך — {{CAND}} מועמדים מ-sitemap וניווט; נפתחו {{LAB}} URL "
                    + "({{OK}} תקינים). {{AGENT}} אותות לעמוד. בדוח זה נחשפים {{SHOWN}}",
            "חבילת Pro — {{PRO}} שורות, {{SHOWN}} URL, scorecard ו-3 פערים",
            "Diagnostic — {{SUM}} כרטיסי סיכום ו-{{SHOWN}} URL; {{PRO}} השורות ב-Pro",
            "תצוגה מקדימה — דף הבית; המעבדה כבר סרקה {{LAB}} URL ו-{{UNIQUE}} סוגים",
            new String[]{
                    "תצוגה מקדימה — scorecard ({{SCALES}} סולמות), 3 פערים ו-Lighthouse. כרטיסי הצ'קליסט וההמלצות נעולים.",
                    "מעבדה — {{UNIQUE}} סוגים ו-{{OBS}} תצפיות ({{LAB}} URL במשפך). רשימת {{PRO}} השורות בחבילת Pro."
            },
            new String[]{
                    "חבילת Diagnostic — scorecard, 3 פערים, {{SUM}} כרטיסי סיכום ו-{{SHOWN}} URL. לא רשימת {{PRO}} השורות המלאה.",
                    "מעבדה — {{UNIQUE}} סוגים / {{OBS}} תצפיות. האודיט המלא וההמלצות ב-Pro."
            },
            "פתחו את האודיט המלא בחבילת Pro"
    );
}
