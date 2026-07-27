import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
    ADD COLUMN IF NOT EXISTS "contacts_hero_media_id" integer;
  `)
  await db.execute(sql`
    ALTER TABLE "site_settings"
    ADD COLUMN IF NOT EXISTS "portfolio_hero_media_id" integer;
  `)
  await db.execute(sql`
    ALTER TABLE "site_settings"
    ADD COLUMN IF NOT EXISTS "legal_hero_media_id" integer;
  `)
  await db.execute(sql`
    ALTER TABLE "site_settings"
    ADD COLUMN IF NOT EXISTS "order_hero_media_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "site_settings"
      ADD CONSTRAINT "site_settings_contacts_hero_media_id_media_id_fk"
      FOREIGN KEY ("contacts_hero_media_id")
      REFERENCES "public"."media"("id")
      ON DELETE set null
      ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "site_settings"
      ADD CONSTRAINT "site_settings_portfolio_hero_media_id_media_id_fk"
      FOREIGN KEY ("portfolio_hero_media_id")
      REFERENCES "public"."media"("id")
      ON DELETE set null
      ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "site_settings"
      ADD CONSTRAINT "site_settings_legal_hero_media_id_media_id_fk"
      FOREIGN KEY ("legal_hero_media_id")
      REFERENCES "public"."media"("id")
      ON DELETE set null
      ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "site_settings"
      ADD CONSTRAINT "site_settings_order_hero_media_id_media_id_fk"
      FOREIGN KEY ("order_hero_media_id")
      REFERENCES "public"."media"("id")
      ON DELETE set null
      ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "site_settings_contacts_hero_media_idx"
    ON "site_settings" USING btree ("contacts_hero_media_id");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "site_settings_portfolio_hero_media_idx"
    ON "site_settings" USING btree ("portfolio_hero_media_id");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "site_settings_legal_hero_media_idx"
    ON "site_settings" USING btree ("legal_hero_media_id");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "site_settings_order_hero_media_idx"
    ON "site_settings" USING btree ("order_hero_media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
    DROP CONSTRAINT IF EXISTS "site_settings_contacts_hero_media_id_media_id_fk";
  `)
  await db.execute(sql`
    ALTER TABLE "site_settings"
    DROP CONSTRAINT IF EXISTS "site_settings_portfolio_hero_media_id_media_id_fk";
  `)
  await db.execute(sql`
    ALTER TABLE "site_settings"
    DROP CONSTRAINT IF EXISTS "site_settings_legal_hero_media_id_media_id_fk";
  `)
  await db.execute(sql`
    ALTER TABLE "site_settings"
    DROP CONSTRAINT IF EXISTS "site_settings_order_hero_media_id_media_id_fk";
  `)

  await db.execute(sql`
    DROP INDEX IF EXISTS "site_settings_contacts_hero_media_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "site_settings_portfolio_hero_media_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "site_settings_legal_hero_media_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "site_settings_order_hero_media_idx";
  `)

  await db.execute(sql`
    ALTER TABLE "site_settings"
    DROP COLUMN IF EXISTS "contacts_hero_media_id";
  `)
  await db.execute(sql`
    ALTER TABLE "site_settings"
    DROP COLUMN IF EXISTS "portfolio_hero_media_id";
  `)
  await db.execute(sql`
    ALTER TABLE "site_settings"
    DROP COLUMN IF EXISTS "legal_hero_media_id";
  `)
  await db.execute(sql`
    ALTER TABLE "site_settings"
    DROP COLUMN IF EXISTS "order_hero_media_id";
  `)
}
