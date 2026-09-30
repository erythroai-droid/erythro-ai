import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Anonymous chat questions, before OTP. No Data API grants: Payload uses the
 * postgres role. Do not GRANT this table to anon.
 */

const LOCK_ID = 202610010210

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "consult_question_log" (
      "id" serial PRIMARY KEY NOT NULL,
      "question" varchar NOT NULL,
      "locale" varchar,
      "visitor" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "consult_question_log_created_at_idx"
    ON "consult_question_log" USING btree ("created_at");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "consult_question_log_visitor_idx"
    ON "consult_question_log" USING btree ("visitor");
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN IF NOT EXISTS "consult_question_log_id" integer;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_consult_question_log_fk"
      FOREIGN KEY ("consult_question_log_id")
      REFERENCES "public"."consult_question_log"("id")
      ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_consult_question_log_id_idx"
    ON "payload_locked_documents_rels" USING btree ("consult_question_log_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    DROP COLUMN IF EXISTS "consult_question_log_id";
  `)
  await db.execute(sql`DROP TABLE IF EXISTS "consult_question_log";`)
}
