import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Nested array `pricing.plans[].features` was created without FK to the parent
 * plan row. Payload deletes parent array rows on every global update and relies
 * on ON DELETE CASCADE to drop nested rows. Without the FK, leftover feature
 * ids collide on the next save → "The following field is invalid: id".
 *
 * PIT-065
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202609070100)`)

  try {
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "audit_page_pricing_plans_features"
          ADD CONSTRAINT "audit_page_pricing_plans_features_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "audit_page_pricing_plans"("id")
          ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202609070100)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202609070100)`)

  try {
    await db.execute(sql`
      ALTER TABLE "audit_page_pricing_plans_features"
        DROP CONSTRAINT IF EXISTS "audit_page_pricing_plans_features_parent_id_fk";
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202609070100)`)
  }
}
