import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Meta funnel: leadChannel + delayed PRO upsell email fields on free audits.
 *
 * Safety (PIT-086 / PIT-004):
 * - Additive columns only
 * - pg_advisory_xact_lock — transaction-scoped
 */

const LOCK_ID = 202610191400

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    ADD COLUMN IF NOT EXISTS "lead_channel" varchar DEFAULT 'organic';
  `)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    ADD COLUMN IF NOT EXISTS "pro_offer_status" varchar DEFAULT 'none';
  `)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    ADD COLUMN IF NOT EXISTS "pro_offer_due_at" timestamp(3) with time zone;
  `)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    ADD COLUMN IF NOT EXISTS "pro_offer_sent_at" timestamp(3) with time zone;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "contact_submissions_pro_offer_due_idx"
    ON "contact_submissions" ("pro_offer_status", "pro_offer_due_at")
    WHERE "pro_offer_status" = 'scheduled';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    DROP INDEX IF EXISTS "contact_submissions_pro_offer_due_idx";
  `)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    DROP COLUMN IF EXISTS "pro_offer_sent_at";
  `)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    DROP COLUMN IF EXISTS "pro_offer_due_at";
  `)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    DROP COLUMN IF EXISTS "pro_offer_status";
  `)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    DROP COLUMN IF EXISTS "lead_channel";
  `)
}
