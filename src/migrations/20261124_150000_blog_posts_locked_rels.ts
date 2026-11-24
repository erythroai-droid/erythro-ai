import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * PIT-169: blog-posts collection needs payload_locked_documents_rels.blog_posts_id
 * or every create/update fails after insert (admin lock query).
 */

const LOCK_ID = 202611241500

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN IF NOT EXISTS "blog_posts_id" integer;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_blog_posts_fk"
      FOREIGN KEY ("blog_posts_id")
      REFERENCES "public"."blog_posts"("id")
      ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_blog_posts_id_idx"
    ON "payload_locked_documents_rels" USING btree ("blog_posts_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_blog_posts_fk";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_blog_posts_id_idx";
  `)
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    DROP COLUMN IF EXISTS "blog_posts_id";
  `)
}
