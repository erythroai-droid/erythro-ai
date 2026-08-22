import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Rename Site Settings social field from TikTok to Telegram. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
    RENAME COLUMN "tiktok" TO "telegram";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
    RENAME COLUMN "telegram" TO "tiktok";
  `)
}
