import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Finish portfolio-categories wiring for Payload internals.
 * The previous migration created the categories tables and remapped projects,
 * but did not add the polymorphic FK column Payload expects on
 * `payload_locked_documents_rels`. Missing that column breaks admin queries.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN IF NOT EXISTS "portfolio_categories_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_portfolio_categories_fk"
      FOREIGN KEY ("portfolio_categories_id")
      REFERENCES "public"."portfolio_categories"("id")
      ON DELETE cascade
      ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_portfolio_categories_id_idx"
    ON "payload_locked_documents_rels" USING btree ("portfolio_categories_id");
  `)

  // Ensure projects always have a category (required relationship in admin).
  await db.execute(sql`
    UPDATE "portfolio_projects" p
    SET "category_id" = c."id"
    FROM "portfolio_categories" c
    WHERE p."category_id" IS NULL
      AND c."value" = 'other';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_portfolio_categories_fk";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_portfolio_categories_id_idx";
  `)
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    DROP COLUMN IF EXISTS "portfolio_categories_id";
  `)
}
