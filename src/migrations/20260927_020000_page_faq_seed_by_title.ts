import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import { seedMissingServiceFaqs } from './20260927_010000_page_faq_cms'

/**
 * The first FAQ migration matched services by slug only.
 * Live services keep an empty slug and are addressed by title, so this pass fills the rest.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202609270200)`)
  try {
    await seedMissingServiceFaqs(db)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202609270200)`)
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Rows are removed with the tables in 20260927_010000_page_faq_cms.
}
