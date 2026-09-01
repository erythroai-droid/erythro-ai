package ai.erythro;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.Margin;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * Генератор PDF-отчета в макете Figma (A4: чёрный сайдбар, красные шапка/подвал, белая колонка).
 * Используется и как шаблон (main), и аудитором {@link AuditCollector}.
 */
public class ReportTemplateGenerator {

    private static final String TEMPLATE_HTML_FILE = "reports/audit_template_white.html";
    private static final String TEMPLATE_PDF_FILE = "reports/audit_template_white.pdf";
    /** Used when TEMPLATE_PDF_FILE is locked by a viewer; fixed name so it never accumulates. */
    private static final String TEMPLATE_PDF_FALLBACK = "reports/audit_template_white.locked.pdf";

    public static void main(String[] args) throws IOException {
        System.out.println("=================================================================");
        System.out.println("📄 Erythro.ai Commercial Audit — Динамическая генерация PDF");
        System.out.println("=================================================================");

        String targetUrl = "https://www.example.com";
        List<String> locales = List.of("en", "ru", "he");
        SimpleDateFormat sdf = new SimpleDateFormat("dd.MM.yyyy");
        String dateStr = sdf.format(new Date());

        List<Map<String, String>> findings = List.of(
                Map.of(
                        "title", "Потеря 25–40% мобильного рекламного трафика",
                        "issue", "Высокое время загрузки Largest Contentful Paint (LCP > 4.0s) на мобильных сетях 4G.",
                        "impact", "Пользователи закрывают сайт до первого экрана, сжигая бюджет Google / Meta Ads.",
                        "solution", "Мобильная оптимизация Core Web Vitals, сжатие Next-Gen WebP/AVIF и кэширование CDN до LCP < 1.5s."
                ),
                Map.of(
                        "title", "Риск срыва лидогенерации и зависания входящих заявок",
                        "issue", "Лид-формы не оснащены невидимой защитой Turnstile и мгновенным AI-автоответчиком.",
                        "impact", "Риск утери «горячих» заявок из-за спам-ботов или долгой ручной обработки свыше 15 минут.",
                        "solution", "Подключение умных AI-агентов (n8n/CRM) для мгновенной квалификации и ответа в Telegram 24/7."
                ),
                Map.of(
                        "title", "Несоответствие закону о доступности (IS 5568 / WCAG 2.1 AA)",
                        "issue", "Отсутствие aria-лейблов на кнопках мобильного меню и некорректное RTL-выравнивание заголовков на иврите.",
                        "impact", "Риск юридических претензий и снижение конверсии региональной аудитории.",
                        "solution", "Комплексный аудит доступности, исправление RTL-зеркалирования и сертификация по стандарту IS 5568."
                )
        );

        List<Map<String, String>> lighthouse = List.of(
                lighthouseRow("MOBILE (iPhone SE)", "72", "54", "100", "100", "2.1 s", "3.4 s", "0.02"),
                lighthouseRow("DESKTOP", "96", "98", "100", "100", "0.7 s", "1.1 s", "0.00")
        );

        List<Map<String, String>> checks = List.of(
                checkRow("Паразитный боковой скролл (Overflow-X на 375px)", "Идеально подогнано под экран смартфона (0px перелива)", "good", "Отлично"),
                checkRow("RTL-зеркалирование и верстка для Израиля (Иврит)", "Тег dir=\"rtl\" активен, выравнивание справа настроено", "good", "Норма"),
                checkRow("SSL / HTTPS шифрование & Security Headers", "HTTPS включен, HSTS и CSP активны", "good", "Защищено"),
                checkRow("Служебные файлы индексации (robots.txt / sitemap.xml)", "robots.txt: 200 OK | sitemap.xml: 200 OK", "good", "В норме")
        );

        String htmlContent = buildAuditHtml(
                targetUrl, dateStr, String.join(", ", locales).toUpperCase(),
                85, "A", 80, 94, 70, 40, 88,
                findings, lighthouse, checks,
                AuditReportI18n.resolve("ru")
        );

        File reportsDir = new File("reports");
        if (!reportsDir.exists()) reportsDir.mkdirs();

        Files.writeString(Paths.get(TEMPLATE_HTML_FILE), htmlContent);
        System.out.println("[✓] HTML-отчет сохранен: `" + TEMPLATE_HTML_FILE + "`");

        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
            Page page = browser.newPage();
            page.setContent(htmlContent);
            page.emulateMedia(new Page.EmulateMediaOptions().setMedia(com.microsoft.playwright.options.Media.PRINT));
            page.evaluate("document.fonts.ready");

            Path pdfPath = Paths.get(TEMPLATE_PDF_FILE).toAbsolutePath();
            try {
                page.pdf(new Page.PdfOptions()
                        .setPath(pdfPath)
                        .setFormat("A4")
                        .setPrintBackground(true)
                        .setPreferCSSPageSize(true)
                        .setMargin(new Margin().setTop("0mm").setBottom("0mm").setLeft("0mm").setRight("0mm"))
                );
                System.out.println("[✓] Превью шаблона сгенерировано: `" + pdfPath + "`");
            } catch (Exception e) {
                Path fallback = Paths.get(TEMPLATE_PDF_FALLBACK).toAbsolutePath();
                page.pdf(new Page.PdfOptions()
                        .setPath(fallback)
                        .setFormat("A4")
                        .setPrintBackground(true)
                        .setPreferCSSPageSize(true)
                        .setMargin(new Margin().setTop("0mm").setBottom("0mm").setLeft("0mm").setRight("0mm"))
                );
                System.out.println("[!] Файл занят, превью сохранено как: `" + fallback + "`");
            }
            browser.close();
        } catch (Exception e) {
            System.err.println("[-] Ошибка генерации PDF: " + e.getMessage());
        }

        System.out.println("=================================================================");
        System.out.println("✅ Готово! Превью шаблона обновлено (демо-данные, боевой отчет не затронут).");
        System.out.println("=================================================================");
    }

    public static Map<String, String> lighthouseRow(String device, String perf, String a11y, String bp, String seo,
                                                    String fcp, String lcp, String cls) {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("device", device);
        row.put("performance", perf);
        row.put("accessibility", a11y);
        row.put("best_practices", bp);
        row.put("seo", seo);
        row.put("fcp", fcp);
        row.put("lcp", lcp);
        row.put("cls", cls);
        return row;
    }

    public static Map<String, String> checkRow(String param, String result, String status, String label) {
        return checkRow(param, result, status, label, "");
    }

    public static Map<String, String> checkRow(String param, String result, String status, String label, String id) {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("param", param);
        row.put("result", result);
        row.put("status", status);
        row.put("label", label);
        row.put("id", id == null ? "" : id);
        return row;
    }

    public static String buildAuditHtml(
            String targetUrl,
            String dateStr,
            String localesStr,
            int overallScore,
            String grade,
            int speedScore,
            int seoScore,
            int leadScore,
            int secScore,
            int aiVisScore,
            List<Map<String, String>> topVulnerabilities,
            List<Map<String, String>> lighthouseRows,
            List<Map<String, String>> checkRows,
            AuditReportI18n i18n
    ) {
        return buildAuditHtml(
                targetUrl, dateStr, localesStr, overallScore, grade,
                speedScore, seoScore, leadScore, secScore, aiVisScore,
                topVulnerabilities, lighthouseRows, checkRows, i18n, false);
    }

    public static String buildAuditHtml(
            String targetUrl,
            String dateStr,
            String localesStr,
            int overallScore,
            String grade,
            int speedScore,
            int seoScore,
            int leadScore,
            int secScore,
            int aiVisScore,
            List<Map<String, String>> topVulnerabilities,
            List<Map<String, String>> lighthouseRows,
            List<Map<String, String>> checkRows,
            AuditReportI18n i18n,
            boolean commercialProposal
    ) {
        return buildAuditHtml(
                targetUrl, dateStr, localesStr, overallScore, grade,
                speedScore, seoScore, leadScore, secScore, aiVisScore,
                topVulnerabilities, lighthouseRows, checkRows, i18n, commercialProposal, null);
    }

    public static String buildAuditHtml(
            String targetUrl,
            String dateStr,
            String localesStr,
            int overallScore,
            String grade,
            int speedScore,
            int seoScore,
            int leadScore,
            int secScore,
            int aiVisScore,
            List<Map<String, String>> topVulnerabilities,
            List<Map<String, String>> lighthouseRows,
            List<Map<String, String>> checkRows,
            AuditReportI18n i18n,
            boolean commercialProposal,
            ReportScopeOfWork.Stats scope
    ) {
        if (i18n == null) {
            i18n = AuditReportI18n.resolve("ru");
        }
        String displayUrl = displayHost(targetUrl);

        String[] idxColors = {"#6b6254", "#8c806d", "#b5a58d"};
        StringBuilder findingsHtml = new StringBuilder();
        int findingCount = Math.min(3, topVulnerabilities == null ? 0 : topVulnerabilities.size());
        for (int i = 0; i < findingCount; i++) {
            Map<String, String> v = topVulnerabilities.get(i);
            String solutionText = commercialProposal
                    ? i18n.proposalSolutionTeaser
                    : esc(v.get("solution"));
            findingsHtml.append("<article class=\"finding\">")
                    .append("<div class=\"finding-idx\" style=\"background:").append(idxColors[i]).append(";\">")
                    .append(String.format("%02d", i + 1)).append("</div>")
                    .append("<div class=\"finding-body\">")
                    .append("<div class=\"finding-row\">")
                    .append("<span class=\"ico ico-alert\">").append(iconWarn()).append("</span>")
                    .append("<div><span class=\"finding-k finding-k-red\">").append(i18n.findingProblem).append("</span> ")
                    .append("<span class=\"finding-title\">").append(esc(v.get("title"))).append("</span>")
                    .append("<div class=\"finding-p\">").append(esc(v.get("issue"))).append("</div></div></div>")
                    .append("<div class=\"finding-row\">")
                    .append("<span class=\"ico ico-diagram\">").append(iconImpact()).append("</span>")
                    .append("<div><span class=\"finding-k finding-k-orange\">").append(i18n.findingImpact).append("</span> ")
                    .append("<span class=\"finding-p finding-p-inline\">").append(esc(v.get("impact"))).append("</span></div></div>")
                    .append("<div class=\"finding-row\">")
                    .append("<span class=\"ico ico-idea\">").append(iconIdea()).append("</span>")
                    .append("<div><span class=\"finding-k finding-k-green\">").append(i18n.findingSolution).append("</span> ")
                    .append("<span class=\"finding-p finding-p-inline").append(commercialProposal ? " finding-p-teaser" : "").append("\">")
                    .append(solutionText).append("</span></div></div>")
                    .append("</div></article>");
        }

        String lighthouseBlock = buildLighthouseHtml(lighthouseRows, i18n, commercialProposal);

        StringBuilder checksHtml = new StringBuilder();
        if (checkRows != null && !checkRows.isEmpty()) {
            checksHtml.append(buildChecksTableHtml(checkRows, i18n, commercialProposal));
        }

        String template = loadReportTemplate(i18n.lang, commercialProposal);
        String res = i18n.applyShellPlaceholders(template);
        if (commercialProposal) {
            res = injectProposalReportClass(res, i18n);
            res = applyProposalDocumentMeta(res, i18n);
            res = applyProposalHeader(res, i18n);
        } else {
            res = applyPaidHeader(res, i18n);
        }

        String logoSvg = "";
        for (String path : List.of("templates/Logo_digital 1.svg", "QA_Auditor/templates/Logo_digital 1.svg", "../templates/Logo_digital 1.svg")) {
            File f = new File(path);
            if (f.exists()) {
                try {
                    logoSvg = Files.readString(f.toPath());
                    break;
                } catch (Exception ignored) {}
            }
        }

        if (!logoSvg.isEmpty()) {
            String brandOpen = "<a class=\"brand\" href=\"https://erythro.ai/\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Erythro.ai\">";
            String brandClose = "</a>";
            int brandStart = res.indexOf("<a class=\"brand\"");
            if (brandStart == -1) {
                brandStart = res.indexOf("<div class=\"brand\">");
                brandOpen = "<div class=\"brand\">";
                brandClose = "</div>";
            }
            if (brandStart != -1) {
                int brandEnd = res.indexOf(brandClose, brandStart);
                if (brandEnd != -1) {
                    res = res.substring(0, brandStart) + brandOpen + logoSvg + res.substring(brandEnd);
                }
            }
        }

        // Full-circle path + pathLength/dasharray — reliable white progress in Chromium PDF
        int scoreClamped = Math.max(0, Math.min(100, overallScore));
        String dashArray = scoreClamped + " " + (100 - scoreClamped);
        String gaugePathTag = "<path class=\"gauge-progress\" d=\"M 70 12 A 58 58 0 1 1 70 128 A 58 58 0 1 1 70 12\" pathLength=\"100\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"5\" stroke-linecap=\"butt\" stroke-dasharray=\"" + dashArray + "\"/>";

        res = res.replace("www.example.com", displayUrl)
                 .replace("{{DISPLAY_URL}}", displayUrl)
                 .replace("20.08.2026", dateStr)
                 .replace("{{DATE_STR}}", dateStr)
                 .replace("EN, RU, HE", localesStr)
                 .replace("{{LOCALES_STR}}", localesStr)
                 .replace("<div class=\"gauge-score\">85</div>", "<div class=\"gauge-score\">" + overallScore + "</div>")
                 .replace("<div class=\"gauge-score\">{{OVERALL}}</div>", "<div class=\"gauge-score\">" + overallScore + "</div>")
                 .replace("<div class=\"gauge-grade\">GRADE:A</div>", "<div class=\"gauge-grade\">" + formatGaugeGrade(grade) + "</div>")
                 .replace("<div class=\"gauge-grade\">GRADE:{{GRADE}}</div>", "<div class=\"gauge-grade\">" + formatGaugeGrade(grade) + "</div>")
                 .replace("style=\"--p: 85;\"", "style=\"--p: " + overallScore + ";\"")
                 .replace("style=\"--p: {{OVERALL}};\"", "style=\"--p: " + overallScore + ";\"");

        int pathStart = res.indexOf("<path class=\"gauge-progress\"");
        if (pathStart != -1) {
            int pathEnd = res.indexOf("/>", pathStart);
            if (pathEnd != -1) {
                res = res.substring(0, pathStart) + gaugePathTag + res.substring(pathEnd + 2);
            }
        }

        StringBuilder chartRowsHtml = new StringBuilder();
        chartRowsHtml.append("<div class=\"chart-rows\">")
                .append(chartRow(i18n.chartSpeed, speedScore))
                .append(chartRow(i18n.chartSeo, seoScore))
                .append(chartRow(i18n.chartLead, leadScore))
                .append(chartRow(i18n.chartSec, secScore))
                .append(chartRow(i18n.chartAi, aiVisScore))
                .append("</div>");

        int rowsStart = res.indexOf("<div class=\"chart-rows\">");
        int ticksBottom = res.indexOf("<div class=\"ticks ticks-bottom\">");
        if (rowsStart != -1 && ticksBottom != -1 && rowsStart < ticksBottom) {
            res = res.substring(0, rowsStart) + chartRowsHtml + "\n                " + res.substring(ticksBottom);
        }

        int findStart = res.indexOf("<div class=\"findings\">");
        if (findStart != -1) {
            String afterFindings = res.substring(findStart);
            int depth = 0;
            int i = 0;
            int endIdx = -1;
            while (i < afterFindings.length()) {
                int open = afterFindings.indexOf("<div", i);
                int close = afterFindings.indexOf("</div>", i);
                if (close == -1) break;
                if (open != -1 && open < close) {
                    depth++;
                    i = open + 4;
                } else {
                    depth--;
                    i = close + 6;
                    if (depth == 0) {
                        endIdx = findStart + i;
                        break;
                    }
                }
            }
            if (endIdx != -1) {
                res = res.substring(0, findStart)
                        + "<div class=\"findings\">\n"
                        + findingsHtml
                        + "\n                </div>"
                        + res.substring(endIdx);
            }
        }

        int tableStart = res.indexOf("<table class=\"metrics\">");
        int tableEnd = tableStart == -1 ? -1 : res.indexOf("</table>", tableStart);
        if (tableStart != -1 && tableEnd != -1) {
            res = res.substring(0, tableStart) + lighthouseBlock + res.substring(tableEnd + "</table>".length());
        }

        if (checksHtml.length() > 0) {
            int checksStart = res.indexOf("<table class=\"checks-table\">");
            int secondTableEnd = checksStart == -1 ? -1 : res.indexOf("</table>", checksStart);
            if (checksStart != -1 && secondTableEnd != -1) {
                res = res.substring(0, checksStart) + checksHtml.toString() + res.substring(secondTableEnd + "</table>".length());
            }
        }

        if (commercialProposal) {
            res = replaceProposalFooter(res, i18n);
            res = stripProposalContentBanner(res);
        } else if (scope != null) {
            res = ReportScopeOfWork.inject(res, i18n.lang, scope);
        } else {
            res = ReportScopeOfWork.inject(res, i18n.lang, localesStr);
        }

        return res;
    }

    private static String buildLighthouseHtml(
            List<Map<String, String>> lighthouseRows,
            AuditReportI18n i18n,
            boolean commercialProposal
    ) {
        if (lighthouseRows == null || lighthouseRows.isEmpty()) {
            return "";
        }
        if (!commercialProposal) {
            StringBuilder lighthouseHtml = new StringBuilder();
            lighthouseHtml.append("<table class=\"metrics\"><thead><tr>")
                    .append("<th>DEVICE</th><th>PERFORMANCE</th><th>")
                    .append("ACCESSIBILITY</th>")
                    .append("<th>BEST PRACTICES</th><th>SEO</th><th>")
                    .append("FCP</th><th>LCP</th><th>CLS</th>")
                    .append("</tr></thead><tbody>");
            for (Map<String, String> row : lighthouseRows) {
                lighthouseHtml.append("<tr>")
                        .append("<td class=\"device\">").append(esc(row.get("device"))).append("</td>")
                        .append("<td>").append(scoreBadge(row.get("performance"))).append("</td>")
                        .append("<td>").append(scoreBadge(row.get("accessibility"))).append("</td>")
                        .append("<td>").append(scoreBadge(row.get("best_practices"))).append("</td>")
                        .append("<td>").append(scoreBadge(row.get("seo"))).append("</td>")
                        .append("<td>").append(esc(row.get("fcp"))).append("</td>")
                        .append("<td>").append(esc(row.get("lcp"))).append("</td>")
                        .append("<td>").append(esc(row.get("cls"))).append("</td></tr>");
            }
            lighthouseHtml.append("</tbody></table>");
            return lighthouseHtml.toString();
        }

        Map<String, String> mobileRow = null;
        for (Map<String, String> row : lighthouseRows) {
            String device = String.valueOf(row.getOrDefault("device", ""));
            if (device.toLowerCase(Locale.ROOT).contains("mobile")) {
                mobileRow = row;
                break;
            }
        }
        if (mobileRow == null) {
            mobileRow = lighthouseRows.get(0);
        }

        StringBuilder faux = new StringBuilder();
        for (int i = 0; i < 2; i++) {
            faux.append("<div class=\"metrics-faux-row\" role=\"presentation\">")
                    .append("<div class=\"metrics-faux-cell\"><span class=\"check-lock-fill\" role=\"presentation\"></span></div>")
                    .append("<div class=\"metrics-faux-cell\"><span class=\"check-lock-fill\" role=\"presentation\"></span></div>")
                    .append("<div class=\"metrics-faux-cell\"><span class=\"check-lock-fill\" role=\"presentation\"></span></div>")
                    .append("</div>");
        }

        return "<div class=\"metrics-proposal-wrap\">"
                + "<table class=\"metrics metrics-proposal\"><thead><tr>"
                + "<th>DEVICE</th><th>PERFORMANCE</th><th>LCP</th>"
                + "</tr></thead><tbody><tr>"
                + "<td class=\"device\">" + esc(mobileRow.get("device")) + "</td>"
                + "<td>" + scoreBadge(mobileRow.get("performance")) + "</td>"
                + "<td>" + esc(mobileRow.get("lcp")) + "</td>"
                + "</tr></tbody></table>"
                + "<div class=\"metrics-locked-panel\" role=\"presentation\">"
                + "<div class=\"metrics-faux-rows\">" + faux + "</div>"
                + buildUnlockOverlay(i18n)
                + "</div></div>";
    }

    private static String buildUnlockOverlay(AuditReportI18n i18n) {
        return "<div class=\"checks-unlock-overlay\">"
                + "<div class=\"checks-unlock-cta\">"
                + "<a class=\"checks-unlock-btn\" href=\"" + esc(i18n.unlockReportUrl) + "\">"
                + esc(i18n.unlockReportBtn) + "</a>"
                + "<p class=\"proposal-unlock-sub\">" + esc(i18n.proposalUnlockSub) + "</p>"
                + "</div></div>";
    }

    private static String applyProposalDocumentMeta(String html, AuditReportI18n i18n) {
        String res = html;
        if (i18n.proposalDocTitle != null && !i18n.proposalDocTitle.isBlank()) {
            res = res.replace("<title>" + i18n.docTitle + "</title>",
                    "<title>" + i18n.proposalDocTitle + "</title>");
        }
        return res;
    }

    private static String applyProposalHeader(String html, AuditReportI18n i18n) {
        String strip = "<div class=\"sheet-title-fill proposal-preview-strip\">"
                + esc(i18n.proposalPreviewBadge) + "</div>";
        return html.replace("<div class=\"sheet-title-fill\"></div>", strip);
    }

    private static String applyPaidHeader(String html, AuditReportI18n i18n) {
        String strip = "<div class=\"sheet-title-fill commercial-audit-strip\">"
                + esc(commercialAuditBadge(i18n)) + "</div>";
        return html.replace("<div class=\"sheet-title-fill\"></div>", strip);
    }

    private static String commercialAuditBadge(AuditReportI18n i18n) {
        if (i18n == null || i18n.lang == null) {
            return "FULL · АУДИТ КОНВЕРСИИ";
        }
        return switch (i18n.lang) {
            case "en" -> "FULL · CONVERSION AUDIT";
            case "he" -> "FULL · אודיט המרה";
            default -> "FULL · АУДИТ КОНВЕРСИИ";
        };
    }

    private static String stripProposalContentBanner(String html) {
        int start = html.indexOf("<div class=\"proposal-preview-banner\">");
        if (start == -1) {
            return html;
        }
        int end = html.indexOf("</div>", start);
        if (end == -1) {
            return html;
        }
        return html.substring(0, start) + html.substring(end + "</div>".length());
    }

    private static String replaceProposalFooter(String html, AuditReportI18n i18n) {
        int footerStart = html.indexOf("<footer class=\"footer\">");
        int footerEnd = html.indexOf("</footer>", footerStart);
        if (footerStart == -1 || footerEnd == -1) {
            return html;
        }
        String footer = "<footer class=\"footer footer-proposal\">"
                + "<div class=\"proposal-footer-watermark\">" + esc(i18n.proposalPreviewBadge) + "</div>"
                + "<div class=\"cta-title cta-title-oneline\">" + i18n.proposalFooterLine + "</div>"
                + "<div class=\"cta-buttons cta-buttons-single\">"
                + "<a class=\"btn btn-unlock\" href=\"" + esc(i18n.unlockReportUrl) + "\">"
                + esc(i18n.proposalFooterBtn) + "</a>"
                + "</div>"
                + "<div class=\"copy\">" + i18n.copyright + "</div>"
                + "</footer>";
        return html.substring(0, footerStart) + footer + html.substring(footerEnd + "</footer>".length());
    }

    /** Visible check rows in commercial proposal PDF (rest are visual placeholders). */
    public static final int PROPOSAL_VISIBLE_CHECK_ROWS = 3;

    private static String buildChecksTableHtml(
            List<Map<String, String>> checkRows,
            AuditReportI18n i18n,
            boolean commercialProposal
    ) {
        StringBuilder checksHtml = new StringBuilder();
        checksHtml.append("<table class=\"checks-table\"><thead><tr>")
                .append("<th>").append(i18n.thCheckParam).append("</th><th>").append(i18n.thCheckResult).append("</th><th>")
                .append(i18n.thCheckStatus).append("</th>")
                .append("</tr></thead><tbody>");
        for (int i = 0; i < checkRows.size(); i++) {
            if (commercialProposal && i >= PROPOSAL_VISIBLE_CHECK_ROWS) {
                continue;
            }
            Map<String, String> r = checkRows.get(i);
            String stClass = switch (String.valueOf(r.get("status")).toLowerCase()) {
                case "good" -> "status-good";
                case "warn" -> "status-warn";
                default -> "status-bad";
            };
            checksHtml.append("<tr>")
                    .append("<td class=\"check-param\">").append(esc(r.get("param"))).append("</td>")
                    .append("<td class=\"check-result\">").append(esc(r.get("result"))).append("</td>")
                    .append("<td class=\"check-status\"><span class=\"status-badge ").append(stClass).append("\">")
                    .append(esc(r.get("label"))).append("</span></td></tr>");
        }
        if (commercialProposal && checkRows.size() > PROPOSAL_VISIBLE_CHECK_ROWS) {
            checksHtml.append(checkRowsLockedBlock(checkRows.size() - PROPOSAL_VISIBLE_CHECK_ROWS, i18n));
        }
        checksHtml.append("</tbody></table>");
        return checksHtml.toString();
    }

    /** Blurred faux rows + centered unlock CTA; no audit text in HTML. */
    private static String checkRowsLockedBlock(int lockedCount, AuditReportI18n i18n) {
        StringBuilder faux = new StringBuilder();
        for (int i = 0; i < lockedCount; i++) {
            faux.append("<div class=\"checks-faux-row\" role=\"presentation\">")
                    .append("<div class=\"checks-faux-cell\"><span class=\"check-lock-fill\" role=\"presentation\"></span></div>")
                    .append("<div class=\"checks-faux-cell checks-faux-cell-wide\"><span class=\"check-lock-fill check-lock-fill-wide\" role=\"presentation\"></span></div>")
                    .append("<div class=\"checks-faux-cell checks-faux-cell-badge\"><span class=\"check-lock-badge\" role=\"presentation\"></span></div>")
                    .append("</div>");
        }
        return "<tr class=\"check-rows-locked-block\"><td colspan=\"3\" class=\"checks-locked-cell\">"
                + "<div class=\"checks-locked-panel\">"
                + faux
                + buildUnlockOverlay(i18n)
                + "</div></td></tr>";
    }

    private static String injectProposalReportClass(String html, AuditReportI18n i18n) {
        if (html.contains("<html") && html.contains("proposal-report")) {
            int htmlTagEnd = html.indexOf('>', html.indexOf("<html"));
            String htmlOpen = htmlTagEnd > 0 ? html.substring(html.indexOf("<html"), htmlTagEnd) : "";
            if (htmlOpen.contains("proposal-report")) {
                return html;
            }
        }
        String base = i18n.htmlClassAttr == null ? "" : i18n.htmlClassAttr.trim();
        if (base.isEmpty()) {
            if (html.contains("class=\"\"")) {
                return html.replace("class=\"\"", "class=\"proposal-report\"");
            }
            return html.replaceFirst("<html ", "<html class=\"proposal-report\" ");
        }
        return html.replace("class=\"" + base + "\"", "class=\"" + base + " proposal-report\"");
    }

    /** Загружает HTML-шаблон отчёта: audit_template_white_{lang}.html или proposal variant */
    private static String loadReportTemplate(String lang, boolean commercialProposal) {
        String normalized = AuditReportI18n.normalizeLang(lang);
        String prefix = commercialProposal ? "audit_template_proposal_" : "audit_template_white_";
        List<String> candidates = List.of(
                "templates/" + prefix + normalized + ".html",
                "QA_Auditor/templates/" + prefix + normalized + ".html",
                "../templates/" + prefix + normalized + ".html",
                "templates/audit_template_white_" + normalized + ".html",
                "QA_Auditor/templates/audit_template_white_" + normalized + ".html",
                "../templates/audit_template_white_" + normalized + ".html",
                "templates/audit_template_white.html",
                "QA_Auditor/templates/audit_template_white.html",
                "../templates/audit_template_white.html"
        );
        for (String path : candidates) {
            File f = new File(path);
            if (f.exists()) {
                try {
                    return Files.readString(f.toPath());
                } catch (Exception ignored) {}
            }
        }
        throw new RuntimeException("Report template not found for lang=" + normalized
                + (commercialProposal ? " (proposal)" : ""));
    }

    private static String loadReportTemplate(String lang) {
        return loadReportTemplate(lang, false);
    }

    private static String getBarClass(int score) {
        if (score >= 75) return "bar-green";
        if (score >= 50) return "bar-warn";
        return "bar-bad";
    }

    private static String chartLabel(String label) {
        return "<div class=\"chart-label\">" + label + "</div>";
    }

    private static String formatGaugeGrade(String grade) {
        return "GRADE:<span dir=\"ltr\" class=\"gauge-grade-val\">" + grade + "</span>";
    }

    private static String chartRow(String label, int score) {
        return "<div class=\"chart-row\">" + chartLabel(label) + chartBar(score) + "</div>";
    }

    private static String chartBar(int score) {
        String fill = getBarClass(score);
        return "<div class=\"bar-track\"><div class=\"bar-fill " + fill + "\" style=\"width:" + score + "%;\"></div></div>";
    }

    private static String scoreBadge(String raw) {
        int score;
        try {
            score = Integer.parseInt(raw.replaceAll("[^0-9-]", ""));
        } catch (Exception e) {
            return esc(raw);
        }
        String cls = score >= 80 ? "badge-good" : (score >= 60 ? "badge-warn" : "badge-bad");
        return "<span class=\"badge " + cls + "\">" + score + "</span>";
    }

    private static String statusBadge(String status, String label) {
        String cls = "badge-good";
        if ("warn".equals(status)) cls = "badge-warn";
        if ("bad".equals(status)) cls = "badge-bad";
        return "<span class=\"badge " + cls + "\">" + esc(label) + "</span>";
    }

    static String displayHost(String url) {
        if (url == null) return "";
        return url.replaceFirst("^https?://", "").replaceFirst("/$", "");
    }

    private static String esc(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private static String loadSvgAsset(String name) {
        Path[] candidates = {
                Paths.get("templates/figma-assets/" + name),
                Paths.get("QA_Auditor/templates/figma-assets/" + name),
                Paths.get("../templates/figma-assets/" + name)
        };
        for (Path p : candidates) {
            if (Files.isRegularFile(p)) {
                try {
                    return Files.readString(p)
                            .replace("preserveAspectRatio=\"none\"", "")
                            .replace("overflow=\"visible\"", "")
                            .replace("style=\"display: block;\"", "")
                            .replace("clip0_0_48", "clip-idea");
                } catch (IOException ignored) {
                    // fall through to next candidate
                }
            }
        }
        return "";
    }

    private static String iconWarn() {
        return loadSvgAsset("icon-alert.svg");
    }

    private static String iconImpact() {
        return loadSvgAsset("icon-diagram.svg");
    }

    private static String iconIdea() {
        return loadSvgAsset("icon-idea.svg");
    }

}
