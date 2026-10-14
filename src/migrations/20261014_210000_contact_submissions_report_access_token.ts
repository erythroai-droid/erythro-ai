import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Unguessable access token for /audit/report/[id]?k=…
 * Backfills existing audit rows and rewrites status-page report_url values.
 *
 * Safety (PIT-086 / PIT-004):
 * - Additive column + data backfill
 * - pg_advisory_xact_lock — transaction-scoped
 */

const LOCK_ID = 202610142100

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    ADD COLUMN IF NOT EXISTS "report_access_token" varchar;
  `)

  await db.execute(sql`
    UPDATE "contact_submissions"
    SET "report_access_token" = rtrim(
      translate(encode(gen_random_bytes(24), 'base64'), '+/', '-_'),
      '='
    )
    WHERE "source" = 'audit'
      AND ("report_access_token" IS NULL OR btrim("report_access_token") = '');
  `)

  await db.execute(sql`
    UPDATE "contact_submissions"
    SET "report_url" = regexp_replace(
      "report_url",
      '(/audit/report/[0-9]+)(?:\\?.*)?$',
      '\\1?k=' || "report_access_token"
    )
    WHERE "source" = 'audit'
      AND "report_access_token" IS NOT NULL
      AND btrim("report_access_token") <> ''
      AND "report_url" IS NOT NULL
      AND "report_url" ~ '/audit/report/[0-9]+';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    ALTER TABLE "contact_submissions"
    DROP COLUMN IF EXISTS "report_access_token";
  `)
}
