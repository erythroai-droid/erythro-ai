import { randomBytes } from 'node:crypto'
import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Portfolio Projects → Highlights (label + detail rows under the body title,
 * optional metrics). Seeds ORA 60A rows that previously lived in code.
 */
type Loc = { en: string; ru: string; he: string }
type SeedRow = {
  label: Loc
  detail: Loc
  metrics?: { value: string; label: Loc }[]
  metricsNote?: Loc
}

const ORA_60A: SeedRow[] = [
  {
    label: { en: 'Multilingual', ru: 'Мультиязычность', he: 'רב־לשוניות' },
    detail: {
      en: 'English · Russian · Hebrew (RTL) · Arabic (RTL)',
      ru: 'Русский · арабский (RTL) · английский · иврит (RTL)',
      he: 'אנגלית · רוסית · עברית (RTL) · ערבית (RTL)',
    },
  },
  {
    label: { en: 'Tech stack', ru: 'Стек технологий', he: 'סטאק טכנולוגי' },
    detail: {
      en: 'Next.js · React · GSAP · TypeScript',
      ru: 'Next.js · React · GSAP · TypeScript',
      he: 'Next.js · React · GSAP · TypeScript',
    },
  },
  {
    label: { en: 'Responsive', ru: 'Адаптивность', he: 'רספונסיביות' },
    detail: {
      en: 'Desktop scrub + static layout under 900px / reduced motion',
      ru: 'Скролл-сборка на десктопе · статика до 900px и при reduced motion',
      he: 'קרצוף בדסקטופ · פריסה סטטית מתחת ל־900px / reduced motion',
    },
  },
  {
    label: { en: 'AI consultant', ru: 'ИИ-консультант', he: 'יועץ AI' },
    detail: {
      en: 'On-page assistant with prepared replies · no model API',
      ru: 'Ассистент на странице с заготовками · без вызова модели',
      he: 'עוזר בעמוד עם תשובות מוכנות · בלי קריאה למודל',
    },
  },
  {
    label: { en: 'Performance', ru: 'Производительность', he: 'ביצועים' },
    detail: {
      en: '181 WebP frames · 768 / 1280 / 1920 · no hero video',
      ru: '181 кадр WebP · 768 / 1280 / 1920 · без видео в первом экране',
      he: '181 פריימי WebP · 768 / 1280 / 1920 · בלי וידאו בהירו',
    },
    metrics: [
      { value: '96', label: { en: 'Lighthouse mobile', ru: 'Lighthouse, мобильный', he: 'Lighthouse מובייל' } },
      { value: '89', label: { en: 'Lighthouse desktop', ru: 'Lighthouse, десктоп', he: 'Lighthouse דסקטופ' } },
      { value: '1.0 s', label: { en: 'First paint (FCP)', ru: 'Первая отрисовка (FCP)', he: 'ציור ראשון (FCP)' } },
      { value: '2.6 s', label: { en: 'LCP mobile', ru: 'LCP, мобильный', he: 'LCP מובייל' } },
      { value: '10 ms', label: { en: 'Blocking time (TBT)', ru: 'Блокировка (TBT)', he: 'זמן חסימה (TBT)' } },
      { value: '0', label: { en: 'Layout shift (CLS)', ru: 'Сдвиг макета (CLS)', he: 'הזזת פריסה (CLS)' } },
    ],
    metricsNote: {
      en: 'Lighthouse 12, ora60a.erythro.ai, November 2026',
      ru: 'Lighthouse 12, ora60a.erythro.ai, ноябрь 2026',
      he: 'Lighthouse 12, ‏ora60a.erythro.ai, נובמבר 2026',
    },
  },
  {
    label: { en: 'CI', ru: 'CI', he: 'CI' },
    detail: {
      en: 'GitHub · automated tests · deploy to Vercel',
      ru: 'GitHub · автотесты · деплой на Vercel',
      he: 'GitHub · בדיקות אוטומטיות · פריסה ל־Vercel',
    },
  },
]

const LOCALES = ['en', 'ru', 'he'] as const
const rowId = () => randomBytes(12).toString('hex')

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202611121800)`)

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "portfolio_projects_highlights" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL
      );
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "portfolio_projects_highlights_order_idx"
      ON "portfolio_projects_highlights" USING btree ("_order");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "portfolio_projects_highlights_parent_id_idx"
      ON "portfolio_projects_highlights" USING btree ("_parent_id");
    `)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "portfolio_projects_highlights"
          ADD CONSTRAINT "portfolio_projects_highlights_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "portfolio_projects"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "portfolio_projects_highlights_locales" (
        "label" varchar,
        "detail" varchar,
        "metrics_note" varchar,
        "id" serial PRIMARY KEY NOT NULL,
        "_locale" "_locales" NOT NULL,
        "_parent_id" varchar NOT NULL
      );
    `)
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "portfolio_projects_highlights_locales_locale_parent_id_unique"
      ON "portfolio_projects_highlights_locales" USING btree ("_locale", "_parent_id");
    `)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "portfolio_projects_highlights_locales"
          ADD CONSTRAINT "portfolio_projects_highlights_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "portfolio_projects_highlights"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "portfolio_projects_highlights_metrics" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "value" varchar
      );
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "portfolio_projects_highlights_metrics_order_idx"
      ON "portfolio_projects_highlights_metrics" USING btree ("_order");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "portfolio_projects_highlights_metrics_parent_id_idx"
      ON "portfolio_projects_highlights_metrics" USING btree ("_parent_id");
    `)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "portfolio_projects_highlights_metrics"
          ADD CONSTRAINT "portfolio_projects_highlights_metrics_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "portfolio_projects_highlights"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "portfolio_projects_highlights_metrics_locales" (
        "label" varchar,
        "id" serial PRIMARY KEY NOT NULL,
        "_locale" "_locales" NOT NULL,
        "_parent_id" varchar NOT NULL
      );
    `)
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "portfolio_projects_highlights_metrics_locales_locale_parent_id_unique"
      ON "portfolio_projects_highlights_metrics_locales" USING btree ("_locale", "_parent_id");
    `)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "portfolio_projects_highlights_metrics_locales"
          ADD CONSTRAINT "portfolio_projects_highlights_metrics_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "portfolio_projects_highlights_metrics"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    const project = await db.execute(sql`
      SELECT p."id" FROM "portfolio_projects" p
      WHERE p."slug" = 'ora-60a'
        AND NOT EXISTS (
          SELECT 1 FROM "portfolio_projects_highlights" h WHERE h."_parent_id" = p."id"
        )
      LIMIT 1;
    `)
    const projectId = ((project as { rows?: { id?: number }[] }).rows ?? [])[0]?.id
    if (projectId == null) return

    for (const [order, row] of ORA_60A.entries()) {
      const hid = rowId()
      await db.execute(sql`
        INSERT INTO "portfolio_projects_highlights" ("_order", "_parent_id", "id")
        VALUES (${order + 1}, ${projectId}, ${hid});
      `)
      for (const loc of LOCALES) {
        await db.execute(sql`
          INSERT INTO "portfolio_projects_highlights_locales"
            ("label", "detail", "metrics_note", "_locale", "_parent_id")
          VALUES (${row.label[loc]}, ${row.detail[loc]}, ${row.metricsNote?.[loc] ?? null}, ${loc}, ${hid});
        `)
      }
      for (const [mOrder, metric] of (row.metrics ?? []).entries()) {
        const mid = rowId()
        await db.execute(sql`
          INSERT INTO "portfolio_projects_highlights_metrics" ("_order", "_parent_id", "id", "value")
          VALUES (${mOrder + 1}, ${hid}, ${mid}, ${metric.value});
        `)
        for (const loc of LOCALES) {
          await db.execute(sql`
            INSERT INTO "portfolio_projects_highlights_metrics_locales" ("label", "_locale", "_parent_id")
            VALUES (${metric.label[loc]}, ${loc}, ${mid});
          `)
        }
      }
    }
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202611121800)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "portfolio_projects_highlights_metrics_locales" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "portfolio_projects_highlights_metrics" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "portfolio_projects_highlights_locales" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "portfolio_projects_highlights" CASCADE;`)
}
