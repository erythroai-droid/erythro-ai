import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * 24h-before-expiry Pro promo nudge (between offer and development reminder).
 * Additive only (PIT-086).
 */

const LOCK_ID = 202610192330

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "pro_offer_nudge_due_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "pro_offer_nudge_sent_at" timestamp(3) with time zone;
  `)

  // Allow enum-like select values via free text column (varchar) — already text/select in Payload.
  // Backfill nudge due for offers already in flight (sent, promo not expired, no nudge yet).
  await db.execute(sql`
    UPDATE "contact_submissions"
    SET "pro_offer_nudge_due_at" = "pro_offer_expires_at" - interval '24 hours'
    WHERE "source" = 'audit'
      AND "pro_offer_status" = 'sent'
      AND "pro_offer_expires_at" IS NOT NULL
      AND "pro_offer_nudge_due_at" IS NULL
      AND "pro_offer_nudge_sent_at" IS NULL
      AND "pro_offer_expires_at" > now();
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)
  await db.execute(sql`
    ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "pro_offer_nudge_due_at",
      DROP COLUMN IF EXISTS "pro_offer_nudge_sent_at";
  `)
}
