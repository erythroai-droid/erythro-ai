import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * team@ commercial opt-out (Pro offer / KP). Additive only (PIT-086).
 */

const LOCK_ID = 202610192200

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "mail_unsubscribes" (
      "email" varchar(254) PRIMARY KEY,
      "source" varchar(64),
      "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)
  await db.execute(sql`DROP TABLE IF EXISTS "mail_unsubscribes";`)
}
