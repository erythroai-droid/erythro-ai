package ai.erythro;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.playwright.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

/**
 * Rebuilds commercial-proposal PDF/HTML from reports/audit_data.json.
 * Checks table: first 3 rows with real audit data; remaining rows are visual placeholders (no text in DOM).
 */
public class RegenerateProposalPdfFromData {

    private static final String DATA_FILE = "reports/audit_data.json";

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

        List<String> langs = args.length > 0
                ? List.of(args)
                : List.of("ru", "en", "he");

        try (Playwright pw = Playwright.create()) {
            Browser browser = pw.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
            for (String lang : langs) {
                System.setProperty("REPORT_LANG", lang);
                String html = AuditCollector.rebuildProposalHtmlFromReport(report, targetUrl, locales);
                Path htmlOut = Paths.get("reports/audit-proposal_" + lang + ".html");
                Path pdfOut = Paths.get("reports/audit-proposal_" + lang + ".pdf");
                Path pdfFallback = Paths.get("reports/audit-proposal_" + lang + ".locked.pdf");

                Files.writeString(htmlOut, html);
                System.out.println("[✓] Proposal HTML: " + htmlOut);

                Page page = browser.newPage();
                page.setContent(html);
                page.emulateMedia(new Page.EmulateMediaOptions()
                        .setMedia(com.microsoft.playwright.options.Media.PRINT));
                page.evaluate("document.fonts.ready");
                try {
                    page.pdf(AuditCollector.pdfOptions(pdfOut.toAbsolutePath()));
                    System.out.println("[✓] Proposal PDF: " + pdfOut.toAbsolutePath());
                } catch (Exception e) {
                    page.pdf(AuditCollector.pdfOptions(pdfFallback.toAbsolutePath()));
                    System.out.println("[!] Файл занят, PDF: " + pdfFallback.toAbsolutePath());
                }
                page.close();
            }
            browser.close();
        }

        System.setProperty("REPORT_LANG", "");
    }
}
