import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Rename localized addon price → priceDisplay to avoid colliding with plan-level `price`
 * (Payload admin hides the nested field when names match).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons_locales"
    RENAME COLUMN "price" TO "price_display";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons_locales"
    RENAME COLUMN "price_display" TO "price";
  `)
}
