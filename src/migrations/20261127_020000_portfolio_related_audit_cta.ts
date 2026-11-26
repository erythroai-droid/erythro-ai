import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Portfolio Projects → relatedAuditHref + localized relatedAuditLabel
 * (editable second CTA under “Related service”, default /audit).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202611270200)`)

  try {
    await db.execute(sql`
      ALTER TABLE "portfolio_projects"
        ADD COLUMN IF NOT EXISTS "related_audit_href" varchar DEFAULT '/audit';
    `)

    await db.execute(sql`
      ALTER TABLE "portfolio_projects_locales"
        ADD COLUMN IF NOT EXISTS "related_audit_label" varchar;
    `)

    await db.execute(sql`
      UPDATE "portfolio_projects"
      SET "related_audit_href" = '/audit'
      WHERE "related_audit_href" IS NULL OR btrim("related_audit_href") = '';
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202611270200)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "portfolio_projects_locales"
      DROP COLUMN IF EXISTS "related_audit_label";
  `)
  await db.execute(sql`
    ALTER TABLE "portfolio_projects"
      DROP COLUMN IF EXISTS "related_audit_href";
  `)
}
