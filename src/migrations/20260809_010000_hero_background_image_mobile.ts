import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "hero"
    ADD COLUMN IF NOT EXISTS "background_image_mobile_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "hero"
      ADD CONSTRAINT "hero_background_image_mobile_id_media_id_fk"
      FOREIGN KEY ("background_image_mobile_id")
      REFERENCES "public"."media"("id")
      ON DELETE set null
      ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "hero_background_image_mobile_idx"
    ON "hero" USING btree ("background_image_mobile_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "hero"
    DROP CONSTRAINT IF EXISTS "hero_background_image_mobile_id_media_id_fk";
  `)

  await db.execute(sql`
    DROP INDEX IF EXISTS "hero_background_image_mobile_idx";
  `)

  await db.execute(sql`
    ALTER TABLE "hero"
    DROP COLUMN IF EXISTS "background_image_mobile_id";
  `)
}
