/**
 * Blog fixes from Translater report `erythro_blog_and_portfolio_audit.md` (2026-11-28).
 * Reads/writes one locale at a time (PIT-174), depth 0 (Upload ids stay ids).
 *
 *   npx tsx scripts/fix-blog-portfolio-audit-blog.ts --dry
 *   npx tsx scripts/fix-blog-portfolio-audit-blog.ts
 */
import './import-project/lib/load-env'
process.env.PAYLOAD_DISABLE_PUSH = '1'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { isLexicalDoc, type LexicalDoc } from '../src/lib/lexical'

const DRY = process.argv.includes('--dry')
const LOCALES = ['en', 'ru', 'he'] as const
type Loc = (typeof LOCALES)[number]
type Pair = { from: string; to: string }

const AUDIT = 'https://erythro.ai/audit'
const CONTACTS = 'https://erythro.ai/contacts'

/** Applied to every post, every text field (title / excerpt / seo / body). */
const GLOBAL: Record<Loc, Pair[]> = {
  en: [{ from: 'Erythro AI', to: 'Erythro.ai' }],
  ru: [{ from: 'Erythro AI', to: 'Erythro.ai' }],
  he: [{ from: 'Erythro AI', to: 'Erythro.ai' }],
}

/** Per post, per locale, every text field. */
const PER_POST: Record<number, Partial<Record<Loc, Pair[]>>> = {
  1: { he: [{ from: 'חברות מדף כמפתח', to: 'חברות מדף מקצה לקצה' }] },
  2: {
    he: [
      {
        from: 'אם ברצונך לראות מה מעכב את צמיחת האתר ומה לתקן קודם, הפעל את הביקורת החינמית:',
        to: 'אם ברצונכם לראות מה מעכב את צמיחת האתר ומה לתקן קודם, הפעילו את הביקורת החינמית:',
      },
    ],
  },
  3: {
    en: [
      { from: 'handsome menu', to: 'polished menu' },
      { from: 'on a computer', to: 'on desktop' },
      { from: 'marked as demonstrational', to: 'marked as demo content' },
    ],
    he: [
      { from: 'מהגרגר לכוס', to: 'מפרי הקפה לכוס' },
      { from: 'הבלוקים נעצרים בזה אחר זה', to: 'הבלוקים מקובעים בזה אחר זה' },
      { from: 'ציון חיפוש', to: 'ציון SEO' },
      { from: 'סרטון הקפה', to: 'רצף הקפה' },
    ],
  },
  5: { en: [{ from: '2. 7 Barba scenarios', to: '2. 6 Barba scenarios' }] },
  6: {
    he: [
      { from: '350 g', to: '350 גרם' },
      { from: '300 g', to: '300 גרם' },
      { from: '200 g', to: '200 גרם' },
      { from: '1.2 kg', to: '1.2 ק"ג' },
    ],
  },
  7: {
    en: [{ from: 'for a watch manufacture', to: 'for a watchmaker' }],
    he: [
      {
        from: '1. Delta Cafés — Bürocratik studio (7.33/10, SOTD Nov 13)',
        to: '1. Delta Cafés — סטודיו Bürocratik (7.33/10, SOTD ב-13 בנובמבר)',
      },
      {
        from: '2. Preymaker — DashDigital studio (7.26/10, SOTD Nov 14)',
        to: '2. Preymaker — סטודיו DashDigital (7.26/10, SOTD ב-14 בנובמבר)',
      },
      {
        from: '3. SANTAL — The First The Last studio (7.25/10, SOTD Nov 15)',
        to: '3. SANTAL — סטודיו The First The Last (7.25/10, SOTD ב-15 בנובמבר)',
      },
    ],
  },
  9: { he: [{ from: 'למותג שלך', to: 'למותג שלכם' }] },
  10: {
    en: [{ from: 'move the shield and shield the crystal', to: 'move the shield to protect the crystal' }],
  },
  11: {
    en: [{ from: 'Most project issues are set not in the code', to: 'Most project issues originate not in the code' }],
  },
  13: { en: [{ from: '(2016 year)', to: '(from 2016)' }] },
  14: {
    ru: [
      {
        from: 'и какую цену в плане производительности приходится платить за скорость загрузки страниц',
        to: 'и какую цену в скорости загрузки страниц за них приходится платить',
      },
    ],
    he: [
      {
        from: 'ומהו המחיר בביצועים עבור מהירות טעינת העמוד',
        to: 'ומהו המחיר שהאנימציות האלה גובות ממהירות טעינת העמוד',
      },
    ],
  },
  15: { en: [{ from: 'and Perplexity Enter your website', to: 'and Perplexity. Enter your website' }] },
  16: { he: [{ from: 'מחסניות טכנולוגיות', to: 'סטאקים טכנולוגיים' }] },
  17: {
    en: [{ from: 'from layout design to', to: 'from slicing mockups to' }],
    he: [
      { from: 'מעיצוב פריסה', to: 'מקידוד תבניות' },
      { from: 'העסק שלך', to: 'העסק שלכם' },
    ],
  },
  19: {
    he: [
      {
        from: 'אודיט אתר חינמי מבוסס AI: 5 סקלות וציון מ-0 עד 100',
        to: 'ביקורת AI חינמית לאתר: 5 מדדים וציון מ-0 עד 100',
      },
      {
        from: 'האודיט החינמי מבוסס ה-AI של Erythro.ai בודק אתר על פני חמש סקלות ומספק',
        to: 'ביקורת ה-AI החינמית של Erythro.ai בודקת אתר לפי חמישה מדדים ומספקת',
      },
    ],
  },
  21: {
    en: [{ from: 'change colour one by one', to: 'change color one by one' }],
    ru: [{ from: 'https://ai-audit-en.erythro.ai/', to: 'https://ai-audit-ru.erythro.ai/' }],
    he: [{ from: 'https://ai-audit-en.erythro.ai/', to: 'https://ai-audit-he.erythro.ai/' }],
  },
  22: {
    ru: [{ from: 'https://ai-audit-en.erythro.ai/', to: 'https://ai-audit-ru.erythro.ai/' }],
    he: [{ from: 'https://ai-audit-en.erythro.ai/', to: 'https://ai-audit-he.erythro.ai/' }],
  },
}

/** Whole paragraphs rebuilt (URLs become link nodes). `null` = delete paragraph. */
const PARAS: Record<number, Partial<Record<Loc, Record<number, string | null>>>> = {
  1: {
    ru: { 10: `Узнайте, где ваш сайт теряет лиды, — бесплатный AI-аудит сайта: ${AUDIT}.` },
    he: { 10: `גלו היכן האתר שלכם מאבד לידים — ביקורת AI חינמית לאתר: ${AUDIT}.` },
  },
  3: {
    ru: {
      8: `Если вам нужен сайт, который раскрывает продукт как историю и сразу собирает заявки, напишите нам: ${CONTACTS}. Если сначала хотите выяснить, где текущий сайт теряет лиды, воспользуйтесь бесплатным AI-аудитом: ${AUDIT}.`,
      9: 'Живое демо: https://origin.erythro.ai/',
    },
    en: {
      8: `If you need a website that tells the product as a story and captures a request right away, contact us: ${CONTACTS}. If you first want to see where your current site loses leads, try our free AI audit: ${AUDIT}.`,
      9: 'Live demo: https://origin.erythro.ai/',
    },
    he: {
      8: `אם אתם צריכים אתר שמציג את המוצר כסיפור וקולט פניות מיד, צרו איתנו קשר: ${CONTACTS}. אם תרצו לבדוק קודם היכן האתר הנוכחי מאבד לידים, נסו את ביקורת ה-AI החינמית שלנו: ${AUDIT}.`,
      9: 'דמו חי: https://origin.erythro.ai/',
    },
  },
  5: {
    ru: { 12: `Хотите выяснить, где ваш сайт теряет лиды? Бесплатный AI-аудит: ${AUDIT}.` },
    en: { 12: `Want to know where your site is losing leads? Free AI audit: ${AUDIT}.` },
    he: { 12: `רוצים לדעת איפה האתר שלכם מאבד לידים? ביקורת AI חינמית: ${AUDIT}.` },
  },
  6: {
    ru: {
      9: `EMBER — это демо-проект, поэтому адрес и контакты на нем вымышленные. Я разрабатываю веб-сайты более 15 лет, и команда Erythro.ai реализовала более 300 продакшн-систем. Если вы управляете рестораном и хотите внедрить подобное решение, откройте рабочий проект и нажмите «I want a site like this» или напишите нам: ${CONTACTS}.`,
    },
    en: {
      9: `EMBER is a demo project, so the address and contact details on it are fictional. I have been building websites for more than 15 years, and with Erythro.ai we have delivered 300+ production systems. If you run a restaurant and want something like this, open the live project and tap "I want a site like this", or contact us: ${CONTACTS}.`,
      10: `Free AI audit: ${AUDIT}.`,
    },
    he: {
      9: `EMBER הינו פרויקט הדגמה, ולכן הכתובת ופרטי הקשר המוצגים בו הינם פיקטיביים. אני עוסק בפיתוח אתרים מעל 15 שנים, ועם Erythro.ai השקנו למעלה מ-300 מערכות ייצור. אם אתם מנהלים מסעדה ומעוניינים בפתרון מסוג זה, פתחו את הפרויקט הפעיל ולחצו על "I want a site like this", או צרו איתנו קשר: ${CONTACTS}.`,
      10: `ביקורת AI חינמית: ${AUDIT}.`,
    },
  },
  7: {
    ru: {
      8: 'Сайты из подборки: Delta Cafés — https://deltacafes.com/en, Preymaker — https://preymaker.com/, SANTAL — https://santalarch.com/.',
    },
    en: {
      8: 'The sites: Delta Cafés — https://deltacafes.com/en, Preymaker — https://preymaker.com/, SANTAL — https://santalarch.com/.',
    },
    he: {
      8: 'האתרים מהסקירה: Delta Cafés — https://deltacafes.com/en, Preymaker — https://preymaker.com/, SANTAL — https://santalarch.com/.',
    },
  },
  9: {
    ru: {
      6: 'Живое демо ORA 60A: https://ora60a.erythro.ai/',
      7: `А как работает ваш сайт: активно генерирует заявки или выполняет лишь роль витрины? Если вашему бренду требуется решение подобного уровня, напишите нам: ${CONTACTS} или напрямую через WhatsApp на сайте.`,
    },
    en: {
      6: 'Live ORA 60A demo: https://ora60a.erythro.ai/',
      7: `What about you: is your website actively generating leads today, or just sitting like a showcase? If you want a website like this for your brand, contact us at ${CONTACTS} or directly via WhatsApp on the site.`,
    },
    he: {
      6: 'דמו חי של ORA 60A: https://ora60a.erythro.ai/',
      7: `ומה איתכם: האתר שלכם היום מביא פניות, או רק משמש כוויטרינה? אם אתם רוצים אתר כזה למותג שלכם, צרו איתנו קשר בכתובת ${CONTACTS} או ישירות ב-WhatsApp מתוך האתר.`,
    },
  },
  12: { ru: { 0: null } },
  15: {
    ru: { 7: `Получите отчёт через бесплатный AI-аудит: ${AUDIT}.` },
    en: { 7: `Get your report with the free AI audit: ${AUDIT}.` },
    he: { 7: `קבלו את הדוח שלכם באמצעות ביקורת ה-AI החינמית: ${AUDIT}.` },
  },
  16: {
    ru: {
      7: '- Лабораторный балл: мобильные 92/100 | десктоп 90/100',
      8: '- Лабораторный LCP: мобильные 2.0 с | десктоп 1.6 с',
      9: '- INP реальных пользователей: мобильные 187 мс | десктоп 98 мс',
      10: '- CLS реальных пользователей: 0 на мобильных и десктопе',
    },
  },
  17: {
    ru: { 12: `Бесплатный AI-аудит: ${AUDIT}.` },
    en: { 12: `Free AI audit: ${AUDIT}.` },
    he: { 12: `ביקורת AI חינמית: ${AUDIT}.` },
  },
  18: {
    ru: { 16: `Бесплатный AI-аудит: ${AUDIT}.` },
    he: { 16: `ביקורת AI חינמית: ${AUDIT}.` },
  },
  19: {
    ru: {
      2: '• Скорость и мобильный UX, 27% (PageSpeed, TTFB, верстка при 375px)',
      3: '• Лиды и формы, 22%',
      4: '• SEO и видимость, 22%',
      5: '• Безопасность и стабильность, 18%',
      6: '• Видимость в AI и узнаваемость бренда, 11%',
      8: `Бесплатный AI-аудит: ${AUDIT}.`,
    },
    he: { 8: `ביקורת AI חינמית: ${AUDIT}.` },
  },
}

/** Expected current text (prefix) of each rebuilt paragraph — guards against index drift. */
const EXPECT: Record<string, string> = {
  '1.ru.10': 'Узнайте, где ваш сайт теряет лиды',
  '1.he.10': 'גלו היכן האתר שלכם מאבד לידים',
  '3.ru.8': 'Если вам нужен сайт',
  '3.ru.9': 'Живое демо',
  '3.en.8': 'If you need a website',
  '3.en.9': 'Live demo at',
  '3.he.8': 'אם אתם זקוקים לאתר',
  '3.he.9': 'דמו חי בכתובת',
  '5.ru.12': 'Хотите выяснить',
  '5.en.12': 'Want to know',
  '5.he.12': 'רוצים לדעת',
  '6.ru.9': 'EMBER — это демо-проект',
  '6.en.9': 'EMBER is a demo project',
  '6.en.10': 'Link at',
  '6.he.9': 'EMBER הינו פרויקט הדגמה',
  '6.he.10': 'ביקורת AI בחינם',
  '7.ru.8': 'Ссылки в первом комментарии',
  '7.en.8': 'Links at',
  '7.he.8': 'קישורים בכתובת',
  '9.ru.6': 'Ссылка на демо',
  '9.ru.7': 'А как работает ваш ресурс',
  '9.en.6': 'The link to the live demo',
  '9.en.7': 'What about you',
  '9.he.6': 'הקישור לדמו החי',
  '9.he.7': 'ומה איתכם',
  '12.ru.0': 'Как AUGE Experience реализует переходы',
  '15.ru.7': '👇 Получите отчет',
  '15.en.7': '👇 Get your report',
  '15.he.7': '👇 קבלו את הדוח',
  '16.ru.7': '- Lab Score',
  '16.ru.8': '- Lab LCP',
  '16.ru.9': '- Real-User INP',
  '16.ru.10': '- Real-User CLS',
  '17.ru.12': 'Ссылки в первом комментарии',
  '17.en.12': 'Links at',
  '17.he.12': 'קישורים בכתובת',
  '18.ru.16': 'Ссылка на бесплатный аудит',
  '18.he.16': 'קישור לביקורת',
  '19.ru.2': '• Speed & Mobile UX',
  '19.ru.3': '• Lead Generation',
  '19.ru.4': '• SEO & Visibility',
  '19.ru.5': '• Security & Stability',
  '19.ru.6': '• AI Visibility',
  '19.ru.8': 'Ссылка на бесплатный аудит',
  '19.he.8': 'קישור לאודיט',
}

/** relatedLinks overrides (array is not localized; label is). Row ids kept. */
const RELATED: Record<number, (rows: Row[]) => Row[]> = {
  // 4 of 5 rows pointed to "/". Keep demo + one audit (host localized in UI) + blog link.
  20: (rows) => {
    if (rows.length === 3 && rows[0]?.href === 'https://psb.erythro.ai/') return rows // already applied
    const [demo, audit, , , blog] = rows
    if (!demo || !audit || !blog || rows.length !== 5) throw new Error('#20 relatedLinks shape changed')
    return [
      { ...demo, href: 'https://psb.erythro.ai/' },
      {
        ...audit,
        href: 'https://ai-audit-en.erythro.ai/',
        label: { en: 'Free AI website audit', ru: 'Бесплатный AI-аудит сайта', he: 'ביקורת AI חינמית לאתר' },
      },
      blog,
    ]
  },
}

type Row = { id?: string; href?: string; label?: Partial<Record<Loc, string | null>> }

const URL_RE = /https?:\/\/[^\s,)]+?(?=[.,;:!?)]*(?:\s|$))/g

function textNode(text: string) {
  return { mode: 'normal', text, type: 'text', style: '', detail: 0, format: 0, version: 1 }
}

function paragraph(text: string) {
  const children: unknown[] = []
  let last = 0
  for (const m of text.matchAll(URL_RE)) {
    const i = m.index ?? 0
    if (i > last) children.push(textNode(text.slice(last, i)))
    children.push({
      type: 'link',
      fields: { url: m[0], newTab: true, linkType: 'custom' },
      format: '',
      indent: 0,
      version: 3,
      children: [textNode(m[0])],
      direction: null,
    })
    last = i + m[0].length
  }
  if (last < text.length) children.push(textNode(text.slice(last)))
  return { type: 'paragraph', format: '', indent: 0, version: 1, children, direction: null, textFormat: 0 }
}

function plain(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; children?: unknown[] }
  return (typeof n.text === 'string' ? n.text : '') + (Array.isArray(n.children) ? n.children.map(plain).join('') : '')
}

function replaceAll(s: string, pairs: Pair[], hits: Map<string, number>): string {
  for (const { from, to } of pairs) {
    if (!s.includes(from)) continue
    hits.set(from, (hits.get(from) ?? 0) + s.split(from).length - 1)
    s = s.split(from).join(to)
  }
  return s
}

function fixString(v: unknown, pairs: Pair[], hits: Map<string, number>): string | undefined {
  if (typeof v !== 'string') return undefined
  const next = replaceAll(v, pairs, hits)
  return next === v ? undefined : next
}

async function main() {
  const payload = await getPayload({ config })
  console.log(DRY ? 'DRY RUN' : 'APPLY', '— blog audit 2026-11-28')
  const res = await payload.find({
    collection: 'blog-posts',
    locale: 'all',
    depth: 0,
    limit: 200,
    overrideAccess: true,
  })
  const problems: string[] = []

  for (const doc of res.docs.sort((a, b) => Number(a.id) - Number(b.id))) {
    const id = Number(doc.id)
    const d = doc as unknown as Record<string, unknown> & {
      title?: Record<string, string>
      excerpt?: Record<string, string>
      seo?: { title?: Record<string, string>; description?: Record<string, string> }
      body?: Record<string, unknown>
      relatedLinks?: Row[]
    }

    // relatedLinks: write once (array rows are shared; labels written for every locale below)
    let related: Row[] | undefined
    if (RELATED[id]) related = RELATED[id](d.relatedLinks ?? [])

    for (const loc of LOCALES) {
      const pairs = [...GLOBAL[loc], ...(PER_POST[id]?.[loc] ?? [])]
      const hits = new Map<string, number>()
      const data: Record<string, unknown> = {}

      const title = fixString(d.title?.[loc], pairs, hits)
      if (title !== undefined) data.title = title
      const excerpt = fixString(d.excerpt?.[loc], pairs, hits)
      if (excerpt !== undefined) data.excerpt = excerpt
      const seoTitle = fixString(d.seo?.title?.[loc], pairs, hits)
      const seoDesc = fixString(d.seo?.description?.[loc], pairs, hits)
      if (seoTitle !== undefined || seoDesc !== undefined) {
        data.seo = {
          title: seoTitle ?? d.seo?.title?.[loc] ?? null,
          description: seoDesc ?? d.seo?.description?.[loc] ?? null,
        }
      }

      const src = d.body?.[loc]
      if (isLexicalDoc(src)) {
        const before = JSON.stringify(src)
        const esc = (x: string) => JSON.stringify(x).slice(1, -1)
        const bodyHits = new Map<string, number>()
        const jsonPairs = pairs.map(({ from, to }) => ({ from: esc(from), to: esc(to) }))
        const body = JSON.parse(replaceAll(before, jsonPairs, bodyHits)) as LexicalDoc
        for (const p of pairs) {
          const n = bodyHits.get(esc(p.from))
          if (n) hits.set(p.from, (hits.get(p.from) ?? 0) + n)
        }
        const paras = PARAS[id]?.[loc]
        if (paras) {
          const kids = [...body.root.children]
          const dels: number[] = []
          for (const [k, text] of Object.entries(paras)) {
            const i = Number(k)
            const exp = EXPECT[`${id}.${loc}.${i}`]
            const cur = plain(kids[i]).trim()
            if (!exp || !cur.startsWith(exp)) {
              problems.push(`#${id} [${loc}] body[${i}] expected "${exp}" got "${cur.slice(0, 60)}"`)
              continue
            }
            if (text === null) dels.push(i)
            else kids[i] = paragraph(text) as (typeof kids)[number]
            hits.set(`para[${i}]${text === null ? ' deleted' : ''}`, 1)
          }
          for (const i of dels.sort((a, b) => b - a)) kids.splice(i, 1)
          body.root.children = kids
        }
        if (JSON.stringify(body) !== before) data.body = body
      }

      if (related) {
        data.relatedLinks = related.map((r) => ({ id: r.id, href: r.href, label: r.label?.[loc] ?? '' }))
        hits.set('relatedLinks', related.length)
      }

      // Report pairs that were meant for this post+locale but matched nothing.
      for (const p of PER_POST[id]?.[loc] ?? []) {
        if (!hits.has(p.from)) problems.push(`#${id} [${loc}] no match: "${p.from}"`)
      }

      if (!Object.keys(data).length) continue
      console.log(`#${id} [${loc}] ${Object.keys(data).join(',')} :: ${[...hits.entries()].map(([k, n]) => `${k.slice(0, 40)}×${n}`).join(' | ')}`)
      if (DRY) continue
      await payload.update({ collection: 'blog-posts', id: doc.id, locale: loc, overrideAccess: true, data })
    }
  }

  if (problems.length) {
    console.log('\nPROBLEMS:')
    for (const p of problems) console.log('  ' + p)
  }
  console.log('\ndone')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
