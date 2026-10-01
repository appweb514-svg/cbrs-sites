import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_formation_cartes_icone" AS ENUM('01_aquagym.png', '02_petanque.png', '03_cyclisme.png', '04_tir_a_l_arc.png', '05_ping_pong.png', '05_tennis_de_table.png', '06_tennis.png', '07_randonnee.png', '08_marche_nordique.png', '09_gymnastique.png', '10_pickleball.png', '11_tai_chi.png', '12_echecs.png', '13_jeux_de_cartes.png', '14_danse.png', '15_atelier_memoire.png', '16_bridge.png');
  CREATE TYPE "public"."enum__formation_v_version_cartes_icone" AS ENUM('01_aquagym.png', '02_petanque.png', '03_cyclisme.png', '04_tir_a_l_arc.png', '05_ping_pong.png', '05_tennis_de_table.png', '06_tennis.png', '07_randonnee.png', '08_marche_nordique.png', '09_gymnastique.png', '10_pickleball.png', '11_tai_chi.png', '12_echecs.png', '13_jeux_de_cartes.png', '14_danse.png', '15_atelier_memoire.png', '16_bridge.png');
  CREATE TABLE "formation_etapes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"surtitre" varchar,
  	"titre" varchar NOT NULL,
  	"texte" varchar,
  	"fiche_id" integer,
  	"fiche_site" varchar,
  	"bouton_libelle" varchar
  );
  
  CREATE TABLE "formation_cartes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titre" varchar NOT NULL,
  	"sous_titre" varchar,
  	"icone" "enum_formation_cartes_icone",
  	"fiche_id" integer,
  	"fiche_site" varchar
  );
  
  CREATE TABLE "_formation_v_version_etapes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"surtitre" varchar,
  	"titre" varchar NOT NULL,
  	"texte" varchar,
  	"fiche_id" integer,
  	"fiche_site" varchar,
  	"bouton_libelle" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_formation_v_version_cartes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"titre" varchar NOT NULL,
  	"sous_titre" varchar,
  	"icone" "enum__formation_v_version_cartes_icone",
  	"fiche_id" integer,
  	"fiche_site" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "formation" DROP CONSTRAINT "formation_fiche_fia_id_documents_id_fk";
  
  ALTER TABLE "formation" DROP CONSTRAINT "formation_fiche_m2_agef_id_documents_id_fk";
  
  ALTER TABLE "formation" DROP CONSTRAINT "formation_fiche_m2_ad_id_documents_id_fk";
  
  ALTER TABLE "formation" DROP CONSTRAINT "formation_fiche_m2_aa_id_documents_id_fk";
  
  ALTER TABLE "formation" DROP CONSTRAINT "formation_fiche_m2_ac_id_documents_id_fk";
  
  ALTER TABLE "formation" DROP CONSTRAINT "formation_fiche_m2_jb_id_documents_id_fk";
  
  ALTER TABLE "_formation_v" DROP CONSTRAINT "_formation_v_version_fiche_fia_id_documents_id_fk";
  
  ALTER TABLE "_formation_v" DROP CONSTRAINT "_formation_v_version_fiche_m2_agef_id_documents_id_fk";
  
  ALTER TABLE "_formation_v" DROP CONSTRAINT "_formation_v_version_fiche_m2_ad_id_documents_id_fk";
  
  ALTER TABLE "_formation_v" DROP CONSTRAINT "_formation_v_version_fiche_m2_aa_id_documents_id_fk";
  
  ALTER TABLE "_formation_v" DROP CONSTRAINT "_formation_v_version_fiche_m2_ac_id_documents_id_fk";
  
  ALTER TABLE "_formation_v" DROP CONSTRAINT "_formation_v_version_fiche_m2_jb_id_documents_id_fk";
  
  DROP INDEX "formation_fiche_fia_idx";
  DROP INDEX "formation_fiche_m2_agef_idx";
  DROP INDEX "formation_fiche_m2_ad_idx";
  DROP INDEX "formation_fiche_m2_aa_idx";
  DROP INDEX "formation_fiche_m2_ac_idx";
  DROP INDEX "formation_fiche_m2_jb_idx";
  DROP INDEX "_formation_v_version_version_fiche_fia_idx";
  DROP INDEX "_formation_v_version_version_fiche_m2_agef_idx";
  DROP INDEX "_formation_v_version_version_fiche_m2_ad_idx";
  DROP INDEX "_formation_v_version_version_fiche_m2_aa_idx";
  DROP INDEX "_formation_v_version_version_fiche_m2_ac_idx";
  DROP INDEX "_formation_v_version_version_fiche_m2_jb_idx";
  ALTER TABLE "formation_etapes" ADD CONSTRAINT "formation_etapes_fiche_id_documents_id_fk" FOREIGN KEY ("fiche_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "formation_etapes" ADD CONSTRAINT "formation_etapes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."formation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "formation_cartes" ADD CONSTRAINT "formation_cartes_fiche_id_documents_id_fk" FOREIGN KEY ("fiche_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "formation_cartes" ADD CONSTRAINT "formation_cartes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."formation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_formation_v_version_etapes" ADD CONSTRAINT "_formation_v_version_etapes_fiche_id_documents_id_fk" FOREIGN KEY ("fiche_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_formation_v_version_etapes" ADD CONSTRAINT "_formation_v_version_etapes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_formation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_formation_v_version_cartes" ADD CONSTRAINT "_formation_v_version_cartes_fiche_id_documents_id_fk" FOREIGN KEY ("fiche_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_formation_v_version_cartes" ADD CONSTRAINT "_formation_v_version_cartes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_formation_v"("id") ON DELETE cascade ON UPDATE no action;

  -- Reprise du contenu existant : les 3 étapes et les 6 cartes fixes deviennent les premières lignes des listes.
  INSERT INTO "formation_etapes" ("_order", "_parent_id", "id", "surtitre", "titre", "texte", "fiche_id", "fiche_site", "bouton_libelle")
  SELECT v.o, f.id, substr(md5(random()::text || f.id || v.o), 1, 24), v.s, v.t, v.x, v.fid, v.site, v.btn
  FROM "formation" f, LATERAL (VALUES
    (1, f.etape1_surtitre, coalesce(f.etape1_titre, 'Connaître la FFRS'), f.etape1_texte, NULL::integer, NULL::varchar, NULL::varchar),
    (2, f.etape2_surtitre, coalesce(f.etape2_titre, 'Formation Initiale des Animateurs (FIA)'), f.etape2_texte, f.fiche_fia_id, 'docs/FFRS_Formation_FIA_Aout-2025.pdf', 'Consulter la fiche FIA (PDF)'),
    (3, f.etape3_surtitre, coalesce(f.etape3_titre, 'Formation par activité (M2)'), f.etape3_texte, NULL::integer, NULL::varchar, NULL::varchar)
  ) AS v(o, s, t, x, fid, site, btn);
  INSERT INTO "formation_cartes" ("_order", "_parent_id", "id", "titre", "sous_titre", "icone", "fiche_id", "fiche_site")
  SELECT v.o, f.id, substr(md5(random()::text || f.id || v.o), 1, 24), v.t, v.st, v.ic, v.fid, v.site
  FROM "formation" f, LATERAL (VALUES
    (1, coalesce(f.carte_ag_titre, 'Aquagym'), f.carte_ag_sous_titre, '01_aquagym.png'::"enum_formation_cartes_icone", f.fiche_m2_agef_id, 'docs/FFRS_Formation_M2-AGEF_Aout-2025.pdf'),
    (2, coalesce(f.carte_gym_titre, 'Gymnastique'), f.carte_gym_sous_titre, '09_gymnastique.png'::"enum_formation_cartes_icone", f.fiche_m2_agef_id, 'docs/FFRS_Formation_M2-AGEF_Aout-2025.pdf'),
    (3, coalesce(f.carte_danse_titre, 'Danse'), f.carte_danse_sous_titre, '14_danse.png'::"enum_formation_cartes_icone", f.fiche_m2_ad_id, 'docs/FFRS_Formation_M2-AD_Aout-2025.pdf'),
    (4, coalesce(f.carte_rando_titre, 'Randonnée'), f.carte_rando_sous_titre, '07_randonnee.png'::"enum_formation_cartes_icone", f.fiche_m2_aa_id, 'docs/FFRS_Formation_M2-AA_Aout-2025.pdf'),
    (5, coalesce(f.carte_raquettes_titre, 'Tennis de table'), f.carte_raquettes_sous_titre, '05_ping_pong.png'::"enum_formation_cartes_icone", f.fiche_m2_ac_id, 'docs/FFRS_Formation_M2-AC_Aout-2025.pdf'),
    (6, coalesce(f.carte_echecs_titre, 'Échecs / Jeux de société'), f.carte_echecs_sous_titre, '12_echecs.png'::"enum_formation_cartes_icone", f.fiche_m2_jb_id, 'docs/FFRS_Formation_M2-JB_Aout-2025.pdf')
  ) AS v(o, t, st, ic, fid, site);
  INSERT INTO "_formation_v_version_etapes" ("_order", "_parent_id", "surtitre", "titre", "texte", "fiche_id", "fiche_site", "bouton_libelle", "_uuid")
  SELECT v.o, f.id, v.s, v.t, v.x, v.fid, v.site, v.btn, substr(md5(random()::text || f.id || v.o), 1, 24)
  FROM "_formation_v" f, LATERAL (VALUES
    (1, f.version_etape1_surtitre, coalesce(f.version_etape1_titre, 'Connaître la FFRS'), f.version_etape1_texte, NULL::integer, NULL::varchar, NULL::varchar),
    (2, f.version_etape2_surtitre, coalesce(f.version_etape2_titre, 'Formation Initiale des Animateurs (FIA)'), f.version_etape2_texte, f.version_fiche_fia_id, 'docs/FFRS_Formation_FIA_Aout-2025.pdf', 'Consulter la fiche FIA (PDF)'),
    (3, f.version_etape3_surtitre, coalesce(f.version_etape3_titre, 'Formation par activité (M2)'), f.version_etape3_texte, NULL::integer, NULL::varchar, NULL::varchar)
  ) AS v(o, s, t, x, fid, site, btn);
  INSERT INTO "_formation_v_version_cartes" ("_order", "_parent_id", "titre", "sous_titre", "icone", "fiche_id", "fiche_site", "_uuid")
  SELECT v.o, f.id, v.t, v.st, v.ic, v.fid, v.site, substr(md5(random()::text || f.id || v.o), 1, 24)
  FROM "_formation_v" f, LATERAL (VALUES
    (1, coalesce(f.version_carte_ag_titre, 'Aquagym'), f.version_carte_ag_sous_titre, '01_aquagym.png'::"enum__formation_v_version_cartes_icone", f.version_fiche_m2_agef_id, 'docs/FFRS_Formation_M2-AGEF_Aout-2025.pdf'),
    (2, coalesce(f.version_carte_gym_titre, 'Gymnastique'), f.version_carte_gym_sous_titre, '09_gymnastique.png'::"enum__formation_v_version_cartes_icone", f.version_fiche_m2_agef_id, 'docs/FFRS_Formation_M2-AGEF_Aout-2025.pdf'),
    (3, coalesce(f.version_carte_danse_titre, 'Danse'), f.version_carte_danse_sous_titre, '14_danse.png'::"enum__formation_v_version_cartes_icone", f.version_fiche_m2_ad_id, 'docs/FFRS_Formation_M2-AD_Aout-2025.pdf'),
    (4, coalesce(f.version_carte_rando_titre, 'Randonnée'), f.version_carte_rando_sous_titre, '07_randonnee.png'::"enum__formation_v_version_cartes_icone", f.version_fiche_m2_aa_id, 'docs/FFRS_Formation_M2-AA_Aout-2025.pdf'),
    (5, coalesce(f.version_carte_raquettes_titre, 'Tennis de table'), f.version_carte_raquettes_sous_titre, '05_ping_pong.png'::"enum__formation_v_version_cartes_icone", f.version_fiche_m2_ac_id, 'docs/FFRS_Formation_M2-AC_Aout-2025.pdf'),
    (6, coalesce(f.version_carte_echecs_titre, 'Échecs / Jeux de société'), f.version_carte_echecs_sous_titre, '12_echecs.png'::"enum__formation_v_version_cartes_icone", f.version_fiche_m2_jb_id, 'docs/FFRS_Formation_M2-JB_Aout-2025.pdf')
  ) AS v(o, t, st, ic, fid, site);
  CREATE INDEX "formation_etapes_order_idx" ON "formation_etapes" USING btree ("_order");
  CREATE INDEX "formation_etapes_parent_id_idx" ON "formation_etapes" USING btree ("_parent_id");
  CREATE INDEX "formation_etapes_fiche_idx" ON "formation_etapes" USING btree ("fiche_id");
  CREATE INDEX "formation_cartes_order_idx" ON "formation_cartes" USING btree ("_order");
  CREATE INDEX "formation_cartes_parent_id_idx" ON "formation_cartes" USING btree ("_parent_id");
  CREATE INDEX "formation_cartes_fiche_idx" ON "formation_cartes" USING btree ("fiche_id");
  CREATE INDEX "_formation_v_version_etapes_order_idx" ON "_formation_v_version_etapes" USING btree ("_order");
  CREATE INDEX "_formation_v_version_etapes_parent_id_idx" ON "_formation_v_version_etapes" USING btree ("_parent_id");
  CREATE INDEX "_formation_v_version_etapes_fiche_idx" ON "_formation_v_version_etapes" USING btree ("fiche_id");
  CREATE INDEX "_formation_v_version_cartes_order_idx" ON "_formation_v_version_cartes" USING btree ("_order");
  CREATE INDEX "_formation_v_version_cartes_parent_id_idx" ON "_formation_v_version_cartes" USING btree ("_parent_id");
  CREATE INDEX "_formation_v_version_cartes_fiche_idx" ON "_formation_v_version_cartes" USING btree ("fiche_id");
  ALTER TABLE "formation" DROP COLUMN "etape1_surtitre";
  ALTER TABLE "formation" DROP COLUMN "etape1_titre";
  ALTER TABLE "formation" DROP COLUMN "etape1_texte";
  ALTER TABLE "formation" DROP COLUMN "etape2_surtitre";
  ALTER TABLE "formation" DROP COLUMN "etape2_titre";
  ALTER TABLE "formation" DROP COLUMN "etape2_texte";
  ALTER TABLE "formation" DROP COLUMN "etape3_surtitre";
  ALTER TABLE "formation" DROP COLUMN "etape3_titre";
  ALTER TABLE "formation" DROP COLUMN "etape3_texte";
  ALTER TABLE "formation" DROP COLUMN "fiche_fia_id";
  ALTER TABLE "formation" DROP COLUMN "fiche_m2_agef_id";
  ALTER TABLE "formation" DROP COLUMN "fiche_m2_ad_id";
  ALTER TABLE "formation" DROP COLUMN "fiche_m2_aa_id";
  ALTER TABLE "formation" DROP COLUMN "fiche_m2_ac_id";
  ALTER TABLE "formation" DROP COLUMN "fiche_m2_jb_id";
  ALTER TABLE "formation" DROP COLUMN "carte_ag_titre";
  ALTER TABLE "formation" DROP COLUMN "carte_ag_sous_titre";
  ALTER TABLE "formation" DROP COLUMN "carte_gym_titre";
  ALTER TABLE "formation" DROP COLUMN "carte_gym_sous_titre";
  ALTER TABLE "formation" DROP COLUMN "carte_danse_titre";
  ALTER TABLE "formation" DROP COLUMN "carte_danse_sous_titre";
  ALTER TABLE "formation" DROP COLUMN "carte_rando_titre";
  ALTER TABLE "formation" DROP COLUMN "carte_rando_sous_titre";
  ALTER TABLE "formation" DROP COLUMN "carte_raquettes_titre";
  ALTER TABLE "formation" DROP COLUMN "carte_raquettes_sous_titre";
  ALTER TABLE "formation" DROP COLUMN "carte_echecs_titre";
  ALTER TABLE "formation" DROP COLUMN "carte_echecs_sous_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_etape1_surtitre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_etape1_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_etape1_texte";
  ALTER TABLE "_formation_v" DROP COLUMN "version_etape2_surtitre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_etape2_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_etape2_texte";
  ALTER TABLE "_formation_v" DROP COLUMN "version_etape3_surtitre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_etape3_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_etape3_texte";
  ALTER TABLE "_formation_v" DROP COLUMN "version_fiche_fia_id";
  ALTER TABLE "_formation_v" DROP COLUMN "version_fiche_m2_agef_id";
  ALTER TABLE "_formation_v" DROP COLUMN "version_fiche_m2_ad_id";
  ALTER TABLE "_formation_v" DROP COLUMN "version_fiche_m2_aa_id";
  ALTER TABLE "_formation_v" DROP COLUMN "version_fiche_m2_ac_id";
  ALTER TABLE "_formation_v" DROP COLUMN "version_fiche_m2_jb_id";
  ALTER TABLE "_formation_v" DROP COLUMN "version_carte_ag_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_carte_ag_sous_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_carte_gym_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_carte_gym_sous_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_carte_danse_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_carte_danse_sous_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_carte_rando_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_carte_rando_sous_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_carte_raquettes_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_carte_raquettes_sous_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_carte_echecs_titre";
  ALTER TABLE "_formation_v" DROP COLUMN "version_carte_echecs_sous_titre";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "formation_etapes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "formation_cartes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_formation_v_version_etapes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_formation_v_version_cartes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "formation_etapes" CASCADE;
  DROP TABLE "formation_cartes" CASCADE;
  DROP TABLE "_formation_v_version_etapes" CASCADE;
  DROP TABLE "_formation_v_version_cartes" CASCADE;
  ALTER TABLE "formation" ADD COLUMN "etape1_surtitre" varchar DEFAULT 'Première étape';
  ALTER TABLE "formation" ADD COLUMN "etape1_titre" varchar DEFAULT 'Connaître la FFRS';
  ALTER TABLE "formation" ADD COLUMN "etape1_texte" varchar DEFAULT 'La Fédération Française de la Retraite Sportive (FFRS) est l’organisme fédéral qui encadre et forme les animateurs.';
  ALTER TABLE "formation" ADD COLUMN "etape2_surtitre" varchar DEFAULT 'Le socle commun';
  ALTER TABLE "formation" ADD COLUMN "etape2_titre" varchar DEFAULT 'Formation Initiale des Animateurs (FIA)';
  ALTER TABLE "formation" ADD COLUMN "etape2_texte" varchar DEFAULT 'Première étape incontournable : la FIA vous forme aux bases de l’animation sportive bénévole (pédagogie, sécurité, connaissance de la fédération).';
  ALTER TABLE "formation" ADD COLUMN "etape3_surtitre" varchar DEFAULT 'La spécialisation';
  ALTER TABLE "formation" ADD COLUMN "etape3_titre" varchar DEFAULT 'Formation par activité (M2)';
  ALTER TABLE "formation" ADD COLUMN "etape3_texte" varchar DEFAULT 'Après la FIA, vous suivez la formation spécifique à l’activité que vous souhaitez encadrer (M2).';
  ALTER TABLE "formation" ADD COLUMN "fiche_fia_id" integer;
  ALTER TABLE "formation" ADD COLUMN "fiche_m2_agef_id" integer;
  ALTER TABLE "formation" ADD COLUMN "fiche_m2_ad_id" integer;
  ALTER TABLE "formation" ADD COLUMN "fiche_m2_aa_id" integer;
  ALTER TABLE "formation" ADD COLUMN "fiche_m2_ac_id" integer;
  ALTER TABLE "formation" ADD COLUMN "fiche_m2_jb_id" integer;
  ALTER TABLE "formation" ADD COLUMN "carte_ag_titre" varchar DEFAULT 'Aquagym';
  ALTER TABLE "formation" ADD COLUMN "carte_ag_sous_titre" varchar DEFAULT 'M2-AGEF — Gymnastique Aquatique';
  ALTER TABLE "formation" ADD COLUMN "carte_gym_titre" varchar DEFAULT 'Gymnastique';
  ALTER TABLE "formation" ADD COLUMN "carte_gym_sous_titre" varchar DEFAULT 'M2-AGEF — Gymnastique d’Entretien';
  ALTER TABLE "formation" ADD COLUMN "carte_danse_titre" varchar DEFAULT 'Danse';
  ALTER TABLE "formation" ADD COLUMN "carte_danse_sous_titre" varchar DEFAULT 'M2-AD — Danse de Salon';
  ALTER TABLE "formation" ADD COLUMN "carte_rando_titre" varchar DEFAULT 'Randonnée';
  ALTER TABLE "formation" ADD COLUMN "carte_rando_sous_titre" varchar DEFAULT 'M2-AA — Activités de Randonnée';
  ALTER TABLE "formation" ADD COLUMN "carte_raquettes_titre" varchar DEFAULT 'Tennis de table';
  ALTER TABLE "formation" ADD COLUMN "carte_raquettes_sous_titre" varchar DEFAULT 'M2-AC — Activités de raquettes';
  ALTER TABLE "formation" ADD COLUMN "carte_echecs_titre" varchar DEFAULT 'Échecs / Jeux de société';
  ALTER TABLE "formation" ADD COLUMN "carte_echecs_sous_titre" varchar DEFAULT 'M2-JB — Jeux de table et de société';
  ALTER TABLE "_formation_v" ADD COLUMN "version_etape1_surtitre" varchar DEFAULT 'Première étape';
  ALTER TABLE "_formation_v" ADD COLUMN "version_etape1_titre" varchar DEFAULT 'Connaître la FFRS';
  ALTER TABLE "_formation_v" ADD COLUMN "version_etape1_texte" varchar DEFAULT 'La Fédération Française de la Retraite Sportive (FFRS) est l’organisme fédéral qui encadre et forme les animateurs.';
  ALTER TABLE "_formation_v" ADD COLUMN "version_etape2_surtitre" varchar DEFAULT 'Le socle commun';
  ALTER TABLE "_formation_v" ADD COLUMN "version_etape2_titre" varchar DEFAULT 'Formation Initiale des Animateurs (FIA)';
  ALTER TABLE "_formation_v" ADD COLUMN "version_etape2_texte" varchar DEFAULT 'Première étape incontournable : la FIA vous forme aux bases de l’animation sportive bénévole (pédagogie, sécurité, connaissance de la fédération).';
  ALTER TABLE "_formation_v" ADD COLUMN "version_etape3_surtitre" varchar DEFAULT 'La spécialisation';
  ALTER TABLE "_formation_v" ADD COLUMN "version_etape3_titre" varchar DEFAULT 'Formation par activité (M2)';
  ALTER TABLE "_formation_v" ADD COLUMN "version_etape3_texte" varchar DEFAULT 'Après la FIA, vous suivez la formation spécifique à l’activité que vous souhaitez encadrer (M2).';
  ALTER TABLE "_formation_v" ADD COLUMN "version_fiche_fia_id" integer;
  ALTER TABLE "_formation_v" ADD COLUMN "version_fiche_m2_agef_id" integer;
  ALTER TABLE "_formation_v" ADD COLUMN "version_fiche_m2_ad_id" integer;
  ALTER TABLE "_formation_v" ADD COLUMN "version_fiche_m2_aa_id" integer;
  ALTER TABLE "_formation_v" ADD COLUMN "version_fiche_m2_ac_id" integer;
  ALTER TABLE "_formation_v" ADD COLUMN "version_fiche_m2_jb_id" integer;
  ALTER TABLE "_formation_v" ADD COLUMN "version_carte_ag_titre" varchar DEFAULT 'Aquagym';
  ALTER TABLE "_formation_v" ADD COLUMN "version_carte_ag_sous_titre" varchar DEFAULT 'M2-AGEF — Gymnastique Aquatique';
  ALTER TABLE "_formation_v" ADD COLUMN "version_carte_gym_titre" varchar DEFAULT 'Gymnastique';
  ALTER TABLE "_formation_v" ADD COLUMN "version_carte_gym_sous_titre" varchar DEFAULT 'M2-AGEF — Gymnastique d’Entretien';
  ALTER TABLE "_formation_v" ADD COLUMN "version_carte_danse_titre" varchar DEFAULT 'Danse';
  ALTER TABLE "_formation_v" ADD COLUMN "version_carte_danse_sous_titre" varchar DEFAULT 'M2-AD — Danse de Salon';
  ALTER TABLE "_formation_v" ADD COLUMN "version_carte_rando_titre" varchar DEFAULT 'Randonnée';
  ALTER TABLE "_formation_v" ADD COLUMN "version_carte_rando_sous_titre" varchar DEFAULT 'M2-AA — Activités de Randonnée';
  ALTER TABLE "_formation_v" ADD COLUMN "version_carte_raquettes_titre" varchar DEFAULT 'Tennis de table';
  ALTER TABLE "_formation_v" ADD COLUMN "version_carte_raquettes_sous_titre" varchar DEFAULT 'M2-AC — Activités de raquettes';
  ALTER TABLE "_formation_v" ADD COLUMN "version_carte_echecs_titre" varchar DEFAULT 'Échecs / Jeux de société';
  ALTER TABLE "_formation_v" ADD COLUMN "version_carte_echecs_sous_titre" varchar DEFAULT 'M2-JB — Jeux de table et de société';
  ALTER TABLE "formation" ADD CONSTRAINT "formation_fiche_fia_id_documents_id_fk" FOREIGN KEY ("fiche_fia_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "formation" ADD CONSTRAINT "formation_fiche_m2_agef_id_documents_id_fk" FOREIGN KEY ("fiche_m2_agef_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "formation" ADD CONSTRAINT "formation_fiche_m2_ad_id_documents_id_fk" FOREIGN KEY ("fiche_m2_ad_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "formation" ADD CONSTRAINT "formation_fiche_m2_aa_id_documents_id_fk" FOREIGN KEY ("fiche_m2_aa_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "formation" ADD CONSTRAINT "formation_fiche_m2_ac_id_documents_id_fk" FOREIGN KEY ("fiche_m2_ac_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "formation" ADD CONSTRAINT "formation_fiche_m2_jb_id_documents_id_fk" FOREIGN KEY ("fiche_m2_jb_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_formation_v" ADD CONSTRAINT "_formation_v_version_fiche_fia_id_documents_id_fk" FOREIGN KEY ("version_fiche_fia_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_formation_v" ADD CONSTRAINT "_formation_v_version_fiche_m2_agef_id_documents_id_fk" FOREIGN KEY ("version_fiche_m2_agef_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_formation_v" ADD CONSTRAINT "_formation_v_version_fiche_m2_ad_id_documents_id_fk" FOREIGN KEY ("version_fiche_m2_ad_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_formation_v" ADD CONSTRAINT "_formation_v_version_fiche_m2_aa_id_documents_id_fk" FOREIGN KEY ("version_fiche_m2_aa_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_formation_v" ADD CONSTRAINT "_formation_v_version_fiche_m2_ac_id_documents_id_fk" FOREIGN KEY ("version_fiche_m2_ac_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_formation_v" ADD CONSTRAINT "_formation_v_version_fiche_m2_jb_id_documents_id_fk" FOREIGN KEY ("version_fiche_m2_jb_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "formation_fiche_fia_idx" ON "formation" USING btree ("fiche_fia_id");
  CREATE INDEX "formation_fiche_m2_agef_idx" ON "formation" USING btree ("fiche_m2_agef_id");
  CREATE INDEX "formation_fiche_m2_ad_idx" ON "formation" USING btree ("fiche_m2_ad_id");
  CREATE INDEX "formation_fiche_m2_aa_idx" ON "formation" USING btree ("fiche_m2_aa_id");
  CREATE INDEX "formation_fiche_m2_ac_idx" ON "formation" USING btree ("fiche_m2_ac_id");
  CREATE INDEX "formation_fiche_m2_jb_idx" ON "formation" USING btree ("fiche_m2_jb_id");
  CREATE INDEX "_formation_v_version_version_fiche_fia_idx" ON "_formation_v" USING btree ("version_fiche_fia_id");
  CREATE INDEX "_formation_v_version_version_fiche_m2_agef_idx" ON "_formation_v" USING btree ("version_fiche_m2_agef_id");
  CREATE INDEX "_formation_v_version_version_fiche_m2_ad_idx" ON "_formation_v" USING btree ("version_fiche_m2_ad_id");
  CREATE INDEX "_formation_v_version_version_fiche_m2_aa_idx" ON "_formation_v" USING btree ("version_fiche_m2_aa_id");
  CREATE INDEX "_formation_v_version_version_fiche_m2_ac_idx" ON "_formation_v" USING btree ("version_fiche_m2_ac_id");
  CREATE INDEX "_formation_v_version_version_fiche_m2_jb_idx" ON "_formation_v" USING btree ("version_fiche_m2_jb_id");
  DROP TYPE "public"."enum_formation_cartes_icone";
  DROP TYPE "public"."enum__formation_v_version_cartes_icone";`)
}
