import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Multi-email Site Settings: address book + display/notify selects.
 * Migrates legacy site_settings.email into emails[0] and all selectors.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202608150100)`)

  try {
    await db.execute(sql`
      ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "display_email_footer" varchar;
    `)
    await db.execute(sql`
      ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "display_email_contacts" varchar;
    `)
    await db.execute(sql`
      ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "display_email_legal" varchar;
    `)
    await db.execute(sql`
      ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "notify_email_contact" varchar;
    `)
    await db.execute(sql`
      ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "notify_email_order" varchar;
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "site_settings_emails" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "label" varchar,
        "address" varchar NOT NULL
      );
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "site_settings_emails_order_idx"
      ON "site_settings_emails" USING btree ("_order");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "site_settings_emails_parent_id_idx"
      ON "site_settings_emails" USING btree ("_parent_id");
    `)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "site_settings_emails"
          ADD CONSTRAINT "site_settings_emails_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "site_settings"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "source" varchar DEFAULT 'contact';
    `)

    // Seed address book + selectors from legacy email when present.
    await db.execute(sql`
      INSERT INTO "site_settings_emails" ("_order", "_parent_id", "id", "label", "address")
      SELECT
        1,
        ss."id",
        'email-' || ss."id"::text,
        'Primary',
        ss."email"
      FROM "site_settings" ss
      WHERE ss."email" IS NOT NULL
        AND btrim(ss."email") <> ''
        AND NOT EXISTS (
          SELECT 1 FROM "site_settings_emails" e WHERE e."_parent_id" = ss."id"
        );
    `)

    await db.execute(sql`
      UPDATE "site_settings"
      SET
        "display_email_footer" = COALESCE(NULLIF(btrim("display_email_footer"), ''), NULLIF(btrim("email"), '')),
        "display_email_contacts" = COALESCE(NULLIF(btrim("display_email_contacts"), ''), NULLIF(btrim("email"), '')),
        "display_email_legal" = COALESCE(NULLIF(btrim("display_email_legal"), ''), NULLIF(btrim("email"), '')),
        "notify_email_contact" = COALESCE(NULLIF(btrim("notify_email_contact"), ''), NULLIF(btrim("email"), '')),
        "notify_email_order" = COALESCE(NULLIF(btrim("notify_email_order"), ''), NULLIF(btrim("email"), ''))
      WHERE "email" IS NOT NULL AND btrim("email") <> '';
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202608150100)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "contact_submissions" DROP COLUMN IF EXISTS "source";`)
  await db.execute(sql`DROP TABLE IF EXISTS "site_settings_emails" CASCADE;`)
  await db.execute(sql`ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "display_email_footer";`)
  await db.execute(sql`ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "display_email_contacts";`)
  await db.execute(sql`ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "display_email_legal";`)
  await db.execute(sql`ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "notify_email_contact";`)
  await db.execute(sql`ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "notify_email_order";`)
}
