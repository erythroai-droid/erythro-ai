# PDF report templates (ru / en / he)

## Files

| File | Purpose |
|------|---------|
| `audit_template_white.html` | Base layout with `{{PLACEHOLDER}}` shell (fallback) |
| `audit_template_white_ru.html` | Russian report shell |
| `audit_template_white_en.html` | English report shell |
| `audit_template_white_he.html` | Hebrew report shell (`dir=rtl`, class `rtl-report`) |

Runtime strings (Top-3, check table, chart labels) come from `AuditReportI18n` + `ReportFindingsCatalog`.

## Run audit (3 site locales)

```bash
LOCALES=en,ru,he mvn compile exec:java
```

## Report language

```bash
# Russian PDF (default)
REPORT_LANG=ru mvn compile exec:java

# English PDF
REPORT_LANG=en mvn compile exec:java

# Hebrew PDF (RTL content column)
REPORT_LANG=he mvn compile exec:java
```

`LOCALES` = which language versions of the **target site** are scanned.  
`REPORT_LANG` = language of the **executive PDF** for the client.
