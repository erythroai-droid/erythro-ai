import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * AI Audit plans: planId + checkoutMode on solution_plans;
 * cardPriceNote + ctaLabel on locales (single source for /audit cards).
 *
 * Safety (PIT-086 / PIT-004):
 * - Additive only (ADD COLUMN IF NOT EXISTS) — no DROP/TRUNCATE/REWRITE of other tables
 * - pg_advisory_xact_lock — transaction-scoped; safe under parallel next build workers
 * - varchar (not enum) — same pattern as solution_plans.kind (20260901)
 * - UPDATEs touch only known audit-* slugs and only empty plan_id (idempotent, no overwrite)
 * - Does not create audit-manual row (data script db:migrate-audit-plans-unify does that)
 */

const LOCK_ID = 202610120100

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    ALTER TABLE "solution_plans"
    ADD COLUMN IF NOT EXISTS "plan_id" varchar;
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans"
    ADD COLUMN IF NOT EXISTS "checkout_mode" varchar DEFAULT 'order';
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_locales"
    ADD COLUMN IF NOT EXISTS "card_price_note" varchar;
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_locales"
    ADD COLUMN IF NOT EXISTS "cta_label" varchar;
  `)

  // Back-fill only empty plan_id on known audit slugs (never overwrites CMS values).
  await db.execute(sql`
    UPDATE "solution_plans"
    SET "plan_id" = 'free', "checkout_mode" = 'order'
    WHERE "slug" = 'audit-free'
      AND ("plan_id" IS NULL OR "plan_id" = '');
  `)
  await db.execute(sql`
    UPDATE "solution_plans"
    SET "plan_id" = 'diagnostic', "checkout_mode" = 'order'
    WHERE "slug" = 'audit-diagnostic'
      AND ("plan_id" IS NULL OR "plan_id" = '');
  `)
  await db.execute(sql`
    UPDATE "solution_plans"
    SET "plan_id" = 'pro', "checkout_mode" = 'order'
    WHERE "slug" = 'audit-pro'
      AND ("plan_id" IS NULL OR "plan_id" = '');
  `)
  await db.execute(sql`
    UPDATE "solution_plans"
    SET "plan_id" = 'manual', "checkout_mode" = 'contact'
    WHERE "slug" = 'audit-manual'
      AND ("plan_id" IS NULL OR "plan_id" = '');
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  await db.execute(sql`
    ALTER TABLE "solution_plans_locales" DROP COLUMN IF EXISTS "cta_label";
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans_locales" DROP COLUMN IF EXISTS "card_price_note";
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans" DROP COLUMN IF EXISTS "checkout_mode";
  `)
  await db.execute(sql`
    ALTER TABLE "solution_plans" DROP COLUMN IF EXISTS "plan_id";
  `)
}
