import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "apparence" ADD COLUMN "image_en_tete_id" integer;
  ALTER TABLE "apparence" ADD COLUMN "teinte_en_tete" varchar DEFAULT '#0a3273' NOT NULL;
  ALTER TABLE "apparence" ADD COLUMN "intensite_teinte" numeric DEFAULT 78 NOT NULL;
  ALTER TABLE "_apparence_v" ADD COLUMN "version_image_en_tete_id" integer;
  ALTER TABLE "_apparence_v" ADD COLUMN "version_teinte_en_tete" varchar DEFAULT '#0a3273' NOT NULL;
  ALTER TABLE "_apparence_v" ADD COLUMN "version_intensite_teinte" numeric DEFAULT 78 NOT NULL;
  ALTER TABLE "apparence" ADD CONSTRAINT "apparence_image_en_tete_id_media_id_fk" FOREIGN KEY ("image_en_tete_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_apparence_v" ADD CONSTRAINT "_apparence_v_version_image_en_tete_id_media_id_fk" FOREIGN KEY ("version_image_en_tete_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "apparence_image_en_tete_idx" ON "apparence" USING btree ("image_en_tete_id");
  CREATE INDEX "_apparence_v_version_version_image_en_tete_idx" ON "_apparence_v" USING btree ("version_image_en_tete_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "apparence" DROP CONSTRAINT "apparence_image_en_tete_id_media_id_fk";
  
  ALTER TABLE "_apparence_v" DROP CONSTRAINT "_apparence_v_version_image_en_tete_id_media_id_fk";
  
  DROP INDEX "apparence_image_en_tete_idx";
  DROP INDEX "_apparence_v_version_version_image_en_tete_idx";
  ALTER TABLE "apparence" DROP COLUMN "image_en_tete_id";
  ALTER TABLE "apparence" DROP COLUMN "teinte_en_tete";
  ALTER TABLE "apparence" DROP COLUMN "intensite_teinte";
  ALTER TABLE "_apparence_v" DROP COLUMN "version_image_en_tete_id";
  ALTER TABLE "_apparence_v" DROP COLUMN "version_teinte_en_tete";
  ALTER TABLE "_apparence_v" DROP COLUMN "version_intensite_teinte";`)
}
