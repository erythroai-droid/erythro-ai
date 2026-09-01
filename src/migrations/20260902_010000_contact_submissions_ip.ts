import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `ip` column to contact_submissions table for rate-limiting, audit and anti-abuse verification.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202609020100)`)

  try {
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "ip" varchar;
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202609020100)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202609020100)`)

  try {
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "ip";
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202609020100)`)
  }
}
