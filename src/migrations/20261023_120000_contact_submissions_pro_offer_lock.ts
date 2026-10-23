import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Send lock for team@ commercial emails (PIT-123: duplicate Pro offer).
 * Additive only (PIT-086).
 */

const LOCK_ID = 202610231200

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "pro_offer_lock_at" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)
  await db.execute(sql`
    ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "pro_offer_lock_at";
  `)
}
