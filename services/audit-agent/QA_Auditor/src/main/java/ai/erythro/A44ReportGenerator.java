package ai.erythro;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Wide A4-4 commercial report: Pro / Diagnostic / Free.
 */
public final class A44ReportGenerator {

    private static final String COPY_SCRIPT = """
<script>
(function () {
    function copyToClipboard(text) {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            return navigator.clipboard.writeText(text).catch(function () {
                return copyFallback(text);
            });
        }
        return copyFallback(text);
    }
    function copyFallback(text) {
        return new Promise(function (resolve, reject) {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.top = '0';
            ta.style.left = '0';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            ta.setSelectionRange(0, ta.value.length);
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
            document.body.removeChild(ta);
            ok ? resolve() : reject(new Error('copy failed'));
        });
    }
    function markCopied(btn) {
        var label = btn.childNodes[0];
        btn.classList.add('is-copied');
        if (label && label.nodeType === 3) label.textContent = 'copied ';
        window.setTimeout(function () {
            btn.classList.remove('is-copied');
            if (label && label.nodeType === 3) label.textContent = 'copy ';
        }, 1400);
    }
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.rec-copy');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        var panel = btn.closest('.rec-panel');
        var body = panel && panel.querySelector('.rec-body');
        if (!body) return;
        var text = (body.innerText || body.textContent || '').replace(/\\u00a0/g, ' ').trim();
        if (!text) return;
        copyToClipboard(text).then(function () { markCopied(btn); }).catch(function () {});
    }, true);
})();
</script>
""";

    private static final String FILTER_SCRIPT = """
<script>
(function () {
    var root = document.querySelector('.check-filters');
    if (!root) return;
    root.addEventListener('click', function (e) {
        var btn = e.target.closest('.check-filter');
        if (!btn) return;
        var filter = btn.getAttribute('data-filter');
        root.querySelectorAll('.check-filter').forEach(function (b) {
            b.classList.toggle('is-active', b === btn);
        });
        document.querySelectorAll('.check-group').forEach(function (g) {
            var show = filter === 'all' || g.getAttribute('data-status') === filter;
            g.classList.toggle('is-hidden', !show);
        });
    });
})();
</script>
""";

    private static final String EXTRA_CSS = """

    html.tier-diagnostic .check-acc:not(.check-acc-locked) { display: none !important; }
    html.tier-diagnostic .check-acc-locked {
        display: block !important;
        margin-top: 10px;
    }
    html.tier-diagnostic .rec-panel-locked {
        position: relative;
        overflow: hidden;
        min-height: 148px;
        border-radius: 8px;
        background: #f7f7f7;
    }
    html.tier-diagnostic .rec-locked-blur {
        padding: 16px 18px 20px;
        pointer-events: none;
        user-select: none;
    }
    html.tier-diagnostic .rec-locked-blur .check-lock-fill {
        display: block;
        height: 12px;
        width: 78%;
        margin: 0 0 10px;
        border-radius: 6px;
        background: linear-gradient(90deg, #e4e4e4, #cfcfcf, #e4e4e4);
        filter: blur(4px);
        opacity: 0.95;
    }
    html.tier-diagnostic .rec-locked-blur .check-lock-fill.wide {
        height: 56px;
        width: 94%;
        margin-bottom: 0;
    }
    html.tier-diagnostic .rec-locked-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.48);
        z-index: 2;
        padding: 12px;
        box-sizing: border-box;
    }
    html.tier-diagnostic .checks-unlock-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 480px;
        max-width: 100%;
        min-height: 44px;
        height: auto;
        padding: 10px 24px;
        border-radius: 24px;
        background: #e52421;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        text-decoration: none;
        text-align: center;
        line-height: 1.3;
        box-shadow: 0 4px 14px rgba(229, 36, 33, 0.25);
        white-space: normal;
        box-sizing: border-box;
    }
    html.tier-free .check-acc { display: none !important; }
    html.tier-free .section-free-locked {
        width: 870px;
    }
    html.tier-free .free-locked-cta {
        text-align: center;
        padding: 8px 0 4px;
    }
    html.tier-free .checks-unlock-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 320px;
        height: 48px;
        padding: 0 28px;
        border-radius: 24px;
        background: #e52421;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        text-decoration: none;
        box-shadow: 0 4px 16px rgba(229, 36, 33, 0.28);
    }
    html.tier-free .proposal-unlock-sub {
        margin: 10px 0 0;
        font-size: 12px;
        color: #3f3f3f;
    }
    html.tier-free .btn-unlock {
        min-width: 320px;
        height: 48px;
        font-size: 14px;
        background: #ffffff;
        color: #e52421;
        border: none;
    }
    html.tier-free .proposal-footer-watermark {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.85;
        margin-bottom: 8px;
    }
    html.pdf-export .rec-copy { display: none !important; }
    html.pdf-export .check-filters,
    html.pdf-export .check-toolbar { display: none !important; }
    html.pdf-export .check-group.is-hidden { display: flex !important; }
    html.pdf-export details.check-acc { display: block !important; }
    html.pdf-export details.check-acc > summary { pointer-events: none; }
    html.pdf-export details.check-acc .rec-panel { display: block !important; }
    html.pdf-export details.check-acc .arrow { display: none !important; }

    /* Hebrew: mirror chrome like audit-report_he.html (sidebar right, content left) */
    html.rtl-report { direction: rtl; }
    html.rtl-report .page { direction: ltr; }
    html.rtl-report .sheet-sidebar { left: auto; right: 0; }
    html.rtl-report .brand { left: auto; right: 41.5px; }
    html.rtl-report .sheet-url,
    html.rtl-report .meta { left: auto; right: 0; }
    html.rtl-report .meta {
        direction: rtl;
        padding: 0 12px;
        box-sizing: border-box;
        gap: 4px 8px;
        flex-wrap: wrap;
        line-height: 1.35;
        height: auto;
        min-height: 40px;
    }
    html.rtl-report .meta .meta-k {
        margin-inline-end: 0.75em;
        white-space: nowrap;
    }
    html.rtl-report .meta .meta-datetime,
    html.rtl-report .meta .meta-locales {
        direction: ltr;
        unicode-bidi: isolate;
        white-space: nowrap;
    }
    html.rtl-report .sheet-url { direction: ltr; unicode-bidi: isolate; }
    html.rtl-report .gauge-wrap { left: auto; right: 52.5px; }
    html.rtl-report .gauge-grade {
        direction: ltr;
        unicode-bidi: isolate;
    }
    html.rtl-report .sheet-title,
    html.rtl-report .sheet-title-fill {
        margin-left: 0;
        margin-right: 285px;
        width: 945px;
    }
    html.rtl-report .sheet-title h1 { direction: rtl; }
    html.rtl-report .main {
        margin-left: 0;
        margin-right: 285px;
        width: 945px;
    }
    html.rtl-report .section-row {
        direction: rtl;
        margin-left: 0;
        margin-right: 0;
    }
    html.rtl-report .section-toc {
        padding: 24px 30px 0;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    }
    html.rtl-report .toc-item {
        direction: rtl;
        justify-content: flex-start;
    }
    html.rtl-report .toc-text {
        direction: rtl;
        text-align: right;
    }
    /* Match Diagnostics inset: same usable width as .main (945 with 37px gutters) */
    html.rtl-report .section-content {
        width: 945px;
        padding-left: 37px;
        padding-right: 37px;
        box-sizing: border-box;
        direction: rtl;
    }
    html.rtl-report .findings-grid,
    html.rtl-report .metrics-card,
    html.rtl-report .check-stack,
    html.rtl-report .scope {
        margin-left: auto;
        margin-right: auto;
        width: 870px;
        max-width: 100%;
        box-sizing: border-box;
    }
    html.rtl-report .diag-title,
    html.rtl-report .diag-sub { direction: rtl; }
    /*
     * Fixed label column (≈ longest HE label) so chart-body col1 does not collapse
     * to 0 — ticks stay over the bar track and match .chart-grid lines.
     */
    html.rtl-report .chart-body {
        direction: rtl;
        grid-template-columns: 128px minmax(0, 1fr);
        column-gap: 10px;
        padding: 0 24px 8px 24px;
    }
    html.rtl-report .ticks {
        grid-column: 2;
        direction: rtl;
    }
    html.rtl-report .chart-rows {
        direction: rtl;
        grid-template-columns: 128px minmax(0, 1fr);
        column-gap: 10px;
    }
    html.rtl-report .chart-grid {
        left: 0;
        right: 138px; /* label col 128 + gap 10 */
    }
    html.rtl-report .chart-label {
        direction: rtl;
        text-align: right;
        justify-content: flex-end;
        padding: 0;
        width: 100%;
        max-width: none;
    }
    html.rtl-report .bar-track {
        direction: rtl;
    }
    html.rtl-report .findings-grid { direction: rtl; }
    html.rtl-report .finding-card,
    html.rtl-report .finding-head,
    html.rtl-report .finding-head-title,
    html.rtl-report .finding-box { direction: rtl; text-align: right; }
    html.rtl-report .finding-box { padding: 10px 18px 10px 12px; }
    html.rtl-report .finding-box::before {
        left: auto;
        right: 0;
    }
    html.rtl-report .check-card,
    html.rtl-report .check-top,
    html.rtl-report .check-name,
    html.rtl-report .check-result,
    html.rtl-report .check-acc > summary,
    html.rtl-report .rec-panel,
    html.rtl-report .rec-toolbar,
    html.rtl-report .rec-body,
    html.rtl-report .scope-lead,
    html.rtl-report .scope-note,
    html.rtl-report .scope-stats,
    html.rtl-report .scope-chip,
    html.rtl-report .scope-item-k,
    html.rtl-report .scope-item-v { direction: rtl; text-align: right; }
    html.rtl-report .scope-cta { direction: rtl; text-align: center; }
    html.rtl-report .check-result {
        border-radius: 3px 0 0 3px;
    }
    html.rtl-report .check-result.good,
    html.rtl-report .check-result.bad,
    html.rtl-report .check-result.warn {
        border-left: 1px solid;
        border-right: none;
    }
    html.rtl-report .check-result.good { border-left-color: #dff3dd; }
    html.rtl-report .check-result.bad { border-left-color: #ffdbda; }
    html.rtl-report .check-result.warn { border-left-color: #f8eee4; }
    html.rtl-report .check-result::before {
        left: auto;
        right: 0;
    }
    html.rtl-report .check-pages { text-align: left; direction: rtl; }
    html.rtl-report .scope-items { padding: 0; }
    html.rtl-report .scope-items li { padding: 14px 16px 14px 0; }
    html.rtl-report .scope-items li::before {
        left: auto;
        right: 0;
    }
    html.rtl-report .scope-note {
        border-left: none;
        border-right: 3px solid #e52421;
    }
    html.rtl-report table.metrics {
        direction: rtl;
    }
    html.rtl-report table.metrics th,
    html.rtl-report table.metrics td {
        text-align: center;
    }
    table.metrics th:first-child {
        text-align: center;
        padding-left: 6px;
        padding-right: 6px;
    }
    html.rtl-report table.metrics th:first-child,
    html.rtl-report table.metrics td.device {
        text-align: right;
        direction: rtl;
        padding-right: 12px;
        padding-left: 6px;
    }
    html.rtl-report table.metrics td:not(.device),
    html.rtl-report table.metrics .pill {
        direction: ltr;
        unicode-bidi: isolate;
    }
    html.rtl-report table.metrics th:first-child {
        border-right: none;
    }
    html.rtl-report table.metrics th:last-child {
        border-right: 1px solid #fff;
    }
    table.metrics col.col-device { width: 154px; }
    table.metrics col.col-perf { width: 118px; }
    table.metrics col.col-a11y { width: 86px; }
    table.metrics col.col-bp { width: 86px; }
    table.metrics col.col-seo { width: 44px; }
    table.metrics col.col-fcp { width: 58px; }
    table.metrics col.col-lcp { width: 58px; }
    table.metrics col.col-cls { width: 50px; }
    table.metrics col.col-agent { width: 64px; }
    table.metrics td.agent-browse {
        text-align: center;
        vertical-align: middle;
        padding: 8px 2px;
    }
    table.metrics th.col-agent,
    table.metrics thead th:last-child {
        font-size: 9px;
        padding: 6px 2px;
    }
    table.metrics th {
        font-size: 9px;
        text-transform: uppercase;
        line-height: 12px;
    }
    table.metrics .pill {
        font-size: 11px;
    }
    table.metrics td.agent-browse .pill {
        font-size: 11px;
        font-weight: 700;
        min-width: 0;
        padding: 4px 6px;
    }
    .metrics-card .metrics-note {
        margin: 0 0 10px;
        padding: 8px 4px 4px;
        font-size: 11px;
        font-weight: 500;
        line-height: 1.45;
        color: #6b6254;
        text-transform: none;
        letter-spacing: 0;
        border-top: 1px solid #e8e8e8;
    }
    html.rtl-report .check-toolbar { direction: rtl; }
    html.rtl-report .check-filters { justify-content: flex-start; }
    html.rtl-report .footer .cta-title,
    html.rtl-report .footer .cta-sub,
    html.rtl-report .footer .copy { direction: rtl; }
    html.rtl-report .footer .copy { text-align: center; }
    html.rtl-report .footer-contact { direction: rtl; }
    html.rtl-report .footer-contact-label { direction: rtl; unicode-bidi: isolate; }

    .footer-actions {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        column-gap: 28px;
        width: 100%;
        max-width: 1180px;
        margin: 12px auto 4px;
        direction: ltr;
    }
    .footer-actions .footer-contact:first-child { justify-self: end; }
    .footer-actions .btn { justify-self: center; }
    .footer-actions .footer-contact:last-child { justify-self: start; }
    .footer-contact {
        display: flex;
        flex-direction: row;
        align-items: baseline;
        gap: 6px;
        color: #fff;
        text-decoration: none;
        white-space: nowrap;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.3;
    }
    .footer-contact-label {
        font-weight: 500;
        letter-spacing: 0.02em;
        opacity: 0.85;
        text-transform: none;
    }
    .footer-contact-value {
        direction: ltr;
        unicode-bidi: isolate;
    }
    .footer-contact:hover .footer-contact-value { text-decoration: underline; }

    .check-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 870px;
        gap: 16px;
        margin: 0 0 18px;
    }
    .check-count {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: #1e1e1e;
        white-space: nowrap;
    }
    .check-filters {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
    }
    .check-filter {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 30px;
        padding: 0 14px;
        border-radius: 30px;
        border: 1px solid #e8e8e8;
        background: #fff;
        color: #1e1e1e;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        line-height: 1;
        cursor: pointer;
    }
    .check-filter.is-active {
        background: #1e1e1e;
        border-color: #1e1e1e;
        color: #fff;
    }
    .check-stack { gap: 30px; }
    .section-scope .toc-item {
        align-items: stretch;
        min-height: 72px;
    }
    .section-scope .toc-bar {
        height: auto;
        min-height: 72px;
        margin-top: 0;
        align-self: stretch;
    }
    .section-scope .toc-text { line-height: 24px; }
    .scope-lead { font-size: 14px; line-height: 24px; margin: 0 0 20px; }
    .scope-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 0 0 24px;
    }
    .scope-chip {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        line-height: 16px;
        text-transform: uppercase;
        color: #ffffff;
        background: #1e1e1e;
        border-radius: 6px;
        padding: 8px 14px;
    }
    .scope-chip-n { font-weight: 800; letter-spacing: 0; }
    .scope-items {
        list-style: none;
        margin: 0 0 20px;
        padding: 0;
        border-top: 1px solid #e8e8e8;
    }
    .scope-items li {
        font-size: 13px;
        line-height: 24px;
        margin: 0;
        padding: 14px 0 14px 16px;
        border-bottom: 1px solid #e8e8e8;
        position: relative;
    }
    .scope-items li::before {
        content: "";
        position: absolute;
        left: 0;
        top: 22px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #e52421;
    }
    .scope-item-k {
        display: block;
        font-weight: 700;
        font-size: 13px;
        line-height: 24px;
        color: #1e1e1e;
        margin: 0 0 2px;
    }
    .scope-item-v {
        display: block;
        font-weight: 400;
        font-size: 13px;
        line-height: 24px;
        color: #3f3f3f;
    }
    .scope-note {
        font-size: 13px;
        line-height: 24px;
        padding: 14px 16px;
        background: #f7f7f7;
        border-left: 3px solid #e52421;
    }
    .section-row.section-scope {
        page-break-inside: avoid;
        break-inside: avoid;
    }
    .section-scope .scope,
    .section-scope .section-content {
        page-break-inside: avoid;
        break-inside: avoid;
    }
    .scope-cta {
        margin: 16px 0 0;
        text-align: center;
    }
    .scope-cta-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 320px;
        max-width: 100%;
        min-height: 44px;
        padding: 10px 22px;
        border-radius: 24px;
        background: #e52421;
        color: #fff;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        text-decoration: none;
        text-align: center;
        line-height: 1.25;
        box-shadow: 0 4px 14px rgba(229, 36, 33, 0.25);
        box-sizing: border-box;
    }
    html.rtl-report .scope-cta-btn { direction: rtl; }
    .check-group {
        display: flex;
        flex-direction: column;
        gap: 30px;
        width: 870px;
    }
    .check-group.is-hidden { display: none; }
    @media print {
        html.pdf-export body { background: #f3f3f3 !important; padding: 0 !important; display: block !important; }
        html.pdf-export .rec-copy { display: none !important; }
        html.pdf-export .check-filters,
        html.pdf-export .check-toolbar { display: none !important; }
        html.pdf-export details.check-acc { display: block !important; }
        html.pdf-export details.check-acc .rec-panel { display: block !important; }
        html.pdf-export details.check-acc .arrow { display: none !important; }
        html.pdf-export .check-group.is-hidden { display: flex !important; }
        html.pdf-export .check-filter { display: none !important; }
        /* Keep the protocol block on one page (Chromium ignores avoid on flex). */
        html.pdf-export .section-row.section-scope {
            display: table;
            width: 1230px;
            table-layout: fixed;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        html.pdf-export .section-row.section-scope > .section-toc,
        html.pdf-export .section-row.section-scope > .section-content {
            display: table-cell;
            vertical-align: top;
        }
        html.pdf-export .section-row.section-scope > .section-toc { width: 285px; }
        html.pdf-export .section-row.section-scope > .section-content { width: 945px; }
        /* Do not stack margin-right on fixed left/right — that opens a white gap
           equal to the sidebar width between title and HE sidebar. */
        html.rtl-report .sheet-title,
        html.rtl-report .sheet-title-fill {
            left: 0;
            right: 285px;
            margin-left: 0;
            margin-right: 0;
            width: auto;
        }
    }
""";

    private A44ReportGenerator() {}

    public static String render(AuditReportView view, A44Tier tier, String assetBase) throws IOException {
        AuditReportI18n i18n = view.i18n;
        A44Copy copy = A44Copy.of(i18n.lang, tier);
        boolean rtl = "he".equals(i18n.lang);
        String htmlClass = "report-a4-4 tier-" + tier.folder + (rtl ? " rtl-report" : "");
        int score = Math.max(0, Math.min(100, view.overallScore));
        String dash = score + " " + (100 - score);
        String h1 = i18n.h1Html.replace("<br>", " ").replace("&amp;", "&");

        StringBuilder body = new StringBuilder();
        body.append("<div class=\"page\">\n");
        body.append("    <aside class=\"sheet-sidebar\">\n");
        body.append("        <a class=\"brand\" href=\"https://erythro.ai/\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Erythro.ai\">");
        body.append("<img src=\"").append(assetBase).append("/logo-digital.svg\" width=\"202\" height=\"63\" alt=\"Erythro.ai\"></a>\n");
        body.append("        <div class=\"sheet-url\">").append(esc(view.displayUrl)).append("</div>\n");
        body.append("    </aside>\n");
        body.append("    <div class=\"meta\">")
                .append("<span class=\"meta-k\">").append(esc(metaLabel(i18n.metaDateLabel))).append("</span>")
                .append(" <strong class=\"meta-datetime\">").append(esc(formatMetaDateTime(view.dateStr, i18n.lang))).append("</strong>")
                .append(" &nbsp;|&nbsp; ")
                .append("<span class=\"meta-k\">").append(esc(metaLabel(i18n.metaLocalesLabel))).append("</span>")
                .append(" <strong class=\"meta-locales\">").append(esc(view.localesStr)).append("</strong></div>\n");
        body.append("    <div class=\"gauge-wrap\">\n");
        body.append("        <svg class=\"gauge-svg\" viewBox=\"0 0 140 140\" aria-hidden=\"true\">\n");
        body.append("            <circle cx=\"70\" cy=\"70\" r=\"70\" fill=\"#E52421\"/>\n");
        body.append("            <circle cx=\"70\" cy=\"70\" r=\"58\" fill=\"none\" stroke=\"#1E1E1E\" stroke-width=\"5\"/>\n");
        body.append("            <path d=\"M 70 12 A 58 58 0 1 1 70 128 A 58 58 0 1 1 70 12\" pathLength=\"100\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"5\" stroke-linecap=\"butt\" stroke-dasharray=\"")
                .append(dash).append("\"/>\n");
        body.append("        </svg>\n");
        body.append("        <div class=\"gauge-hole\">\n");
        body.append("            <div class=\"gauge-score\">").append(score).append("</div>\n");
        body.append("            <div class=\"gauge-grade\">GRADE:<span class=\"gauge-grade-val\">").append(esc(view.grade)).append("</span></div>\n");
        body.append("            <div class=\"gauge-sub\">").append(esc(i18n.gaugeSub)).append("</div>\n");
        body.append("        </div>\n    </div>\n");
        body.append("    <div class=\"sheet-title\"><h1>").append(h1).append("</h1></div>\n");
        body.append("    <div class=\"sheet-title-fill").append(tier == A44Tier.FREE ? " proposal-preview-strip" : "").append("\">")
                .append(esc(copy.strip)).append("</div>\n");
        body.append("    <table class=\"sheet\" role=\"presentation\">\n");
        body.append("      <thead><tr><td class=\"sheet-head\"></td></tr></thead>\n");
        body.append("      <tfoot><tr><td class=\"sheet-foot\"></td></tr></tfoot>\n");
        body.append("      <tbody><tr><td class=\"sheet-body\">\n");
        body.append("    <div class=\"main\">\n");
        body.append(chartCard(view, copy));
        body.append("    </div>\n");
        body.append("    <div class=\"section-rows\">\n");
        body.append(findingsSection(view, copy, i18n, tier));
        if (tier == A44Tier.PRO) {
            body.append(metricsSection(view, copy, i18n, true, assetBase, pagesForTier(view, tier)));
            body.append(checksSection(view, copy, i18n, tier, assetBase));
        } else if (tier == A44Tier.DIAGNOSTIC) {
            body.append(metricsSection(view, copy, i18n, false, assetBase, pagesForTier(view, tier)));
            body.append(checksSection(view, copy, i18n, tier, assetBase));
        } else if (tier == A44Tier.FREE) {
            body.append(metricsSection(view, copy, i18n, false, assetBase, pagesForTier(view, tier)));
            body.append(freeLockedChecksSection(copy, i18n));
        }
        body.append(ReportScopeOfWork.sectionRow(view, tier));
        body.append("    </div>\n");
        body.append("      </td></tr></tbody>\n");
        body.append("    </table>\n");
        body.append(footer(view, copy, i18n, tier, assetBase));
        body.append("</div>\n");
        if (tier == A44Tier.PRO) {
            body.append(COPY_SCRIPT);
        }
        if (tier != A44Tier.FREE) {
            body.append(FILTER_SCRIPT);
        }

        String css = toA4RemCss(loadBaseCss() + EXTRA_CSS);
        return "<!DOCTYPE html>\n"
                + "<html lang=\"" + esc(i18n.htmlLang) + "\""
                + (i18n.htmlDirAttr == null || i18n.htmlDirAttr.isBlank() ? "" : " " + i18n.htmlDirAttr)
                + " class=\"" + htmlClass + "\">\n"
                + "<head>\n<meta charset=\"UTF-8\">\n<title>"
                + (tier == A44Tier.FREE ? i18n.proposalDocTitle : i18n.docTitle)
                + "</title>\n"
                + "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n"
                + "<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n"
                + "<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap\" rel=\"stylesheet\">\n"
                + "<style>\n" + css + "\n</style>\n</head>\n<body>\n"
                + body
                + "</body>\n</html>\n";
    }

    private static String loadBaseCss() throws IOException {
        for (Path p : List.of(
                Paths.get("templates/audit_template_a4_4.html"),
                Paths.get("reports/audit-report-a4-4.html"),
                Paths.get("QA_Auditor/reports/audit-report-a4-4.html")
        )) {
            if (Files.isRegularFile(p)) {
                String html = Files.readString(p);
                int a = html.indexOf("<style>");
                int b = html.indexOf("</style>");
                if (a >= 0 && b > a) {
                    return html.substring(a + "<style>".length(), b);
                }
            }
        }
        throw new IOException("A4-4 CSS template not found");
    }

    /**
     * Fit the 1230-unit Figma canvas onto real A4 (210×297 mm), same approach as
     * white templates ({@code font-size: calc(210mm / 595)} with rem lengths).
     */
    private static String toA4RemCss(String css) {
        String rem = css.replaceAll("(\\d+(?:\\.\\d+)?)px", "$1rem");
        return """
            @page { size: A4; margin: 0; }
            html {
                font-size: calc(210mm / 1230);
            }
            html, body {
                width: 210mm;
                min-height: 297mm;
            }
            @media screen {
                html, body {
                    width: 100%;
                    min-height: 100%;
                    background: #2a2a2a;
                }
                body {
                    display: flex;
                    justify-content: center;
                    padding: 24px 0 48px;
                }
                .page { zoom: 1.5; box-shadow: 0 8px 32px rgba(0,0,0,0.35); }
            }
            """ + rem;
    }

    private static String chartCard(AuditReportView view, A44Copy copy) {
        String ticks = "<div class=\"ticks\" aria-hidden=\"true\"><span>0</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span><span>70</span><span>80</span><span>90</span><span>100</span></div>";
        StringBuilder rows = new StringBuilder();
        addBar(rows, copy.chartSpeed, view.speedScore);
        addBar(rows, copy.chartSeo, view.seoScore);
        addBar(rows, copy.chartLead, view.leadScore);
        addBar(rows, copy.chartSec, view.secScore);
        addBar(rows, copy.chartAi, view.aiVisScore);
        return """
        <div class="chart-card">
            <h2 class="diag-title">%s</h2>
            <p class="diag-sub">%s</p>
            <div class="chart-body">
                %s
                <div class="chart-grid-wrap">
                    <div class="chart-grid" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
                    <div class="chart-rows">%s</div>
                </div>
                %s
            </div>
        </div>
""".formatted(copy.diagTitleHtml, esc(copy.diagSub), ticks, rows, ticks);
    }

    private static void addBar(StringBuilder rows, String label, int score) {
        String cls = score >= 90 ? "bar-green" : (score >= 50 ? "bar-warn" : "bar-bad");
        rows.append("<div class=\"chart-label\">").append(esc(label)).append("</div>");
        rows.append("<div class=\"bar-track\"><div class=\"bar-fill ").append(cls)
                .append("\" style=\"width:").append(Math.max(0, Math.min(100, score))).append("%\"></div></div>");
    }

    private static String findingsSection(AuditReportView view, A44Copy copy, AuditReportI18n i18n, A44Tier tier) {
        StringBuilder cards = new StringBuilder();
        List<Map<String, String>> list = view.topVulnerabilities == null ? List.of() : view.topVulnerabilities;
        int n = Math.min(3, list.size());
        for (int i = 0; i < n; i++) {
            Map<String, String> v = list.get(i);
            String solution = tier == A44Tier.PRO ? esc(v.get("solution")) : esc(i18n.proposalSolutionTeaser);
            cards.append("<article class=\"finding-card\">");
            cards.append("<div class=\"finding-head\"><div class=\"finding-idx\">")
                    .append(String.format("%02d", i + 1)).append("</div>");
            cards.append("<h3 class=\"finding-head-title\">").append(esc(copy.findingHead)).append("</h3></div>");
            cards.append("<div class=\"finding-box problem\"><strong>").append(esc(i18n.findingProblem)).append("</strong> ")
                    .append(esc(v.get("title")))
                    .append("<span class=\"issue\">").append(esc(v.get("issue"))).append("</span></div>");
            cards.append("<div class=\"finding-box impact\"><strong>").append(esc(i18n.findingImpact)).append("</strong> ")
                    .append(esc(v.get("impact"))).append("</div>");
            cards.append("<div class=\"finding-box solution\"><strong>").append(esc(i18n.findingSolution)).append("</strong> ")
                    .append(solution).append("</div>");
            cards.append("</article>");
        }
        String inner = "<div class=\"findings-grid\">" + cards + "</div>";
        if (tier == A44Tier.FREE) {
            inner += "<p class=\"check-pages\">"
                    + esc(String.format(copy.pagesChecked, pagesForTier(view, tier)))
                    + "</p>";
        }
        return section(i18n.sectionTop3, inner);
    }

    private static String checksSection(
            AuditReportView view, A44Copy copy, AuditReportI18n i18n, A44Tier tier, String assetBase) {
        List<Map<String, String>> rows;
        if (tier == A44Tier.PRO && view.fullSignalRows != null && !view.fullSignalRows.isEmpty()) {
            rows = view.fullSignalRows;
        } else if (tier == A44Tier.DIAGNOSTIC) {
            rows = diagnosticChecklist(view);
        } else {
            rows = view.checkRows == null ? List.of() : view.checkRows;
        }
        int visible = rows.size();
        List<Map<String, String>> good = new ArrayList<>();
        List<Map<String, String>> warn = new ArrayList<>();
        List<Map<String, String>> bad = new ArrayList<>();
        for (int i = 0; i < visible; i++) {
            Map<String, String> row = rows.get(i);
            switch (normalizeCheckStatus(row)) {
                case "good" -> good.add(row);
                case "bad" -> bad.add(row);
                default -> warn.add(row);
            }
        }
        String allLabel = "he".equals(i18n.lang) ? "הכל" : ("en".equals(i18n.lang) ? "all" : "все");
        String resultsLabel = "he".equals(i18n.lang) ? "תוצאות" : ("en".equals(i18n.lang) ? "Results" : "Результаты");
        StringBuilder inner = new StringBuilder();
        inner.append("<div class=\"check-toolbar\">");
        inner.append("<p class=\"check-count\">").append(esc(resultsLabel)).append(" (").append(visible).append(")</p>");
        inner.append("<div class=\"check-filters\" role=\"tablist\">");
        inner.append(filterBtn("all", allLabel, true));
        inner.append(filterBtn("good", i18n.statusExcellent, false));
        inner.append(filterBtn("warn", i18n.statusNeedsAttention, false));
        inner.append(filterBtn("bad", i18n.statusCritical, false));
        inner.append("</div></div>");
        inner.append("<div class=\"check-stack\">");
        int pages = pagesForTier(view, tier);
        boolean[] firstCard = {true};
        inner.append(checkGroup("good", good, copy, i18n, pages, tier, assetBase, firstCard));
        inner.append(checkGroup("warn", warn, copy, i18n, pages, tier, assetBase, firstCard));
        inner.append(checkGroup("bad", bad, copy, i18n, pages, tier, assetBase, firstCard));
        inner.append("</div>");
        return section(checksToc(i18n), inner.toString());
    }

    /**
     * Diagnostic keeps the summary-table size (10–11 cards). Failing aggregated
     * extras (SEO/OG, a11y, …) still replace the weakest green rows so problems
     * are not dropped; per-URL funnel cards stay in Pro. Display order is
     * excellent → needs-attention → critical (see checksSection).
     */
    private static List<Map<String, String>> diagnosticChecklist(AuditReportView view) {
        List<Map<String, String>> base = view.checkRows == null ? List.of() : view.checkRows;
        List<Map<String, String>> bad = new ArrayList<>();
        List<Map<String, String>> warn = new ArrayList<>();
        List<Map<String, String>> good = new ArrayList<>();
        List<String> baseIds = new ArrayList<>();
        for (Map<String, String> row : base) {
            baseIds.add(String.valueOf(row.getOrDefault("id", "")));
            switch (normalizeCheckStatus(row)) {
                case "good" -> good.add(row);
                case "bad" -> bad.add(row);
                default -> warn.add(row);
            }
        }
        List<Map<String, String>> extras = view.fullSignalRows == null ? List.of() : view.fullSignalRows;
        for (Map<String, String> row : extras) {
            String id = String.valueOf(row.getOrDefault("id", ""));
            if (baseIds.contains(id) || id.startsWith("agent_")) {
                continue;
            }
            switch (normalizeCheckStatus(row)) {
                case "good" -> { /* keep original green summaries, do not inflate */ }
                case "bad" -> bad.add(row);
                default -> warn.add(row);
            }
        }
        int cap = Math.max(base.size(), 1);
        List<Map<String, String>> out = new ArrayList<>();
        for (Map<String, String> row : bad) {
            if (out.size() >= cap) {
                break;
            }
            out.add(row);
        }
        for (Map<String, String> row : warn) {
            if (out.size() >= cap) {
                break;
            }
            out.add(row);
        }
        for (Map<String, String> row : good) {
            if (out.size() >= cap) {
                break;
            }
            out.add(row);
        }
        return out;
    }

    private static String checksToc(AuditReportI18n i18n) {
        return switch (i18n.lang) {
            case "en" -> "FULL AUDIT CHECKLIST<br>&amp; FUNNEL CRAWL";
            case "he" -> "רשימת בדיקות מלאה<br>וסריקת משפך";
            default -> "ПОЛНЫЙ ЧЕКЛИСТ АУДИТА<br>И ОБХОД ВОРОНКИ";
        };
    }

    /** Free tier teaser: unlock CTA only (full checklist lives in paid tiers). */
    private static String freeLockedChecksSection(A44Copy copy, AuditReportI18n i18n) {
        String inner = "<div class=\"section-free-locked\">"
                + "<div class=\"free-locked-cta\">"
                + "<a class=\"checks-unlock-btn\" href=\"" + esc(i18n.unlockReportUrl) + "\">"
                + esc(i18n.unlockReportBtn) + "</a>"
                + "<p class=\"proposal-unlock-sub\">" + esc(copy.unlockOverlaySub) + "</p>"
                + "</div>"
                + "</div>";
        return section(checksToc(i18n), inner);
    }

    private static String filterBtn(String status, String label, boolean active) {
        return "<button type=\"button\" class=\"check-filter" + (active ? " is-active" : "")
                + "\" data-filter=\"" + status + "\">" + esc(label) + "</button>";
    }

    private static String checkGroup(
            String status, List<Map<String, String>> rows,
            A44Copy copy, AuditReportI18n i18n, int pages, A44Tier tier, String assetBase,
            boolean[] firstCard) {
        if (rows.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("<div class=\"check-group\" data-status=\"").append(status).append("\">");
        for (Map<String, String> row : rows) {
            boolean isFirst = firstCard[0];
            if (isFirst) {
                firstCard[0] = false;
            }
            sb.append(checkCard(row, copy, i18n, pages, tier, assetBase, isFirst));
        }
        sb.append("</div>");
        return sb.toString();
    }

    private static String normalizeCheckStatus(Map<String, String> row) {
        String status = String.valueOf(row.getOrDefault("status", "warn")).toLowerCase();
        if ("good".equals(status) || "ok".equals(status)) {
            return "good";
        }
        if ("bad".equals(status) || "critical".equals(status)) {
            return "bad";
        }
        return "warn";
    }

    private static String checkCard(
            Map<String, String> row, A44Copy copy, AuditReportI18n i18n, int pages,
            A44Tier tier, String assetBase, boolean isFirst) {
        String status = normalizeCheckStatus(row);
        String id = String.valueOf(row.getOrDefault("id", ""));
        StringBuilder sb = new StringBuilder();
        sb.append("<article class=\"check-card\" data-status=\"").append(status).append("\">");
        sb.append("<div class=\"check-top\"><span class=\"check-badge ").append(status).append("\">")
                .append(esc(row.get("label"))).append("</span>");
        sb.append("<h3 class=\"check-name\">").append(esc(row.get("param"))).append("</h3></div>");
        sb.append("<div class=\"check-result ").append(status).append("\">");
        sb.append("<p class=\"check-result-label\">").append(esc(i18n.thCheckResult)).append("</p>");
        sb.append("<p class=\"check-result-text\">").append(esc(row.get("result"))).append("</p></div>");
        if (tier == A44Tier.PRO) {
            sb.append(accordion(copy, assetBase, A44Recommendations.forCheck(id, status, i18n.lang), true,
                    "good".equals(status) ? copy.recImproveTitle : copy.recTitle));
            sb.append("<p class=\"check-pages\">").append(esc(String.format(copy.pagesChecked, pages))).append("</p>");
        } else if (tier == A44Tier.DIAGNOSTIC) {
            if (isFirst) {
                sb.append(lockedRecommendationsAccordion(copy, i18n, assetBase, status));
            }
            sb.append("<p class=\"check-pages\">").append(esc(String.format(copy.pagesChecked, pages))).append("</p>");
        }
        sb.append("</article>");
        return sb.toString();
    }

    /** Open accordion teaser: blurred faux rec text + unlock CTA (no real recommendations in DOM). */
    private static String lockedRecommendationsAccordion(
            A44Copy copy, AuditReportI18n i18n, String assetBase, String status) {
        String title = "good".equals(status) ? copy.recImproveTitle : copy.recTitle;
        return "<details class=\"check-acc check-acc-locked\" open>"
                + "<summary><img src=\"" + assetBase + "/icon-idea-16.svg\" width=\"16\" height=\"16\" alt=\"\">"
                + esc(title)
                + "<img class=\"arrow\" src=\"" + assetBase + "/icon-arrow-down.svg\" width=\"9\" height=\"9\" alt=\"\"></summary>"
                + "<div class=\"rec-panel rec-panel-locked\">"
                + "<div class=\"rec-locked-blur\" role=\"presentation\" aria-hidden=\"true\">"
                + "<span class=\"check-lock-fill\"></span>"
                + "<span class=\"check-lock-fill\"></span>"
                + "<span class=\"check-lock-fill\"></span>"
                + "<span class=\"check-lock-fill wide\"></span>"
                + "</div>"
                + "<div class=\"rec-locked-overlay\">"
                + "<a class=\"checks-unlock-btn\" href=\"" + esc(i18n.unlockReportUrl) + "\">"
                + esc(copy.unlockRecsBtn) + "</a>"
                + "</div></div></details>";
    }

    private static String accordion(A44Copy copy, String assetBase, String recText, boolean open) {
        return accordion(copy, assetBase, recText, open, copy.recTitle);
    }

    private static String accordion(A44Copy copy, String assetBase, String recText, boolean open, String title) {
        String heading = title == null || title.isBlank() ? copy.recTitle : title;
        return "<details class=\"check-acc\"" + (open ? " open" : "") + ">"
                + "<summary><img src=\"" + assetBase + "/icon-idea-16.svg\" width=\"16\" height=\"16\" alt=\"\">"
                + esc(heading)
                + "<img class=\"arrow\" src=\"" + assetBase + "/icon-arrow-down.svg\" width=\"9\" height=\"9\" alt=\"\"></summary>"
                + "<div class=\"rec-panel\"><div class=\"rec-toolbar\">"
                + "<span class=\"rec-chip\">" + esc(copy.recChip) + "</span>"
                + "<button type=\"button\" class=\"rec-copy\">" + esc(copy.recCopy) + " "
                + "<img src=\"" + assetBase + "/icon-copy.svg\" width=\"16\" height=\"16\" alt=\"\"></button></div>"
                + "<pre class=\"rec-body\">" + esc(recText) + "</pre></div></details>";
    }

    private static int pagesForTier(AuditReportView view, A44Tier tier) {
        int visited = Math.max(0, view.pagesVisited);
        return Math.min(visited, tier.pageCap);
    }

    private static String metricsSection(
            AuditReportView view, A44Copy copy, AuditReportI18n i18n, boolean withRec, String assetBase, int pages) {
        // Black header row stays English in every locale (matches Lighthouse labels).
        String thDevice = "DEVICE";
        String thPerf = "PERFORMANCE";
        String thA11y = "ACCESSIBILITY";
        String thBp = "BEST PRACTICES";
        String thSeo = "SEO";
        String thFcp = "FCP";
        String thLcp = "LCP";
        String thCls = "CLS";
        String thAgent = "Funnel<br>pages";
        StringBuilder rows = new StringBuilder();
        String mobilePerf = "—", mobileLcp = "—", mobileFcp = "—", deskPerf = "—", deskLcp = "—";
        List<Map<String, String>> lh = view.lighthouseRows == null ? List.of() : view.lighthouseRows;
        boolean agentPlaced = false;
        for (Map<String, String> r : lh) {
            rows.append("<tr><td class=\"device\">").append(esc(r.get("device"))).append("</td>");
            rows.append(pillCell(r.get("performance")));
            rows.append(pillCell(r.get("accessibility")));
            rows.append(pillCell(r.get("best_practices")));
            rows.append(pillCell(r.get("seo")));
            rows.append("<td>").append(esc(r.get("fcp"))).append("</td>");
            rows.append("<td>").append(esc(r.get("lcp"))).append("</td>");
            rows.append("<td>").append(esc(r.get("cls"))).append("</td>");
            if (!agentPlaced) {
                rows.append(agentBrowseCell(view, pages, Math.max(1, lh.size())));
                agentPlaced = true;
            }
            rows.append("</tr>");
            String dev = String.valueOf(r.get("device")).toLowerCase();
            if (dev.contains("mobile") || dev.contains("iphone") || dev.contains("мобил")) {
                mobilePerf = r.get("performance");
                mobileLcp = r.get("lcp");
                mobileFcp = r.get("fcp");
            } else {
                deskPerf = r.get("performance");
                deskLcp = r.get("lcp");
            }
        }
        if (lh.isEmpty()) {
            rows.append("<tr><td class=\"device\">—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td>");
            rows.append(agentBrowseCell(view, pages, 1)).append("</tr>");
        }
        StringBuilder card = new StringBuilder("<div class=\"metrics-card\"><table class=\"metrics\">");
        card.append("<colgroup><col class=\"col-device\"><col class=\"col-perf\"><col class=\"col-a11y\">")
                .append("<col class=\"col-bp\"><col class=\"col-seo\"><col class=\"col-fcp\">")
                .append("<col class=\"col-lcp\"><col class=\"col-cls\"><col class=\"col-agent\"></colgroup>");
        card.append("<thead><tr><th>").append(thDevice).append("</th><th>").append(thPerf)
                .append("</th><th>").append(thA11y).append("</th><th>").append(thBp)
                .append("</th><th>").append(thSeo).append("</th><th>").append(thFcp)
                .append("</th><th>").append(thLcp).append("</th><th>").append(thCls)
                .append("</th><th>").append(thAgent).append("</th></tr></thead><tbody>")
                .append(rows).append("</tbody></table>");
        if (withRec) {
            card.append(accordion(copy, assetBase,
                    A44Recommendations.lighthouse(i18n.lang, mobilePerf, mobileLcp, mobileFcp, deskPerf, deskLcp),
                    true));
        }
        int shown = Math.max(0, pages);
        int opened = Math.max(0, shown - Math.min(Math.max(0, view.pagesBroken), shown));
        card.append("<p class=\"metrics-note\">").append(esc(funnelNote(i18n.lang, opened, shown))).append("</p>");
        card.append("</div>");
        return section(i18n.sectionSpeedHtml, card.toString());
    }

    private static String pillCell(String score) {
        int n = 0;
        try { n = Integer.parseInt(String.valueOf(score).replaceAll("[^0-9]", "")); } catch (Exception ignored) {}
        String cls = n >= 90 ? "pill-good" : (n >= 50 ? "pill-warn" : "pill-bad");
        return "<td><span class=\"pill " + cls + "\">" + esc(score) + "</span></td>";
    }

    private static String agentBrowseCell(AuditReportView view, int pages, int rowspan) {
        int shown = Math.max(0, pages);
        int broken = Math.min(Math.max(0, view.pagesBroken), shown);
        int opened = Math.max(0, shown - broken);
        String cls = broken > 0 ? "pill-bad" : (shown > 0 ? "pill-good" : "pill-warn");
        return "<td class=\"agent-browse\" rowspan=\"" + rowspan + "\">"
                + "<span class=\"pill " + cls + "\">" + opened + "/" + shown + "</span></td>";
    }

    private static String funnelNote(String lang, int opened, int shown) {
        if (opened == shown) {
            return ReportFindingsCatalog.tr(lang,
                    "Обход воронки: " + shown + " ключевых URL открыты аудитором (HTTP).",
                    "Funnel crawl: " + shown + " key URLs opened by the auditor (HTTP).",
                    "סריקת משפך: " + shown + " כתובות נפתחו על ידי הסוקר (HTTP).");
        }
        return ReportFindingsCatalog.tr(lang,
                "Обход воронки: " + opened + " из " + shown + " ключевых URL открыты аудитором (HTTP).",
                "Funnel crawl: " + opened + " of " + shown + " key URLs opened by the auditor (HTTP).",
                "סריקת משפך: " + opened + " מתוך " + shown + " כתובות נפתחו על ידי הסוקר (HTTP).");
    }

    private static String footer(AuditReportView view, A44Copy copy, AuditReportI18n i18n, A44Tier tier, String assetBase) {
        if (tier == A44Tier.FREE) {
            String unlock = "<a class=\"btn btn-unlock\" href=\""
                    + esc(i18n.unlockReportUrl) + "\">" + esc(i18n.proposalFooterBtn) + "</a>";
            return "<footer class=\"footer footer-proposal\">"
                    + "<div class=\"proposal-footer-watermark\">" + esc(i18n.proposalPreviewBadge) + "</div>"
                    + "<div class=\"cta-title\">" + esc(i18n.proposalFooterLine) + "</div>"
                    + footerActions(i18n.lang, unlock)
                    + "<div class=\"copy\">" + i18n.copyright + "</div></footer>\n";
        }
        String whatsapp = "<a class=\"btn\" href=\"https://wa.me/972533333333\">" + esc(i18n.ctaWhatsapp) + "</a>";
        return "<footer class=\"footer\">"
                + "<div class=\"cta-title\">" + i18n.ctaTitleHtml.replaceAll("<svg[\\s\\S]*?</svg>",
                "<img src=\"" + assetBase + "/logo-footer.svg\" width=\"96\" height=\"21\" alt=\"Erythro.ai\">")
                + "</div>"
                + "<p class=\"cta-sub\">" + esc(i18n.ctaSub) + "</p>"
                + footerActions(i18n.lang, whatsapp)
                + "<div class=\"copy\">" + i18n.copyright + "</div></footer>\n";
    }

    private static String footerActions(String lang, String buttonHtml) {
        boolean he = "he".equals(lang);
        String emailLabel = he ? "אימייל" : "email";
        String phoneLabel = he ? "טלפון" : ("en".equals(lang) ? "phone" : "телефон");
        String contactDir = he ? " dir=\"rtl\"" : "";
        return "<div class=\"footer-actions\">"
                + "<a class=\"footer-contact\" href=\"mailto:team@erythro.ai\"" + contactDir + ">"
                + "<span class=\"footer-contact-label\">" + emailLabel + ":</span>"
                + "<span class=\"footer-contact-value\" dir=\"ltr\">team@erythro.ai</span></a>"
                + buttonHtml
                + "<a class=\"footer-contact\" href=\"tel:+972505308305\"" + contactDir + ">"
                + "<span class=\"footer-contact-label\">" + phoneLabel + ":</span>"
                + "<span class=\"footer-contact-value\" dir=\"ltr\">+972 50 530 8 305</span></a>"
                + "</div>";
    }

    private static String section(String tocHtml, String inner) {
        return """
        <div class="section-row">
            <div class="section-toc"><div class="toc-item"><div class="toc-bar"></div><div class="toc-text">%s</div></div></div>
            <div class="section-content">
                %s
            </div>
        </div>
""".formatted(tocHtml, inner);
    }

    /** Ensures meta labels end with a colon for spacing before the value. */
    private static String metaLabel(String label) {
        if (label == null || label.isBlank()) {
            return "";
        }
        String trimmed = label.trim();
        return trimmed.endsWith(":") || trimmed.endsWith("：") ? trimmed : trimmed + ":";
    }

    /**
     * Hebrew sidebar meta shows time before date (04:11 27.08.2026).
     * Other languages keep "dd.MM.yyyy HH:mm".
     */
    private static String formatMetaDateTime(String dateStr, String lang) {
        if (dateStr == null || dateStr.isBlank()) {
            return "";
        }
        if (!"he".equals(lang)) {
            return dateStr.trim();
        }
        String[] parts = dateStr.trim().split("\\s+");
        if (parts.length >= 2 && parts[0].contains(".") && parts[1].contains(":")) {
            return parts[1] + " " + parts[0];
        }
        return dateStr.trim();
    }

    private static String esc(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
