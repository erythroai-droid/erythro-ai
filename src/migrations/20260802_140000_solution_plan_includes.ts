import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Order-page “What's included in development” rich-text field on solution plans.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_locales"
    ADD COLUMN IF NOT EXISTS "includes" jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_locales"
    DROP COLUMN IF EXISTS "includes";
  `)
}
