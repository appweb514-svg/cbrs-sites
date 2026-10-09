import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "activites" ADD COLUMN "bon_a_savoir_afficher" boolean DEFAULT true;
  ALTER TABLE "_activites_v" ADD COLUMN "version_bon_a_savoir_afficher" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "activites" DROP COLUMN "bon_a_savoir_afficher";
  ALTER TABLE "_activites_v" DROP COLUMN "version_bon_a_savoir_afficher";`)
}
