import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Addon price becomes display text like Feature Value ("350₪/мес"), not a bare number.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons"
    ALTER COLUMN "price" TYPE varchar
    USING (
      CASE
        WHEN "price" IS NULL THEN NULL
        ELSE TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM ("price"::numeric)::text)) || '₪/мес'
      END
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_addons"
    ALTER COLUMN "price" TYPE numeric
    USING (
      NULLIF(regexp_replace(COALESCE("price"::text, ''), '[^0-9]', '', 'g'), '')::numeric
    );
  `)
}
