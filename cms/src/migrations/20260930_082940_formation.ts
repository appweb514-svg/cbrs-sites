import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_roles_permissions_section" ADD VALUE 'formation' BEFORE 'tarifs';
  ALTER TYPE "public"."enum__roles_v_version_permissions_section" ADD VALUE 'formation' BEFORE 'tarifs';
  CREATE TABLE "formation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parcours_surtitre" varchar DEFAULT 'Parcours de formation',
  	"parcours_titre" varchar DEFAULT 'Devenir animateur vous tente ?',
  	"parcours_texte" varchar DEFAULT 'Voici le cheminement pour encadrer bénévolement une activité au sein du CBRS, étape après étape.',
  	"etape1_surtitre" varchar DEFAULT 'Première étape',
  	"etape1_titre" varchar DEFAULT 'Connaître la FFRS',
  	"etape1_texte" varchar DEFAULT 'La Fédération Française de la Retraite Sportive (FFRS) est l’organisme fédéral qui encadre et forme les animateurs.',
  	"etape2_surtitre" varchar DEFAULT 'Le socle commun',
  	"etape2_titre" varchar DEFAULT 'Formation Initiale des Animateurs (FIA)',
  	"etape2_texte" varchar DEFAULT 'Première étape incontournable : la FIA vous forme aux bases de l’animation sportive bénévole (pédagogie, sécurité, connaissance de la fédération).',
  	"etape3_surtitre" varchar DEFAULT 'La spécialisation',
  	"etape3_titre" varchar DEFAULT 'Formation par activité (M2)',
  	"etape3_texte" varchar DEFAULT 'Après la FIA, vous suivez la formation spécifique à l’activité que vous souhaitez encadrer (M2).',
  	"fiche_fia_id" integer,
  	"fiche_m2_agef_id" integer,
  	"fiche_m2_ad_id" integer,
  	"fiche_m2_aa_id" integer,
  	"fiche_m2_ac_id" integer,
  	"fiche_m2_jb_id" integer,
  	"carte_ag_titre" varchar DEFAULT 'Aquagym',
  	"carte_ag_sous_titre" varchar DEFAULT 'M2-AGEF — Gymnastique Aquatique',
  	"carte_gym_titre" varchar DEFAULT 'Gymnastique',
  	"carte_gym_sous_titre" varchar DEFAULT 'M2-AGEF — Gymnastique d’Entretien',
  	"carte_danse_titre" varchar DEFAULT 'Danse',
  	"carte_danse_sous_titre" varchar DEFAULT 'M2-AD — Danse de Salon',
  	"carte_rando_titre" varchar DEFAULT 'Randonnée',
  	"carte_rando_sous_titre" varchar DEFAULT 'M2-AA — Activités de Randonnée',
  	"carte_raquettes_titre" varchar DEFAULT 'Tennis de table',
  	"carte_raquettes_sous_titre" varchar DEFAULT 'M2-AC — Activités de raquettes',
  	"carte_echecs_titre" varchar DEFAULT 'Échecs / Jeux de société',
  	"carte_echecs_sous_titre" varchar DEFAULT 'M2-JB — Jeux de table et de société',
  	"note" varchar DEFAULT 'Cliquez sur « Consulter le PDF » d’une fiche pour l’afficher en grand. Vous pourrez ensuite la télécharger, l’imprimer ou zoomer.',
  	"cta_titre" varchar DEFAULT 'Vous souhaitez devenir animateur ?',
  	"cta_texte" varchar DEFAULT 'Contactez-nous pour obtenir toutes les informations sur les formations disponibles.',
  	"cta_bouton" varchar DEFAULT 'Nous contacter',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_formation_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_parcours_surtitre" varchar DEFAULT 'Parcours de formation',
  	"version_parcours_titre" varchar DEFAULT 'Devenir animateur vous tente ?',
  	"version_parcours_texte" varchar DEFAULT 'Voici le cheminement pour encadrer bénévolement une activité au sein du CBRS, étape après étape.',
  	"version_etape1_surtitre" varchar DEFAULT 'Première étape',
  	"version_etape1_titre" varchar DEFAULT 'Connaître la FFRS',
  	"version_etape1_texte" varchar DEFAULT 'La Fédération Française de la Retraite Sportive (FFRS) est l’organisme fédéral qui encadre et forme les animateurs.',
  	"version_etape2_surtitre" varchar DEFAULT 'Le socle commun',
  	"version_etape2_titre" varchar DEFAULT 'Formation Initiale des Animateurs (FIA)',
  	"version_etape2_texte" varchar DEFAULT 'Première étape incontournable : la FIA vous forme aux bases de l’animation sportive bénévole (pédagogie, sécurité, connaissance de la fédération).',
  	"version_etape3_surtitre" varchar DEFAULT 'La spécialisation',
  	"version_etape3_titre" varchar DEFAULT 'Formation par activité (M2)',
  	"version_etape3_texte" varchar DEFAULT 'Après la FIA, vous suivez la formation spécifique à l’activité que vous souhaitez encadrer (M2).',
  	"version_fiche_fia_id" integer,
  	"version_fiche_m2_agef_id" integer,
  	"version_fiche_m2_ad_id" integer,
  	"version_fiche_m2_aa_id" integer,
  	"version_fiche_m2_ac_id" integer,
  	"version_fiche_m2_jb_id" integer,
  	"version_carte_ag_titre" varchar DEFAULT 'Aquagym',
  	"version_carte_ag_sous_titre" varchar DEFAULT 'M2-AGEF — Gymnastique Aquatique',
  	"version_carte_gym_titre" varchar DEFAULT 'Gymnastique',
  	"version_carte_gym_sous_titre" varchar DEFAULT 'M2-AGEF — Gymnastique d’Entretien',
  	"version_carte_danse_titre" varchar DEFAULT 'Danse',
  	"version_carte_danse_sous_titre" varchar DEFAULT 'M2-AD — Danse de Salon',
  	"version_carte_rando_titre" varchar DEFAULT 'Randonnée',
  	"version_carte_rando_sous_titre" varchar DEFAULT 'M2-AA — Activités de Randonnée',
  	"version_carte_raquettes_titre" varchar DEFAULT 'Tennis de table',
  	"version_carte_raquettes_sous_titre" varchar DEFAULT 'M2-AC — Activités de raquettes',
  	"version_carte_echecs_titre" varchar DEFAULT 'Échecs / Jeux de société',
  	"version_carte_echecs_sous_titre" varchar DEFAULT 'M2-JB — Jeux de table et de société',
  	"version_note" varchar DEFAULT 'Cliquez sur « Consulter le PDF » d’une fiche pour l’afficher en grand. Vous pourrez ensuite la télécharger, l’imprimer ou zoomer.',
  	"version_cta_titre" varchar DEFAULT 'Vous souhaitez devenir animateur ?',
  	"version_cta_texte" varchar DEFAULT 'Contactez-nous pour obtenir toutes les informations sur les formations disponibles.',
  	"version_cta_bouton" varchar DEFAULT 'Nous contacter',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
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
  CREATE INDEX "_formation_v_created_at_idx" ON "_formation_v" USING btree ("created_at");
  CREATE INDEX "_formation_v_updated_at_idx" ON "_formation_v" USING btree ("updated_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "formation" CASCADE;
  DROP TABLE "_formation_v" CASCADE;
  ALTER TABLE "roles_permissions" ALTER COLUMN "section" SET DATA TYPE text;
  DROP TYPE "public"."enum_roles_permissions_section";
  CREATE TYPE "public"."enum_roles_permissions_section" AS ENUM('vie-du-club', 'membres-bureau', 'activites', 'sorties', 'galerie', 'documents', 'media', 'flash-info', 'tarifs', 'apparence');
  ALTER TABLE "roles_permissions" ALTER COLUMN "section" SET DATA TYPE "public"."enum_roles_permissions_section" USING "section"::"public"."enum_roles_permissions_section";
  ALTER TABLE "_roles_v_version_permissions" ALTER COLUMN "section" SET DATA TYPE text;
  DROP TYPE "public"."enum__roles_v_version_permissions_section";
  CREATE TYPE "public"."enum__roles_v_version_permissions_section" AS ENUM('vie-du-club', 'membres-bureau', 'activites', 'sorties', 'galerie', 'documents', 'media', 'flash-info', 'tarifs', 'apparence');
  ALTER TABLE "_roles_v_version_permissions" ALTER COLUMN "section" SET DATA TYPE "public"."enum__roles_v_version_permissions_section" USING "section"::"public"."enum__roles_v_version_permissions_section";`)
}
