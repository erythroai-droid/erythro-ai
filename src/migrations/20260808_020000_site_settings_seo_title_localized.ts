import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Move Site Settings → SEO title onto locales so en / ru / he can differ.
 * Previously seo_title lived on site_settings (shared across locales).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202608080200)`)

  try {
    await db.execute(sql`
      ALTER TABLE "site_settings_locales"
        ADD COLUMN IF NOT EXISTS "seo_title" varchar;
    `)

    // Copy the former shared title into every locale row.
    await db.execute(sql`
      UPDATE "site_settings_locales" AS loc
      SET "seo_title" = s."seo_title"
      FROM "site_settings" AS s
      WHERE loc."_parent_id" = s."id"
        AND (loc."seo_title" IS NULL OR btrim(loc."seo_title") = '')
        AND s."seo_title" IS NOT NULL
        AND btrim(s."seo_title") <> '';
    `)

    // If rows still hold the English default, set proper ru / he titles.
    await db.execute(sql`
      UPDATE "site_settings_locales"
      SET "seo_title" = 'Erythro.ai — цифровое агентство'
      WHERE "_locale"::text = 'ru'
        AND (
          "seo_title" IS NULL
          OR btrim("seo_title") = ''
          OR "seo_title" = 'Erythro.ai - digital agency'
        );
    `)

    await db.execute(sql`
      UPDATE "site_settings_locales"
      SET "seo_title" = 'Erythro.ai - סוכנות דיגיטל'
      WHERE "_locale"::text = 'he'
        AND (
          "seo_title" IS NULL
          OR btrim("seo_title") = ''
          OR "seo_title" = 'Erythro.ai - digital agency'
        );
    `)

    await db.execute(sql`
      UPDATE "site_settings_locales"
      SET "seo_title" = 'Erythro.ai - digital agency'
      WHERE "_locale"::text = 'en'
        AND ("seo_title" IS NULL OR btrim("seo_title") = '');
    `)

    await db.execute(sql`
      ALTER TABLE "site_settings"
        DROP COLUMN IF EXISTS "seo_title";
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202608080200)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "seo_title" varchar;
  `)

  await db.execute(sql`
    UPDATE "site_settings" AS s
    SET "seo_title" = COALESCE(
      (
        SELECT loc."seo_title"
        FROM "site_settings_locales" AS loc
        WHERE loc."_parent_id" = s."id" AND loc."_locale"::text = 'en'
        LIMIT 1
      ),
      (
        SELECT loc."seo_title"
        FROM "site_settings_locales" AS loc
        WHERE loc."_parent_id" = s."id" AND loc."seo_title" IS NOT NULL
        LIMIT 1
      )
    );
  `)

  await db.execute(sql`
    ALTER TABLE "site_settings_locales"
      DROP COLUMN IF EXISTS "seo_title";
  `)
}
