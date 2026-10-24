import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Open-tracking pixel hits for team@ commercial mail (not a Payload collection).
 * Additive only (PIT-086).
 */

const LOCK_ID = 202610241200

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "mail_opens" (
      "id" serial PRIMARY KEY NOT NULL,
      "submission_id" integer NOT NULL,
      "kind" varchar NOT NULL,
      "user_agent" varchar,
      "opened_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "mail_opens_submission_idx" ON "mail_opens" ("submission_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)
  await db.execute(sql`DROP TABLE IF EXISTS "mail_opens";`)
}
