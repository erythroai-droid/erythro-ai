import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Make portfolio categories CMS-editable:
 * - new `portfolio-categories` collection
 * - `portfolio-projects.category` becomes a relationship
 * - seed the previous hardcoded options and remaps existing projects
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "portfolio_categories" (
      "id" serial PRIMARY KEY NOT NULL,
      "value" varchar NOT NULL,
      "order" numeric DEFAULT 0,
      "show_in_filters" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "portfolio_categories_value_idx"
    ON "portfolio_categories" USING btree ("value");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "portfolio_categories_locales" (
      "label" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "portfolio_categories_locales"
      ADD CONSTRAINT "portfolio_categories_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id")
      REFERENCES "public"."portfolio_categories"("id")
      ON DELETE cascade
      ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "portfolio_categories_locales_locale_parent_id_unique"
    ON "portfolio_categories_locales" USING btree ("_locale","_parent_id");
  `)

  // Seed previous hardcoded list (match by value so remapping stays stable).
  await db.execute(sql`
    INSERT INTO "portfolio_categories" ("value", "order", "show_in_filters", "updated_at", "created_at")
    VALUES
      ('ai', 10, true, now(), now()),
      ('crm', 20, true, now(), now()),
      ('websites', 30, true, now(), now()),
      ('landing', 40, true, now(), now()),
      ('apps', 50, true, now(), now()),
      ('other', 60, true, now(), now())
    ON CONFLICT ("value") DO UPDATE SET
      "order" = EXCLUDED."order",
      "show_in_filters" = EXCLUDED."show_in_filters";
  `)

  await db.execute(sql`
    INSERT INTO "portfolio_categories_locales" ("label", "_locale", "_parent_id")
    SELECT v.label, v.locale::"_locales", c.id
    FROM (
      VALUES
        ('ai', 'en', 'AI Agents'),
        ('ai', 'ru', 'AI-агенты'),
        ('ai', 'he', 'סוכני AI'),
        ('crm', 'en', 'CRM Systems'),
        ('crm', 'ru', 'CRM-системы'),
        ('crm', 'he', 'מערכות CRM'),
        ('websites', 'en', 'Websites'),
        ('websites', 'ru', 'Сайты'),
        ('websites', 'he', 'אתרים'),
        ('landing', 'en', 'Landing Pages'),
        ('landing', 'ru', 'Лендинги'),
        ('landing', 'he', 'דפי נחיתה'),
        ('apps', 'en', 'Apps'),
        ('apps', 'ru', 'Приложения'),
        ('apps', 'he', 'אפליקציות'),
        ('other', 'en', 'Other'),
        ('other', 'ru', 'Другое'),
        ('other', 'he', 'אחר')
    ) AS v(value, locale, label)
    JOIN "portfolio_categories" c ON c."value" = v.value
    ON CONFLICT ("_locale", "_parent_id") DO UPDATE SET "label" = EXCLUDED."label";
  `)

  await db.execute(sql`
    ALTER TABLE "portfolio_projects"
    ADD COLUMN IF NOT EXISTS "category_id" integer;
  `)

  // Remap old select values → relationship ids when the legacy column still exists.
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'portfolio_projects'
          AND column_name = 'category'
      ) THEN
        UPDATE "portfolio_projects" p
        SET "category_id" = c."id"
        FROM "portfolio_categories" c
        WHERE p."category_id" IS NULL
          AND p."category"::text = c."value";

        UPDATE "portfolio_projects"
        SET "category_id" = (
          SELECT c."id" FROM "portfolio_categories" c WHERE c."value" = 'other' LIMIT 1
        )
        WHERE "category_id" IS NULL;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "portfolio_projects"
      ADD CONSTRAINT "portfolio_projects_category_id_portfolio_categories_id_fk"
      FOREIGN KEY ("category_id")
      REFERENCES "public"."portfolio_categories"("id")
      ON DELETE restrict
      ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "portfolio_projects_category_idx"
    ON "portfolio_projects" USING btree ("category_id");
  `)

  // Drop legacy select column + enum once remapped.
  await db.execute(sql`
    ALTER TABLE "portfolio_projects" DROP COLUMN IF EXISTS "category";
  `)
  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_portfolio_projects_category";
  `)

  // categoryLabel is now optional.
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'portfolio_projects_locales'
          AND column_name = 'category_label'
          AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE "portfolio_projects_locales"
        ALTER COLUMN "category_label" DROP NOT NULL;
      END IF;
    END $$;
  `)

  // Allow locking docs against the new collection.
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TYPE "public"."enum_payload_locked_documents_rels_relation_to"
      ADD VALUE IF NOT EXISTS 'portfolio-categories';
    EXCEPTION
      WHEN undefined_object THEN null;
      WHEN duplicate_object THEN null;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_portfolio_projects_category" AS ENUM (
        'ai', 'crm', 'websites', 'landing', 'apps', 'other'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "portfolio_projects"
    ADD COLUMN IF NOT EXISTS "category" "public"."enum_portfolio_projects_category";
  `)

  await db.execute(sql`
    UPDATE "portfolio_projects" p
    SET "category" = c."value"::"public"."enum_portfolio_projects_category"
    FROM "portfolio_categories" c
    WHERE p."category_id" = c."id"
      AND p."category" IS NULL;
  `)

  await db.execute(sql`
    UPDATE "portfolio_projects"
    SET "category" = 'other'
    WHERE "category" IS NULL;
  `)

  await db.execute(sql`
    ALTER TABLE "portfolio_projects"
    DROP CONSTRAINT IF EXISTS "portfolio_projects_category_id_portfolio_categories_id_fk";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "portfolio_projects_category_idx";
  `)
  await db.execute(sql`
    ALTER TABLE "portfolio_projects"
    DROP COLUMN IF EXISTS "category_id";
  `)

  await db.execute(sql`
    DROP TABLE IF EXISTS "portfolio_categories_locales" CASCADE;
  `)
  await db.execute(sql`
    DROP TABLE IF EXISTS "portfolio_categories" CASCADE;
  `)
}
