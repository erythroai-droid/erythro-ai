import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Move addon price to locales so each language can use its own display string
 * (e.g. "350₪/mth" / "350₪/мес" / "₪350/חודש").
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons_locales"
    ADD COLUMN IF NOT EXISTS "price" varchar;
  `)

  await db.execute(sql`
    UPDATE "solution_plans_addons_locales" AS l
    SET "price" = a."price"
    FROM "solution_plans_addons" AS a
    WHERE l."_parent_id" = a."id"
      AND (l."price" IS NULL OR BTRIM(l."price") = '');
  `)

  await db.execute(sql`
    ALTER TABLE "solution_plans_addons"
    DROP COLUMN IF EXISTS "price";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons"
    ADD COLUMN IF NOT EXISTS "price" varchar;
  `)

  await db.execute(sql`
    UPDATE "solution_plans_addons" AS a
    SET "price" = COALESCE(
      (
        SELECT l."price"
        FROM "solution_plans_addons_locales" AS l
        WHERE l."_parent_id" = a."id" AND l."_locale" = 'en'
        LIMIT 1
      ),
      (
        SELECT l."price"
        FROM "solution_plans_addons_locales" AS l
        WHERE l."_parent_id" = a."id" AND l."price" IS NOT NULL
        LIMIT 1
      ),
      '0'
    );
  `)

  await db.execute(sql`
    ALTER TABLE "solution_plans_addons_locales"
    DROP COLUMN IF EXISTS "price";
  `)
}
