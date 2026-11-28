import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Case Studies homepage: single bannerVideo / bannerVideoMobile → banners[] slider.
 *
 *   case_studies_banners   array rows (desktop + mobile uploads per slide)
 *
 * Existing desktop/mobile uploads (if any) are copied into the first slide so
 * editors keep the current banner until they add more rows in admin.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "case_studies_banners" (
      "_order"           integer NOT NULL,
      "_parent_id"       integer NOT NULL,
      "id"               varchar PRIMARY KEY,
      "video_id"         integer,
      "video_mobile_id"  integer,
      CONSTRAINT "case_studies_banners_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "case_studies"("id") ON DELETE cascade,
      CONSTRAINT "case_studies_banners_video_id_fk"
        FOREIGN KEY ("video_id") REFERENCES "media"("id") ON DELETE set null,
      CONSTRAINT "case_studies_banners_video_mobile_id_fk"
        FOREIGN KEY ("video_mobile_id") REFERENCES "media"("id") ON DELETE set null
    );
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "case_studies_banners_order_idx"
    ON "case_studies_banners" ("_order");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "case_studies_banners_parent_id_idx"
    ON "case_studies_banners" ("_parent_id");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "case_studies_banners_video_idx"
    ON "case_studies_banners" ("video_id");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "case_studies_banners_video_mobile_idx"
    ON "case_studies_banners" ("video_mobile_id");
  `)

  // One-time seed from legacy single-banner columns when the array is still empty.
  await db.execute(sql`
    INSERT INTO "case_studies_banners" ("_order", "_parent_id", "id", "video_id", "video_mobile_id")
    SELECT
      1,
      cs."id",
      'banner-migrated-' || cs."id"::text,
      cs."banner_video_id",
      cs."banner_video_mobile_id"
    FROM "case_studies" cs
    WHERE (cs."banner_video_id" IS NOT NULL OR cs."banner_video_mobile_id" IS NOT NULL)
      AND NOT EXISTS (
        SELECT 1 FROM "case_studies_banners" b WHERE b."_parent_id" = cs."id"
      );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "case_studies_banners";`)
}
