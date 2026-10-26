#!/usr/bin/env node
/**
 * Renders the Pro v2 HTML reports (RU/EN/HE) to A4 PDF with Playwright (project's @playwright/test).
 * Run after apply-v2-polish.cjs:  node services/audit-agent/QA_Auditor/scripts/render-v2-pdf.cjs
 * Targets that are locked by another program (e.g. an open PDF viewer) are skipped and reported.
 */
let chromium;
try {
  chromium = require('@playwright/test').chromium;
} catch (e1) {
  try {
    chromium = require('C:/dev/erythro-ai/node_modules/@playwright/test').chromium;
  } catch (e2) {
    chromium = require('playwright').chromium;
  }
}
const fs = require('fs');
const path = require('path');
let PDFDocument, rgb, StandardFonts;
try {
  ({ PDFDocument, rgb, StandardFonts } = require('pdf-lib'));
} catch (e1) {
  try {
    ({ PDFDocument, rgb, StandardFonts } = require('C:/dev/erythro-ai/services/audit-agent/node_modules/pdf-lib'));
  } catch (e2) {}
}

const D = 'C:/agents/website-auditor/erythro-ai/QA_Auditor/reports/';
const ROOT = 'C:/agents/website-auditor/erythro-ai/reports/';
const P = 'C:/dev/erythro-ai/';

// --tier=pro builds only that tier (PDF is built per tier once its HTML is approved)
const ALL_TIERS = ['pro', 'diagnostic', 'free'];
const tierArg = (process.argv.find((a) => a.startsWith('--tier=')) || '').slice(7);
const TIERS = tierArg ? tierArg.split(',').filter((t) => ALL_TIERS.includes(t)) : ALL_TIERS;
if (!TIERS.length) throw new Error('unknown --tier: ' + tierArg);
const LANGS = ['ru', 'en', 'he'];

(async () => {
  const b = await chromium.launch();
  for (const t of TIERS) {
    for (const l of LANGS) {
      const src = D + `${t}/audit-report_${l}.html`;
      if (!fs.existsSync(src)) {
        console.warn(`[!] Missing HTML source: ${src}`);
        continue;
      }
      const p = await b.newPage({ viewport: { width: 794, height: 1123 } });
      await p.goto('file:///' + src, { waitUntil: 'load' });
      await p.emulateMedia({ media: 'print' });
      await p.evaluate(() => { document.querySelectorAll('details').forEach((d) => { d.removeAttribute('name'); d.open = true; }); });
      await p.evaluate(() => document.fonts.ready);
      // Full-bleed page background: no @page margins (they print white); the 10mm top/bottom and 8mm side
      // spacing is rebuilt with a table whose thead/tfoot repeat on every page.
      await p.addStyleTag({ content: '@page { size: A4; margin: 0 !important; } html, body { background: #eaeaea !important; margin: 0 !important; }' });
      await p.evaluate(() => {
        const w = document.querySelector('.wrap');
        const tbl = document.createElement('table');
        tbl.style.cssText = 'width:100%;border-collapse:collapse;table-layout:fixed;background:transparent';
        const cell = (h, pad) => '<td style="height:' + h + ';padding:' + pad + ' !important;vertical-align:top;text-align:start !important;text-transform:none !important;letter-spacing:normal !important;font:inherit !important;color:inherit !important;background:transparent !important;border:0 !important;"></td>';
        tbl.innerHTML = '<thead><tr>' + cell('10mm', '0') + '</tr></thead><tfoot><tr>' + cell('10mm', '0') + '</tr></tfoot><tbody><tr>' + cell('auto', '0 8mm') + '</tr></tbody>';
        w.parentNode.insertBefore(tbl, w);
        tbl.querySelector('tbody td').appendChild(w);
      });
      let buf = await p.pdf({ format: 'A4', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } });
      let pageCount = 0;

      if (PDFDocument) {
        try {
          const pdfDoc = await PDFDocument.load(buf);
          const total = pdfDoc.getPageCount();
          pageCount = total;
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const isRtl = l === 'he';

          for (let i = 0; i < total; i++) {
            const page = pdfDoc.getPage(i);
            const { width, height } = page.getSize();
            const pageStr = `${i + 1} / ${total}`;
            const tw = font.widthOfTextAtSize(pageStr, 8);
            const x = isRtl ? 24 : (width - 24 - tw);
            const y = 10;
            page.drawText(pageStr, {
              x,
              y,
              size: 8,
              font,
              color: rgb(0.45, 0.45, 0.45)
            });
          }
          buf = Buffer.from(await pdfDoc.save());
        } catch (pdfErr) {
          console.warn(`[!] Numbering error for ${t}-${l}:`, pdfErr.message);
        }
      }

      const pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
      const targets = [
        D + `${t}/audit-report_${l}.pdf`,
        ROOT + `${t}/audit-report_${l}.pdf`,
        P + `services/audit-agent/QA_Auditor/reports/${t}/audit-report_${l}.pdf`,
        P + `public/samples/audit/${t}-${l}.pdf`,
      ];
      if (t === 'pro') {
        targets.push(D + `pro-v2/audit-report_${l}.pdf`);
        targets.push(P + `services/audit-agent/QA_Auditor/reports/pro-v2/audit-report_${l}.pdf`);
        targets.push(P + `public/samples/audit/pro-${l}-v2.pdf`);
      }
      if (t === 'pro' && l === 'ru') {
        targets.push(D + 'audit-report.pdf');
        targets.push(ROOT + 'audit-report.pdf');
        targets.push(P + 'services/audit-agent/QA_Auditor/reports/audit-report.pdf');
      }
      const res = targets.map((target) => {
        try {
          const dir = path.dirname(target);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(target, buf);
          return 'ok';
        } catch (e) {
          const alt = target.replace(/.pdf$/, '.new.pdf');
          try {
            fs.writeFileSync(alt, buf);
            return 'LOCKED:' + target.split('/').pop() + ' -> ' + alt.split('/').pop();
          } catch (e2) {
            return 'LOCKED:' + target.split('/').pop();
          }
        }
      });
      console.log(`[✓] PDF [${t}-${l}] pages ${pageCount || pages}: ${res.join(' ')}`);
      await p.close();
    }
  }
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
