package ai.erythro;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.WaitUntilState;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

/**
 * Builds A4-4 subscription reports (pro / diagnostic / free) in ru, en, he + PDF.
 */
public class RegenerateA44ReportsFromData {

    private static final String DATA_FILE = "reports/audit_data.json";
    private static final String ASSET_BASE = "../../templates/figma-assets";

    public static void main(String[] args) throws Exception {
        Path dataPath = Paths.get(DATA_FILE);
        ObjectMapper mapper = new ObjectMapper();
        @SuppressWarnings("unchecked")
        Map<String, Object> report = mapper.readValue(dataPath.toFile(), Map.class);

        String targetUrl = String.valueOf(report.getOrDefault("target_url", "https://erythro.ai/"));
        @SuppressWarnings("unchecked")
        List<String> locales = (List<String>) report.get("locales_audited");
        if (locales == null) {
            locales = (List<String>) report.get("locales");
        }
        if (locales == null || locales.isEmpty()) {
            locales = List.of("en", "ru", "he");
        }

        List<String> langs = args.length > 0 ? List.of(args) : List.of("ru", "en", "he");
        String onlyTier = System.getProperty("a44.tier", "").trim();
        A44Tier[] tiers = onlyTier.isEmpty()
                ? A44Tier.values()
                : new A44Tier[]{A44Tier.valueOf(onlyTier.toUpperCase())};

        try (Playwright pw = Playwright.create()) {
            Browser browser = pw.chromium().launch(new com.microsoft.playwright.BrowserType.LaunchOptions().setHeadless(true));
            exportAll(report, targetUrl, locales, langs, tiers, browser);
            browser.close();
        }
        System.setProperty("REPORT_LANG", "");
        System.out.println("Done. Folders: reports/pro, reports/diagnostic, reports/free");
    }

    /** Commercial packages Free / Diagnostic / Pro × report languages. Used after a live crawl and from this main. */
    public static void exportAll(
            Map<String, Object> report,
            String targetUrl,
            List<String> locales,
            Browser browser) throws Exception {
        exportAll(report, targetUrl, locales, List.of("ru", "en", "he"), A44Tier.values(), browser);
    }

    public static void exportAll(
            Map<String, Object> report,
            String targetUrl,
            List<String> locales,
            List<String> langs,
            A44Tier[] tiers,
            Browser browser) throws Exception {
        for (A44Tier tier : tiers) {
            Path dir = Paths.get("reports", tier.folder);
            Files.createDirectories(dir);
            for (String lang : langs) {
                System.setProperty("REPORT_LANG", lang);
                AuditReportView view = AuditCollector.buildReportView(report, targetUrl, locales, lang);
                String html = A44ReportGenerator.render(view, tier, ASSET_BASE);
                Path htmlOut = dir.resolve("audit-report_" + lang + ".html");
                Path pdfOut = dir.resolve("audit-report_" + lang + ".pdf");
                Path pdfFallback = dir.resolve("audit-report_" + lang + ".locked.pdf");
                Files.writeString(htmlOut, html);
                System.out.println("[✓] HTML " + tier.folder + "/" + lang + ": " + htmlOut);

                Page page = browser.newPage();
                page.navigate(htmlOut.toAbsolutePath().toUri().toString(),
                        new Page.NavigateOptions().setWaitUntil(WaitUntilState.LOAD));
                page.emulateMedia(new Page.EmulateMediaOptions()
                        .setMedia(com.microsoft.playwright.options.Media.PRINT));
                page.evaluate("""
                        () => {
                          document.documentElement.classList.add('pdf-export');
                          document.querySelectorAll('details').forEach(d => { d.open = true; });
                          document.querySelectorAll('.check-filters, .check-toolbar, .rec-copy').forEach(el => el.remove());
                          document.querySelectorAll('.check-group.is-hidden').forEach(g => g.classList.remove('is-hidden'));
                        }
                        """);
                page.evaluate("document.fonts.ready");
                try {
                    page.pdf(a44PdfOptions(pdfOut.toAbsolutePath()));
                    System.out.println("[✓] PDF  " + tier.folder + "/" + lang + ": " + pdfOut);
                } catch (Exception e) {
                    page.pdf(a44PdfOptions(pdfFallback.toAbsolutePath()));
                    System.out.println("[!] File busy, PDF: " + pdfFallback);
                }
                page.close();
            }
        }
    }

    private static Page.PdfOptions a44PdfOptions(Path target) {
        // Same A4 pagination as white templates (audit_22.08.26): CSS @page size + preferCSSPageSize.
        return AuditCollector.pdfOptions(target);
    }
}
