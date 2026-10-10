import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Complète 20261010_120000 : la table d'historique _tarifs_v doit aussi porter la fiche d'adhésion.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_tarifs_v" ADD COLUMN IF NOT EXISTS "version_fiche_adhesion_id" integer;
  ALTER TABLE "_tarifs_v" ADD CONSTRAINT "_tarifs_v_version_fiche_adhesion_id_documents_id_fk" FOREIGN KEY ("version_fiche_adhesion_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "_tarifs_v_version_version_fiche_adhesion_idx" ON "_tarifs_v" USING btree ("version_fiche_adhesion_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_tarifs_v" DROP CONSTRAINT "_tarifs_v_version_fiche_adhesion_id_documents_id_fk";
  DROP INDEX "_tarifs_v_version_version_fiche_adhesion_idx";
  ALTER TABLE "_tarifs_v" DROP COLUMN "version_fiche_adhesion_id";`)
}
