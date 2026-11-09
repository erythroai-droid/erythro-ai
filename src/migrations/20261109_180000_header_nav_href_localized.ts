import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Move Header nav (and submenu) href into locales so EN/RU/HE can store different links
 * (e.g. Audit → technical / commercial LPs per language).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202611091800)`)

  try {
    await db.execute(sql`
      ALTER TABLE "header_nav_items_locales"
      ADD COLUMN IF NOT EXISTS "href" varchar;
    `)
    await db.execute(sql`
      UPDATE "header_nav_items_locales" AS l
      SET "href" = p."href"
      FROM "header_nav_items" AS p
      WHERE l."_parent_id" = p."id"
        AND (l."href" IS NULL OR BTRIM(l."href") = '');
    `)
    await db.execute(sql`
      UPDATE "header_nav_items_locales"
      SET "href" = '#'
      WHERE "href" IS NULL OR BTRIM("href") = '';
    `)
    await db.execute(sql`
      ALTER TABLE "header_nav_items_locales"
      ALTER COLUMN "href" SET NOT NULL;
    `)
    await db.execute(sql`
      ALTER TABLE "header_nav_items"
      DROP COLUMN IF EXISTS "href";
    `)

    await db.execute(sql`
      ALTER TABLE "header_nav_items_children_locales"
      ADD COLUMN IF NOT EXISTS "href" varchar;
    `)
    await db.execute(sql`
      UPDATE "header_nav_items_children_locales" AS l
      SET "href" = p."href"
      FROM "header_nav_items_children" AS p
      WHERE l."_parent_id" = p."id"
        AND (l."href" IS NULL OR BTRIM(l."href") = '');
    `)
    await db.execute(sql`
      UPDATE "header_nav_items_children_locales"
      SET "href" = '#'
      WHERE "href" IS NULL OR BTRIM("href") = '';
    `)
    await db.execute(sql`
      ALTER TABLE "header_nav_items_children_locales"
      ALTER COLUMN "href" SET NOT NULL;
    `)
    await db.execute(sql`
      ALTER TABLE "header_nav_items_children"
      DROP COLUMN IF EXISTS "href";
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202611091800)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202611091800)`)

  try {
    await db.execute(sql`
      ALTER TABLE "header_nav_items"
      ADD COLUMN IF NOT EXISTS "href" varchar;
    `)
    await db.execute(sql`
      UPDATE "header_nav_items" AS p
      SET "href" = COALESCE(
        (
          SELECT l."href"
          FROM "header_nav_items_locales" AS l
          WHERE l."_parent_id" = p."id" AND l."_locale" = 'en'
          LIMIT 1
        ),
        (
          SELECT l."href"
          FROM "header_nav_items_locales" AS l
          WHERE l."_parent_id" = p."id" AND l."href" IS NOT NULL
          LIMIT 1
        ),
        '#'
      );
    `)
    await db.execute(sql`
      ALTER TABLE "header_nav_items"
      ALTER COLUMN "href" SET NOT NULL;
    `)
    await db.execute(sql`
      ALTER TABLE "header_nav_items_locales"
      DROP COLUMN IF EXISTS "href";
    `)

    await db.execute(sql`
      ALTER TABLE "header_nav_items_children"
      ADD COLUMN IF NOT EXISTS "href" varchar;
    `)
    await db.execute(sql`
      UPDATE "header_nav_items_children" AS p
      SET "href" = COALESCE(
        (
          SELECT l."href"
          FROM "header_nav_items_children_locales" AS l
          WHERE l."_parent_id" = p."id" AND l."_locale" = 'en'
          LIMIT 1
        ),
        (
          SELECT l."href"
          FROM "header_nav_items_children_locales" AS l
          WHERE l."_parent_id" = p."id" AND l."href" IS NOT NULL
          LIMIT 1
        ),
        '#'
      );
    `)
    await db.execute(sql`
      ALTER TABLE "header_nav_items_children"
      ALTER COLUMN "href" SET NOT NULL;
    `)
    await db.execute(sql`
      ALTER TABLE "header_nav_items_children_locales"
      DROP COLUMN IF EXISTS "href";
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202611091800)`)
  }
}
