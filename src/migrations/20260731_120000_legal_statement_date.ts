import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fix legal-page date field:
 * - Custom display date was wrongly named `updatedAt`, which collided with
 *   Payload's system timestamp and stored values like `2026-07-31T07:49:44.673Z`.
 * - Rename to `statement_date` and restore `updated_at` as a real timestamp.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of ['legal_privacy', 'legal_terms', 'legal_accessibility']) {
    await db.execute(sql`
      ALTER TABLE ${sql.raw(`"${table}"`)}
      ADD COLUMN IF NOT EXISTS "statement_date" varchar;
    `)

    // Copy existing display date (date-only or ISO timestamp → YYYY-MM-DD)
    await db.execute(sql`
      UPDATE ${sql.raw(`"${table}"`)}
      SET "statement_date" = LEFT("updated_at", 10)
      WHERE "statement_date" IS NULL
        AND "updated_at" IS NOT NULL
        AND "updated_at" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}';
    `)

    // Convert updated_at varchar → timestamp for Payload system field
    await db.execute(sql`
      ALTER TABLE ${sql.raw(`"${table}"`)}
      ALTER COLUMN "updated_at" TYPE timestamp(3) with time zone
      USING CASE
        WHEN "updated_at" IS NULL OR BTRIM("updated_at") = '' THEN NULL
        WHEN "updated_at" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN ("updated_at")::timestamptz
        ELSE NOW()
      END;
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of ['legal_privacy', 'legal_terms', 'legal_accessibility']) {
    await db.execute(sql`
      ALTER TABLE ${sql.raw(`"${table}"`)}
      ALTER COLUMN "updated_at" TYPE varchar
      USING CASE
        WHEN "updated_at" IS NULL THEN NULL
        ELSE to_char("updated_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      END;
    `)

    await db.execute(sql`
      UPDATE ${sql.raw(`"${table}"`)}
      SET "updated_at" = "statement_date"
      WHERE "statement_date" IS NOT NULL;
    `)

    await db.execute(sql`
      ALTER TABLE ${sql.raw(`"${table}"`)}
      DROP COLUMN IF EXISTS "statement_date";
    `)
  }
}
