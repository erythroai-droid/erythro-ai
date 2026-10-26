package ai.erythro;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.Margin;
import com.microsoft.playwright.options.WaitUntilState;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

public class RenderV2Pdf {

    public static void main(String[] args) {
        try (Playwright pw = Playwright.create()) {
            Browser browser = pw.chromium().launch(new com.microsoft.playwright.BrowserType.LaunchOptions().setHeadless(true));
            renderAll(browser, "ru");
            browser.close();
            System.out.println("[✓] All V2 PDFs generated successfully!");
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    public static void renderAll(Browser browser) throws Exception {
        renderAll(browser, "ru");
    }

    public static void renderAll(Browser browser, String reportLang) throws Exception {
        Page page = browser.newPage();

        List<String> langs = List.of("ru", "en", "he");
        List<String> tiers = List.of("free", "diagnostic", "pro");

        Path reportsDir = Paths.get("QA_Auditor/reports").toAbsolutePath();
        if (!Files.exists(reportsDir)) {
            reportsDir = Paths.get("reports").toAbsolutePath();
        }

        for (String tier : tiers) {
            Path tierDir = reportsDir.resolve(tier);
            if (!Files.exists(tierDir)) continue;

            for (String lang : langs) {
                Path htmlPath = tierDir.resolve("audit-report_" + lang + ".html");
                if (!Files.exists(htmlPath)) {
                    continue;
                }
                Path pdfPath = tierDir.resolve("audit-report_" + lang + ".pdf");

                System.out.println("[+] Rendering PDF: " + pdfPath);
                page.navigate(htmlPath.toUri().toString(), new Page.NavigateOptions().setWaitUntil(WaitUntilState.LOAD));
                page.emulateMedia(new Page.EmulateMediaOptions().setMedia(com.microsoft.playwright.options.Media.PRINT));

                // Remove name attribute from details so accordion does not collapse open items, and expand all
                page.evaluate("() => { document.querySelectorAll('details').forEach(d => { d.removeAttribute('name'); d.open = true; }); }");
                page.evaluate("document.fonts.ready");

                // Full-bleed background styling
                page.addStyleTag(new Page.AddStyleTagOptions().setContent(
                        "@page { size: A4; margin: 0 !important; } html, body { background: #eaeaea !important; margin: 0 !important; }"));

                // Rebuild 10mm top/bottom and 8mm sides via table thead/tfoot so page background is never white
                page.evaluate("""
                    () => {
                      const w = document.querySelector('.wrap');
                      if (w && !w.parentElement.matches('td')) {
                        const t = document.createElement('table');
                        t.style.cssText = 'width:100%;border-collapse:collapse;table-layout:fixed;background:transparent';
                        const cell = (h, pad) => '<td style="height:' + h + ';padding:' + pad + ' !important;vertical-align:top;text-align:start !important;text-transform:none !important;letter-spacing:normal !important;font:inherit !important;color:inherit !important;background:transparent !important;border:0 !important;"></td>';
                        t.innerHTML = '<thead><tr>' + cell('10mm', '0') + '</tr></thead><tfoot><tr>' + cell('10mm', '0') + '</tr></tfoot><tbody><tr>' + cell('auto', '0 8mm') + '</tr></tbody>';
                        w.parentNode.insertBefore(t, w);
                        t.querySelector('tbody td').appendChild(w);
                      }
                    }
                    """);

                Page.PdfOptions pdfOpts = new Page.PdfOptions()
                        .setPath(pdfPath)
                        .setFormat("A4")
                        .setPrintBackground(true)
                        .setMargin(new Margin().setTop("0").setBottom("0").setLeft("0").setRight("0"));

                try {
                    page.pdf(pdfOpts);
                    System.out.println("[✓] PDF saved: " + pdfPath);
                    stampPageNumbers(pdfPath, lang);
                } catch (Exception e) {
                    Path alt = Paths.get(pdfPath.toString().replaceAll("\\.pdf$", ".new.pdf"));
                    page.pdf(pdfOpts.setPath(alt));
                    System.out.println("[!] Primary PDF locked, saved: " + alt);
                    stampPageNumbers(alt, lang);
                }

                if ("pro".equals(tier)) {
                    // Copy to reports/pro-v2/
                    Path proV2Pdf = reportsDir.resolve("pro-v2").resolve("audit-report_" + lang + ".pdf");
                    safeCopy(pdfPath, proV2Pdf);

                    // Copy to dev samples (both v2 and main)
                    Path sampleV2Pdf = Paths.get("C:/dev/erythro-ai/public/samples/audit/pro-" + lang + "-v2.pdf").toAbsolutePath();
                    safeCopy(pdfPath, sampleV2Pdf);
                    Path sampleMainPdf = Paths.get("C:/dev/erythro-ai/public/samples/audit/pro-" + lang + ".pdf").toAbsolutePath();
                    safeCopy(pdfPath, sampleMainPdf);

                    // Copy to agent reports (both v2 and pro)
                    Path agentPdf = Paths.get("C:/dev/erythro-ai/services/audit-agent/QA_Auditor/reports/pro-v2/audit-report_" + lang + ".pdf").toAbsolutePath();
                    safeCopy(pdfPath, agentPdf);
                    Path agentProPdf = Paths.get("C:/dev/erythro-ai/services/audit-agent/QA_Auditor/reports/pro/audit-report_" + lang + ".pdf").toAbsolutePath();
                    safeCopy(pdfPath, agentProPdf);
                }
            }
        }

        // Also copy primary reportLang PDF to reports/audit-report.pdf
        String activeLang = reportLang != null && !reportLang.isBlank() ? reportLang : "ru";
        Path activePdf = reportsDir.resolve("pro").resolve("audit-report_" + activeLang + ".pdf");
        if (!Files.exists(activePdf)) {
            activePdf = reportsDir.resolve("diagnostic").resolve("audit-report_" + activeLang + ".pdf");
        }
        if (!Files.exists(activePdf)) {
            activePdf = reportsDir.resolve("free").resolve("audit-report_" + activeLang + ".pdf");
        }
        if (Files.exists(activePdf)) {
            Path rootPdf = reportsDir.resolve("audit-report.pdf");
            safeCopy(activePdf, rootPdf);
            Path devAgentRootPdf = Paths.get("C:/dev/erythro-ai/services/audit-agent/QA_Auditor/reports/audit-report.pdf").toAbsolutePath();
            safeCopy(activePdf, devAgentRootPdf);
            System.out.println("[✓] Root audit-report.pdf updated with " + activeLang);
        }

        page.close();
    }

    private static void stampPageNumbers(Path pdfPath, String lang) {
        try {
            Path script = Paths.get("scripts/stamp-pdf-numbers.cjs");
            if (!Files.exists(script)) {
                script = Paths.get("QA_Auditor/scripts/stamp-pdf-numbers.cjs");
            }
            if (!Files.exists(script)) {
                return;
            }
            ProcessBuilder pb = new ProcessBuilder("node", script.toAbsolutePath().toString(), pdfPath.toAbsolutePath().toString(), lang);
            pb.inheritIO();
            Process p = pb.start();
            p.waitFor();
        } catch (Exception e) {
            System.err.println("[!] Error stamping page numbers: " + e.getMessage());
        }
    }

    private static void safeCopy(Path source, Path target) {
        try {
            if (target.getParent() != null) {
                Files.createDirectories(target.getParent());
            }
            Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("[✓] Saved PDF: " + target);
        } catch (Exception e) {
            Path alt = Paths.get(target.toString().replaceAll("\\.pdf$", ".new.pdf"));
            try {
                Files.copy(source, alt, StandardCopyOption.REPLACE_EXISTING);
                System.out.println("[!] Target locked (" + target.getFileName() + "), saved fallback: " + alt.getFileName());
            } catch (Exception e2) {
                System.err.println("[!] Failed to save PDF to " + target + ": " + e.getMessage());
            }
        }
    }
}
