import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Order page CMS fields on solution plans (localized):
 * payment_note, tax_note, tax_value
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_locales"
    ADD COLUMN IF NOT EXISTS "payment_note" varchar;
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_locales"
    ADD COLUMN IF NOT EXISTS "tax_note" varchar;
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_locales"
    ADD COLUMN IF NOT EXISTS "tax_value" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_locales"
    DROP COLUMN IF EXISTS "payment_note";
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_locales"
    DROP COLUMN IF EXISTS "tax_note";
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_locales"
    DROP COLUMN IF EXISTS "tax_value";
  `)
}
