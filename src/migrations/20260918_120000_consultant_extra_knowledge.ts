import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Unpublished consultant facts (refund policy, process notes, etc.) live on
 * consultant-settings locales — not on public pages.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202609181200)`)

  try {
    await db.execute(sql`
      ALTER TABLE "consultant_settings_locales"
      ADD COLUMN IF NOT EXISTS "extra_knowledge" varchar;
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202609181200)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202609181200)`)

  try {
    await db.execute(sql`
      ALTER TABLE "consultant_settings_locales"
      DROP COLUMN IF EXISTS "extra_knowledge";
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202609181200)`)
  }
}
