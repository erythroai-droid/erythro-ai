import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * AI Audit pipeline result fields on contact_submissions:
 * score, summary JSON, R2 reportUrl, optional html, retries, last error.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202608311200)`)

  try {
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "audit_score" numeric;
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "audit_summary" jsonb;
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "report_url" varchar;
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "html_result" varchar;
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "retry_count" numeric DEFAULT 0;
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "error_last" varchar;
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202608311200)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202608311200)`)

  try {
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "error_last";
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "retry_count";
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "html_result";
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "report_url";
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "audit_summary";
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "audit_score";
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202608311200)`)
  }
}
