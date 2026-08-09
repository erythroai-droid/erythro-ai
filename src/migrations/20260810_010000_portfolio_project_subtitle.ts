import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Optional localized subtitle under the project title on /portfolio/[slug] body.
 * Column lives on portfolio_projects_locales next to summary.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202608100100)`)

  try {
    await db.execute(sql`
      ALTER TABLE "portfolio_projects_locales"
        ADD COLUMN IF NOT EXISTS "subtitle" varchar;
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202608100100)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "portfolio_projects_locales"
      DROP COLUMN IF EXISTS "subtitle";
  `)
}
