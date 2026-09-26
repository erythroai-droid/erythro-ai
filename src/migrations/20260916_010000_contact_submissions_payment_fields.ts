import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * PayPlus payment tracking fields on contact_submissions:
 * payment_status, payment_transaction_id, payment_provider, payment_amount.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202609160100)`)

  try {
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "payment_status" varchar DEFAULT 'none';
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "payment_transaction_id" varchar;
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "payment_provider" varchar;
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "payment_amount" numeric;
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "contact_submissions_payment_status_idx"
      ON "contact_submissions" USING btree ("payment_status");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "contact_submissions_payment_tx_idx"
      ON "contact_submissions" USING btree ("payment_transaction_id");
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202609160100)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202609160100)`)

  try {
    await db.execute(sql`DROP INDEX IF EXISTS "contact_submissions_payment_tx_idx"`)
    await db.execute(sql`DROP INDEX IF EXISTS "contact_submissions_payment_status_idx"`)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "payment_amount";
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "payment_provider";
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "payment_transaction_id";
    `)
    await db.execute(sql`
      ALTER TABLE "contact_submissions"
      DROP COLUMN IF EXISTS "payment_status";
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202609160100)`)
  }
}
