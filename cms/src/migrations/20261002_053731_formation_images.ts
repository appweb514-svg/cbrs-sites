import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "formation_cartes" ADD COLUMN "image_id" integer;
  ALTER TABLE "_formation_v_version_cartes" ADD COLUMN "image_id" integer;
  ALTER TABLE "formation_cartes" ADD CONSTRAINT "formation_cartes_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_formation_v_version_cartes" ADD CONSTRAINT "_formation_v_version_cartes_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "formation_cartes_image_idx" ON "formation_cartes" USING btree ("image_id");
  CREATE INDEX "_formation_v_version_cartes_image_idx" ON "_formation_v_version_cartes" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "formation_cartes" DROP CONSTRAINT "formation_cartes_image_id_media_id_fk";
  
  ALTER TABLE "_formation_v_version_cartes" DROP CONSTRAINT "_formation_v_version_cartes_image_id_media_id_fk";
  
  DROP INDEX "formation_cartes_image_idx";
  DROP INDEX "_formation_v_version_cartes_image_idx";
  ALTER TABLE "formation_cartes" DROP COLUMN "image_id";
  ALTER TABLE "_formation_v_version_cartes" DROP COLUMN "image_id";`)
}
