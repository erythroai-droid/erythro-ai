import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Move Portfolio Projects relatedAuditHref into locales so EN/RU/HE can store different links.
 * Copies existing parent value into every locale row, then drops the parent column.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202611270400)`)

  try {
    await db.execute(sql`
      ALTER TABLE "portfolio_projects_locales"
        ADD COLUMN IF NOT EXISTS "related_audit_href" varchar DEFAULT '/audit';
    `)

    await db.execute(sql`
      UPDATE "portfolio_projects_locales" AS l
      SET "related_audit_href" = COALESCE(
        NULLIF(BTRIM(p."related_audit_href"), ''),
        '/audit'
      )
      FROM "portfolio_projects" AS p
      WHERE l."_parent_id" = p."id"
        AND (l."related_audit_href" IS NULL OR BTRIM(l."related_audit_href") = '');
    `)

    await db.execute(sql`
      UPDATE "portfolio_projects_locales"
      SET "related_audit_href" = '/audit'
      WHERE "related_audit_href" IS NULL OR BTRIM("related_audit_href") = '';
    `)

    await db.execute(sql`
      ALTER TABLE "portfolio_projects"
        DROP COLUMN IF EXISTS "related_audit_href";
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202611270400)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202611270400)`)

  try {
    await db.execute(sql`
      ALTER TABLE "portfolio_projects"
        ADD COLUMN IF NOT EXISTS "related_audit_href" varchar DEFAULT '/audit';
    `)

    await db.execute(sql`
      UPDATE "portfolio_projects" AS p
      SET "related_audit_href" = COALESCE(
        (
          SELECT NULLIF(BTRIM(l."related_audit_href"), '')
          FROM "portfolio_projects_locales" AS l
          WHERE l."_parent_id" = p."id" AND l."_locale" = 'en'
          LIMIT 1
        ),
        (
          SELECT NULLIF(BTRIM(l."related_audit_href"), '')
          FROM "portfolio_projects_locales" AS l
          WHERE l."_parent_id" = p."id" AND l."related_audit_href" IS NOT NULL
          LIMIT 1
        ),
        '/audit'
      );
    `)

    await db.execute(sql`
      ALTER TABLE "portfolio_projects_locales"
        DROP COLUMN IF EXISTS "related_audit_href";
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202611270400)`)
  }
}
