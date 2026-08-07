import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Localized burger-menu subtitle under each Header → Nav Item.
 * Column lives on header_nav_items_locales next to label.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202608080100)`)

  try {
    await db.execute(sql`
      ALTER TABLE "header_nav_items_locales"
        ADD COLUMN IF NOT EXISTS "description" varchar;
    `)

    // Backfill current front-end defaults so the admin shows existing subtitles.
    await db.execute(sql`
      UPDATE "header_nav_items_locales" AS loc
      SET "description" = v.description
      FROM "header_nav_items" AS item
      CROSS JOIN (
        VALUES
          ('#cases', 'en', 'View our selected works'),
          ('#cases', 'ru', 'Смотреть избранные работы'),
          ('#cases', 'he', 'צפו בעבודות נבחרות'),
          ('#services', 'en', 'What we can build for you'),
          ('#services', 'ru', 'Что мы можем сделать для вас'),
          ('#services', 'he', 'מה נוכל לבנות בשבילכם'),
          ('#solutions', 'en', 'Ready-made packages'),
          ('#solutions', 'ru', 'Готовые пакеты решений'),
          ('#solutions', 'he', 'חבילות מוכנות'),
          ('/contacts', 'en', 'Get in touch and find us'),
          ('/contacts', 'ru', 'Связаться с нами'),
          ('/contacts', 'he', 'צרו קשר ומצאו אותנו'),
          ('#contacts', 'en', 'Get in touch and find us'),
          ('#contacts', 'ru', 'Связаться с нами'),
          ('#contacts', 'he', 'צרו קשר ומצאו אותנו')
      ) AS v(href, locale, description)
      WHERE loc."_parent_id" = item."id"
        AND item."href" = v.href
        AND loc."_locale"::text = v.locale
        AND (loc."description" IS NULL OR btrim(loc."description") = '');
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202608080100)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "header_nav_items_locales"
      DROP COLUMN IF EXISTS "description";
  `)
}
