import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * AI Audit plans: localized cardName for /audit Pricing badge
 * (editable in admin; Title stays for order page / admin list).
 *
 * Safety (PIT-086 / PIT-004):
 * - Additive only (ADD COLUMN IF NOT EXISTS)
 * - pg_advisory_xact_lock — transaction-scoped
 * - Does not overwrite existing locale values
 */

const LOCK_ID = 202610120200

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    ALTER TABLE "solution_plans_locales"
    ADD COLUMN IF NOT EXISTS "card_name" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    ALTER TABLE "solution_plans_locales" DROP COLUMN IF EXISTS "card_name";
  `)
}
