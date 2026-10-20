/**
 * Sanity checks mirroring AuditCollector.geminiFunnelMatchesReportLang logic.
 * Run: node services/audit-agent/QA_Auditor/scripts/check-gemini-lang.mjs
 */

function containsCyrillic(text) {
  return /[\u0400-\u04FF\u0500-\u052F]/.test(text || '')
}

function isHebrewLetter(cp) {
  return cp >= 0x0590 && cp <= 0x05ff
}

function matches(reportLang, fields) {
  const lang = (reportLang || 'ru').trim().toLowerCase()
  const parts = [fields.verdict || '', fields.priority_fix || '', ...(fields.gaps || [])]
  const text = parts.join(' ').trim()
  if (!text) return true
  if ((lang === 'he' || lang === 'en') && containsCyrillic(text)) return false
  if (lang === 'he') {
    let letters = 0
    let hebrew = 0
    for (const ch of text) {
      const cp = ch.codePointAt(0)
      if (/\p{L}/u.test(ch)) letters++
      if (isHebrewLetter(cp)) hebrew++
    }
    if (letters >= 40 && hebrew === 0) return false
  }
  return true
}

const cases = [
  ['he', { verdict: 'Конверсионный путь полностью исправен на всех страницах сайта.' }, false],
  ['he', { verdict: 'מסלול ההמרה תקין בכל העמודים שנבדקו ויש טפסים ו-WhatsApp.' }, true],
  ['he', { verdict: 'Forms and WhatsApp are available on every page that was crawled today.' }, false],
  ['en', { verdict: 'Конверсионный путь исправен.' }, false],
  ['en', { verdict: 'Lead path is healthy: forms and WhatsApp on key pages.' }, true],
  ['ru', { verdict: 'Конверсионный путь полностью исправен.' }, true],
]

let failed = 0
for (const [lang, fields, expected] of cases) {
  const got = matches(lang, fields)
  if (got !== expected) {
    failed++
    console.error('FAIL', { lang, expected, got, fields })
  } else {
    console.log('ok', lang, expected)
  }
}
if (failed) {
  console.error(failed + ' failed')
  process.exit(1)
}
console.log('all ok')
