import { randomUUID } from 'crypto'
import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Blog posts collection (SEO/GEO) + footer Company Link → /blog.
 * Advisory lock: parallel Payload inits during build can race CREATE TABLE.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202611241200)`)

  try {
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "public"."enum_blog_posts_status" AS ENUM ('draft', 'published');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS "blog_posts_id_seq";`)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" integer PRIMARY KEY DEFAULT nextval('blog_posts_id_seq') NOT NULL,
        "slug" varchar NOT NULL,
        "status" "enum_blog_posts_status" DEFAULT 'draft' NOT NULL,
        "published_at" timestamp(3) with time zone,
        "cover_id" integer,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)
    await db.execute(sql`
      ALTER SEQUENCE "blog_posts_id_seq" OWNED BY "blog_posts"."id";
    `)
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_slug_idx"
      ON "blog_posts" USING btree ("slug");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "blog_posts_cover_idx"
      ON "blog_posts" USING btree ("cover_id");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "blog_posts_updated_at_idx"
      ON "blog_posts" USING btree ("updated_at");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "blog_posts_created_at_idx"
      ON "blog_posts" USING btree ("created_at");
    `)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "blog_posts"
          ADD CONSTRAINT "blog_posts_cover_id_media_id_fk"
          FOREIGN KEY ("cover_id") REFERENCES "media"("id")
          ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS "blog_posts_locales_id_seq";`)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_posts_locales" (
        "title" varchar NOT NULL,
        "excerpt" varchar NOT NULL,
        "body" jsonb,
        "seo_title" varchar,
        "seo_description" varchar,
        "faq_title" varchar,
        "id" integer PRIMARY KEY DEFAULT nextval('blog_posts_locales_id_seq') NOT NULL,
        "_locale" "_locales" NOT NULL,
        "_parent_id" integer NOT NULL
      );
    `)
    await db.execute(sql`
      ALTER SEQUENCE "blog_posts_locales_id_seq" OWNED BY "blog_posts_locales"."id";
    `)
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_locales_locale_parent_id_unique"
      ON "blog_posts_locales" USING btree ("_locale", "_parent_id");
    `)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "blog_posts_locales"
          ADD CONSTRAINT "blog_posts_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "blog_posts"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_posts_tags" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "tag" varchar NOT NULL
      );
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "blog_posts_tags_order_idx"
      ON "blog_posts_tags" USING btree ("_order");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "blog_posts_tags_parent_id_idx"
      ON "blog_posts_tags" USING btree ("_parent_id");
    `)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "blog_posts_tags"
          ADD CONSTRAINT "blog_posts_tags_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "blog_posts"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_posts_related_links" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "href" varchar NOT NULL
      );
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "blog_posts_related_links_order_idx"
      ON "blog_posts_related_links" USING btree ("_order");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "blog_posts_related_links_parent_id_idx"
      ON "blog_posts_related_links" USING btree ("_parent_id");
    `)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "blog_posts_related_links"
          ADD CONSTRAINT "blog_posts_related_links_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "blog_posts"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS "blog_posts_related_links_locales_id_seq";`)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_posts_related_links_locales" (
        "label" varchar NOT NULL,
        "id" integer PRIMARY KEY DEFAULT nextval('blog_posts_related_links_locales_id_seq') NOT NULL,
        "_locale" "_locales" NOT NULL,
        "_parent_id" varchar NOT NULL
      );
    `)
    await db.execute(sql`
      ALTER SEQUENCE "blog_posts_related_links_locales_id_seq"
      OWNED BY "blog_posts_related_links_locales"."id";
    `)
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_related_links_locales_locale_parent_id_unique"
      ON "blog_posts_related_links_locales" USING btree ("_locale", "_parent_id");
    `)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "blog_posts_related_links_locales"
          ADD CONSTRAINT "blog_posts_related_links_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "blog_posts_related_links"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_posts_faq_items" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL
      );
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "blog_posts_faq_items_order_idx"
      ON "blog_posts_faq_items" USING btree ("_order");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "blog_posts_faq_items_parent_id_idx"
      ON "blog_posts_faq_items" USING btree ("_parent_id");
    `)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "blog_posts_faq_items"
          ADD CONSTRAINT "blog_posts_faq_items_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "blog_posts"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS "blog_posts_faq_items_locales_id_seq";`)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_posts_faq_items_locales" (
        "question" varchar NOT NULL,
        "answer" varchar,
        "details" varchar,
        "id" integer PRIMARY KEY DEFAULT nextval('blog_posts_faq_items_locales_id_seq') NOT NULL,
        "_locale" "_locales" NOT NULL,
        "_parent_id" varchar NOT NULL
      );
    `)
    await db.execute(sql`
      ALTER SEQUENCE "blog_posts_faq_items_locales_id_seq"
      OWNED BY "blog_posts_faq_items_locales"."id";
    `)
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_faq_items_locales_locale_parent_id_unique"
      ON "blog_posts_faq_items_locales" USING btree ("_locale", "_parent_id");
    `)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "blog_posts_faq_items_locales"
          ADD CONSTRAINT "blog_posts_faq_items_locales_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "blog_posts_faq_items"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    // Footer: ensure /blog company link exists (idempotent).
    const footerRows = await db.execute(sql`SELECT "id" FROM "footer" ORDER BY "id" ASC LIMIT 1`)
    const footerId =
      Array.isArray(footerRows) && footerRows[0] && typeof (footerRows[0] as { id?: unknown }).id === 'number'
        ? (footerRows[0] as { id: number }).id
        : footerRows &&
            typeof footerRows === 'object' &&
            'rows' in footerRows &&
            Array.isArray((footerRows as { rows: unknown[] }).rows) &&
            (footerRows as { rows: Array<{ id?: number }> }).rows[0]?.id

    if (typeof footerId === 'number') {
      const existing = await db.execute(sql`
        SELECT "id" FROM "footer_company_links"
        WHERE "_parent_id" = ${footerId} AND "href" = '/blog'
        LIMIT 1
      `)
      const hasBlog =
        (Array.isArray(existing) && existing.length > 0) ||
        (existing &&
          typeof existing === 'object' &&
          'rows' in existing &&
          Array.isArray((existing as { rows: unknown[] }).rows) &&
          (existing as { rows: unknown[] }).rows.length > 0)

      if (!hasBlog) {
        const linkId = randomUUID()
        const orderRows = await db.execute(sql`
          SELECT COALESCE(MAX("_order"), 0) AS "max_order"
          FROM "footer_company_links"
          WHERE "_parent_id" = ${footerId}
        `)
        let nextOrder = 1
        if (Array.isArray(orderRows) && orderRows[0]) {
          nextOrder = Number((orderRows[0] as { max_order?: number }).max_order || 0) + 1
        } else if (
          orderRows &&
          typeof orderRows === 'object' &&
          'rows' in orderRows &&
          Array.isArray((orderRows as { rows: unknown[] }).rows) &&
          (orderRows as { rows: Array<{ max_order?: number }> }).rows[0]
        ) {
          nextOrder =
            Number((orderRows as { rows: Array<{ max_order?: number }> }).rows[0].max_order || 0) + 1
        }

        await db.execute(sql`
          INSERT INTO "footer_company_links" ("_order", "_parent_id", "id", "href")
          VALUES (${nextOrder}, ${footerId}, ${linkId}, '/blog')
        `)
        await db.execute(sql`
          INSERT INTO "footer_company_links_locales" ("label", "_locale", "_parent_id")
          VALUES
            ('Blog', 'en', ${linkId}),
            ('Блог', 'ru', ${linkId}),
            ('בלוג', 'he', ${linkId})
        `)
      }
    }
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202611241200)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "blog_posts_faq_items_locales" CASCADE;`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS "blog_posts_faq_items_locales_id_seq";`)
  await db.execute(sql`DROP TABLE IF EXISTS "blog_posts_faq_items" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "blog_posts_related_links_locales" CASCADE;`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS "blog_posts_related_links_locales_id_seq";`)
  await db.execute(sql`DROP TABLE IF EXISTS "blog_posts_related_links" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "blog_posts_tags" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "blog_posts_locales" CASCADE;`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS "blog_posts_locales_id_seq";`)
  await db.execute(sql`DROP TABLE IF EXISTS "blog_posts" CASCADE;`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS "blog_posts_id_seq";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_blog_posts_status";`)

  await db.execute(sql`
    DELETE FROM "footer_company_links_locales"
    WHERE "_parent_id" IN (
      SELECT "id" FROM "footer_company_links" WHERE "href" = '/blog'
    );
  `)
  await db.execute(sql`
    DELETE FROM "footer_company_links" WHERE "href" = '/blog';
  `)
}
