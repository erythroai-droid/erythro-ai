import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Structured AI Audit lead fields on contact_submissions:
 * website, audit language, plan slug/total, and lab workflow status.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202608310100)`)

  try {
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "website" varchar;
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "audit_language" varchar;
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "plan_slug" varchar;
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "plan_total" varchar;
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "audit_status" varchar DEFAULT 'new';
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "contact_submissions_website_idx"
      ON "contact_submissions" USING btree ("website");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "contact_submissions_plan_slug_idx"
      ON "contact_submissions" USING btree ("plan_slug");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "contact_submissions_audit_status_idx"
      ON "contact_submissions" USING btree ("audit_status");
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202608310100)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202608310100)`)

  try {
    await db.execute(sql`DROP INDEX IF EXISTS "contact_submissions_audit_status_idx"`)
    await db.execute(sql`DROP INDEX IF EXISTS "contact_submissions_plan_slug_idx"`)
    await db.execute(sql`DROP INDEX IF EXISTS "contact_submissions_website_idx"`)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "audit_status";
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "plan_total";
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "plan_slug";
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "audit_language";
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "website";
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202608310100)`)
  }
}
