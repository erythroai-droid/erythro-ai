#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

let PDFDocument, rgb, StandardFonts;
try {
  ({ PDFDocument, rgb, StandardFonts } = require('pdf-lib'));
} catch (e1) {
  try {
    ({ PDFDocument, rgb, StandardFonts } = require(path.resolve(process.cwd(), 'node_modules/pdf-lib')));
  } catch (e2) {
    try {
      ({ PDFDocument, rgb, StandardFonts } = require(path.resolve(__dirname, '../node_modules/pdf-lib')));
    } catch (e3) {
      try {
        ({ PDFDocument, rgb, StandardFonts } = require(path.resolve(__dirname, '../../node_modules/pdf-lib')));
      } catch (e4) {
        try {
          ({ PDFDocument, rgb, StandardFonts } = require('C:/dev/erythro-ai/services/audit-agent/node_modules/pdf-lib'));
        } catch (e5) {
          console.warn('[stamp-pdf-numbers] pdf-lib not found, skipping page numbering');
          process.exit(0);
        }
      }
    }
  }
}

const file = process.argv[2];
const lang = process.argv[3] || 'ru';

if (!file || !fs.existsSync(file)) {
  console.warn(`[stamp-pdf-numbers] File not found: ${file}`);
  process.exit(0);
}

(async () => {
  try {
    const buf = fs.readFileSync(file);
    const pdfDoc = await PDFDocument.load(buf);
    const total = pdfDoc.getPageCount();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const isRtl = lang === 'he';

    for (let i = 0; i < total; i++) {
      const page = pdfDoc.getPage(i);
      const { width } = page.getSize();
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
    const out = await pdfDoc.save();
    fs.writeFileSync(file, out);
    console.log(`[✓] Stamped page numbers (${total} pages) on ${file}`);
  } catch (err) {
    console.warn(`[!] stamp-pdf-numbers error on ${file}: ${err.message}`);
  }
})();
