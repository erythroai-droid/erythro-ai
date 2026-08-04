import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * homeOnly on solution plan features: show on homepage cards, hide from order package accordion.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_features"
    ADD COLUMN IF NOT EXISTS "home_only" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_features"
    DROP COLUMN IF EXISTS "home_only";
  `)
}
