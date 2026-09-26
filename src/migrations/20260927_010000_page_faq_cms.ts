import { randomUUID } from 'crypto'
import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import { listPageFaqEntries, getPageFaq, type PageFaqBlock } from '../lib/pageFaq'

/**
 * FAQ accordions on service pages and /audit.
 * Tables follow Payload naming: group `faq` + array `items`.
 * Seeds the copy that previously lived only in src/lib/pageFaq.ts.
 */

const LOCALES = ['en', 'ru', 'he'] as const

function resultRows(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[]
  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows?: unknown }).rows
    if (Array.isArray(rows)) return rows as Record<string, unknown>[]
  }
  return []
}

async function createFaqTables(
  db: MigrateUpArgs['db'],
  itemsTable: string,
  localesTable: string,
  parentTable: string,
): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ${sql.raw(`"${itemsTable}"`)} (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL
    );
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS ${sql.raw(`"${itemsTable}_order_idx"`)}
    ON ${sql.raw(`"${itemsTable}"`)} USING btree ("_order");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS ${sql.raw(`"${itemsTable}_parent_id_idx"`)}
    ON ${sql.raw(`"${itemsTable}"`)} USING btree ("_parent_id");
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE ${sql.raw(`"${itemsTable}"`)}
        ADD CONSTRAINT ${sql.raw(`"${itemsTable}_parent_id_fk"`)}
        FOREIGN KEY ("_parent_id") REFERENCES ${sql.raw(`"${parentTable}"`)}("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    CREATE SEQUENCE IF NOT EXISTS ${sql.raw(`"${localesTable}_id_seq"`)};
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ${sql.raw(`"${localesTable}"`)} (
      "question" varchar NOT NULL,
      "answer" varchar,
      "details" varchar,
      "id" integer PRIMARY KEY DEFAULT nextval(${sql.raw(`'${localesTable}_id_seq'`)}) NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
  `)
  await db.execute(sql`
    ALTER SEQUENCE ${sql.raw(`"${localesTable}_id_seq"`)}
    OWNED BY ${sql.raw(`"${localesTable}"."id"`)};
  `)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS ${sql.raw(`"${localesTable}_locale_parent_id_unique"`)}
    ON ${sql.raw(`"${localesTable}"`)} USING btree ("_locale", "_parent_id");
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE ${sql.raw(`"${localesTable}"`)}
        ADD CONSTRAINT ${sql.raw(`"${localesTable}_parent_id_fk"`)}
        FOREIGN KEY ("_parent_id") REFERENCES ${sql.raw(`"${itemsTable}"`)}("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)
}

async function seedFaq(
  db: MigrateUpArgs['db'],
  parentId: number,
  block: PageFaqBlock,
  localesParentTable: string,
  itemsTable: string,
  itemLocalesTable: string,
): Promise<void> {
  const existing = resultRows(
    await db.execute(
      sql`SELECT id FROM ${sql.raw(`"${itemsTable}"`)} WHERE "_parent_id" = ${parentId} LIMIT 1`,
    ),
  )
  if (existing.length) return

  for (const locale of LOCALES) {
    const title = block.title[locale] || block.title.en || ''
    await db.execute(sql`
      UPDATE ${sql.raw(`"${localesParentTable}"`)}
      SET "faq_title" = ${title}
      WHERE "_parent_id" = ${parentId} AND "_locale" = ${locale}::"_locales"
    `)
  }

  for (let index = 0; index < block.items.length; index++) {
    const item = block.items[index]
    const itemId = randomUUID()
    await db.execute(sql`
      INSERT INTO ${sql.raw(`"${itemsTable}"`)} ("_order", "_parent_id", "id")
      VALUES (${index + 1}, ${parentId}, ${itemId})
    `)
    for (const locale of LOCALES) {
      const details = (item.details?.[locale] || []).join('\n')
      await db.execute(sql`
        INSERT INTO ${sql.raw(`"${itemLocalesTable}"`)}
          ("question", "answer", "details", "_locale", "_parent_id")
        VALUES (
          ${item.question[locale] || item.question.en || ''},
          ${item.answer[locale] || item.answer.en || ''},
          ${details || null},
          ${locale}::"_locales",
          ${itemId}
        )
      `)
    }
  }
}

const TITLE_TO_FAQ_KEY: Record<string, string> = {
  'design & branding': 'design-branding',
  development: 'development',
  'ai & automation': 'ai-automation',
  'enterprise engineering': 'enterprise-engineering',
  management: 'management',
}

function faqKeyForService(slug: unknown, title: unknown): string | undefined {
  const slugText = typeof slug === 'string' ? slug.trim() : ''
  if (slugText && getPageFaq(slugText)) return slugText
  const titleText = typeof title === 'string' ? title.trim().toLowerCase() : ''
  return TITLE_TO_FAQ_KEY[titleText]
}

/** Idempotent: skips a service that already has FAQ rows. */
export async function seedMissingServiceFaqs(db: MigrateUpArgs['db']): Promise<void> {
  const rows = resultRows(
    await db.execute(sql`
      SELECT s.id, s.slug, loc.title
      FROM "services" s
      LEFT JOIN "services_locales" loc
        ON loc."_parent_id" = s.id AND loc."_locale" = 'en'
    `),
  )

  for (const row of rows) {
    const key = faqKeyForService(row.slug, row.title)
    const block = key ? getPageFaq(key) : undefined
    const parentId = Number(row.id)
    if (!block || !Number.isFinite(parentId) || parentId <= 0) continue
    await seedFaq(
      db,
      parentId,
      block,
      'services_locales',
      'services_faq_items',
      'services_faq_items_locales',
    )
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202609270100)`)

  try {
    await db.execute(sql`
      ALTER TABLE "services_locales" ADD COLUMN IF NOT EXISTS "faq_title" varchar;
    `)
    await db.execute(sql`
      ALTER TABLE "audit_page_locales" ADD COLUMN IF NOT EXISTS "faq_title" varchar;
    `)

    await createFaqTables(db, 'services_faq_items', 'services_faq_items_locales', 'services')
    await createFaqTables(db, 'audit_page_faq_items', 'audit_page_faq_items_locales', 'audit_page')

    await seedMissingServiceFaqs(db)

    const auditRows = resultRows(await db.execute(sql`SELECT id FROM "audit_page" LIMIT 1`))
    const auditId = Number(auditRows[0]?.id)
    const auditFaq = listPageFaqEntries().find(([key]) => key === 'audit')?.[1]
    if (Number.isFinite(auditId) && auditId > 0 && auditFaq) {
      await seedFaq(
        db,
        auditId,
        auditFaq,
        'audit_page_locales',
        'audit_page_faq_items',
        'audit_page_faq_items_locales',
      )
    }
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202609270100)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202609270100)`)
  try {
    await db.execute(sql`DROP TABLE IF EXISTS "services_faq_items_locales" CASCADE;`)
    await db.execute(sql`DROP SEQUENCE IF EXISTS "services_faq_items_locales_id_seq";`)
    await db.execute(sql`DROP TABLE IF EXISTS "services_faq_items" CASCADE;`)
    await db.execute(sql`DROP TABLE IF EXISTS "audit_page_faq_items_locales" CASCADE;`)
    await db.execute(sql`DROP SEQUENCE IF EXISTS "audit_page_faq_items_locales_id_seq";`)
    await db.execute(sql`DROP TABLE IF EXISTS "audit_page_faq_items" CASCADE;`)
    await db.execute(sql`ALTER TABLE "services_locales" DROP COLUMN IF EXISTS "faq_title";`)
    await db.execute(sql`ALTER TABLE "audit_page_locales" DROP COLUMN IF EXISTS "faq_title";`)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202609270100)`)
  }
}
