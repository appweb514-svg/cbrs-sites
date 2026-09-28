import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum__galerie_v_version_categorie" AS ENUM('sport', 'sortie', 'vie');
  CREATE TYPE "public"."enum__galerie_v_version_activite" AS ENUM('marche-nordique', 'tai-chi', 'randonnee', 'gymnastique', 'tennis-de-table', 'danse', 'cyclisme', 'aquagym', 'petanque', 'tennis', 'atelier-memoire', 'autres-sport', 'autres-sorties', 'vie-club', 'autres');
  CREATE TYPE "public"."enum__documents_v_version_categorie" AS ENUM('adhesion', 'vie-associative', 'formations', 'assurance', 'autre');
  CREATE TYPE "public"."enum__documents_v_version_remplace_lien_officiel" AS ENUM('aucun', 'statuts', 'reglement', 'adhesion', 'assurance', 'federal');
  CREATE TYPE "public"."enum__roles_v_version_permissions_actions" AS ENUM('voir', 'creer', 'modifier', 'publier', 'supprimer');
  CREATE TYPE "public"."enum__roles_v_version_permissions_section" AS ENUM('vie-du-club', 'membres-bureau', 'activites', 'sorties', 'galerie', 'documents', 'media', 'flash-info', 'tarifs', 'apparence');
  CREATE TABLE "_membres_bureau_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_nom" varchar NOT NULL,
  	"version_fonction" varchar NOT NULL,
  	"version_photo_id" integer,
  	"version_ordre" numeric DEFAULT 10,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_galerie_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_photo_id" integer NOT NULL,
  	"version_legende" varchar,
  	"version_annee" numeric NOT NULL,
  	"version_categorie" "enum__galerie_v_version_categorie" DEFAULT 'vie' NOT NULL,
  	"version_activite" "enum__galerie_v_version_activite" DEFAULT 'autres',
  	"version_album" varchar,
  	"version_fichier_origine" varchar,
  	"version_afficher_sur_site" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_documents_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_titre" varchar NOT NULL,
  	"version_categorie" "enum__documents_v_version_categorie" DEFAULT 'autre' NOT NULL,
  	"version_description" varchar,
  	"version_remplace_lien_officiel" "enum__documents_v_version_remplace_lien_officiel" DEFAULT 'aucun' NOT NULL,
  	"version_afficher_sur_site" boolean DEFAULT true,
  	"version_ordre" numeric DEFAULT 100,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_media_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_alt" varchar NOT NULL,
  	"version_credit" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"version_sizes_vignette_url" varchar,
  	"version_sizes_vignette_width" numeric,
  	"version_sizes_vignette_height" numeric,
  	"version_sizes_vignette_mime_type" varchar,
  	"version_sizes_vignette_filesize" numeric,
  	"version_sizes_vignette_filename" varchar,
  	"version_sizes_large_url" varchar,
  	"version_sizes_large_width" numeric,
  	"version_sizes_large_height" numeric,
  	"version_sizes_large_mime_type" varchar,
  	"version_sizes_large_filesize" numeric,
  	"version_sizes_large_filename" varchar,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_users_v_version_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "_users_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_nom" varchar NOT NULL,
  	"version_est_administrateur" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_email" varchar NOT NULL,
  	"version_reset_password_token" varchar,
  	"version_reset_password_expiration" timestamp(3) with time zone,
  	"version_salt" varchar,
  	"version_hash" varchar,
  	"version_reset_password_requested_at" timestamp(3) with time zone,
  	"version_login_attempts" numeric DEFAULT 0,
  	"version_lock_until" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_users_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"roles_id" integer
  );
  
  CREATE TABLE "_roles_v_version_permissions_actions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__roles_v_version_permissions_actions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_roles_v_version_permissions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"section" "enum__roles_v_version_permissions_section" NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_roles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_nom" varchar NOT NULL,
  	"version_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_roles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"activites_id" integer
  );
  
  CREATE TABLE "_flash_info_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_actif" boolean DEFAULT true,
  	"version_message" varchar NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_tarifs_v_version_lignes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"montant" varchar NOT NULL,
  	"libelle" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_tarifs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_parametres_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_depuis" varchar DEFAULT '1993',
  	"version_adherents" varchar DEFAULT '1 200',
  	"version_activites" varchar DEFAULT '≈ 20',
  	"version_email_contact" varchar DEFAULT 'cbrs@cbrs60.fr',
  	"version_email_sorties" varchar DEFAULT 'martinelcbrs60@gmail.com',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "_apparence_v" ALTER COLUMN "version_intensite_teinte" SET DEFAULT 78;
  ALTER TABLE "_membres_bureau_v" ADD CONSTRAINT "_membres_bureau_v_parent_id_membres_bureau_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."membres_bureau"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_membres_bureau_v" ADD CONSTRAINT "_membres_bureau_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_galerie_v" ADD CONSTRAINT "_galerie_v_parent_id_galerie_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."galerie"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_galerie_v" ADD CONSTRAINT "_galerie_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_documents_v" ADD CONSTRAINT "_documents_v_parent_id_documents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_media_v" ADD CONSTRAINT "_media_v_parent_id_media_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_users_v_version_sessions" ADD CONSTRAINT "_users_v_version_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_users_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_users_v" ADD CONSTRAINT "_users_v_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_users_v_rels" ADD CONSTRAINT "_users_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_users_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_users_v_rels" ADD CONSTRAINT "_users_v_rels_roles_fk" FOREIGN KEY ("roles_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_roles_v_version_permissions_actions" ADD CONSTRAINT "_roles_v_version_permissions_actions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_roles_v_version_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_roles_v_version_permissions" ADD CONSTRAINT "_roles_v_version_permissions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_roles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_roles_v" ADD CONSTRAINT "_roles_v_parent_id_roles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_roles_v_rels" ADD CONSTRAINT "_roles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_roles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_roles_v_rels" ADD CONSTRAINT "_roles_v_rels_activites_fk" FOREIGN KEY ("activites_id") REFERENCES "public"."activites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tarifs_v_version_lignes" ADD CONSTRAINT "_tarifs_v_version_lignes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_tarifs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_membres_bureau_v_parent_idx" ON "_membres_bureau_v" USING btree ("parent_id");
  CREATE INDEX "_membres_bureau_v_version_version_photo_idx" ON "_membres_bureau_v" USING btree ("version_photo_id");
  CREATE INDEX "_membres_bureau_v_version_version_updated_at_idx" ON "_membres_bureau_v" USING btree ("version_updated_at");
  CREATE INDEX "_membres_bureau_v_version_version_created_at_idx" ON "_membres_bureau_v" USING btree ("version_created_at");
  CREATE INDEX "_membres_bureau_v_created_at_idx" ON "_membres_bureau_v" USING btree ("created_at");
  CREATE INDEX "_membres_bureau_v_updated_at_idx" ON "_membres_bureau_v" USING btree ("updated_at");
  CREATE INDEX "_galerie_v_parent_idx" ON "_galerie_v" USING btree ("parent_id");
  CREATE INDEX "_galerie_v_version_version__order_idx" ON "_galerie_v" USING btree ("version__order");
  CREATE INDEX "_galerie_v_version_version_photo_idx" ON "_galerie_v" USING btree ("version_photo_id");
  CREATE INDEX "_galerie_v_version_version_fichier_origine_idx" ON "_galerie_v" USING btree ("version_fichier_origine");
  CREATE INDEX "_galerie_v_version_version_updated_at_idx" ON "_galerie_v" USING btree ("version_updated_at");
  CREATE INDEX "_galerie_v_version_version_created_at_idx" ON "_galerie_v" USING btree ("version_created_at");
  CREATE INDEX "_galerie_v_created_at_idx" ON "_galerie_v" USING btree ("created_at");
  CREATE INDEX "_galerie_v_updated_at_idx" ON "_galerie_v" USING btree ("updated_at");
  CREATE INDEX "_documents_v_parent_idx" ON "_documents_v" USING btree ("parent_id");
  CREATE INDEX "_documents_v_version_version_updated_at_idx" ON "_documents_v" USING btree ("version_updated_at");
  CREATE INDEX "_documents_v_version_version_created_at_idx" ON "_documents_v" USING btree ("version_created_at");
  CREATE INDEX "_documents_v_version_version_filename_idx" ON "_documents_v" USING btree ("version_filename");
  CREATE INDEX "_documents_v_created_at_idx" ON "_documents_v" USING btree ("created_at");
  CREATE INDEX "_documents_v_updated_at_idx" ON "_documents_v" USING btree ("updated_at");
  CREATE INDEX "_media_v_parent_idx" ON "_media_v" USING btree ("parent_id");
  CREATE INDEX "_media_v_version_version_updated_at_idx" ON "_media_v" USING btree ("version_updated_at");
  CREATE INDEX "_media_v_version_version_created_at_idx" ON "_media_v" USING btree ("version_created_at");
  CREATE INDEX "_media_v_version_version_filename_idx" ON "_media_v" USING btree ("version_filename");
  CREATE INDEX "_media_v_version_sizes_vignette_version_sizes_vignette_f_idx" ON "_media_v" USING btree ("version_sizes_vignette_filename");
  CREATE INDEX "_media_v_version_sizes_large_version_sizes_large_filenam_idx" ON "_media_v" USING btree ("version_sizes_large_filename");
  CREATE INDEX "_media_v_created_at_idx" ON "_media_v" USING btree ("created_at");
  CREATE INDEX "_media_v_updated_at_idx" ON "_media_v" USING btree ("updated_at");
  CREATE INDEX "_users_v_version_sessions_order_idx" ON "_users_v_version_sessions" USING btree ("_order");
  CREATE INDEX "_users_v_version_sessions_parent_id_idx" ON "_users_v_version_sessions" USING btree ("_parent_id");
  CREATE INDEX "_users_v_parent_idx" ON "_users_v" USING btree ("parent_id");
  CREATE INDEX "_users_v_version_version_updated_at_idx" ON "_users_v" USING btree ("version_updated_at");
  CREATE INDEX "_users_v_version_version_created_at_idx" ON "_users_v" USING btree ("version_created_at");
  CREATE INDEX "_users_v_version_version_email_idx" ON "_users_v" USING btree ("version_email");
  CREATE INDEX "_users_v_created_at_idx" ON "_users_v" USING btree ("created_at");
  CREATE INDEX "_users_v_updated_at_idx" ON "_users_v" USING btree ("updated_at");
  CREATE INDEX "_users_v_rels_order_idx" ON "_users_v_rels" USING btree ("order");
  CREATE INDEX "_users_v_rels_parent_idx" ON "_users_v_rels" USING btree ("parent_id");
  CREATE INDEX "_users_v_rels_path_idx" ON "_users_v_rels" USING btree ("path");
  CREATE INDEX "_users_v_rels_roles_id_idx" ON "_users_v_rels" USING btree ("roles_id");
  CREATE INDEX "_roles_v_version_permissions_actions_order_idx" ON "_roles_v_version_permissions_actions" USING btree ("order");
  CREATE INDEX "_roles_v_version_permissions_actions_parent_idx" ON "_roles_v_version_permissions_actions" USING btree ("parent_id");
  CREATE INDEX "_roles_v_version_permissions_order_idx" ON "_roles_v_version_permissions" USING btree ("_order");
  CREATE INDEX "_roles_v_version_permissions_parent_id_idx" ON "_roles_v_version_permissions" USING btree ("_parent_id");
  CREATE INDEX "_roles_v_parent_idx" ON "_roles_v" USING btree ("parent_id");
  CREATE INDEX "_roles_v_version_version_nom_idx" ON "_roles_v" USING btree ("version_nom");
  CREATE INDEX "_roles_v_version_version_updated_at_idx" ON "_roles_v" USING btree ("version_updated_at");
  CREATE INDEX "_roles_v_version_version_created_at_idx" ON "_roles_v" USING btree ("version_created_at");
  CREATE INDEX "_roles_v_created_at_idx" ON "_roles_v" USING btree ("created_at");
  CREATE INDEX "_roles_v_updated_at_idx" ON "_roles_v" USING btree ("updated_at");
  CREATE INDEX "_roles_v_rels_order_idx" ON "_roles_v_rels" USING btree ("order");
  CREATE INDEX "_roles_v_rels_parent_idx" ON "_roles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_roles_v_rels_path_idx" ON "_roles_v_rels" USING btree ("path");
  CREATE INDEX "_roles_v_rels_activites_id_idx" ON "_roles_v_rels" USING btree ("activites_id");
  CREATE INDEX "_flash_info_v_created_at_idx" ON "_flash_info_v" USING btree ("created_at");
  CREATE INDEX "_flash_info_v_updated_at_idx" ON "_flash_info_v" USING btree ("updated_at");
  CREATE INDEX "_tarifs_v_version_lignes_order_idx" ON "_tarifs_v_version_lignes" USING btree ("_order");
  CREATE INDEX "_tarifs_v_version_lignes_parent_id_idx" ON "_tarifs_v_version_lignes" USING btree ("_parent_id");
  CREATE INDEX "_tarifs_v_created_at_idx" ON "_tarifs_v" USING btree ("created_at");
  CREATE INDEX "_tarifs_v_updated_at_idx" ON "_tarifs_v" USING btree ("updated_at");
  CREATE INDEX "_parametres_v_created_at_idx" ON "_parametres_v" USING btree ("created_at");
  CREATE INDEX "_parametres_v_updated_at_idx" ON "_parametres_v" USING btree ("updated_at");
  ALTER TABLE "documents" DROP COLUMN "_objectkey";
  ALTER TABLE "media" DROP COLUMN "_objectkey";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_membres_bureau_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_galerie_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_documents_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_media_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_users_v_version_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_users_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_users_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_roles_v_version_permissions_actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_roles_v_version_permissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_roles_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_roles_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_flash_info_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_tarifs_v_version_lignes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_tarifs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_parametres_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_membres_bureau_v" CASCADE;
  DROP TABLE "_galerie_v" CASCADE;
  DROP TABLE "_documents_v" CASCADE;
  DROP TABLE "_media_v" CASCADE;
  DROP TABLE "_users_v_version_sessions" CASCADE;
  DROP TABLE "_users_v" CASCADE;
  DROP TABLE "_users_v_rels" CASCADE;
  DROP TABLE "_roles_v_version_permissions_actions" CASCADE;
  DROP TABLE "_roles_v_version_permissions" CASCADE;
  DROP TABLE "_roles_v" CASCADE;
  DROP TABLE "_roles_v_rels" CASCADE;
  DROP TABLE "_flash_info_v" CASCADE;
  DROP TABLE "_tarifs_v_version_lignes" CASCADE;
  DROP TABLE "_tarifs_v" CASCADE;
  DROP TABLE "_parametres_v" CASCADE;
  ALTER TABLE "_apparence_v" ALTER COLUMN "version_intensite_teinte" SET DEFAULT 90;
  ALTER TABLE "documents" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
  DROP TYPE "public"."enum__galerie_v_version_categorie";
  DROP TYPE "public"."enum__galerie_v_version_activite";
  DROP TYPE "public"."enum__documents_v_version_categorie";
  DROP TYPE "public"."enum__documents_v_version_remplace_lien_officiel";
  DROP TYPE "public"."enum__roles_v_version_permissions_actions";
  DROP TYPE "public"."enum__roles_v_version_permissions_section";`)
}
