import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_activites_bon_a_savoir_intensite" AS ENUM('douce', 'moderee', 'soutenue');
  CREATE TYPE "public"."enum__activites_v_version_bon_a_savoir_intensite" AS ENUM('douce', 'moderee', 'soutenue');
  ALTER TABLE "activites" ADD COLUMN "bon_a_savoir_tenue" varchar;
  ALTER TABLE "activites" ADD COLUMN "bon_a_savoir_materiel" varchar;
  ALTER TABLE "activites" ADD COLUMN "bon_a_savoir_intensite" "enum_activites_bon_a_savoir_intensite";
  ALTER TABLE "activites" ADD COLUMN "bon_a_savoir_duree" varchar;
  ALTER TABLE "activites" ADD COLUMN "bon_a_savoir_prix" varchar;
  ALTER TABLE "_activites_v" ADD COLUMN "version_bon_a_savoir_tenue" varchar;
  ALTER TABLE "_activites_v" ADD COLUMN "version_bon_a_savoir_materiel" varchar;
  ALTER TABLE "_activites_v" ADD COLUMN "version_bon_a_savoir_intensite" "enum__activites_v_version_bon_a_savoir_intensite";
  ALTER TABLE "_activites_v" ADD COLUMN "version_bon_a_savoir_duree" varchar;
  ALTER TABLE "_activites_v" ADD COLUMN "version_bon_a_savoir_prix" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "activites" DROP COLUMN "bon_a_savoir_tenue";
  ALTER TABLE "activites" DROP COLUMN "bon_a_savoir_materiel";
  ALTER TABLE "activites" DROP COLUMN "bon_a_savoir_intensite";
  ALTER TABLE "activites" DROP COLUMN "bon_a_savoir_duree";
  ALTER TABLE "activites" DROP COLUMN "bon_a_savoir_prix";
  ALTER TABLE "_activites_v" DROP COLUMN "version_bon_a_savoir_tenue";
  ALTER TABLE "_activites_v" DROP COLUMN "version_bon_a_savoir_materiel";
  ALTER TABLE "_activites_v" DROP COLUMN "version_bon_a_savoir_intensite";
  ALTER TABLE "_activites_v" DROP COLUMN "version_bon_a_savoir_duree";
  ALTER TABLE "_activites_v" DROP COLUMN "version_bon_a_savoir_prix";
  DROP TYPE "public"."enum_activites_bon_a_savoir_intensite";
  DROP TYPE "public"."enum__activites_v_version_bon_a_savoir_intensite";`)
}
