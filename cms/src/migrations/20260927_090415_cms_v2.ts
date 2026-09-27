import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import activitesSite from '../seed/activites.json'
import { ROLES_DEPART } from '../seed/import'
import { SITE_PAGES } from '../sitePages'

// Clés d’ordre (fractional-indexing) composées de chiffres seuls : triées de la même façon quelle que soit la collation.
const cleOrdre = (i: number) => {
  let n = i
  for (let longueur = 1; longueur < 6; longueur++) {
    const taille = 10 ** longueur
    if (n < taille) return String.fromCharCode(96 + longueur) + String(n).padStart(longueur, '0')
    n -= taille
  }
  throw new Error('Trop de photos dans la galerie')
}

type Ligne = Record<string, unknown>
const lignes = async (db: MigrateUpArgs['db'], requete: ReturnType<typeof sql>) =>
  ((await db.execute(requete)) as unknown as { rows: Ligne[] }).rows

// Ancien lien libre (texte) → lien structuré (page du site, lien externe ou aucun).
const convertirLien = (lien: unknown) => {
  const valeur = typeof lien === 'string' ? lien.trim() : ''
  const chemin = valeur.replace(/\.html$/, '').replace(/\/index$/, '/') || ''
  if (chemin && SITE_PAGES.some((page) => page.value === chemin)) return { type: 'page', page: chemin, url: null }
  if (/^https:\/\//.test(valeur)) return { type: 'externe', page: null, url: valeur }
  return { type: 'aucun', page: null, url: null }
}

const CATEGORIE_DOCUMENT: Record<string, string> = {
  statuts: 'vie-associative',
  reglement: 'vie-associative',
  adhesion: 'adhesion',
  assurance: 'assurance',
  federal: 'assurance',
  autre: 'autre',
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // 1. Sauvegarde des données dont les colonnes vont disparaître (rôles, référents, liens, rubriques).
  await db.execute(sql`
  CREATE TABLE "_migr_roles" AS SELECT "parent_id" AS "user_id", "value"::text AS "role" FROM "users_roles";
  CREATE TABLE "_migr_referents" AS SELECT "parent_id" AS "activite_id", "users_id" AS "user_id" FROM "activites_rels" WHERE "path" = 'referents' AND "users_id" IS NOT NULL;
  CREATE TABLE "_migr_liens" AS SELECT "id", "lien" FROM "vie_du_club";
  CREATE TABLE "_migr_liens_v" AS SELECT "id", "version_lien" AS "lien" FROM "_vie_du_club_v";
  CREATE TABLE "_migr_rubriques" AS SELECT "id", "rubrique"::text AS "rubrique" FROM "documents";
  UPDATE "galerie" SET "annee" = EXTRACT(YEAR FROM "created_at") WHERE "annee" IS NULL;
  DELETE FROM "activites_rels" WHERE "path" = 'referents';
  DELETE FROM "_activites_v_rels" WHERE "path" = 'version.referents';`)

  // 2. Schéma généré par Payload.
  await db.execute(sql`
   CREATE TYPE "public"."enum_vie_du_club_lien_type" AS ENUM('aucun', 'page', 'activite', 'sortie', 'externe');
  CREATE TYPE "public"."enum_vie_du_club_lien_page" AS ENUM('/', '/activites', '/planning', '/sorties-voyages', '/galerie', '/adhesion', '/formation', '/evenement', '/statuts', '/liens-utiles', '/contact', '/mentions-legales', '/conditions-utilisation');
  CREATE TYPE "public"."enum__vie_du_club_v_version_lien_type" AS ENUM('aucun', 'page', 'activite', 'sortie', 'externe');
  CREATE TYPE "public"."enum__vie_du_club_v_version_lien_page" AS ENUM('/', '/activites', '/planning', '/sorties-voyages', '/galerie', '/adhesion', '/formation', '/evenement', '/statuts', '/liens-utiles', '/contact', '/mentions-legales', '/conditions-utilisation');
  CREATE TYPE "public"."enum_galerie_categorie" AS ENUM('sport', 'sortie', 'vie');
  CREATE TYPE "public"."enum_galerie_activite" AS ENUM('marche-nordique', 'tai-chi', 'randonnee', 'gymnastique', 'tennis-de-table', 'danse', 'cyclisme', 'aquagym', 'petanque', 'tennis', 'atelier-memoire', 'autres-sport', 'autres-sorties', 'vie-club', 'autres');
  CREATE TYPE "public"."enum_documents_categorie" AS ENUM('adhesion', 'vie-associative', 'formations', 'assurance', 'autre');
  CREATE TYPE "public"."enum_documents_remplace_lien_officiel" AS ENUM('aucun', 'statuts', 'reglement', 'adhesion', 'assurance', 'federal');
  CREATE TYPE "public"."enum_roles_permissions_actions" AS ENUM('voir', 'creer', 'modifier', 'publier', 'supprimer');
  CREATE TYPE "public"."enum_roles_permissions_section" AS ENUM('vie-du-club', 'membres-bureau', 'activites', 'sorties', 'galerie', 'documents', 'media', 'flash-info', 'tarifs', 'apparence');
  CREATE TYPE "public"."enum_apparence_en_tetes_page" AS ENUM('/', '/activites', '/planning', '/sorties-voyages', '/galerie', '/adhesion', '/formation', '/evenement', '/statuts', '/liens-utiles', '/contact', '/mentions-legales', '/conditions-utilisation');
  CREATE TYPE "public"."enum_apparence_police_titres" AS ENUM('defaut', 'Inter', 'Manrope', 'Poppins', 'Lato', 'Open Sans', 'Nunito', 'Merriweather', 'Source Serif 4');
  CREATE TYPE "public"."enum_apparence_police_sous_titres" AS ENUM('defaut', 'Inter', 'Manrope', 'Poppins', 'Lato', 'Open Sans', 'Nunito', 'Merriweather', 'Source Serif 4');
  CREATE TYPE "public"."enum_apparence_police_texte" AS ENUM('defaut', 'Inter', 'Manrope', 'Poppins', 'Lato', 'Open Sans', 'Nunito', 'Merriweather', 'Source Serif 4');
  CREATE TYPE "public"."enum__apparence_v_version_en_tetes_page" AS ENUM('/', '/activites', '/planning', '/sorties-voyages', '/galerie', '/adhesion', '/formation', '/evenement', '/statuts', '/liens-utiles', '/contact', '/mentions-legales', '/conditions-utilisation');
  CREATE TYPE "public"."enum__apparence_v_version_police_titres" AS ENUM('defaut', 'Inter', 'Manrope', 'Poppins', 'Lato', 'Open Sans', 'Nunito', 'Merriweather', 'Source Serif 4');
  CREATE TYPE "public"."enum__apparence_v_version_police_sous_titres" AS ENUM('defaut', 'Inter', 'Manrope', 'Poppins', 'Lato', 'Open Sans', 'Nunito', 'Merriweather', 'Source Serif 4');
  CREATE TYPE "public"."enum__apparence_v_version_police_texte" AS ENUM('defaut', 'Inter', 'Manrope', 'Poppins', 'Lato', 'Open Sans', 'Nunito', 'Merriweather', 'Source Serif 4');
  CREATE TABLE "activites_animateurs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nom" varchar,
  	"photo_id" integer
  );
  
  CREATE TABLE "_activites_v_version_animateurs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar,
  	"photo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"roles_id" integer
  );
  
  CREATE TABLE "roles_permissions_actions" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_roles_permissions_actions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "roles_permissions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section" "enum_roles_permissions_section" NOT NULL
  );
  
  CREATE TABLE "roles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "roles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"activites_id" integer
  );
  
  CREATE TABLE "apparence_en_tetes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"page" "enum_apparence_en_tetes_page" NOT NULL,
  	"titre" varchar,
  	"sous_titre" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "apparence" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"police_titres" "enum_apparence_police_titres" DEFAULT 'defaut' NOT NULL,
  	"police_sous_titres" "enum_apparence_police_sous_titres" DEFAULT 'defaut' NOT NULL,
  	"police_texte" "enum_apparence_police_texte" DEFAULT 'defaut' NOT NULL,
  	"couleur_principale" varchar DEFAULT '#0a3273' NOT NULL,
  	"couleur_secondaire" varchar DEFAULT '#437c14' NOT NULL,
  	"couleur_accent" varchar DEFAULT '#145c75' NOT NULL,
  	"valeurs_origine" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_apparence_v_version_en_tetes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"page" "enum__apparence_v_version_en_tetes_page" NOT NULL,
  	"titre" varchar,
  	"sous_titre" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_apparence_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_police_titres" "enum__apparence_v_version_police_titres" DEFAULT 'defaut' NOT NULL,
  	"version_police_sous_titres" "enum__apparence_v_version_police_sous_titres" DEFAULT 'defaut' NOT NULL,
  	"version_police_texte" "enum__apparence_v_version_police_texte" DEFAULT 'defaut' NOT NULL,
  	"version_couleur_principale" varchar DEFAULT '#0a3273' NOT NULL,
  	"version_couleur_secondaire" varchar DEFAULT '#437c14' NOT NULL,
  	"version_couleur_accent" varchar DEFAULT '#145c75' NOT NULL,
  	"version_valeurs_origine" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_roles" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_roles" CASCADE;
  ALTER TABLE "activites_rels" DROP CONSTRAINT "activites_rels_users_fk";
  
  ALTER TABLE "_activites_v_rels" DROP CONSTRAINT "_activites_v_rels_users_fk";
  
  DROP INDEX "activites_rels_users_id_idx";
  DROP INDEX "_activites_v_rels_users_id_idx";
  ALTER TABLE "galerie" ALTER COLUMN "annee" SET NOT NULL;
  ALTER TABLE "vie_du_club" ADD COLUMN "lien_type" "enum_vie_du_club_lien_type" DEFAULT 'aucun';
  ALTER TABLE "vie_du_club" ADD COLUMN "lien_page" "enum_vie_du_club_lien_page";
  ALTER TABLE "vie_du_club" ADD COLUMN "lien_activite_id" integer;
  ALTER TABLE "vie_du_club" ADD COLUMN "lien_sortie_id" integer;
  ALTER TABLE "vie_du_club" ADD COLUMN "lien_url" varchar;
  ALTER TABLE "_vie_du_club_v" ADD COLUMN "version_lien_type" "enum__vie_du_club_v_version_lien_type" DEFAULT 'aucun';
  ALTER TABLE "_vie_du_club_v" ADD COLUMN "version_lien_page" "enum__vie_du_club_v_version_lien_page";
  ALTER TABLE "_vie_du_club_v" ADD COLUMN "version_lien_activite_id" integer;
  ALTER TABLE "_vie_du_club_v" ADD COLUMN "version_lien_sortie_id" integer;
  ALTER TABLE "_vie_du_club_v" ADD COLUMN "version_lien_url" varchar;
  ALTER TABLE "activites" ADD COLUMN "niveau" varchar;
  ALTER TABLE "activites" ADD COLUMN "photo_id" integer;
  ALTER TABLE "activites" ADD COLUMN "carte_lieu" varchar;
  ALTER TABLE "activites" ADD COLUMN "carte_lat" numeric;
  ALTER TABLE "activites" ADD COLUMN "carte_lon" numeric;
  ALTER TABLE "activites" ADD COLUMN "slug" varchar;
  ALTER TABLE "activites" ADD COLUMN "ordre" numeric DEFAULT 100;
  ALTER TABLE "activites_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "_activites_v" ADD COLUMN "version_niveau" varchar;
  ALTER TABLE "_activites_v" ADD COLUMN "version_photo_id" integer;
  ALTER TABLE "_activites_v" ADD COLUMN "version_carte_lieu" varchar;
  ALTER TABLE "_activites_v" ADD COLUMN "version_carte_lat" numeric;
  ALTER TABLE "_activites_v" ADD COLUMN "version_carte_lon" numeric;
  ALTER TABLE "_activites_v" ADD COLUMN "version_slug" varchar;
  ALTER TABLE "_activites_v" ADD COLUMN "version_ordre" numeric DEFAULT 100;
  ALTER TABLE "_activites_v_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "galerie" ADD COLUMN "_order" varchar;
  ALTER TABLE "galerie" ADD COLUMN "categorie" "enum_galerie_categorie" DEFAULT 'vie' NOT NULL;
  ALTER TABLE "galerie" ADD COLUMN "activite" "enum_galerie_activite" DEFAULT 'autres';
  ALTER TABLE "galerie" ADD COLUMN "fichier_origine" varchar;
  ALTER TABLE "galerie" ADD COLUMN "afficher_sur_site" boolean DEFAULT true;
  ALTER TABLE "documents" ADD COLUMN "categorie" "enum_documents_categorie" DEFAULT 'autre' NOT NULL;
  ALTER TABLE "documents" ADD COLUMN "remplace_lien_officiel" "enum_documents_remplace_lien_officiel" DEFAULT 'aucun' NOT NULL;
  ALTER TABLE "documents" ADD COLUMN "afficher_sur_site" boolean DEFAULT true;
  ALTER TABLE "documents" ADD COLUMN "ordre" numeric DEFAULT 100;
  ALTER TABLE "users" ADD COLUMN "est_administrateur" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "roles_id" integer;
  ALTER TABLE "activites_animateurs" ADD CONSTRAINT "activites_animateurs_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activites_animateurs" ADD CONSTRAINT "activites_animateurs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."activites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_activites_v_version_animateurs" ADD CONSTRAINT "_activites_v_version_animateurs_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_activites_v_version_animateurs" ADD CONSTRAINT "_activites_v_version_animateurs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_activites_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_roles_fk" FOREIGN KEY ("roles_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roles_permissions_actions" ADD CONSTRAINT "roles_permissions_actions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."roles_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roles_permissions" ADD CONSTRAINT "roles_permissions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roles_rels" ADD CONSTRAINT "roles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roles_rels" ADD CONSTRAINT "roles_rels_activites_fk" FOREIGN KEY ("activites_id") REFERENCES "public"."activites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "apparence_en_tetes" ADD CONSTRAINT "apparence_en_tetes_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "apparence_en_tetes" ADD CONSTRAINT "apparence_en_tetes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."apparence"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_apparence_v_version_en_tetes" ADD CONSTRAINT "_apparence_v_version_en_tetes_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_apparence_v_version_en_tetes" ADD CONSTRAINT "_apparence_v_version_en_tetes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_apparence_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "activites_animateurs_order_idx" ON "activites_animateurs" USING btree ("_order");
  CREATE INDEX "activites_animateurs_parent_id_idx" ON "activites_animateurs" USING btree ("_parent_id");
  CREATE INDEX "activites_animateurs_photo_idx" ON "activites_animateurs" USING btree ("photo_id");
  CREATE INDEX "_activites_v_version_animateurs_order_idx" ON "_activites_v_version_animateurs" USING btree ("_order");
  CREATE INDEX "_activites_v_version_animateurs_parent_id_idx" ON "_activites_v_version_animateurs" USING btree ("_parent_id");
  CREATE INDEX "_activites_v_version_animateurs_photo_idx" ON "_activites_v_version_animateurs" USING btree ("photo_id");
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_roles_id_idx" ON "users_rels" USING btree ("roles_id");
  CREATE INDEX "roles_permissions_actions_order_idx" ON "roles_permissions_actions" USING btree ("order");
  CREATE INDEX "roles_permissions_actions_parent_idx" ON "roles_permissions_actions" USING btree ("parent_id");
  CREATE INDEX "roles_permissions_order_idx" ON "roles_permissions" USING btree ("_order");
  CREATE INDEX "roles_permissions_parent_id_idx" ON "roles_permissions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "roles_nom_idx" ON "roles" USING btree ("nom");
  CREATE INDEX "roles_updated_at_idx" ON "roles" USING btree ("updated_at");
  CREATE INDEX "roles_created_at_idx" ON "roles" USING btree ("created_at");
  CREATE INDEX "roles_rels_order_idx" ON "roles_rels" USING btree ("order");
  CREATE INDEX "roles_rels_parent_idx" ON "roles_rels" USING btree ("parent_id");
  CREATE INDEX "roles_rels_path_idx" ON "roles_rels" USING btree ("path");
  CREATE INDEX "roles_rels_activites_id_idx" ON "roles_rels" USING btree ("activites_id");
  CREATE INDEX "apparence_en_tetes_order_idx" ON "apparence_en_tetes" USING btree ("_order");
  CREATE INDEX "apparence_en_tetes_parent_id_idx" ON "apparence_en_tetes" USING btree ("_parent_id");
  CREATE INDEX "apparence_en_tetes_image_idx" ON "apparence_en_tetes" USING btree ("image_id");
  CREATE INDEX "_apparence_v_version_en_tetes_order_idx" ON "_apparence_v_version_en_tetes" USING btree ("_order");
  CREATE INDEX "_apparence_v_version_en_tetes_parent_id_idx" ON "_apparence_v_version_en_tetes" USING btree ("_parent_id");
  CREATE INDEX "_apparence_v_version_en_tetes_image_idx" ON "_apparence_v_version_en_tetes" USING btree ("image_id");
  CREATE INDEX "_apparence_v_created_at_idx" ON "_apparence_v" USING btree ("created_at");
  CREATE INDEX "_apparence_v_updated_at_idx" ON "_apparence_v" USING btree ("updated_at");
  ALTER TABLE "vie_du_club" ADD CONSTRAINT "vie_du_club_lien_activite_id_activites_id_fk" FOREIGN KEY ("lien_activite_id") REFERENCES "public"."activites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vie_du_club" ADD CONSTRAINT "vie_du_club_lien_sortie_id_sorties_id_fk" FOREIGN KEY ("lien_sortie_id") REFERENCES "public"."sorties"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vie_du_club_v" ADD CONSTRAINT "_vie_du_club_v_version_lien_activite_id_activites_id_fk" FOREIGN KEY ("version_lien_activite_id") REFERENCES "public"."activites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vie_du_club_v" ADD CONSTRAINT "_vie_du_club_v_version_lien_sortie_id_sorties_id_fk" FOREIGN KEY ("version_lien_sortie_id") REFERENCES "public"."sorties"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activites" ADD CONSTRAINT "activites_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activites_rels" ADD CONSTRAINT "activites_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_activites_v" ADD CONSTRAINT "_activites_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_activites_v_rels" ADD CONSTRAINT "_activites_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_roles_fk" FOREIGN KEY ("roles_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "vie_du_club_lien_lien_activite_idx" ON "vie_du_club" USING btree ("lien_activite_id");
  CREATE INDEX "vie_du_club_lien_lien_sortie_idx" ON "vie_du_club" USING btree ("lien_sortie_id");
  CREATE INDEX "_vie_du_club_v_version_lien_version_lien_activite_idx" ON "_vie_du_club_v" USING btree ("version_lien_activite_id");
  CREATE INDEX "_vie_du_club_v_version_lien_version_lien_sortie_idx" ON "_vie_du_club_v" USING btree ("version_lien_sortie_id");
  CREATE INDEX "activites_photo_idx" ON "activites" USING btree ("photo_id");
  CREATE UNIQUE INDEX "activites_slug_idx" ON "activites" USING btree ("slug");
  CREATE INDEX "activites_rels_media_id_idx" ON "activites_rels" USING btree ("media_id");
  CREATE INDEX "_activites_v_version_version_photo_idx" ON "_activites_v" USING btree ("version_photo_id");
  CREATE INDEX "_activites_v_version_version_slug_idx" ON "_activites_v" USING btree ("version_slug");
  CREATE INDEX "_activites_v_rels_media_id_idx" ON "_activites_v_rels" USING btree ("media_id");
  CREATE INDEX "galerie__order_idx" ON "galerie" USING btree ("_order");
  CREATE INDEX "galerie_fichier_origine_idx" ON "galerie" USING btree ("fichier_origine");
  CREATE INDEX "payload_locked_documents_rels_roles_id_idx" ON "payload_locked_documents_rels" USING btree ("roles_id");
  ALTER TABLE "vie_du_club" DROP COLUMN "lien";
  ALTER TABLE "_vie_du_club_v" DROP COLUMN "version_lien";
  ALTER TABLE "activites_rels" DROP COLUMN "users_id";
  ALTER TABLE "_activites_v_rels" DROP COLUMN "users_id";
  ALTER TABLE "documents" DROP COLUMN "rubrique";
  DROP TYPE "public"."enum_documents_rubrique";
  DROP TYPE "public"."enum_users_roles";`)

  // 3. Conversion des données.
  await db.execute(sql`
  UPDATE "users" SET "est_administrateur" = true WHERE "id" IN (SELECT "user_id" FROM "_migr_roles" WHERE "role" = 'admin');`)

  for (const lien of await lignes(db, sql`SELECT "id", "lien" FROM "_migr_liens"`)) {
    const l = convertirLien(lien.lien)
    await db.execute(sql`UPDATE "vie_du_club" SET "lien_type" = ${l.type}, "lien_page" = ${l.page}, "lien_url" = ${l.url} WHERE "id" = ${lien.id}`)
  }
  for (const lien of await lignes(db, sql`SELECT "id", "lien" FROM "_migr_liens_v"`)) {
    const l = convertirLien(lien.lien)
    await db.execute(sql`UPDATE "_vie_du_club_v" SET "version_lien_type" = ${l.type}, "version_lien_page" = ${l.page}, "version_lien_url" = ${l.url} WHERE "id" = ${lien.id}`)
  }

  // Un document ne remplaçait un lien officiel que via sa rubrique : on conserve ce choix, désormais explicite.
  for (const doc of await lignes(db, sql`SELECT "id", "rubrique" FROM "_migr_rubriques"`)) {
    const rubrique = String(doc.rubrique ?? 'autre')
    const remplace = rubrique === 'autre' ? 'aucun' : rubrique
    await db.execute(sql`UPDATE "documents" SET "categorie" = ${CATEGORIE_DOCUMENT[rubrique] ?? 'autre'}, "remplace_lien_officiel" = ${remplace} WHERE "id" = ${doc.id}`)
  }

  // Identifiant d’URL des activités existantes : repris du site quand le nom correspond.
  const slugParNom = new Map(activitesSite.map((a) => [a.nom.toLowerCase(), a.slug]))
  for (const activite of await lignes(db, sql`SELECT "id", "nom" FROM "activites" WHERE "slug" IS NULL`)) {
    const slug = slugParNom.get(String(activite.nom ?? '').toLowerCase()) ?? `activite-${activite.id}`
    await db.execute(sql`UPDATE "activites" SET "slug" = ${slug} WHERE "id" = ${activite.id}`)
  }
  await db.execute(sql`
  UPDATE "_activites_v" v SET "version_slug" = a."slug" FROM "activites" a WHERE v."parent_id" = a."id" AND v."version_slug" IS NULL;`)

  const photos = await lignes(db, sql`SELECT "id" FROM "galerie" ORDER BY "annee" DESC, "id"`)
  for (const [i, photo] of photos.entries()) {
    await db.execute(sql`UPDATE "galerie" SET "_order" = ${cleOrdre(i)} WHERE "id" = ${photo.id}`)
  }

  // Anciens rôles fixes → rôles modifiables ; référents d’activité → un rôle « Responsable <activité> ».
  const rolesUtilisateurs = new Map<number, number[]>()
  const attribuer = (userId: unknown, roleId: number) => {
    const id = Number(userId)
    rolesUtilisateurs.set(id, [...(rolesUtilisateurs.get(id) ?? []), roleId])
  }
  const anciensRoles = await lignes(db, sql`SELECT "user_id", "role" FROM "_migr_roles"`)
  const ANCIEN_VERS_NOUVEAU: Record<string, string> = {
    bureau: 'Bureau',
    sorties: 'Équipe Sorties & Voyages',
    galerie: 'Équipe Galerie',
  }
  for (const [ancien, nom] of Object.entries(ANCIEN_VERS_NOUVEAU)) {
    const titulaires = anciensRoles.filter((r) => r.role === ancien)
    if (!titulaires.length) continue
    const depart = ROLES_DEPART.find((r) => r.nom === nom)!
    const role = await payload.create({
      collection: 'roles',
      data: { nom, description: depart.description, permissions: depart.permissions },
      req,
    })
    titulaires.forEach((t) => attribuer(t.user_id, role.id))
  }
  const referents = await lignes(
    db,
    sql`SELECT r."activite_id", r."user_id", a."nom" FROM "_migr_referents" r JOIN "activites" a ON a."id" = r."activite_id" ORDER BY r."activite_id"`,
  )
  for (const activiteId of [...new Set(referents.map((r) => Number(r.activite_id)))]) {
    const concernes = referents.filter((r) => Number(r.activite_id) === activiteId)
    const role = await payload.create({
      collection: 'roles',
      data: {
        nom: `Responsable ${concernes[0].nom ?? `activité ${activiteId}`}`,
        description: 'Repris de l’ancien champ « référents » de l’activité.',
        permissions: [
          { section: 'activites', actions: ['voir', 'modifier', 'publier'] },
          { section: 'media', actions: ['voir', 'creer', 'modifier'] },
        ],
        activitesAutorisees: [activiteId],
      },
      req,
    })
    concernes.forEach((r) => attribuer(r.user_id, role.id))
  }
  for (const [userId, roleIds] of rolesUtilisateurs) {
    for (const [i, roleId] of [...new Set(roleIds)].entries()) {
      await db.execute(sql`INSERT INTO "users_rels" ("order", "parent_id", "path", "roles_id") VALUES (${i + 1}, ${userId}, 'roles', ${roleId})`)
    }
  }

  await db.execute(sql`
  DROP TABLE "_migr_roles";
  DROP TABLE "_migr_referents";
  DROP TABLE "_migr_liens";
  DROP TABLE "_migr_liens_v";
  DROP TABLE "_migr_rubriques";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_documents_rubrique" AS ENUM('statuts', 'reglement', 'adhesion', 'assurance', 'federal', 'autre');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'bureau', 'activites', 'sorties', 'galerie');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "activites_animateurs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_activites_v_version_animateurs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "roles_permissions_actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "roles_permissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "roles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "roles_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "apparence_en_tetes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "apparence" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_apparence_v_version_en_tetes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_apparence_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "activites_animateurs" CASCADE;
  DROP TABLE "_activites_v_version_animateurs" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "roles_permissions_actions" CASCADE;
  DROP TABLE "roles_permissions" CASCADE;
  DROP TABLE "roles" CASCADE;
  DROP TABLE "roles_rels" CASCADE;
  DROP TABLE "apparence_en_tetes" CASCADE;
  DROP TABLE "apparence" CASCADE;
  DROP TABLE "_apparence_v_version_en_tetes" CASCADE;
  DROP TABLE "_apparence_v" CASCADE;
  ALTER TABLE "vie_du_club" DROP CONSTRAINT "vie_du_club_lien_activite_id_activites_id_fk";
  
  ALTER TABLE "vie_du_club" DROP CONSTRAINT "vie_du_club_lien_sortie_id_sorties_id_fk";
  
  ALTER TABLE "_vie_du_club_v" DROP CONSTRAINT "_vie_du_club_v_version_lien_activite_id_activites_id_fk";
  
  ALTER TABLE "_vie_du_club_v" DROP CONSTRAINT "_vie_du_club_v_version_lien_sortie_id_sorties_id_fk";
  
  ALTER TABLE "activites" DROP CONSTRAINT "activites_photo_id_media_id_fk";
  
  ALTER TABLE "activites_rels" DROP CONSTRAINT "activites_rels_media_fk";
  
  ALTER TABLE "_activites_v" DROP CONSTRAINT "_activites_v_version_photo_id_media_id_fk";
  
  ALTER TABLE "_activites_v_rels" DROP CONSTRAINT "_activites_v_rels_media_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_roles_fk";
  
  DROP INDEX "vie_du_club_lien_lien_activite_idx";
  DROP INDEX "vie_du_club_lien_lien_sortie_idx";
  DROP INDEX "_vie_du_club_v_version_lien_version_lien_activite_idx";
  DROP INDEX "_vie_du_club_v_version_lien_version_lien_sortie_idx";
  DROP INDEX "activites_photo_idx";
  DROP INDEX "activites_slug_idx";
  DROP INDEX "activites_rels_media_id_idx";
  DROP INDEX "_activites_v_version_version_photo_idx";
  DROP INDEX "_activites_v_version_version_slug_idx";
  DROP INDEX "_activites_v_rels_media_id_idx";
  DROP INDEX "galerie__order_idx";
  DROP INDEX "galerie_fichier_origine_idx";
  DROP INDEX "payload_locked_documents_rels_roles_id_idx";
  ALTER TABLE "galerie" ALTER COLUMN "annee" DROP NOT NULL;
  ALTER TABLE "vie_du_club" ADD COLUMN "lien" varchar;
  ALTER TABLE "_vie_du_club_v" ADD COLUMN "version_lien" varchar;
  ALTER TABLE "activites_rels" ADD COLUMN "users_id" integer;
  ALTER TABLE "_activites_v_rels" ADD COLUMN "users_id" integer;
  ALTER TABLE "documents" ADD COLUMN "rubrique" "enum_documents_rubrique" NOT NULL;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  ALTER TABLE "activites_rels" ADD CONSTRAINT "activites_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_activites_v_rels" ADD CONSTRAINT "_activites_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "activites_rels_users_id_idx" ON "activites_rels" USING btree ("users_id");
  CREATE INDEX "_activites_v_rels_users_id_idx" ON "_activites_v_rels" USING btree ("users_id");
  ALTER TABLE "vie_du_club" DROP COLUMN "lien_type";
  ALTER TABLE "vie_du_club" DROP COLUMN "lien_page";
  ALTER TABLE "vie_du_club" DROP COLUMN "lien_activite_id";
  ALTER TABLE "vie_du_club" DROP COLUMN "lien_sortie_id";
  ALTER TABLE "vie_du_club" DROP COLUMN "lien_url";
  ALTER TABLE "_vie_du_club_v" DROP COLUMN "version_lien_type";
  ALTER TABLE "_vie_du_club_v" DROP COLUMN "version_lien_page";
  ALTER TABLE "_vie_du_club_v" DROP COLUMN "version_lien_activite_id";
  ALTER TABLE "_vie_du_club_v" DROP COLUMN "version_lien_sortie_id";
  ALTER TABLE "_vie_du_club_v" DROP COLUMN "version_lien_url";
  ALTER TABLE "activites" DROP COLUMN "niveau";
  ALTER TABLE "activites" DROP COLUMN "photo_id";
  ALTER TABLE "activites" DROP COLUMN "carte_lieu";
  ALTER TABLE "activites" DROP COLUMN "carte_lat";
  ALTER TABLE "activites" DROP COLUMN "carte_lon";
  ALTER TABLE "activites" DROP COLUMN "slug";
  ALTER TABLE "activites" DROP COLUMN "ordre";
  ALTER TABLE "activites_rels" DROP COLUMN "media_id";
  ALTER TABLE "_activites_v" DROP COLUMN "version_niveau";
  ALTER TABLE "_activites_v" DROP COLUMN "version_photo_id";
  ALTER TABLE "_activites_v" DROP COLUMN "version_carte_lieu";
  ALTER TABLE "_activites_v" DROP COLUMN "version_carte_lat";
  ALTER TABLE "_activites_v" DROP COLUMN "version_carte_lon";
  ALTER TABLE "_activites_v" DROP COLUMN "version_slug";
  ALTER TABLE "_activites_v" DROP COLUMN "version_ordre";
  ALTER TABLE "_activites_v_rels" DROP COLUMN "media_id";
  ALTER TABLE "galerie" DROP COLUMN "_order";
  ALTER TABLE "galerie" DROP COLUMN "categorie";
  ALTER TABLE "galerie" DROP COLUMN "activite";
  ALTER TABLE "galerie" DROP COLUMN "fichier_origine";
  ALTER TABLE "galerie" DROP COLUMN "afficher_sur_site";
  ALTER TABLE "documents" DROP COLUMN "categorie";
  ALTER TABLE "documents" DROP COLUMN "remplace_lien_officiel";
  ALTER TABLE "documents" DROP COLUMN "afficher_sur_site";
  ALTER TABLE "documents" DROP COLUMN "ordre";
  ALTER TABLE "users" DROP COLUMN "est_administrateur";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "roles_id";
  DROP TYPE "public"."enum_vie_du_club_lien_type";
  DROP TYPE "public"."enum_vie_du_club_lien_page";
  DROP TYPE "public"."enum__vie_du_club_v_version_lien_type";
  DROP TYPE "public"."enum__vie_du_club_v_version_lien_page";
  DROP TYPE "public"."enum_galerie_categorie";
  DROP TYPE "public"."enum_galerie_activite";
  DROP TYPE "public"."enum_documents_categorie";
  DROP TYPE "public"."enum_documents_remplace_lien_officiel";
  DROP TYPE "public"."enum_roles_permissions_actions";
  DROP TYPE "public"."enum_roles_permissions_section";
  DROP TYPE "public"."enum_apparence_en_tetes_page";
  DROP TYPE "public"."enum_apparence_police_titres";
  DROP TYPE "public"."enum_apparence_police_sous_titres";
  DROP TYPE "public"."enum_apparence_police_texte";
  DROP TYPE "public"."enum__apparence_v_version_en_tetes_page";
  DROP TYPE "public"."enum__apparence_v_version_police_titres";
  DROP TYPE "public"."enum__apparence_v_version_police_sous_titres";
  DROP TYPE "public"."enum__apparence_v_version_police_texte";`)
}
