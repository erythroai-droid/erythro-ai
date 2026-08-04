import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Rich-text Full description on order add-ons (e.g. Monthly subscription accordion).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons_locales"
    ADD COLUMN IF NOT EXISTS "full" jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons_locales"
    DROP COLUMN IF EXISTS "full";
  `)
}
