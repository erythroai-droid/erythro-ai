import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Portfolio Projects → optional relatedService relationship (bottom “Related service”
 * CTA on /portfolio/[slug]). Seeds from the former static slug map in internalLinks.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202611261100)`)

  try {
    await db.execute(sql`
      ALTER TABLE "portfolio_projects"
        ADD COLUMN IF NOT EXISTS "related_service_id" integer;
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "portfolio_projects_related_service_idx"
      ON "portfolio_projects" USING btree ("related_service_id");
    `)

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "portfolio_projects"
          ADD CONSTRAINT "portfolio_projects_related_service_id_services_id_fk"
          FOREIGN KEY ("related_service_id") REFERENCES "services"("id")
          ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    // Former PORTFOLIO_RELATED_SERVICE_SLUG map → CMS relation (only when still empty).
    await db.execute(sql`
      UPDATE "portfolio_projects" AS p
      SET "related_service_id" = s."id"
      FROM (VALUES
        ('ai-consultant', 'ai-automation'),
        ('ai-audit-agent', 'ai-automation'),
        ('ember', 'development'),
        ('ora-60a', 'development'),
        ('rosso-garage', 'design-branding'),
        ('la-scala', 'design-branding'),
        ('mustang-6663rt', 'development'),
        ('origin-coffee', 'design-branding'),
        ('psb-consulting', 'enterprise-engineering')
      ) AS m(project_slug, service_slug)
      INNER JOIN "services" AS s ON s."slug" = m.service_slug
      WHERE p."slug" = m.project_slug
        AND p."related_service_id" IS NULL;
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202611261100)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "portfolio_projects"
      DROP CONSTRAINT IF EXISTS "portfolio_projects_related_service_id_services_id_fk";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "portfolio_projects_related_service_idx";
  `)
  await db.execute(sql`
    ALTER TABLE "portfolio_projects"
      DROP COLUMN IF EXISTS "related_service_id";
  `)
}
