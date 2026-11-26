import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Portfolio Projects → optional performanceScores group (Lighthouse-style gauges).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202611270300)`)

  try {
    await db.execute(sql`
      ALTER TABLE "portfolio_projects"
        ADD COLUMN IF NOT EXISTS "performance_scores_enabled" boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS "performance_scores_performance" numeric,
        ADD COLUMN IF NOT EXISTS "performance_scores_accessibility" numeric,
        ADD COLUMN IF NOT EXISTS "performance_scores_best_practices" numeric,
        ADD COLUMN IF NOT EXISTS "performance_scores_seo" numeric,
        ADD COLUMN IF NOT EXISTS "performance_scores_agent_browse" varchar;
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202611270300)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "portfolio_projects"
      DROP COLUMN IF EXISTS "performance_scores_enabled",
      DROP COLUMN IF EXISTS "performance_scores_performance",
      DROP COLUMN IF EXISTS "performance_scores_accessibility",
      DROP COLUMN IF EXISTS "performance_scores_best_practices",
      DROP COLUMN IF EXISTS "performance_scores_seo",
      DROP COLUMN IF EXISTS "performance_scores_agent_browse";
  `)
}
