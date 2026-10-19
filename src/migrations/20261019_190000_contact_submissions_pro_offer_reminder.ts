import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Ads LP funnel: 72h promo window + reminder fields.
 * Additive only (PIT-086).
 */

const LOCK_ID = 202610191900

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    ADD COLUMN IF NOT EXISTS "pro_offer_expires_at" timestamp(3) with time zone;
  `)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    ADD COLUMN IF NOT EXISTS "pro_offer_reminder_due_at" timestamp(3) with time zone;
  `)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    ADD COLUMN IF NOT EXISTS "pro_offer_reminder_sent_at" timestamp(3) with time zone;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "contact_submissions_pro_offer_reminder_due_idx"
    ON "contact_submissions" ("pro_offer_status", "pro_offer_reminder_due_at")
    WHERE "pro_offer_status" = 'sent' AND "pro_offer_reminder_sent_at" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`DROP INDEX IF EXISTS "contact_submissions_pro_offer_reminder_due_idx";`)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    DROP COLUMN IF EXISTS "pro_offer_reminder_sent_at";
  `)
  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    DROP COLUMN IF EXISTS "pro_offer_reminder_due_at";
  `)
  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    DROP COLUMN IF EXISTS "pro_offer_expires_at";
  `)
}
