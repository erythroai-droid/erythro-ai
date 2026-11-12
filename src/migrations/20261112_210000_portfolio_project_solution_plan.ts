import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Portfolio Projects → optional solutionPlan relationship (pricing package badge
 * next to the body title). Seeds ORA 60A → ai-smart-card when both exist.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202611122100)`)

  try {
    await db.execute(sql`
      ALTER TABLE "portfolio_projects"
        ADD COLUMN IF NOT EXISTS "solution_plan_id" integer;
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "portfolio_projects_solution_plan_idx"
      ON "portfolio_projects" USING btree ("solution_plan_id");
    `)

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "portfolio_projects"
          ADD CONSTRAINT "portfolio_projects_solution_plan_id_solution_plans_id_fk"
          FOREIGN KEY ("solution_plan_id") REFERENCES "solution_plans"("id")
          ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`
      UPDATE "portfolio_projects" AS p
      SET "solution_plan_id" = (
        SELECT s."id"
        FROM "solution_plans" AS s
        WHERE s."slug" IN ('ai-smart-card', 'ai-business-card')
        ORDER BY CASE WHEN s."slug" = 'ai-smart-card' THEN 0 ELSE 1 END
        LIMIT 1
      )
      WHERE p."slug" = 'ora-60a'
        AND p."solution_plan_id" IS NULL
        AND EXISTS (
          SELECT 1
          FROM "solution_plans" AS s
          WHERE s."slug" IN ('ai-smart-card', 'ai-business-card')
        );
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202611122100)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "portfolio_projects"
      DROP CONSTRAINT IF EXISTS "portfolio_projects_solution_plan_id_solution_plans_id_fk";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "portfolio_projects_solution_plan_idx";
  `)
  await db.execute(sql`
    ALTER TABLE "portfolio_projects"
      DROP COLUMN IF EXISTS "solution_plan_id";
  `)
}
