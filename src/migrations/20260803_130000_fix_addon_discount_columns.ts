import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Repair: earlier migration used discount_months_1/_6/_12, but Payload expects
 * discount_months1/6/12. Rename misnamed columns (or add correct ones).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'solution_plans_addons'
          AND column_name = 'discount_months_1'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'solution_plans_addons'
          AND column_name = 'discount_months1'
      ) THEN
        ALTER TABLE "solution_plans_addons" RENAME COLUMN "discount_months_1" TO "discount_months1";
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'solution_plans_addons'
          AND column_name = 'discount_months_6'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'solution_plans_addons'
          AND column_name = 'discount_months6'
      ) THEN
        ALTER TABLE "solution_plans_addons" RENAME COLUMN "discount_months_6" TO "discount_months6";
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'solution_plans_addons'
          AND column_name = 'discount_months_12'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'solution_plans_addons'
          AND column_name = 'discount_months12'
      ) THEN
        ALTER TABLE "solution_plans_addons" RENAME COLUMN "discount_months_12" TO "discount_months12";
      END IF;
    END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "solution_plans_addons"
    ADD COLUMN IF NOT EXISTS "discount_months1" numeric DEFAULT 0;
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons"
    ADD COLUMN IF NOT EXISTS "discount_months6" numeric DEFAULT 0;
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons"
    ADD COLUMN IF NOT EXISTS "discount_months12" numeric DEFAULT 0;
  `)

  // Drop leftover wrong-named columns if both old and new somehow exist
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons" DROP COLUMN IF EXISTS "discount_months_1";
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons" DROP COLUMN IF EXISTS "discount_months_6";
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons" DROP COLUMN IF EXISTS "discount_months_12";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Irreversible repair — leave correct columns in place
  await db.execute(sql`SELECT 1`)
}
