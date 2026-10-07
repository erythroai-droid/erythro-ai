import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Payload 3.90 defaults auth.forgotPassword.minRequestInterval to 15000ms.
 * That adds users.reset_password_requested_at. CI keeps push off, so the
 * column has to arrive through this migration (and the matching db:fix script).
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202610070215)`)

  try {
    await db.execute(sql`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202610070215)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202610070215)`)

  try {
    await db.execute(sql`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_requested_at";
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202610070215)`)
  }
}
