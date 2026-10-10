import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tarifs" ADD COLUMN "fiche_adhesion_id" integer;
  ALTER TABLE "tarifs" ADD CONSTRAINT "tarifs_fiche_adhesion_id_documents_id_fk" FOREIGN KEY ("fiche_adhesion_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "tarifs_fiche_adhesion_idx" ON "tarifs" USING btree ("fiche_adhesion_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tarifs" DROP CONSTRAINT "tarifs_fiche_adhesion_id_documents_id_fk";
  DROP INDEX "tarifs_fiche_adhesion_idx";
  ALTER TABLE "tarifs" DROP COLUMN "fiche_adhesion_id";`)
}
