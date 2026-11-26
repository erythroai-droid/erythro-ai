import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Services 1/2/4 had empty/null slug in prod, so the relatedService seed (join on slug)
 * only matched enterprise-engineering → psb-consulting. Backfill slugs from
 * SERVICE_ID_TO_SLUG, then re-seed portfolio related_service_id by service id.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202611270100)`)

  try {
    await db.execute(sql`
      UPDATE "services" SET "slug" = 'design-branding'
      WHERE "id" = 1 AND ("slug" IS NULL OR btrim("slug") = '');
    `)
    await db.execute(sql`
      UPDATE "services" SET "slug" = 'development'
      WHERE "id" = 2 AND ("slug" IS NULL OR btrim("slug") = '');
    `)
    await db.execute(sql`
      UPDATE "services" SET "slug" = 'enterprise-engineering'
      WHERE "id" = 3 AND ("slug" IS NULL OR btrim("slug") = '');
    `)
    await db.execute(sql`
      UPDATE "services" SET "slug" = 'ai-automation'
      WHERE "id" = 4 AND ("slug" IS NULL OR btrim("slug") = '');
    `)

    // Re-seed by stable service id (not slug), only when still empty.
    await db.execute(sql`
      UPDATE "portfolio_projects" AS p
      SET "related_service_id" = m.service_id
      FROM (VALUES
        ('ai-consultant', 4),
        ('ai-audit-agent', 4),
        ('ember', 2),
        ('ora-60a', 2),
        ('rosso-garage', 1),
        ('la-scala', 1),
        ('mustang-6663rt', 2),
        ('origin-coffee', 1),
        ('psb-consulting', 3)
      ) AS m(project_slug, service_id)
      WHERE p."slug" = m.project_slug
        AND p."related_service_id" IS NULL
        AND EXISTS (SELECT 1 FROM "services" s WHERE s."id" = m.service_id);
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202611270100)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Do not clear service slugs — they are required for routing. Only clear seeded relations
  // that this migration may have filled (leave manually set values alone is not possible
  // without a snapshot; no-op down for data safety).
  await db.execute(sql`SELECT 1`)
}
