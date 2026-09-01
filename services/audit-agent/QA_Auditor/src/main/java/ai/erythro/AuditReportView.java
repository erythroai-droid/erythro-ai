package ai.erythro;

import java.util.List;
import java.util.Map;

/**
 * Render-ready audit payload shared by A4 and A4-4 report builders.
 */
public final class AuditReportView {

    public final AuditReportI18n i18n;
    public final String targetUrl;
    public final String displayUrl;
    public final String dateStr;
    public final String localesStr;
    public final int overallScore;
    public final String grade;
    public final int speedScore;
    public final int seoScore;
    public final int leadScore;
    public final int secScore;
    public final int aiVisScore;
    public final int pagesVisited;
    public final int pagesOk;
    public final int pagesBroken;
    public final List<Map<String, String>> topVulnerabilities;
    public final List<Map<String, String>> lighthouseRows;
    public final List<Map<String, String>> checkRows;
    public final List<Map<String, String>> fullSignalRows;
    public final ReportScopeOfWork.Stats scope;

    public AuditReportView(
            AuditReportI18n i18n,
            String targetUrl,
            String displayUrl,
            String dateStr,
            String localesStr,
            int overallScore,
            String grade,
            int speedScore,
            int seoScore,
            int leadScore,
            int secScore,
            int aiVisScore,
            int pagesVisited,
            int pagesOk,
            int pagesBroken,
            List<Map<String, String>> topVulnerabilities,
            List<Map<String, String>> lighthouseRows,
            List<Map<String, String>> checkRows,
            List<Map<String, String>> fullSignalRows,
            ReportScopeOfWork.Stats scope
    ) {
        this.i18n = i18n;
        this.targetUrl = targetUrl;
        this.displayUrl = displayUrl;
        this.dateStr = dateStr;
        this.localesStr = localesStr;
        this.overallScore = overallScore;
        this.grade = grade;
        this.speedScore = speedScore;
        this.seoScore = seoScore;
        this.leadScore = leadScore;
        this.secScore = secScore;
        this.aiVisScore = aiVisScore;
        this.pagesVisited = pagesVisited;
        this.pagesOk = pagesOk;
        this.pagesBroken = pagesBroken;
        this.topVulnerabilities = topVulnerabilities;
        this.lighthouseRows = lighthouseRows;
        this.checkRows = checkRows;
        this.fullSignalRows = fullSignalRows == null ? List.of() : fullSignalRows;
        this.scope = scope;
    }
}
