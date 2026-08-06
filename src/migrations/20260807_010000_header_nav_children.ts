import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Nested submenu rows under Header → Nav Items (any top-level item can have children).
 * Tables: header_nav_items_children + locales for localized labels.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202608070100)`)

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "header_nav_items_children" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "href" varchar NOT NULL
      );
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "header_nav_items_children_order_idx"
      ON "header_nav_items_children" USING btree ("_order");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "header_nav_items_children_parent_id_idx"
      ON "header_nav_items_children" USING btree ("_parent_id");
    `)

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "header_nav_items_children"
          ADD CONSTRAINT "header_nav_items_children_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "header_nav_items"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`
      CREATE SEQUENCE IF NOT EXISTS "header_nav_items_children_locales_id_seq";
    `)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "header_nav_items_children_locales" (
        "label" varchar NOT NULL,
        "id" integer PRIMARY KEY DEFAULT nextval('header_nav_items_children_locales_id_seq') NOT NULL,
        "_locale" "_locales" NOT NULL,
        "_parent_id" varchar NOT NULL
      );
    `)
    await db.execute(sql`
      ALTER SEQUENCE "header_nav_items_children_locales_id_seq"
      OWNED BY "header_nav_items_children_locales"."id";
    `)

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "header_nav_items_children_locales_locale_parent_id_unique"
      ON "header_nav_items_children_locales" USING btree ("_locale", "_parent_id");
    `)

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "header_nav_items_children_locales"
          ADD CONSTRAINT "header_nav_items_children_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "header_nav_items_children"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202608070100)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "header_nav_items_children_locales" CASCADE;`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS "header_nav_items_children_locales_id_seq";`)
  await db.execute(sql`DROP TABLE IF EXISTS "header_nav_items_children" CASCADE;`)
}
