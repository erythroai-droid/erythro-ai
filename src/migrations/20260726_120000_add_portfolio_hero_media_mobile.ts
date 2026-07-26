import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "portfolio_projects"
    ADD COLUMN IF NOT EXISTS "hero_media_mobile_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "portfolio_projects"
      ADD CONSTRAINT "portfolio_projects_hero_media_mobile_id_media_id_fk"
      FOREIGN KEY ("hero_media_mobile_id")
      REFERENCES "public"."media"("id")
      ON DELETE set null
      ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "portfolio_projects_hero_media_mobile_idx"
    ON "portfolio_projects" USING btree ("hero_media_mobile_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "portfolio_projects"
    DROP CONSTRAINT IF EXISTS "portfolio_projects_hero_media_mobile_id_media_id_fk";
  `)

  await db.execute(sql`
    DROP INDEX IF EXISTS "portfolio_projects_hero_media_mobile_idx";
  `)

  await db.execute(sql`
    ALTER TABLE "portfolio_projects"
    DROP COLUMN IF EXISTS "hero_media_mobile_id";
  `)
}
