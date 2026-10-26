#!/usr/bin/env node
/**
 * Idempotent design polish for the Pro v2 report HTML (RU / EN / HE).
 *
 * Why a script: the v2 HTML copies are produced/overwritten by other tools and
 * agents; this re-applies the agreed design (CSS block + markup tweaks) in one go.
 *
 *   node scripts/apply-v2-polish.cjs            # patch every known copy
 *   node scripts/apply-v2-polish.cjs file.html  # patch specific files
 *
 * The CSS block is replaced (not appended) on every run, markup changes are
 * detected and skipped when already applied.
 */
const fs = require('fs');
const path = require('path');

const D = process.env.QA_AUDITOR_DIR?.trim() || 
  (fs.existsSync(path.resolve('reports')) ? path.resolve('.') : 
   (fs.existsSync('C:/agents/website-auditor/erythro-ai/QA_Auditor') ? 'C:/agents/website-auditor/erythro-ai/QA_Auditor' : path.resolve('.')));

const P = (fs.existsSync('C:/dev/erythro-ai') ? 'C:/dev/erythro-ai' : path.resolve(D, '../..'));
const LANGS = ['ru', 'en', 'he'];

function defaultFiles() {
  const out = [];
  const ROOT = path.resolve(D, '..');
  const TIERS = ['pro', 'diagnostic', 'free'];
  for (const t of TIERS) {
    for (const l of LANGS) {
      for (const f of [
        path.join(D, `templates/audit_template_${t}_${l}.html`),
        path.join(D, `reports/${t}/audit-report_${l}.html`),
        path.join(ROOT, `reports/${t}/audit-report_${l}.html`),
        path.join(P, `services/audit-agent/QA_Auditor/reports/${t}/audit-report_${l}.html`),
        path.join(P, `public/samples/audit/${t}-${l}.html`),
      ]) {
        if (fs.existsSync(f)) out.push(f);
      }
      if (t === 'pro') {
        for (const f of [
          path.join(D, `templates/audit_template_v2_${l}.html`),
          path.join(D, `reports/pro-v2/audit-report_${l}.html`),
          path.join(P, `services/audit-agent/QA_Auditor/reports/pro-v2/audit-report_${l}.html`),
          path.join(P, `public/samples/audit/pro-${l}-v2.html`),
        ]) {
          if (fs.existsSync(f)) out.push(f);
        }
      }
    }
  }
  for (const f of [
    path.join(D, 'reports/audit-report.html'),
    path.join(ROOT, 'reports/audit-report.html'),
    path.join(P, 'services/audit-agent/QA_Auditor/reports/audit-report.html'),
  ]) {
    if (fs.existsSync(f)) out.push(f);
  }
  return out;
}

const T = {
  ru: { step: 'Шаг', h2: 'Рекомендуемые действия', growth: 'Точка роста',
    sub: 'Порядок исправлений: идите сверху вниз, от самого срочного к менее срочным. Цвет показывает срочность и совпадает со статусами в чеклисте.',
    leg: ['Критично — исправить в первую очередь', 'Требует внимания — запланировать', 'Точка роста — по возможности'] },
  en: { step: 'Step', h2: 'Recommended actions', growth: 'Growth opportunity',
    sub: 'Fix order: work from top to bottom, from the most urgent to the least. The color shows urgency and matches the statuses in the checklist.',
    leg: ['Critical — fix first', 'Needs attention — plan it', 'Growth — when possible'] },
  he: { step: 'שלב', h2: 'פעולות מומלצות', growth: 'הזדמנות לצמיחה',
    sub: 'סדר התיקונים: מלמעלה למטה, מהדחוף ביותר ללא דחוף. הצבע מציין דחיפות ותואם לסטטוסים ברשימת הבדיקות.',
    leg: ['קריטי — לתקן קודם', 'דורש תשומת לב — לתכנן', 'הזדמנות לצמיחה — במידת האפשר'] },
};

const HE_TEXT_FIXES = [
  ['ציון מהירות מובייל נמוך מהרצוי.', 'ציון Lighthouse במובייל: 50/100, LCP 8.3 s.'],
  ['אופטימיזציית Core Web Vitals: תמונות מתקדמות וטעינת CSS קריטי מבית Erythro.ai.', 'אופטימיזציית Core Web Vitals: תמונות Next-Gen, CSS קריטי וטעינה מוקדמת (preload) של אלמנט ה-LCP.'],
  ['כל 100+ אלפיות שנייה של עיכוב מפחיתות המרה ומייקרות את עלות הליד.', 'כל 100 אלפיות שנייה נוספות של עיכוב מפחיתות המרה ומייקרות את עלות הליד.'],
  ['תמונות next-gen, CSS קריטי ו-CDN מבית Erythro.ai.', 'דחיסת תמונות Next-Gen, CSS קריטי ומטמון CDN מבית Erythro.ai.'],
  ['סוכני AI מבית Erythro.ai: סיווג, ניתוב ומשימות 24/7.', 'סוכני AI עם n8n/CRM מבית Erythro.ai: סיווג (קוואליפיקציה), דיוור אוטומטי ומשימות 24/7.'],
  ['צמיחה — לפי האפשר', 'הזדמנות לצמיחה — במידת האפשר'],
  ['3 פגיעויות הקונברסיה המרכזיות והכנסה מוחמצת', '3 פגיעויות ההמרה המרכזיות והכנסות שאובדות'],
  ['הגדרת קישורי alternates (hreflang) ומטא-נתוני OpenGraph לכל השפות', 'הגדרת תגיות alternate רב-לשוניות (hreflang) ומטא-נתוני OpenGraph לכל השפות'],
  ['גלילה אופקית (Overflow-X במובייל 375px)', 'גלילה אופקית לא רצויה (Overflow-X במובייל 375px)'],
  ['Robots.txt: בוטים AI ואינדוקס', 'Robots.txt: בוטי AI ואינדוקס'],
  ['HTTPS וכותרות אבטחה HTTP', 'HTTPS וכותרות אבטחת HTTP'],
  ['RTL ופריסה לישראל (עברית)', 'שיקוף RTL ופריסה לישראל (עברית)'],
  ['התפריט מוביל רק ל-URL חיים', 'התפריט מוביל רק לכתובות URL פעילות'],
  ['הטמיעו אוטומציית AI והגדילו את הקונברסיה באתר', 'הטמיעו אוטומציית AI והגדילו את יחס ההמרה באתר'],
  ['פגיעות קונברסיה', 'פגיעות המרה'],
];

const R = ':root:root:root ';
const MARK_START = '/* === v2-polish:start === */';
const MARK_END = '/* === v2-polish:end === */';

function css(lang) {
  const he = lang === 'he';
  const font = he ? "'Heebo', system-ui, sans-serif" : "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
  return `${MARK_START}
${R.trim()} { --bg: #eaeaea; --card: #f8f8f8; --soft: #ffffff; --line: #d6d6d6; --mute: #554f42; --mono: ${font}; }
${R}body, ${R}body * { font-family: ${font}; }
${R}.code-box, ${R}.code-box *, ${R}pre, ${R}code { font-family: 'IBM Plex Mono', ${he ? "'Heebo', " : ''}ui-monospace, Menlo, Consolas, monospace !important; }
${R}.wrap { gap: 40px !important; }
${R}.wrap > .logo { margin-bottom: -30px !important; }
${R}.card { background: #f8f8f8 !important; }
${R}section { border: 1px solid #e0e0e0 !important; }
${R}section.card-ai-visibility { border-top: 4px solid #8b5cf6 !important; }
${R}.card.card-ai-visibility { background: #f8f8f8 !important; }
${R}.ai-engine, ${R}.ai-factor { background: #ffffff !important; }
${R}.gauge svg circle:first-child { stroke: #b3b3b3; }
${R}.flow { background: #fff !important; border: 1px solid var(--line); }
${R}.scope-list li { position: relative; padding-inline-start: 24px !important; }
${R}.scope-list li::before { content: ""; position: absolute; inset-inline-start: 2px; top: 29px; width: 8px; height: 8px; border-radius: 50%; background: #e52421; }
${R}.chip, ${R}.chip:hover { transition: none !important; }
${R}.chip:hover { background: var(--soft) !important; border-color: var(--line) !important; transform: none !important; box-shadow: none !important; }
${R}.code-file, ${R}.code-file svg, ${R}.code-file code { color: #1e1e1e !important; }
${R}.code-box pre, ${R}.code-box pre code, ${R}.code-box .code-header { direction: ltr !important; text-align: left !important; }
${R}.code-file code { unicode-bidi: isolate; }

/* ---- diagnostic results badges & hovers ---- */
${R}.badge.ok { background: #eef9ec !important; border-color: #cfeccb !important; color: #1d7a12 !important; }
${R}.badge.warn { background: #fff6ec !important; border-color: #f8dcc0 !important; color: #9a4a00 !important; }
${R}.badge.crit { background: #fff1f0 !important; border-color: #fca5a5 !important; color: #b91c1c !important; }

${R}a.badge {
  text-decoration: none !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  transition: background-color .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease, transform .15s ease !important;
}
${R}a.badge:hover {
  transform: translateY(-1px) !important;
  filter: none !important;
}
${R}a.badge.warn:hover {
  background: #ff7900 !important;
  border-color: #ff7900 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(255, 121, 0, 0.35) !important;
  filter: none !important;
}
${R}a.badge.crit:hover {
  background: #e52421 !important;
  border-color: #e52421 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(229, 36, 33, 0.35) !important;
  filter: none !important;
}

/* ---- AI verdict, lead-path block, footer CTA ---- */
${R}.ai-verdict { margin-top: 56px !important; padding: 26px 28px 24px !important; }
${R}.ai-verdict-body h4 { margin-top: 0 !important; margin-bottom: 8px !important; }
${R}.flow { padding: 20px 24px !important; margin-top: 18px !important; gap: 16px !important; }
${R}.flow-col h4 { margin-bottom: 14px !important; }
${R}.flow-in { gap: 8px !important; align-items: flex-start; }
${R}.flow-in .pill { width: max-content; max-width: 100%; white-space: normal; padding: 5px 14px !important; }
${R}.flow-steps { gap: 8px !important; }
${R}.flow-step { padding: 10px 14px !important; }
${R}.flow-out { gap: 10px !important; }
${R}.note { margin-top: 14px !important; }
${R}.cta { grid-template-columns: minmax(0, 1fr) !important; row-gap: 0 !important; text-align: center !important; justify-items: center; }
${R}.cta > div { max-width: none !important; width: 100%; }
${R}.cta h2, ${R}.cta p { max-width: none !important; text-align: center !important; }
${R}.cta h2::before { content: ""; display: inline-block !important; width: 2px; height: 1em; background: var(--brand); margin-inline-end: 12px; vertical-align: -2px; border-radius: 2px; }
${R}.cta .contacts { margin-top: 20px !important; justify-content: center !important; }
${R}.cta a.go { justify-self: center; margin-top: 28px !important; padding: 18px 40px !important; min-width: 280px; display: inline-flex; align-items: center; justify-content: center; }
${R}.foot { text-align: center; }

/* ---- checklist: accordion ---- */
${R}.checks { gap: 10px !important; }
${R}.check { position: relative; --c: #94a3b8; --c-bg: #f8fafc; border: 1px solid var(--line) !important; border-radius: 10px !important; background: #f8f8f8 !important; padding: 0 !important; box-shadow: none !important; margin-bottom: 0 !important; overflow: hidden; interpolate-size: allow-keywords; transition: box-shadow .2s ease, background-color .2s ease, border-color .2s ease !important; }
${R}.check[data-s="g"] { --c: #22bf16; --c-bg: #f3fbf2; }
${R}.check[data-s="w"] { --c: #ff7900; --c-bg: #fff8f1; }
/* growth point: an issue on a scale that is in the green zone (90+) */
${R}.check[data-s="n"] { --c: #6b6b6b; --c-bg: #f6f6f6; }
${R}.st.n { color: #3d3d3d !important; background: #ececec !important; border-color: #6b6b6b !important; font-weight: 500; }
${R}.check[data-s="n"] .rec { border-top: 3px solid #6b6b6b !important; }
${R}.check[data-s="n"] .rec-title-row b { font-family: var(--mono) !important; font-weight: 600 !important; font-size: 11px !important; letter-spacing: .04em !important; text-transform: uppercase !important; color: #3d3d3d !important; }
${R}.check[data-s="n"] .check-action-link { color: #4a4a4a !important; }
${R}.filter.on[data-f="n"] { background: #6b6b6b !important; border-color: #6b6b6b !important; color: #fff !important; }
${R}.badge.grow { background: #f1f1f1 !important; border-color: #d0d0d0 !important; color: #4a4a4a !important; }
${R}a.badge.grow:hover { background: #1e1e1e !important; border-color: #1e1e1e !important; color: #fff !important; }
${R}.check[data-s="c"] { --c: #e52421; --c-bg: #fff4f3; }
${R}.check::details-content { height: 0; overflow: hidden; transition: height .3s ease, content-visibility .3s allow-discrete; }
${R}.check[open]::details-content { height: auto; }
${R}.check::before { content: ""; position: absolute; inset-block: 0; inset-inline-start: 0; width: 3px; background: var(--line); transition: background-color .2s ease; }
${R}.check[open]::before { background: var(--c); }
${R}.check summary { padding: 20px 24px !important; gap: 16px !important; }
${R}.check summary, ${R}.check .body { padding-inline-start: 26px !important; }
${R}.check:not([open]) summary:hover { background: transparent !important; }
${R}.check:hover summary .nm { color: inherit !important; font-weight: 500 !important; }
${R}.check .chev { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--line); background: #fff; display: flex !important; align-items: center; justify-content: center; padding: 0 !important; font-size: 0 !important; font-size-adjust: none !important; line-height: 0 !important; color: var(--mute) !important; transition: transform .25s ease, background-color .2s ease, color .2s ease, border-color .2s ease !important; }
${R}.check .chev::after { content: ""; width: 7px; height: 7px; margin: -3px 0 0 0; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(45deg); }
${R}.check[open] { background: var(--c-bg) !important; border-color: var(--c) !important; }
${R}.check[open] summary .nm { color: #1e1e1e !important; font-weight: 600 !important; }
${R}.check[open] summary .chev { background: var(--c); border-color: var(--c); color: #fff !important; transform: rotate(180deg); }
${R}.check .body { padding: 0 24px 24px !important; }
${R}.check[open] .res, ${R}.check[open] .rec { background: #fff !important; }
${R}.check:hover, ${R}.check:not([open]):hover, ${R}.check[open]:hover { box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.10) !important; }
${R}.check:not([open]):hover, ${R}.check[open]:hover { background: #ffffff !important; }

/* ---- recommended actions ---- */
${R}.actions { gap: 18px !important; }
${R}.action, ${R}.action:nth-child(odd), ${R}.action:nth-child(even), ${R}.action:has(.tag.crit), ${R}.action:has(.tag.med), ${R}.action:has(.tag.gold) { --c: #6b6b6b; position: relative; overflow: hidden; background: #fff !important; border: 1px solid var(--line) !important; border-radius: 10px !important; padding: 26px 28px !important; box-shadow: none !important; transition: box-shadow .2s ease !important; }
${R}.action:has(.tag.crit) { --c: #e52421; }
${R}.action:has(.tag.med) { --c: #e8650a; }
${R}.action::before { content: ""; position: absolute; inset-block: 0; inset-inline-start: 0; width: 3px; background: var(--c); }
${R}.action > div:first-child { min-width: 0; }
${R}.action h3 { font-size: 19px !important; font-weight: 600 !important; color: #1e1e1e !important; margin-bottom: 12px !important; }
${R}.action p { color: #2b2b2b !important; font-size: 15px !important; line-height: 1.75 !important; margin-top: 14px !important; max-width: 760px !important; }
${R}.action .plus { align-self: start; display: flex !important; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-width: 76px; padding: 10px 14px !important; font-size: 30px !important; font-weight: 700 !important; line-height: 1 !important; background: var(--c) !important; color: #fff !important; border: 0 !important; border-radius: 10px; box-shadow: none !important; outline: none !important; }
${R}.action .plus small { margin: 0 !important; font-size: 11px !important; font-weight: 600 !important; letter-spacing: .06em; text-transform: uppercase; color: rgba(255,255,255,.92) !important; }
${R}.action .code-box { border: 1px solid var(--line) !important; border-top: 3px solid var(--c) !important; background: #fff !important; max-width: 100%; }
${R}.action .code-box pre, ${R}.action .code-box code { overflow-x: auto; max-width: 100%; }
${R}.action .btn-copy { color: #4a4a4a !important; background: #f4f4f4 !important; border-color: #cfcfcf !important; }
${R}.action:has(.tag.crit) .btn-copy { color: #a80d0a !important; background: #fff5f5 !important; border-color: #fca5a5 !important; }
${R}.action:has(.tag.med) .btn-copy { color: #8f3f00 !important; background: #fff9f2 !important; border-color: #fcd34d !important; }
${R}.action:hover, ${R}.action:nth-child(odd):hover, ${R}.action:nth-child(even):hover, ${R}.action:has(.tag.crit):hover, ${R}.action:has(.tag.med):hover, ${R}.action:has(.tag.gold):hover { box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.20) !important; }
${R}.tag.gold { background: #fff !important; border-color: var(--line) !important; color: #4a4a4a !important; }
${R}.legend { display: flex; flex-wrap: wrap; gap: 8px 22px; margin: 18px 0 0; padding: 0; list-style: none; font-size: 14px; color: var(--mute); }
${R}.legend li { display: flex; align-items: center; gap: 8px; }
${R}.legend li::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: var(--d); flex-shrink: 0; }
${R}.legend li:nth-child(1) { --d: #e52421; } ${R}.legend li:nth-child(2) { --d: #e8650a; } ${R}.legend li:nth-child(3) { --d: #6b6b6b; }

/* ---- tier lock card & engineering spec (Free & Diagnostic) ---- */
${R}.tier-lock-card {
  position: relative !important;
  background: #ffffff !important;
  border: 1px dashed #c4c4c4 !important;
  border-radius: 10px !important;
  padding: 22px 26px !important;
  margin-top: 14px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
}
${R}.tier-lock-card .lock-header {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #1e1e1e !important;
}
${R}.tier-lock-card .lock-header svg {
  width: 20px !important;
  height: 20px !important;
  color: #e8650a !important;
  flex-shrink: 0 !important;
}
${R}.tier-lock-card p {
  margin: 0 !important;
  font-size: 14px !important;
  line-height: 1.6 !important;
  color: #444444 !important;
}
${R}.tier-lock-card .lock-bullets {
  margin: 4px 0 6px !important;
  padding: 0 !important;
  list-style: none !important;
  font-size: 13.5px !important;
  line-height: 1.7 !important;
  color: #333333 !important;
}
${R}.tier-lock-card .lock-actions {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  flex-wrap: wrap !important;
  margin-top: 4px !important;
}
${R}.spec-box {
  background: #fbfbfc !important;
  border: 1px solid var(--line) !important;
  border-top: 3px solid #0284c7 !important;
  border-radius: 8px !important;
  padding: 14px 18px !important;
  margin-top: 14px !important;
}
${R}.spec-box-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  font-family: var(--mono) !important;
  font-size: 11px !important;
  color: #554f42 !important;
  border-bottom: 1px solid var(--line) !important;
  padding-bottom: 8px !important;
  margin-bottom: 10px !important;
}
${R}.spec-box-body {
  font-size: 13.5px !important;
  line-height: 1.6 !important;
  color: #2b2b2b !important;
}
${R}.spec-box-pro-note {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  margin-top: 10px !important;
  padding-top: 10px !important;
  border-top: 1px dashed var(--line) !important;
  font-size: 12.5px !important;
  color: #64748b !important;
}
${R}.spec-pro-link {
  color: #e8650a !important;
  font-weight: 600 !important;
  text-decoration: none !important;
}
${R}.spec-pro-link:hover {
  text-decoration: underline !important;
}

/* ---- top-3 locked solution in Free tier ---- */
${R}.t3-row.solution.locked {
  background: #fff9f5 !important;
  border-radius: 6px !important;
  padding: 8px 12px !important;
  margin-top: 4px !important;
}
${R}.t3-sol-locked {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-size: 13.5px !important;
  color: #554f42 !important;
}
${R}.t3-sol-locked svg {
  color: #e8650a !important;
  flex-shrink: 0 !important;
}
${R}.t3-lock-link, ${R}.t3-step-link {
  color: #e52421 !important;
  font-weight: 600 !important;
  text-decoration: none !important;
}
${R}.t3-lock-link:hover, ${R}.t3-step-link:hover {
  color: #b91c1c !important;
  text-decoration: underline !important;
}

/* ---- footer CTA for Free tier ---- */
${R}.cta-buttons {
  display: flex !important;
  gap: 14px !important;
  flex-wrap: wrap !important;
  justify-content: center !important;
  margin-top: 24px !important;
}
${R}.cta-buttons a.go {
  margin-top: 0 !important;
  min-width: 220px !important;
}
${R}.cta-text-link {
  color: #e8650a !important;
  font-weight: 600 !important;
  text-decoration: underline !important;
}
${R}.cta-text-link:hover {
  color: #c2410c !important;
}

/* ---- Free: locked scale badge, Step 1 link in top-3, locked steps 2–6, tier comparison ---- */
${R}a.badge.lock { background: #f4f4f4 !important; border-color: var(--line) !important; color: #6b6b6b !important; }
${R}a.badge.lock:hover { background: #1e1e1e !important; border-color: #1e1e1e !important; color: #fff !important; }
${R}.actions-locked { gap: 10px !important; }
${R}.action-locked { --c: #6b6b6b; position: relative; display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; padding: 14px 18px 14px 20px; background: #f8f8f8; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
${R}.action-locked:has(.tag.crit) { --c: #e52421; }
${R}.action-locked:has(.tag.med) { --c: #e8650a; }
${R}.action-locked::before { content: ""; position: absolute; inset-block: 0; inset-inline-start: 0; width: 3px; background: var(--c); }
${R}.action-locked h3 { margin: 0 0 8px !important; font-size: 16px !important; font-weight: 600 !important; color: #1e1e1e !important; }
${R}.action-locked .tags { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
${R}.action-locked .locked-note { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #6b6b6b; }
${R}.action-locked .locked-note svg { color: #e8650a; flex-shrink: 0; }
${R}.action-locked .plus { display: flex !important; flex-direction: column; align-items: center; gap: 2px; min-width: 64px; padding: 8px 12px !important; font-size: 22px !important; font-weight: 700 !important; line-height: 1 !important; background: #fff !important; color: var(--c) !important; border: 1px solid var(--c) !important; border-radius: 8px; box-shadow: none !important; }
${R}.action-locked .plus small { margin: 0 !important; font-size: 10px !important; font-weight: 600 !important; letter-spacing: .06em; text-transform: uppercase; color: inherit !important; }
/* tier comparison: own type scale, not the mono/uppercase Lighthouse table */
/* section frame like AI Visibility, in brand red */
${R}section.tiers { border-top: 4px solid #e52421 !important; border-radius: 12px !important; box-shadow: 0 4px 20px rgba(229, 36, 33, .06) !important; }
${R}.tiers-wrap { margin-top: 26px; overflow-x: auto; background: #fff; border: 0; border-radius: 14px; }
${R}.tiers-table { width: 100%; margin: 0 !important; border-collapse: separate; border-spacing: 0; min-width: 600px; table-layout: fixed; }
${R}.tiers-table th, ${R}.tiers-table td { padding: 15px 18px !important; border-bottom: 1px solid #efefef !important; text-align: center !important; vertical-align: middle; font-family: inherit !important; text-transform: none !important; letter-spacing: 0 !important; font-size: 14.5px !important; line-height: 1.45; color: #1e1e1e; }
${R}.tiers-table tbody tr:last-child th, ${R}.tiers-table tbody tr:last-child td { border-bottom: 0 !important; }
${R}.tiers-table tbody tr:nth-child(even) th, ${R}.tiers-table tbody tr:nth-child(even) td { background: #fafafa; }
${R}.tiers-table thead th { vertical-align: bottom; padding-block: 26px 20px !important; border-bottom: 1px solid var(--line) !important; background: #fff; }
${R}.tiers-table thead th:first-child { width: 36%; }
${R}.tiers-table .t-name { display: block; font-size: 19px; font-weight: 700; color: #1e1e1e; }
${R}.tiers-table .t-price { display: flex; align-items: baseline; justify-content: center; gap: 8px; margin-top: 8px; font-size: 30px; font-weight: 700; line-height: 1; color: #1e1e1e; direction: ltr; }
${R}.tiers-table .t-old { font-size: 17px; font-weight: 600; color: #4a4a4a; text-decoration: line-through; text-decoration-color: #1e1e1e; text-decoration-thickness: 1.5px; }
${R}.tiers-table .t-note { display: block; margin-top: 8px; font-size: 12.5px; font-weight: 500; line-height: 1.35; color: #6b6b6b; }
${R}.tiers-table .is-here .t-name, ${R}.tiers-table .is-here .t-price { color: #4f4f4f; }
${R}.tiers-table thead th.is-pro { position: relative; background: #e52421 !important; }
${R}.tiers-table thead th.is-pro .t-name, ${R}.tiers-table thead th.is-pro .t-price, ${R}.tiers-table thead th.is-pro .t-note { color: #fff; }
${R}.tiers-table tbody th { text-align: start !important; font-weight: 500 !important; color: #3d3d3d !important; }
${R}.tiers-table td:nth-child(2) { color: #4f4f4f; }
${R}.tiers-table thead th.is-pro { border-inline: 1px solid #e52421 !important; border-bottom-color: rgba(0, 0, 0, .2) !important; }
${R}.tiers-table tbody tr:hover th, ${R}.tiers-table tbody tr:hover td { background: #f4f4f4; }
${R}.tiers-table .yes { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #e8f8e6; color: #1d9a12; font-weight: 700; font-size: 14px; }
${R}.tiers-table .no { display: inline-flex; color: #8a8a8a; }
${R}.tiers-table .no svg { display: block; }
/* checks count row: the numbers do the selling */
${R}.tiers-table tr.row-count td { font-size: 26px !important; font-weight: 700 !important; color: #1e1e1e; }
${R}.tiers-table tr.row-count td:nth-child(2) { color: #4f4f4f; }
${R}.tiers-table tr.row-count th { font-weight: 600 !important; color: #1e1e1e !important; }
/* AI Visibility rows: lead topic of the audit, same violet as the AI Visibility section */
${R}.tiers-table tbody tr.row-ai th, ${R}.tiers-table tbody tr.row-ai td, ${R}.tiers-table tbody tr.row-ai:nth-child(even) th, ${R}.tiers-table tbody tr.row-ai:nth-child(even) td { background: #fff; }
${R}.tiers-table tr.row-ai th { color: #1e1e1e !important; font-weight: 600 !important; border-inline-start: 4px solid #8b5cf6 !important; }
${R}.tiers-table tr.row-ai td { font-weight: 600; color: #1e1e1e; }
${R}.tiers-table tr.row-ai td:nth-child(2) { color: #4f4f4f; }
${R}.tiers-table tbody tr.row-ai:hover th, ${R}.tiers-table tbody tr.row-ai:hover td { background: #f4f4f4; }
${R}.tiers-table .ai-tag { display: inline-block; margin-bottom: 6px; padding: 3px 9px; border-radius: 999px; background: #8b5cf6; color: #fff; font-size: 10.5px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; }
${R}.tiers-table tr.row-ai th .ai-tag { display: table; }
/* Free column: neutral #fafafa, muted type */
${R}.tiers-table thead th:nth-child(2), ${R}.tiers-table tbody tr td:nth-child(2) { background: #fafafa !important; }
${R}.tiers-table tbody tr:hover td:nth-child(2) { background: #f1f1f1 !important; }
/* Diagnostic column: the gold of the header badge (#ffe9c7), dark type */
${R}.tiers-table thead th:nth-child(3), ${R}.tiers-table tbody tr td:nth-child(3) { background: #ffe9c7 !important; color: #1e1e1e !important; border-bottom-color: rgba(30, 30, 30, .08) !important; }
${R}.tiers-table tbody tr:hover td:nth-child(3) { background: #ffdfae !important; }
${R}.tiers-table td:nth-child(3) .no { color: #8a6a3a; }
/* Pro column: the whole column in brand red, white type (wins over zebra, hover and AI-row tints) */
${R}.tiers-table tbody tr td:nth-child(4) { background: #e52421 !important; color: #fff !important; font-weight: 600; border-inline: 1px solid #e52421 !important; border-bottom-color: rgba(0, 0, 0, .2) !important; }
${R}.tiers-table tbody tr:hover td:nth-child(4) { background: #cf1f1c !important; }
${R}.tiers-table tbody tr:last-child td:nth-child(4) { border-bottom: 0 !important; }
${R}.tiers-table td:nth-child(4) .yes { background: #fff; color: #e52421; }
${R}.tiers-table td:nth-child(4) .no { color: rgba(255, 255, 255, .6); }
/* ---- Diagnostic: checklist summary cards per area ---- */
${R}.sum-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 22px; }
${R}.sum-card { --c: #22bf16; position: relative; overflow: hidden; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 20px 22px 20px 24px; }
${R}.sum-card[data-s="n"] { --c: #6b6b6b; } ${R}.sum-card[data-s="w"] { --c: #ff7900; } ${R}.sum-card[data-s="c"] { --c: #e52421; }
${R}.sum-card::before { content: ""; position: absolute; inset-block: 0; inset-inline-start: 0; width: 3px; background: var(--c); }
${R}.sum-card.sum-ai { grid-column: 1 / -1; border-color: #ddd0ff; box-shadow: 0 4px 20px rgba(139, 92, 246, .06); }
${R}.sum-card.sum-ai::before { width: 4px; background: #8b5cf6; }
${R}.sum-head { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; }
${R}.sum-head h3 { flex: 1; min-width: 0; margin: 0 !important; font-size: 17px !important; font-weight: 600 !important; color: #1e1e1e !important; }
${R}.sum-card .ai-tag { display: inline-block; margin-bottom: 8px; padding: 3px 9px; border-radius: 999px; background: #8b5cf6; color: #fff; font-size: 10.5px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; }
${R}.sum-total { margin: 6px 0 12px !important; font-size: 13px !important; color: #5f5f5f !important; }
${R}.sum-counts { display: flex; flex-wrap: wrap; gap: 6px; }
${R}.sum-n { padding: 3px 10px; border: 1px solid; border-radius: 999px; font-size: 12px; font-weight: 500; }
${R}.sum-n.g { color: #0e5a06; background: #eef9ec; border-color: #cfeccb; } ${R}.sum-n.n { color: #3d3d3d; background: #f1f1f1; border-color: #d6d6d6; }
${R}.sum-n.w { color: #8f3f00; background: #fff6ec; border-color: #f8dcc0; } ${R}.sum-n.c { color: #a80d0a; background: #fff1f0; border-color: #fca5a5; }
${R}.sum-issues { display: grid; gap: 12px; margin: 16px 0 0 !important; padding: 0 !important; list-style: none; }
${R}.sum-issues li { display: grid; gap: 5px; padding-top: 12px; border-top: 1px solid #eee; }
${R}.sum-issues li .st { justify-self: start; min-width: 0; }
${R}.sum-issues b { font-size: 14px; font-weight: 600; color: #1e1e1e; }
${R}.sum-issues small { font-size: 12.5px; line-height: 1.5; color: #5f5f5f; }
${R}.sum-locked { display: flex; align-items: center; gap: 8px; margin: 16px 0 0 !important; font-size: 13px !important; color: #1e1e1e !important; }
${R}.sum-locked svg { flex-shrink: 0; color: #8b5cf6; }
/* ---- Diagnostic: AI Visibility summary score (breakdown is Pro) ---- */
${R}.ai-summary { --z: #22bf16; display: flex; align-items: center; gap: 22px; margin-top: 20px; padding: 18px 22px; background: #fff; border: 1px solid #e4dcff; border-radius: 12px; }
${R}.ai-summary[data-z="warn"] { --z: #ff7900; } ${R}.ai-summary[data-z="bad"] { --z: #e52421; }
${R}.ai-summary-num b { font-size: 46px; font-weight: 700; line-height: 1; color: var(--z); }
${R}.ai-summary-num small { margin-inline-start: 2px; font-size: 16px; color: #6b6b6b; }
${R}.ai-summary-tx { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
${R}.ai-summary-lbl { font-size: 15px; font-weight: 600; color: #1e1e1e; }
${R}.ai-summary-pass { font-size: 13px; color: #5f5f5f; }
/* ---- Pro: AI Visibility criteria status (from data) ---- */
${R}.ai-factor .tag.ok { background: #eef9ec !important; border-color: #cfeccb !important; color: #1d7a12 !important; }
${R}.ai-factor .tag.crit { background: #fff1f0 !important; border-color: #fca5a5 !important; color: #b91c1c !important; }
/* ---- Pro: Funnel review (AI verdict on the lead path) ---- */
${R}.fr-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 22px; }
${R}.fr-box { --c: #22bf16; position: relative; overflow: hidden; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px 18px 22px; }
${R}.fr-box[data-s="w"] { --c: #ff7900; } ${R}.fr-box[data-s="c"] { --c: #e52421; }
${R}.fr-box::before { content: ""; position: absolute; inset-block: 0; inset-inline-start: 0; width: 3px; background: var(--c); }
${R}.fr-box b, ${R}.fr-fix b { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: #6b6b6b; }
${R}.fr-box p, ${R}.fr-fix p { margin: 0 !important; font-size: 15px !important; line-height: 1.6 !important; color: #1e1e1e !important; }
${R}.fr-gaps { margin: 0 !important; padding-inline-start: 18px !important; font-size: 15px; line-height: 1.6; color: #1e1e1e; }
${R}.fr-none { color: #1d7a12 !important; }
/* the recommendation follows the review status (green: no gaps, orange: gaps), never alarm red */
${R}.fr-fix { --c: #22bf16; margin-top: 16px; background: #fff; border: 1px solid var(--line); border-inline-start: 4px solid var(--c); border-radius: 12px; padding: 18px 20px; }
${R}.fr-fix[data-s="w"] { --c: #ff7900; }
/* scales: the header row takes the spare height, so number and bars sit on one line across a row
   even when a badge wraps under the title (tablet, PDF) */
${R}.scale { display: flex; flex-direction: column; }
${R}.scale .row { flex: 1 0 auto; align-items: flex-start; }
/* gauge word stays inside the ring: 2-line wrap via <span>…<br>…</span>, room from the stroke */
${R}.gauge { display: inline-flex !important; position: relative !important; align-items: center !important; justify-content: center !important; }
${R}.gauge .lbl {
  position: absolute !important;
  inset: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  width: 100% !important;
  height: 100% !important;
  padding: 24px 20px !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
  letter-spacing: 0 !important;
  box-sizing: border-box !important;
}
${R}.gauge .lbl > span {
  display: block !important;
  text-align: center !important;
  max-width: 100% !important;
  line-height: 1.25 !important;
}
${R}.bt-short { display: none; }
${R}.tiers-hint { display: none; }
/* first column (variant A): icon tile + title + one-line description */
${R}.tiers-table .tl { display: flex; align-items: center; gap: 12px; }
${R}.tiers-table .tl-ic { flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; background: #f1f1f1; color: #1e1e1e; }
${R}.tiers-table tr.row-ai .tl-ic { background: #efe9ff; color: #6d28d9; }
${R}.tiers-table tr.row-count .tl-ic { background: #1e1e1e; color: #fff; }
${R}.tiers-table .tl-tx { min-width: 0; }
${R}.tiers-table .tl-tx b { display: block; font-size: 15px; font-weight: 600; line-height: 1.3; color: #1e1e1e; }
${R}.tiers-table .tl-tx small { display: block; margin-top: 3px; font-size: 12.5px; font-weight: 400; line-height: 1.4; color: #5f5f5f; }
${R}.tiers-table .tl-tx .ai-tag { display: table; }
${R}.tiers-method { margin: 14px 2px 0 !important; font-size: 12.5px !important; line-height: 1.55; color: #6b6b6b !important; }
${R}.tiers-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 12px; margin-top: 22px; }

/* ---- buttons: one standard. primary = black, secondary = white, hover = brand red ---- */
${R}.tier-btn-primary, ${R}.tier-btn-secondary, ${R}.cta a.go, ${R}.cta a.go.sec {
  display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important;
  padding: 14px 26px !important; border-radius: 999px !important; border: 1px solid #1e1e1e !important;
  font-family: inherit !important; font-size: 14px !important; font-weight: 600 !important; letter-spacing: .01em !important; text-transform: none !important;
  text-decoration: none !important; white-space: nowrap; box-shadow: none !important; transform: none !important;
  transition: background .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease, transform .15s ease !important;
}
${R}.tier-btn-primary, ${R}.cta a.go { background: #1e1e1e !important; color: #fff !important; }
${R}.tier-btn-secondary, ${R}.cta a.go.sec { background: #fff !important; color: #1e1e1e !important; }
${R}.tier-btn-primary:hover, ${R}.tier-btn-secondary:hover, ${R}.cta a.go:hover, ${R}.cta a.go.sec:hover, ${R}.order-btn:hover {
  background: #e52421 !important; border-color: #e52421 !important; color: #fff !important;
  box-shadow: 0 6px 20px rgba(229, 36, 33, .3) !important; transform: translateY(-1px) !important;
}
/* the big full-width action button: same black, larger */
${R}.order-btn { background: #1e1e1e !important; color: #fff !important; border: 1px solid #1e1e1e !important; box-shadow: none !important; text-decoration: none !important; }

/* ---- top-3 ---- */
${R}.top3 { gap: 18px !important; }
${R}.top3 .t3 { display: grid !important; grid-template-columns: auto 1fr !important; column-gap: 18px !important; row-gap: 20px !important; align-items: center !important; padding: 28px 32px !important; overflow: visible !important; border: 1px solid var(--line) !important; border-top: 3px solid #e52421 !important; border-radius: 12px !important; background: #fff !important; }
${R}.top3 .t3 > div:last-child { display: contents !important; padding: 0 !important; border: 0 !important; background: none !important; }
${R}.top3 .t3 .t3-idx { grid-column: 1 !important; grid-row: 1 !important; align-self: stretch !important; height: auto !important; width: 60px !important; padding: 0 !important; display: grid !important; place-items: center; border-radius: 5px !important; background: #e52421 !important; color: #fff !important; font-size: 22px !important; font-weight: 600 !important; }
${R}.top3 .t3 .t3-head { grid-column: 2; grid-row: 1; }
${R}.top3 .t3 .t3-head h3 { margin-bottom: 8px; }
${R}.top3 .t3 .t3-rows { grid-column: 1 / -1; grid-row: 2; margin-top: 0; }

/* ---- tablet / mobile ---- */
@media (max-width: 720px) {
  ${R}.top3 .t3 .t3-idx { width: 46px !important; font-size: 18px !important; }
  ${R}.action { padding: 20px !important; }
  ${R}.action { grid-template-columns: minmax(0, 1fr) !important; gap: 14px !important; }
  ${R}.action .plus { order: -1; justify-self: start; min-width: 0; display: inline-flex !important; flex-direction: row; align-items: baseline; gap: 8px; padding: 8px 14px !important; font-size: 22px !important; }
  ${R}.action .plus small { margin-top: 0 !important; }
  ${R}.check summary { padding: 16px !important; }
  ${R}.check .body { padding: 0 16px 18px !important; }
}
@media (max-width: 600px) {
  ${R}.wrap { padding: 20px 12px 56px !important; gap: 24px !important; }
  ${R}.wrap > .logo { margin-bottom: -18px !important; }
  ${R}.logo svg { width: 190px; height: auto; }
  ${R}.card.scales { grid-template-columns: minmax(0, 1fr) !important; }
  ${R}.scale, ${R}.scale:nth-child(even), ${R}.scale:nth-child(odd):not(:last-child), ${R}.scale:last-child { padding-inline: 0 !important; border-inline-end: 0 !important; grid-column: 1 / -1; }
  ${R}.scale:last-child { padding-bottom: 0 !important; }
  ${R}.scale .row { align-items: flex-start; }
  ${R}.top3 .t3 { padding: 18px 16px !important; column-gap: 12px !important; row-gap: 16px !important; }
  ${R}.top3 .t3 .t3-idx { align-self: start !important; width: 36px !important; height: 36px !important; font-size: 16px !important; }
  ${R}.t3-head h3 { font-size: 17px !important; line-height: 1.3; }
  ${R}.t3-row { grid-template-columns: 1fr !important; gap: 4px !important; }
  ${R}.action { padding: 18px 16px !important; }
  ${R}.action h3 { font-size: 17px !important; }
  ${R}.code-header { flex-wrap: wrap !important; gap: 8px !important; padding: 8px 12px !important; }
  ${R}.code-file { min-width: 0; flex: 1 1 100%; }
  ${R}.code-file code { overflow-wrap: anywhere; word-break: break-all; font-size: 11px !important; }
  ${R}.btn-copy { margin-inline-start: auto; }
  ${R}.checks { gap: 8px !important; }
  ${R}.check summary { padding: 14px 14px 14px 18px !important; gap: 10px !important; }
  ${R}.check .nm { font-size: 15px !important; }
  ${R}.check .body { padding: 0 14px 16px 18px !important; }
  ${R}.filters { gap: 6px !important; }
  ${R}.filter { padding: 8px 12px !important; }
  ${R}.ai-engine-head { flex-wrap: wrap; gap: 6px 10px; }
  ${R}.order-btn { font-size: 16px !important; padding: 18px 20px !important; gap: 8px; }
  ${R}.cta { padding: 8px 4px !important; }
  ${R}.cta h2 { font-size: 22px !important; }
  ${R}.cta .contacts { gap: 8px 16px; }
  ${R}.cta a.go { white-space: normal; }
  ${R}.card h2 { font-size: 22px !important; }
  ${R}.score-num { font-size: 64px !important; }
  ${R}.tier-lock-card { padding: 18px 16px !important; }
  ${R}.action-locked { padding: 12px 12px 12px 16px; gap: 10px; }
  ${R}.action-locked h3 { font-size: 15px !important; }
  ${R}.action-locked .plus { min-width: 0; padding: 6px 8px !important; font-size: 18px !important; }
  ${R}.tier-lock-card .lock-actions a { white-space: normal; }
  /* tier table keeps its desktop layout and scrolls sideways inside its frame */
  ${R}.tiers-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  ${R}.tiers-table { min-width: 760px; }
  ${R}.tiers-hint { display: block; margin: 18px 0 -12px !important; font-size: 13px !important; font-weight: 600; color: #1e1e1e !important; }
  /* first column stays on screen while the tiers scroll under it */
  ${R}.tiers-table thead th:first-child { width: 150px; }
  ${R}.tiers-table thead th:first-child, ${R}.tiers-table tbody th { position: sticky; inset-inline-start: 0; z-index: 2; background: #fff !important; box-shadow: 6px 0 8px -6px rgba(0, 0, 0, .18); }
  ${R.trim()}[dir="rtl"] .tiers-table thead th:first-child, ${R.trim()}[dir="rtl"] .tiers-table tbody th { box-shadow: -6px 0 8px -6px rgba(0, 0, 0, .18); }
  ${R}.tiers-table tbody th { padding-inline: 12px 10px !important; }
  ${R}.tiers-table .tl-ic { display: none; }
  ${R}.tiers-table .tl-tx b { font-size: 13.5px; }
  ${R}.tiers-table .tl-tx small { font-size: 11.5px; }
  /* shorter button labels, smaller buttons */
  ${R}.sum-grid { grid-template-columns: minmax(0, 1fr); }
  ${R}.sum-card { padding: 16px 16px 16px 18px; }
  ${R}.ai-summary { gap: 14px; padding: 14px 16px; }
  ${R}.ai-summary-num b { font-size: 36px; }
  ${R}.fr-grid { grid-template-columns: minmax(0, 1fr); }
  ${R}.bt-full { display: none; }
  ${R}.bt-short { display: inline; }
  ${R}.tier-btn-primary, ${R}.tier-btn-secondary, ${R}.cta a.go, ${R}.cta a.go.sec { padding: 12px 18px !important; font-size: 13px !important; }
  ${R}.tiers-actions { justify-content: stretch; }
  ${R}.tiers-actions a, ${R}.cta-buttons a.go { flex: 1 1 100%; white-space: normal; }
}

/* ---- print / PDF ---- */
@page { size: A4; margin: 10mm 8mm; }
@media print {
  ${R.trim()} { --pad: 36px; }
  html, body { background: #eaeaea !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-size: 13.5px !important; line-height: 1.6 !important; }
  ${R}.wrap { max-width: none !important; padding: 0 !important; gap: 32px !important; }
  ${R}.wrap > .logo { margin-bottom: -26px !important; }
  ${R}.logo svg { width: 160px; height: auto; }
  /* section cards: may flow over pages, but the border/background are repeated cleanly at the break */
  ${R}.card, ${R}.card.card-ai-visibility, ${R}.card.scales { border-radius: 10px !important; box-shadow: none !important; padding: var(--pad) !important; break-inside: auto !important; page-break-inside: auto !important; }
  /* long sections (top-3, actions, checklist): items are cards themselves, so the section frame is dropped and
     items flow across pages without a broken frame (box-decoration-break:clone overlaps content in Chromium print) */
  ${R}.card:has(.top3), ${R}.card:has(.actions), ${R}.card:has(.checks) { background: transparent !important; border: 0 !important; padding: 0 !important; }
  ${R}.card:has(.top3) > h2, ${R}.card:has(.actions) > h2, ${R}.card:has(.checks) > .row, ${R}.card:has(.top3) > .sub, ${R}.card:has(.actions) > .sub, ${R}.card:has(.actions) > .legend { padding-inline: 4px; }
  ${R}.card:has(.checks) > .filters { padding-inline: 4px; }
  ${R}.card.card-ai-visibility { break-inside: avoid !important; page-break-inside: avoid !important; }
  /* small sections stay whole */
  ${R}.card.scales, ${R}.card:has(.chips), ${R}.card:has(table), ${R}.card:has(.flow), ${R}.card:has(.proto) { break-inside: avoid !important; page-break-inside: avoid !important; }
  ${R}.card h2, ${R}.scales-head, ${R}.sub, ${R}.legend { break-after: avoid; page-break-after: avoid; }
  ${R}.card h2 { font-size: 21px !important; }
  /* heading + intro + legend never split and stay glued to the first block below */
  ${R}.card h2, ${R}.sub, ${R}.legend, ${R}.scales-head, ${R}.card > .row { break-inside: avoid !important; page-break-inside: avoid !important; }
  ${R}.card > .row { break-after: avoid !important; page-break-after: avoid !important; }
  ${R}p { orphans: 3; widows: 3; }
  ${R}.sub, ${R}.score-note, ${R}.note { font-size: 13px !important; margin-top: 10px !important; }
  ${R}.score-num { font-size: 60px !important; }
  ${R}.gauge { width: 120px; height: 120px; }
  ${R}.gauge .lbl {
    padding: 22px 18px !important;
    font-size: 14px !important;
    line-height: 1.25 !important;
  }
  ${R}.score { margin-top: 14px !important; gap: 14px !important; }
  /* atomic blocks never split */
  ${R}.t3, ${R}.action, ${R}.check, ${R}.scale, ${R}.stat, ${R}.flow, ${R}.ai-engine, ${R}.ai-factor, ${R}.ai-verdict, ${R}.code-box, ${R}tr, ${R}.scope-list li, ${R}.legend { break-inside: avoid !important; page-break-inside: avoid !important; }
  ${R}.scale { padding: 20px 0 !important; }
  ${R}.scale:nth-child(even) { padding-inline-end: 24px !important; }
  ${R}.scale:nth-child(odd):not(:last-child) { padding-inline-start: 24px !important; }
  ${R}.scales-head { padding: 0 0 16px !important; }
  ${R}.scale .val b { font-size: 26px !important; }
  ${R}.top3 { gap: 24px !important; margin-top: 20px !important; }
  ${R}.top3 .t3 { padding: 26px 30px !important; row-gap: 16px !important; column-gap: 16px !important; }
  ${R}.top3 .t3 .t3-idx { width: 48px !important; font-size: 19px !important; }
  ${R}.t3-head h3 { font-size: 16.5px !important; margin-bottom: 8px !important; }
  ${R}.t3-row { grid-template-columns: 170px 1fr !important; padding: 12px 0 !important; font-size: 13px !important; }
  ${R}.actions { gap: 24px !important; margin-top: 20px !important; }
  ${R}.action { padding: 26px 30px !important; gap: 10px 16px !important; align-content: start; }
  ${R}.action > div:first-child { display: contents !important; }
  ${R}.action h3 { grid-column: 1; grid-row: 1; font-size: 16.5px !important; margin-bottom: 8px !important; }
  ${R}.action .tags { grid-column: 1; grid-row: 2; }
  ${R}.action > div:first-child > p { grid-column: 1 / -1; grid-row: 3; font-size: 13.5px !important; line-height: 1.7 !important; margin-top: 12px !important; }
  ${R}.action .code-box { grid-column: 1 / -1; grid-row: 4; margin-top: 10px !important; }
  ${R}.action .plus { grid-column: 2; grid-row: 1 / span 2; align-self: start; min-width: 64px !important; padding: 8px 10px !important; font-size: 24px !important; }
  ${R}.action .plus small { font-size: 10px !important; }
  ${R}.action-locked, ${R}.tier-lock-card .lock-header { break-inside: avoid !important; page-break-inside: avoid !important; }
  ${R}.fr-box, ${R}.fr-fix, ${R}.sum-card, ${R}.ai-summary { break-inside: avoid !important; page-break-inside: avoid !important; }
  ${R}.tiers-table { min-width: 0; }
  /* tier comparison: compact enough that table, note and buttons share one page */
  ${R}section.tiers { break-inside: avoid !important; page-break-inside: avoid !important; }
  ${R}.tiers-wrap { margin-top: 16px; }
  ${R}.tiers-table th, ${R}.tiers-table td { padding: 6px 10px !important; font-size: 12px !important; }
  ${R}.tiers-table thead th { padding-block: 12px 10px !important; }
  ${R}.tiers-table .t-price { font-size: 20px; margin-top: 4px; }
  ${R}.tiers-table .t-note { margin-top: 4px; font-size: 10.5px; }
  ${R}.tiers-table .tl-ic { width: 26px; height: 26px; border-radius: 7px; }
  ${R}.tiers-table .tl-ic svg { width: 14px; height: 14px; }
  ${R}.tiers-table .tl-tx b { font-size: 12.5px; }
  ${R}.tiers-table .tl-tx small { font-size: 10px; margin-top: 1px; }
  ${R}.tiers-table tr.row-count td { font-size: 20px !important; }
  ${R}.tiers-method { margin-top: 10px !important; font-size: 10.5px !important; }
  ${R}.tiers-actions { margin-top: 12px; }
  ${R}.tiers-table .t-price { font-size: 22px; }
  ${R}section.tiers { box-shadow: none !important; break-inside: avoid !important; }
  ${R}.legend { margin-top: 14px !important; font-size: 12px !important; gap: 4px 16px !important; }
  ${R}.flow { padding: 26px !important; margin-top: 18px !important; gap: 20px !important; }
  ${R}.flow-step { padding: 14px 16px !important; font-size: 12.5px !important; }
  ${R}.flow { grid-template-columns: max-content auto minmax(0, 1.3fr) auto minmax(0, 1.1fr) !important; }
  ${R}.flow-in { gap: 10px !important; justify-content: flex-start !important; }
  ${R}.flow-in .pill { white-space: nowrap !important; width: max-content !important; padding: 5px 13px !important; font-size: 12.5px !important; line-height: 1.35 !important; }
  ${R}.flow-out { gap: 14px !important; font-size: 12.5px !important; }
  ${R}.chips { margin-top: 18px !important; }
  ${R}.chip { font-size: 13px !important; padding: 8px 16px !important; }
  ${R}.checks { gap: 18px !important; margin-top: 18px !important; }
  ${R}.check, ${R}.check[open] { box-shadow: none !important; }
  ${R}.check summary { padding: 18px 22px 18px 28px !important; }
  ${R}.check .nm { font-size: 14.5px !important; }
  ${R}.check .body { padding: 0 22px 20px 28px !important; gap: 14px !important; display: grid !important; }
  ${R}.check .res, ${R}.check .rec { padding: 16px 20px !important; font-size: 12.5px !important; line-height: 1.65 !important; }
  ${R}.check .rec p { font-size: 12.5px !important; line-height: 1.65 !important; }
  ${R}.check .rec-title-row { margin-bottom: 8px !important; }
  ${R}.check .chev, ${R}.check .check-action-link { display: none !important; }
  ${R}.proto { gap: 16px !important; margin-top: 18px !important; }
  ${R}.stat { padding: 18px 20px !important; }
  ${R}.stat b { font-size: 26px !important; }
  ${R}.scope-list { margin-top: 18px !important; }
  ${R}.scope-list li { padding-block: 16px !important; padding-inline: 22px 0 !important; font-size: 12.5px !important; line-height: 1.65 !important; }
  ${R}.scope-list li::before { top: 23px !important; }
  ${R}.code-box pre, ${R}.code-box pre code { white-space: pre-wrap !important; word-break: break-word !important; overflow: visible !important; font-size: 10.5px !important; line-height: 1.5 !important; }
  ${R}.code-box { margin-top: 14px !important; }
  ${R}.btn-copy { display: none !important; }
  ${R}.ai-grid { gap: 12px !important; }
  ${R}.ai-engine, ${R}.ai-factor { padding: 12px 14px !important; }
  /* keep the whole AI Visibility card (incl. the purple verdict) on one page */
  ${R}.card.card-ai-visibility { padding: 20px 22px !important; }
  ${R}.ai-engine { padding: 9px 12px !important; gap: 4px !important; }
  ${R}.ai-factor { padding: 8px 12px !important; }
  ${R}.ai-matrix { gap: 8px !important; }
  ${R}.ai-matrix-head { margin: 14px 0 8px !important; break-after: avoid !important; page-break-after: avoid !important; }
  ${R}.ai-factor, ${R}.ai-engine, ${R}.fr-grid { break-inside: avoid !important; page-break-inside: avoid !important; }
  ${R}.ai-engine p, ${R}.ai-factor p { font-size: 11.5px !important; line-height: 1.45 !important; }
  ${R}.ai-sub { font-size: 12.5px !important; margin-bottom: 10px !important; }
  ${R}.ai-verdict { margin-top: 22px !important; padding: 14px 18px !important; gap: 10px !important; }
  ${R}.ai-verdict-body p { font-size: 12.5px !important; line-height: 1.5 !important; }
  /* page 1 must hold: header + overall score + diagnostic results */
  ${R}.card:has(.score), ${R}.card.scales { padding: 24px 28px !important; }
  ${R}.scale { padding: 13px 0 !important; }
  ${R}.scale .val { margin: 8px 0 8px !important; }
  ${R}.score { margin-top: 10px !important; }
  ${R}.score-num { font-size: 54px !important; }
  ${R}.gauge { width: 112px !important; height: 112px !important; }
  ${R}.gauge .lbl {
    padding: 20px 16px !important;
    font-size: 13px !important;
    line-height: 1.25 !important;
    letter-spacing: 0 !important;
  }
  ${R}.wrap > .logo { margin-bottom: -30px !important; }
  /* channel pills: equal width, stretched over the column height like the middle column */
  ${R}.flow-in { display: flex !important; flex-direction: column !important; align-items: stretch !important; justify-content: stretch !important; gap: 8px !important; }
  ${R}.flow-in .pill { flex: 1 1 0 !important; width: auto !important; min-width: 170px; display: flex !important; align-items: center !important; padding: 0 16px !important; }
  /* steps: slightly tighter so two cards fit on a page more often */
  ${R}.action { padding: 22px 28px !important; }
  ${R}.action > div:first-child > p { margin-top: 10px !important; }
  ${R}.code-box pre, ${R}.code-box pre code { line-height: 1.4 !important; }
  ${R}.code-box { margin-top: 10px !important; }
  ${R}.action { padding: 18px 26px !important; }
  ${R}.code-box pre { padding: 10px 14px !important; margin: 0 !important; }
  ${R}.code-box .code-header { padding: 6px 12px !important; }
  ${R}.code-box pre, ${R}.code-box pre code { font-size: 10px !important; line-height: 1.38 !important; }
  /* top-3: all three cards on one page */
  ${R}.top3 { gap: 16px !important; margin-top: 14px !important; }
  ${R}.top3 .t3 { padding: 18px 26px !important; row-gap: 8px !important; }
  ${R}.t3-row { padding: 8px 0 !important; }
  ${R}.t3-head h3 { margin-bottom: 4px !important; }
  /* top-3 fills its own page: fixed-height flex breaks fragmentation, so each card gets a min-height instead */
  ${R}.card:has(.top3) { break-before: page !important; page-break-before: always !important; }
  ${R}.card:has(.top3) .top3 { gap: 22px !important; margin-top: 22px !important; }
  ${R}.top3 .t3 { min-height: 71mm !important; align-content: space-evenly !important; padding: 16px 32px !important; row-gap: 10px !important; column-gap: 18px !important; }
  ${R}.t3-row { padding: 8px 0 !important; font-size: 13.5px !important; }
  ${R}.t3-head h3 { font-size: 17.5px !important; margin-bottom: 8px !important; }
  ${R}.top3 .t3 .t3-idx { width: 52px !important; font-size: 20px !important; }
  /* channel pills: compact, text centered, equal width, spread evenly over the column height */
  ${R}.flow-in { justify-content: space-between !important; align-items: stretch !important; gap: 14px !important; }
  ${R}.flow-in .pill { flex: 0 0 auto !important; height: 32px; min-width: 150px; padding: 0 16px !important; display: flex !important; align-items: center !important; justify-content: center !important; text-align: center !important; }
  ${R}.cta { padding: 12px 0 0 !important; display: block !important; break-inside: avoid; }
  ${R}.cta h2 { font-size: 19px !important; }
  ${R}.cta a.go { display: inline-block; margin-top: 18px; }
  ${R}.order-btn { display: flex !important; font-size: 16px !important; padding: 16px 24px !important; box-shadow: none !important; break-inside: avoid; break-after: avoid; page-break-after: avoid; }
  ${R}.filters, ${R}#empty { display: none !important; }
  /* keep the one-line footer on the last content page instead of a page of its own */
  ${R}.foot { padding-top: 0 !important; margin-top: -24px !important; font-size: 11px !important; break-before: avoid !important; page-break-before: avoid !important; }
  ${R}.check, ${R}.check::before, ${R}.check .chev, ${R}.check::details-content, ${R}.action, ${R}.chip { transition: none !important; animation: none !important; }
  * { transition: none !important; animation: none !important; }
}
${MARK_END}
`;
}

const PRINT_JS_MARK = 'data-v2-polish-print';
const PRINT_JS = `<script ${PRINT_JS_MARK}>
(function () {
  function openAll() {
    document.querySelectorAll('details.check').forEach(function (d) { d.removeAttribute('name'); d.open = true; });
  }
  try {
    var mq = window.matchMedia('print');
    if (mq.addEventListener) mq.addEventListener('change', function (e) { if (e.matches) openAll(); });
    else if (mq.addListener) mq.addListener(function (e) { if (e.matches) openAll(); });
  } catch (err) {}
  window.addEventListener('beforeprint', openAll);
})();
</script>
`;

const COPY_JS_MARK = 'data-v2-polish-copy';
const COPY_JS = `<script ${COPY_JS_MARK}>
(function () {
  function execCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '-9999px';
      ta.style.width = '2em';
      ta.style.height = '2em';
      ta.style.padding = '0';
      ta.style.border = 'none';
      ta.style.outline = 'none';
      ta.style.boxShadow = 'none';
      ta.style.background = 'transparent';
      ta.style.fontSize = '16px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      var ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (err) {
        ok = false;
      }
      document.body.removeChild(ta);
      if (ok) resolve();
      else reject(new Error('execCommand copy failed'));
    });
  }

  function copyToClipboard(text) {
    if (!text) return Promise.reject(new Error('No text to copy'));
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text).catch(function () {
        return execCopy(text);
      });
    }
    return execCopy(text);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-copy');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    var textToCopy = '';
    var codeBox = btn.closest('.code-box');
    if (codeBox) {
      var pre = codeBox.querySelector('pre');
      if (pre) {
        textToCopy = pre.innerText || pre.textContent || '';
      }
    }
    if (!textToCopy) {
      textToCopy = btn.getAttribute('data-copy') || '';
    }
    if (!textToCopy) {
      var rec = btn.closest('.rec');
      if (rec) {
        var p = rec.querySelector('p');
        if (p) textToCopy = p.innerText || p.textContent || '';
      }
    }
    if (!textToCopy) {
      var container = btn.closest('.action, .check');
      if (container) {
        var anyPre = container.querySelector('pre, code');
        if (anyPre) textToCopy = anyPre.innerText || anyPre.textContent || '';
      }
    }

    textToCopy = textToCopy.trim();
    if (!textToCopy) return;

    var span = btn.querySelector('.copy-text');
    var orig = span ? span.textContent : 'copy';

    copyToClipboard(textToCopy).then(function () {
      if (span) span.textContent = 'copied!';
      btn.classList.add('copied');
      setTimeout(function () {
        if (span) span.textContent = orig;
        btn.classList.remove('copied');
      }, 2000);
    }).catch(function (err) {
      console.error('Copy failed:', err);
    });
  });
})();
</script>
`;

/** direct children of <div class="actions"> as [start,end) ranges */
function actionRanges(s) {
  const a = s.indexOf('<div class="actions">');
  if (a < 0) return null;
  let depth = 1, start = -1;
  const kids = [];
  const re = /<div\b|<\/div>/g;
  re.lastIndex = a + '<div class="actions">'.length;
  let m;
  while ((m = re.exec(s))) {
    if (m[0] === '<div') { if (depth === 1) start = m.index; depth++; }
    else { depth--; if (depth === 1 && start >= 0) { kids.push([start, m.index + 6]); start = -1; } if (depth === 0) break; }
  }
  return kids;
}

function patchMarkup(s, lang, log) {
  const t = T[lang];

  // 0) gauge status: wrap label in <span>, two lines for multi-word (RU/EN/HE)
  const gaugeLabels = [
    ['Требует внимания', 'Требует<br>внимания'],
    ['Требует<br>внимания', 'Требует<br>внимания'],
    ['Needs attention', 'Needs<br>attention'],
    ['Needs<br>attention', 'Needs<br>attention'],
    ['דורש תשומת לב', 'דורש<br>תשומת לב'],
    ['דורש<br>תשומת לב', 'דורש<br>תשומת לב'],
    ['Отлично', 'Отлично'],
    ['Excellent', 'Excellent'],
    ['מצוין', 'מצוין'],
    ['Критично', 'Критично'],
    ['Critical', 'Critical'],
    ['קריטי', 'קריטי'],
  ];
  for (const [from, to] of gaugeLabels) {
    const bare = `<div class="lbl">${from}</div>`;
    const wrapped = `<div class="lbl"><span>${to}</span></div>`;
    if (s.includes(bare)) {
      s = s.split(bare).join(wrapped);
      log.push('gauge-lbl');
    }
  }

  // 1) green scale badges are plain status (no link / arrow)
  s = s.replace(/<a href="#[^"]+" class="badge ok"[^>]*>([^<]*?)\s*[↓⬇]?\s*<\/a>/g, (m, txt) => { log.push('ok-badge'); return `<span class="badge ok">${txt.trim()}</span>`; });

  // 2) hebrew: align actions 4-6 with RU/EN, then wording fixes
  if (lang === 'he') {
    const kids = actionRanges(s);
    if (kids && kids.length === 6) {
      const ch = kids.map(([x, y]) => s.slice(x, y));
      const idx = (id) => ch.findIndex((c) => c.includes('id="' + id + '"'));
      const iL = idx('action-lead'), iA = idx('action-ai'), iS = idx('action-sec');
      const h3L = iL >= 0 ? ((ch[iL].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '') : '';
      if (iL >= 0 && iA >= 0 && iS >= 0 && /Turnstile/.test(h3L)) {
        const codeBox = (c) => { const i = c.indexOf('<div class="code-box">'); const j = c.indexOf('</pre>', i); return c.slice(i, j + 6) + '\n    </div>'; };
        const lead = ch[iL], ai = ch[iA];
        const goldTag = ai.match(/<span class="tag gold"[\s\S]*?<\/span>/)[0];
        const mk = (id, h3, cat, p, code) => `<div class="action" id="${id}">
        <div>
          ${h3}
          <div class="tags">${cat}${goldTag}</div>
          ${p}

    ${code}
        </div>
        <div class="plus"><small>שלב</small>0</div>
      </div>`;
        ch[iL] = mk('action-lead', ai.match(/<h3>[\s\S]*?<\/h3>/)[0], lead.match(/<span class="tag">[^<]*<\/span>/)[0], ai.match(/<p>[\s\S]*?<\/p>/)[0], codeBox(lead));
        ch[iA] = mk('action-ai', '<h3>נראות בחיפוש AI: llms.txt ו-Content-Signals</h3>', ai.match(/<span class="tag">[^<]*<\/span>/)[0],
          '<p>אישור ציטוט על ידי מנועי חיפוש מבוססי AI (ChatGPT, Perplexity) וחסימת אימון מודלים ללא אישור</p>', codeBox(ai));
        let out = s.slice(0, kids[0][0]);
        ch.forEach((c, i) => { out += (i ? '\n      ' : '') + c; });
        s = out + s.slice(kids[5][1]);
        log.push('he-align');
      }
    }
    s = s.replace(/(?:שיקוף )+RTL ופריסה/g, 'RTL ופריסה'); // repair repeated prefix from older runs
    for (const [a, b] of HE_TEXT_FIXES) {
      if (!s.includes(a)) continue;
      if (b.includes(a)) { s = s.split(b).join(a); } // normalise first, so a fix that contains its own source is applied once
      s = s.split(a).join(b);
      log.push('he-fix');
    }
  }

  // 3) step badges: "P1 priority" -> "Step 1"
  s = s.replace(/<div class="plus">P(\d+)<small>[^<]*<\/small><\/div>/g, (m, d) => { log.push('step'); return `<div class="plus"><small>${t.step}</small>${d}</div>`; });

  // 4) sub + legend in recommended actions
  const h = s.indexOf(`<h2>${t.h2}</h2>`);
  if (h >= 0 && !/class="legend"/.test(s.slice(h, h + 3000))) {
    const a = s.indexOf('<p class="sub">', h), b = s.indexOf('</p>', a) + 4;
    s = s.slice(0, a) + `<p class="sub">${t.sub}</p>\n    <ul class="legend">${t.leg.map((x) => `<li>${x}</li>`).join('')}</ul>` + s.slice(b);
    log.push('legend');
  }

  // 5) sort actions: critical, needs attention, rest; renumber steps
  const kids = actionRanges(s);
  if (kids && kids.length) {
    const chunks = kids.map(([x, y]) => s.slice(x, y));
    const rank = (c) => (/tier-lock-card/.test(c) ? 99 : /class="tag crit"/.test(c) ? 0 : /class="tag med"/.test(c) ? 1 : 2);
    const CANON = ['action-speed', 'action-seo', 'action-lead', 'action-sec', 'action-ai'];
    const canon = (c) => {
      if (/tier-lock-card/.test(c)) return 999;
      const k = CANON.indexOf((c.match(/id="([^"]+)"/) || [])[1]);
      return k < 0 ? 99 : k;
    };
    const sorted = chunks.map((c, i) => ({ c, i, r: rank(c) })).sort((p, q) => p.r - q.r || canon(p.c) - canon(q.c) || p.i - q.i).map((o) => o.c);
    let n = 0;
    const renum = sorted.map((c) => {
      if (/tier-lock-card/.test(c)) return c;
      return c.replace(/(<div class="plus"><small>[^<]*<\/small>)\d+(<\/div>)/, (m, x, y) => x + (++n) + y);
    });
    const same = renum.every((c, i) => c === chunks[i]);
    if (!same) { s = s.slice(0, kids[0][0]) + renum.join('\n      ') + s.slice(kids[kids.length - 1][1]); log.push('sort'); }
  }
  return s;
}

// A freshly written file can be held for a moment on Windows (antivirus scan): retry before giving up
function writeWithRetry(file, data, tries = 8) {
  for (let i = 1; ; i++) {
    try { fs.writeFileSync(file, data); return; } catch (e) {
      if (i >= tries || !/UNKNOWN|EBUSY|EPERM/.test(e.code || '')) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250 * i);
    }
  }
}

function patch(file) {
  const m = file.match(/(?:_|-)(ru|en|he)(?:-v2)?\.html$/);
  let lang = m && m[1];
  if (!lang) {
    try {
      const sTemp = fs.readFileSync(file, 'utf8');
      const hmLang = sTemp.match(/<html[^>]*lang=["'](ru|en|he)["']/i);
      lang = hmLang ? hmLang[1] : 'ru';
    } catch (e) {
      lang = 'ru';
    }
  }
  let s = fs.readFileSync(file, 'utf8');
  const log = [];

  // drop any previous polish blocks (new or legacy ones) so the CSS never stacks up
  s = s.replace(new RegExp(MARK_START.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '[\\s\\S]*?' + MARK_END.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '\\n?', 'g'), '');
  s = s.replace(/\/\* === design polish[^\n]*\*\/[\s\S]*?(?=\/\* === design polish|<\/style>)/g, '');

  s = patchMarkup(s, lang, log);

  // fonts
  if (lang === 'he') s = s.replace(/family=Heebo:wght@[^&"]*(?:&family=IBM\+Plex\+Mono:wght@[^&"]*)?&display=swap/, 'family=Heebo:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  else s = s.replace(/family=IBM\+Plex\+Mono:wght@400;500&family=Inter:wght@[^&"]*(?:&family=Inter\+Tight:wght@[^&"]*)?&display=swap/, 'family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');

  const j = s.lastIndexOf('</style>');
  s = s.slice(0, j) + css(lang) + s.slice(j);

  if (!s.includes(PRINT_JS_MARK)) { const b = s.lastIndexOf('</body>'); s = s.slice(0, b) + PRINT_JS + s.slice(b); log.push('print-js'); }

  if (s.includes(COPY_JS_MARK)) {
    s = s.replace(new RegExp('<script ' + COPY_JS_MARK + '>[\\s\\S]*?<\\/script>\\n?', 'g'), COPY_JS);
  } else {
    const b = s.lastIndexOf('</body>');
    s = s.slice(0, b) + COPY_JS + s.slice(b);
    log.push('copy-js');
  }

  writeWithRetry(file, s);
  return log;
}

const targets = process.argv.length > 2 ? process.argv.slice(2) : defaultFiles();
for (const f of targets) {
  if (!fs.existsSync(f)) { console.log('skip (missing):', f); continue; }
  try {
    const log = patch(f);
    const summary = log.reduce((a, k) => { a[k] = (a[k] || 0) + 1; return a; }, {});
    console.log('ok', f.replace(/^C:\//, ''), JSON.stringify(summary));
  } catch (e) { console.log('FAIL', f, e.message); }
}
