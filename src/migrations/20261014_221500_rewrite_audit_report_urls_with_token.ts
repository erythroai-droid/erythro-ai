import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Re-attach ?k= to status-page report_url values overwritten by an old worker
 * that emailed / stored /audit/report/[id] without the access token (PIT-107).
 *
 * Safety (PIT-086): pg_advisory_xact_lock — transaction-scoped.
 */

const LOCK_ID = 202610142215

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

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
      AND "report_url" ~ '/audit/report/[0-9]+'
      AND "report_url" !~ '[?&]k=';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)
  // Irreversible data repair — no-op.
}
