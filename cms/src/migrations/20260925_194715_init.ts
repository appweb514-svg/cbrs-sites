import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_vie_du_club_categorie" AS ENUM('club', 'sortie', 'evenement');
  CREATE TYPE "public"."enum_vie_du_club_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__vie_du_club_v_version_categorie" AS ENUM('club', 'sortie', 'evenement');
  CREATE TYPE "public"."enum__vie_du_club_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_activites_creneaux_jour" AS ENUM('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche', 'Voir planning');
  CREATE TYPE "public"."enum_activites_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__activites_v_version_creneaux_jour" AS ENUM('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche', 'Voir planning');
  CREATE TYPE "public"."enum__activites_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_sorties_type" AS ENUM('manifestation', 'sortie', 'voyage');
  CREATE TYPE "public"."enum_sorties_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__sorties_v_version_type" AS ENUM('manifestation', 'sortie', 'voyage');
  CREATE TYPE "public"."enum__sorties_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_documents_rubrique" AS ENUM('statuts', 'reglement', 'adhesion', 'assurance', 'federal', 'autre');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'bureau', 'activites', 'sorties', 'galerie');
  CREATE TABLE "vie_du_club" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titre" varchar,
  	"date" timestamp(3) with time zone,
  	"categorie" "enum_vie_du_club_categorie" DEFAULT 'club',
  	"image_id" integer,
  	"resume" varchar,
  	"lien" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_vie_du_club_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_vie_du_club_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_titre" varchar,
  	"version_date" timestamp(3) with time zone,
  	"version_categorie" "enum__vie_du_club_v_version_categorie" DEFAULT 'club',
  	"version_image_id" integer,
  	"version_resume" varchar,
  	"version_lien" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__vie_du_club_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "membres_bureau" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"fonction" varchar NOT NULL,
  	"photo_id" integer,
  	"ordre" numeric DEFAULT 10,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "activites_creneaux" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"jour" "enum_activites_creneaux_jour",
  	"horaire" varchar,
  	"lieu" varchar
  );
  
  CREATE TABLE "activites_infos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"texte" varchar
  );
  
  CREATE TABLE "activites" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar,
  	"icone_id" integer,
  	"description" varchar,
  	"presentation" varchar,
  	"point_rencontre" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_activites_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "activites_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "_activites_v_version_creneaux" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"jour" "enum__activites_v_version_creneaux_jour",
  	"horaire" varchar,
  	"lieu" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_activites_v_version_infos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"texte" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_activites_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_nom" varchar,
  	"version_icone_id" integer,
  	"version_description" varchar,
  	"version_presentation" varchar,
  	"version_point_rencontre" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__activites_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_activites_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "sorties" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_sorties_type" DEFAULT 'sortie',
  	"titre" varchar,
  	"date" timestamp(3) with time zone,
  	"lieu" varchar,
  	"image_id" integer,
  	"resume" varchar,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_sorties_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_sorties_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_type" "enum__sorties_v_version_type" DEFAULT 'sortie',
  	"version_titre" varchar,
  	"version_date" timestamp(3) with time zone,
  	"version_lieu" varchar,
  	"version_image_id" integer,
  	"version_resume" varchar,
  	"version_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__sorties_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "galerie" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"album" varchar,
  	"annee" numeric,
  	"photo_id" integer NOT NULL,
  	"legende" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titre" varchar NOT NULL,
  	"rubrique" "enum_documents_rubrique" NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_vignette_url" varchar,
  	"sizes_vignette_width" numeric,
  	"sizes_vignette_height" numeric,
  	"sizes_vignette_mime_type" varchar,
  	"sizes_vignette_filesize" numeric,
  	"sizes_vignette_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar
  );
  
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"vie_du_club_id" integer,
  	"membres_bureau_id" integer,
  	"activites_id" integer,
  	"sorties_id" integer,
  	"galerie_id" integer,
  	"documents_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "flash_info" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"actif" boolean DEFAULT true,
  	"message" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "tarifs_lignes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"montant" varchar NOT NULL,
  	"libelle" varchar NOT NULL
  );
  
  CREATE TABLE "tarifs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "parametres" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"depuis" varchar DEFAULT '1993',
  	"adherents" varchar DEFAULT '1 200',
  	"activites" varchar DEFAULT '≈ 20',
  	"email_contact" varchar DEFAULT 'cbrs@cbrs60.fr',
  	"email_sorties" varchar DEFAULT 'martinelcbrs60@gmail.com',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "vie_du_club" ADD CONSTRAINT "vie_du_club_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vie_du_club_v" ADD CONSTRAINT "_vie_du_club_v_parent_id_vie_du_club_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vie_du_club"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vie_du_club_v" ADD CONSTRAINT "_vie_du_club_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "membres_bureau" ADD CONSTRAINT "membres_bureau_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activites_creneaux" ADD CONSTRAINT "activites_creneaux_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."activites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "activites_infos" ADD CONSTRAINT "activites_infos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."activites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "activites" ADD CONSTRAINT "activites_icone_id_media_id_fk" FOREIGN KEY ("icone_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activites_rels" ADD CONSTRAINT "activites_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."activites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "activites_rels" ADD CONSTRAINT "activites_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_activites_v_version_creneaux" ADD CONSTRAINT "_activites_v_version_creneaux_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_activites_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_activites_v_version_infos" ADD CONSTRAINT "_activites_v_version_infos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_activites_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_activites_v" ADD CONSTRAINT "_activites_v_parent_id_activites_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."activites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_activites_v" ADD CONSTRAINT "_activites_v_version_icone_id_media_id_fk" FOREIGN KEY ("version_icone_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_activites_v_rels" ADD CONSTRAINT "_activites_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_activites_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_activites_v_rels" ADD CONSTRAINT "_activites_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sorties" ADD CONSTRAINT "sorties_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sorties_v" ADD CONSTRAINT "_sorties_v_parent_id_sorties_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sorties"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sorties_v" ADD CONSTRAINT "_sorties_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "galerie" ADD CONSTRAINT "galerie_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vie_du_club_fk" FOREIGN KEY ("vie_du_club_id") REFERENCES "public"."vie_du_club"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_membres_bureau_fk" FOREIGN KEY ("membres_bureau_id") REFERENCES "public"."membres_bureau"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_activites_fk" FOREIGN KEY ("activites_id") REFERENCES "public"."activites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sorties_fk" FOREIGN KEY ("sorties_id") REFERENCES "public"."sorties"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_galerie_fk" FOREIGN KEY ("galerie_id") REFERENCES "public"."galerie"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tarifs_lignes" ADD CONSTRAINT "tarifs_lignes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tarifs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "vie_du_club_image_idx" ON "vie_du_club" USING btree ("image_id");
  CREATE INDEX "vie_du_club_updated_at_idx" ON "vie_du_club" USING btree ("updated_at");
  CREATE INDEX "vie_du_club_created_at_idx" ON "vie_du_club" USING btree ("created_at");
  CREATE INDEX "vie_du_club__status_idx" ON "vie_du_club" USING btree ("_status");
  CREATE INDEX "_vie_du_club_v_parent_idx" ON "_vie_du_club_v" USING btree ("parent_id");
  CREATE INDEX "_vie_du_club_v_version_version_image_idx" ON "_vie_du_club_v" USING btree ("version_image_id");
  CREATE INDEX "_vie_du_club_v_version_version_updated_at_idx" ON "_vie_du_club_v" USING btree ("version_updated_at");
  CREATE INDEX "_vie_du_club_v_version_version_created_at_idx" ON "_vie_du_club_v" USING btree ("version_created_at");
  CREATE INDEX "_vie_du_club_v_version_version__status_idx" ON "_vie_du_club_v" USING btree ("version__status");
  CREATE INDEX "_vie_du_club_v_created_at_idx" ON "_vie_du_club_v" USING btree ("created_at");
  CREATE INDEX "_vie_du_club_v_updated_at_idx" ON "_vie_du_club_v" USING btree ("updated_at");
  CREATE INDEX "_vie_du_club_v_latest_idx" ON "_vie_du_club_v" USING btree ("latest");
  CREATE INDEX "membres_bureau_photo_idx" ON "membres_bureau" USING btree ("photo_id");
  CREATE INDEX "membres_bureau_updated_at_idx" ON "membres_bureau" USING btree ("updated_at");
  CREATE INDEX "membres_bureau_created_at_idx" ON "membres_bureau" USING btree ("created_at");
  CREATE INDEX "activites_creneaux_order_idx" ON "activites_creneaux" USING btree ("_order");
  CREATE INDEX "activites_creneaux_parent_id_idx" ON "activites_creneaux" USING btree ("_parent_id");
  CREATE INDEX "activites_infos_order_idx" ON "activites_infos" USING btree ("_order");
  CREATE INDEX "activites_infos_parent_id_idx" ON "activites_infos" USING btree ("_parent_id");
  CREATE INDEX "activites_icone_idx" ON "activites" USING btree ("icone_id");
  CREATE INDEX "activites_updated_at_idx" ON "activites" USING btree ("updated_at");
  CREATE INDEX "activites_created_at_idx" ON "activites" USING btree ("created_at");
  CREATE INDEX "activites__status_idx" ON "activites" USING btree ("_status");
  CREATE INDEX "activites_rels_order_idx" ON "activites_rels" USING btree ("order");
  CREATE INDEX "activites_rels_parent_idx" ON "activites_rels" USING btree ("parent_id");
  CREATE INDEX "activites_rels_path_idx" ON "activites_rels" USING btree ("path");
  CREATE INDEX "activites_rels_users_id_idx" ON "activites_rels" USING btree ("users_id");
  CREATE INDEX "_activites_v_version_creneaux_order_idx" ON "_activites_v_version_creneaux" USING btree ("_order");
  CREATE INDEX "_activites_v_version_creneaux_parent_id_idx" ON "_activites_v_version_creneaux" USING btree ("_parent_id");
  CREATE INDEX "_activites_v_version_infos_order_idx" ON "_activites_v_version_infos" USING btree ("_order");
  CREATE INDEX "_activites_v_version_infos_parent_id_idx" ON "_activites_v_version_infos" USING btree ("_parent_id");
  CREATE INDEX "_activites_v_parent_idx" ON "_activites_v" USING btree ("parent_id");
  CREATE INDEX "_activites_v_version_version_icone_idx" ON "_activites_v" USING btree ("version_icone_id");
  CREATE INDEX "_activites_v_version_version_updated_at_idx" ON "_activites_v" USING btree ("version_updated_at");
  CREATE INDEX "_activites_v_version_version_created_at_idx" ON "_activites_v" USING btree ("version_created_at");
  CREATE INDEX "_activites_v_version_version__status_idx" ON "_activites_v" USING btree ("version__status");
  CREATE INDEX "_activites_v_created_at_idx" ON "_activites_v" USING btree ("created_at");
  CREATE INDEX "_activites_v_updated_at_idx" ON "_activites_v" USING btree ("updated_at");
  CREATE INDEX "_activites_v_latest_idx" ON "_activites_v" USING btree ("latest");
  CREATE INDEX "_activites_v_rels_order_idx" ON "_activites_v_rels" USING btree ("order");
  CREATE INDEX "_activites_v_rels_parent_idx" ON "_activites_v_rels" USING btree ("parent_id");
  CREATE INDEX "_activites_v_rels_path_idx" ON "_activites_v_rels" USING btree ("path");
  CREATE INDEX "_activites_v_rels_users_id_idx" ON "_activites_v_rels" USING btree ("users_id");
  CREATE INDEX "sorties_image_idx" ON "sorties" USING btree ("image_id");
  CREATE INDEX "sorties_updated_at_idx" ON "sorties" USING btree ("updated_at");
  CREATE INDEX "sorties_created_at_idx" ON "sorties" USING btree ("created_at");
  CREATE INDEX "sorties__status_idx" ON "sorties" USING btree ("_status");
  CREATE INDEX "_sorties_v_parent_idx" ON "_sorties_v" USING btree ("parent_id");
  CREATE INDEX "_sorties_v_version_version_image_idx" ON "_sorties_v" USING btree ("version_image_id");
  CREATE INDEX "_sorties_v_version_version_updated_at_idx" ON "_sorties_v" USING btree ("version_updated_at");
  CREATE INDEX "_sorties_v_version_version_created_at_idx" ON "_sorties_v" USING btree ("version_created_at");
  CREATE INDEX "_sorties_v_version_version__status_idx" ON "_sorties_v" USING btree ("version__status");
  CREATE INDEX "_sorties_v_created_at_idx" ON "_sorties_v" USING btree ("created_at");
  CREATE INDEX "_sorties_v_updated_at_idx" ON "_sorties_v" USING btree ("updated_at");
  CREATE INDEX "_sorties_v_latest_idx" ON "_sorties_v" USING btree ("latest");
  CREATE INDEX "galerie_photo_idx" ON "galerie" USING btree ("photo_id");
  CREATE INDEX "galerie_updated_at_idx" ON "galerie" USING btree ("updated_at");
  CREATE INDEX "galerie_created_at_idx" ON "galerie" USING btree ("created_at");
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "documents_filename_idx" ON "documents" USING btree ("filename");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_vignette_sizes_vignette_filename_idx" ON "media" USING btree ("sizes_vignette_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_vie_du_club_id_idx" ON "payload_locked_documents_rels" USING btree ("vie_du_club_id");
  CREATE INDEX "payload_locked_documents_rels_membres_bureau_id_idx" ON "payload_locked_documents_rels" USING btree ("membres_bureau_id");
  CREATE INDEX "payload_locked_documents_rels_activites_id_idx" ON "payload_locked_documents_rels" USING btree ("activites_id");
  CREATE INDEX "payload_locked_documents_rels_sorties_id_idx" ON "payload_locked_documents_rels" USING btree ("sorties_id");
  CREATE INDEX "payload_locked_documents_rels_galerie_id_idx" ON "payload_locked_documents_rels" USING btree ("galerie_id");
  CREATE INDEX "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "tarifs_lignes_order_idx" ON "tarifs_lignes" USING btree ("_order");
  CREATE INDEX "tarifs_lignes_parent_id_idx" ON "tarifs_lignes" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "vie_du_club" CASCADE;
  DROP TABLE "_vie_du_club_v" CASCADE;
  DROP TABLE "membres_bureau" CASCADE;
  DROP TABLE "activites_creneaux" CASCADE;
  DROP TABLE "activites_infos" CASCADE;
  DROP TABLE "activites" CASCADE;
  DROP TABLE "activites_rels" CASCADE;
  DROP TABLE "_activites_v_version_creneaux" CASCADE;
  DROP TABLE "_activites_v_version_infos" CASCADE;
  DROP TABLE "_activites_v" CASCADE;
  DROP TABLE "_activites_v_rels" CASCADE;
  DROP TABLE "sorties" CASCADE;
  DROP TABLE "_sorties_v" CASCADE;
  DROP TABLE "galerie" CASCADE;
  DROP TABLE "documents" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "flash_info" CASCADE;
  DROP TABLE "tarifs_lignes" CASCADE;
  DROP TABLE "tarifs" CASCADE;
  DROP TABLE "parametres" CASCADE;
  DROP TYPE "public"."enum_vie_du_club_categorie";
  DROP TYPE "public"."enum_vie_du_club_status";
  DROP TYPE "public"."enum__vie_du_club_v_version_categorie";
  DROP TYPE "public"."enum__vie_du_club_v_version_status";
  DROP TYPE "public"."enum_activites_creneaux_jour";
  DROP TYPE "public"."enum_activites_status";
  DROP TYPE "public"."enum__activites_v_version_creneaux_jour";
  DROP TYPE "public"."enum__activites_v_version_status";
  DROP TYPE "public"."enum_sorties_type";
  DROP TYPE "public"."enum_sorties_status";
  DROP TYPE "public"."enum__sorties_v_version_type";
  DROP TYPE "public"."enum__sorties_v_version_status";
  DROP TYPE "public"."enum_documents_rubrique";
  DROP TYPE "public"."enum_users_roles";`)
}
