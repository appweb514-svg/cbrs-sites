import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "documents" ADD COLUMN "prefix" varchar DEFAULT '';
  ALTER TABLE "documents" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "_documents_v" ADD COLUMN "version_prefix" varchar DEFAULT '';
  ALTER TABLE "_documents_v" ADD COLUMN "version__objectkey" varchar;
  ALTER TABLE "media" ADD COLUMN "prefix" varchar DEFAULT '';
  ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "_media_v" ADD COLUMN "version_prefix" varchar DEFAULT '';
  ALTER TABLE "_media_v" ADD COLUMN "version__objectkey" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "documents" DROP COLUMN "prefix";
  ALTER TABLE "documents" DROP COLUMN "_objectkey";
  ALTER TABLE "_documents_v" DROP COLUMN "version_prefix";
  ALTER TABLE "_documents_v" DROP COLUMN "version__objectkey";
  ALTER TABLE "media" DROP COLUMN "prefix";
  ALTER TABLE "media" DROP COLUMN "_objectkey";
  ALTER TABLE "_media_v" DROP COLUMN "version_prefix";
  ALTER TABLE "_media_v" DROP COLUMN "version__objectkey";`)
}
