import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Per-term discount % fields for order add-ons (1 / 6 / 12 months).
 * Addon `price` is treated as a monthly rate.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons"
    ADD COLUMN IF NOT EXISTS "discount_months_1" numeric DEFAULT 0;
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons"
    ADD COLUMN IF NOT EXISTS "discount_months_6" numeric DEFAULT 0;
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons"
    ADD COLUMN IF NOT EXISTS "discount_months_12" numeric DEFAULT 0;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons"
    DROP COLUMN IF EXISTS "discount_months_1";
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons"
    DROP COLUMN IF EXISTS "discount_months_6";
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons"
    DROP COLUMN IF EXISTS "discount_months_12";
  `)
}
