import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Paramètres : réglages SMTP et sauvegardes (groupes « smtp » et « sauvegarde »), avec leurs colonnes d'historique _parametres_v.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_parametres_sauvegarde_jour" AS ENUM('0', '1', '2', '3', '4', '5', '6');
  CREATE TYPE "public"."enum_parametres_sauvegarde_externe_fournisseur" AS ENUM('aucun', 's3', 'dropbox', 'drive');
  CREATE TYPE "public"."enum__parametres_v_version_sauvegarde_jour" AS ENUM('0', '1', '2', '3', '4', '5', '6');
  CREATE TYPE "public"."enum__parametres_v_version_sauvegarde_externe_fournisseur" AS ENUM('aucun', 's3', 'dropbox', 'drive');
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "smtp_actif" boolean DEFAULT false;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "smtp_hote" varchar;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "smtp_port" numeric DEFAULT 587;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "smtp_securise" boolean DEFAULT false;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "smtp_utilisateur" varchar;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "smtp_mot_de_passe" varchar;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "smtp_expediteur" varchar;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "smtp_nom_expediteur" varchar DEFAULT 'CBRS';
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "sauvegarde_actif" boolean DEFAULT true;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "sauvegarde_jour" "public"."enum_parametres_sauvegarde_jour" DEFAULT '0';
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "sauvegarde_heure" numeric DEFAULT 3;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "sauvegarde_conservation_jours" numeric DEFAULT 90;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "sauvegarde_externe_fournisseur" "public"."enum_parametres_sauvegarde_externe_fournisseur" DEFAULT 'aucun';
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "sauvegarde_externe_endpoint" varchar;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "sauvegarde_externe_region" varchar;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "sauvegarde_externe_bucket" varchar;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "sauvegarde_externe_cle_acces" varchar;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "sauvegarde_externe_cle_secrete" varchar;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "sauvegarde_externe_jeton" varchar;
  ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "sauvegarde_externe_dossier" varchar DEFAULT 'cbrs-sauvegardes';
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_smtp_actif" boolean DEFAULT false;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_smtp_hote" varchar;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_smtp_port" numeric DEFAULT 587;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_smtp_securise" boolean DEFAULT false;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_smtp_utilisateur" varchar;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_smtp_mot_de_passe" varchar;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_smtp_expediteur" varchar;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_smtp_nom_expediteur" varchar DEFAULT 'CBRS';
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_sauvegarde_actif" boolean DEFAULT true;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_sauvegarde_jour" "public"."enum__parametres_v_version_sauvegarde_jour" DEFAULT '0';
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_sauvegarde_heure" numeric DEFAULT 3;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_sauvegarde_conservation_jours" numeric DEFAULT 90;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_sauvegarde_externe_fournisseur" "public"."enum__parametres_v_version_sauvegarde_externe_fournisseur" DEFAULT 'aucun';
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_sauvegarde_externe_endpoint" varchar;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_sauvegarde_externe_region" varchar;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_sauvegarde_externe_bucket" varchar;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_sauvegarde_externe_cle_acces" varchar;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_sauvegarde_externe_cle_secrete" varchar;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_sauvegarde_externe_jeton" varchar;
  ALTER TABLE "_parametres_v" ADD COLUMN IF NOT EXISTS "version_sauvegarde_externe_dossier" varchar DEFAULT 'cbrs-sauvegardes';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "smtp_actif";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "smtp_hote";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "smtp_port";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "smtp_securise";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "smtp_utilisateur";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "smtp_mot_de_passe";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "smtp_expediteur";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "smtp_nom_expediteur";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "sauvegarde_actif";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "sauvegarde_jour";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "sauvegarde_heure";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "sauvegarde_conservation_jours";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "sauvegarde_externe_fournisseur";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "sauvegarde_externe_endpoint";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "sauvegarde_externe_region";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "sauvegarde_externe_bucket";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "sauvegarde_externe_cle_acces";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "sauvegarde_externe_cle_secrete";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "sauvegarde_externe_jeton";
  ALTER TABLE "parametres" DROP COLUMN IF EXISTS "sauvegarde_externe_dossier";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_smtp_actif";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_smtp_hote";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_smtp_port";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_smtp_securise";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_smtp_utilisateur";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_smtp_mot_de_passe";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_smtp_expediteur";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_smtp_nom_expediteur";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_sauvegarde_actif";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_sauvegarde_jour";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_sauvegarde_heure";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_sauvegarde_conservation_jours";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_sauvegarde_externe_fournisseur";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_sauvegarde_externe_endpoint";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_sauvegarde_externe_region";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_sauvegarde_externe_bucket";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_sauvegarde_externe_cle_acces";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_sauvegarde_externe_cle_secrete";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_sauvegarde_externe_jeton";
  ALTER TABLE "_parametres_v" DROP COLUMN IF EXISTS "version_sauvegarde_externe_dossier";
  DROP TYPE IF EXISTS "public"."enum_parametres_sauvegarde_jour";
  DROP TYPE IF EXISTS "public"."enum_parametres_sauvegarde_externe_fournisseur";
  DROP TYPE IF EXISTS "public"."enum__parametres_v_version_sauvegarde_jour";
  DROP TYPE IF EXISTS "public"."enum__parametres_v_version_sauvegarde_externe_fournisseur";`)
}
