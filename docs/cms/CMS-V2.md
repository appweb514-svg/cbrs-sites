# CMS v2 — contrat technique (décisions d'architecture)

Worktree `cms-v2` (branche `appweb514-svg/cms-v2`) = site (`site3/`) + CMS Payload (`cms/`).
Objectif : le club administre le site **sans pouvoir le casser**.

## Règles communes

- Le site reste statique (HTML + `site3/cms-client.js`). Si le CMS ne répond pas, le site garde son contenu HTML actuel (repli).
- Libellés admin 100 % en français, avec `admin.description` qui dit **où** le contenu apparaît sur le site.
- Base locale SQLite (`cms/.env`). **Ne jamais utiliser `cms/.env.local` ni une base PostgreSQL de production.** Ne pas créer de migration : Opus les génère à la fin.
- Tests d'accès : `cms/tests/int/*.int.spec.ts` (vitest). Tout nouveau droit = un test.
- Pas de nouvelle dépendance npm sans nécessité (le demander via `ESCALATE:`).

## 1. Site servi à la racine du domaine

- Adresses publiques propres : `/`, `/activites`, `/activite?id=01`, `/galerie`, `/contact`… (plus de `/site3/…html`).
- `vercel.json` est la source unique des règles : réécriture `/<page>` → `/site3/<page>.html` ; fichiers (images, js, css, pdf) `/<chemin>` → `/site3/<chemin>` quand ils n'existent pas à la racine ; redirections permanentes des anciennes adresses (`/site3/<page>.html`, `/<page>.html`, `/<page>/`) vers `/<page>`. `/old-version` inchangé.
- Liens internes du site : `href="/activites"`, `href="/activite?id=01"`, `href="/"`.
- `tooling/serve.mjs` (Node, sans dépendance) sert le dépôt en local en appliquant les règles de `vercel.json` (pour tester comme en production).
- `site3/ui-shell.js` reconnaît la page courante avec et sans `.html` (et `/` = accueil).

## 2. Pages du site sélectionnables (liste déroulante)

- `cms/src/sitePages.ts` : liste unique `SITE_PAGES` `{ label, value }` (value = chemin propre, ex. `/activites`).
- Champ réutilisable `lienField()` (`cms/src/fields/lien.ts`) : groupe « Lien » avec
  `type` (radio : Aucun / Page du site / Activité / Sortie ou voyage / Adresse externe),
  `page` (select `SITE_PAGES`), `activite` (relation `activites`), `sortie` (relation `sorties`),
  `url` (texte, seulement pour Adresse externe, doit commencer par `https://`). Champs affichés selon `type` (`admin.condition`).
- Le site résout le lien : page → chemin ; activité → `/activite?id=<slug>` ; sortie → `/sortie?id=<id>` ; externe → url (nouvel onglet).
- Utilisé partout où il y avait un lien saisi à la main (ex. Vie du club « En savoir plus »).

## 3. Documents (PDF)

- Champs : `titre`, `categorie` (Adhésion, Vie associative, Formations, Assurance, Autre), `description`,
  `remplaceLienOfficiel` (select : Aucun / Statuts / Règlement intérieur / Fiche d'adhésion / Déclaration d'assurance / Imprimé fédéral ; défaut Aucun),
  `afficherSurSite` (case, défaut oui), `ordre` (nombre).
- Site : `liens-utiles` affiche la liste de **tous** les documents `afficherSurSite`, groupés par catégorie (titre, description, lien PDF).
  Les liens officiels (`a[data-cbrs-doc]`) ne sont remplacés que par le document le plus récent dont `remplaceLienOfficiel` correspond.

## 4. Galerie

- Collection `galerie` : `photo` (upload media, requis), `legende`, `annee` (nombre), `categorie` (sport / sortie / vie = CATEGORY_LABELS de galerie.html),
  `activite` (select = clés ACTIVITY_LABELS de galerie.html), `album` (texte libre), `ordre`, `afficherSurSite` (case, défaut oui).
- Seed idempotent `cms/src/seed/galerie.ts` : importe les 126 photos de `site3/photos/` avec les métadonnées de `scrapedPhotos` (extraites dans `cms/src/seed/galerie.json`) ; ne réimporte pas une photo déjà présente (clé = nom de fichier).
- Site : `galerie.html` utilise les photos du CMS quand l'API répond (même rendu, mêmes filtres), sinon `scrapedPhotos` (repli).

## 5. Activités (page complète gérée par le CMS)

- Chaque activité du CMS couvre **tout** ce qu'affiche `activite.html` : nom, slug (id du site), logo/icône, description courte, présentation,
  photo principale, galerie de photos (array d'uploads), créneaux, point de rendez-vous, carte (lieu / lat / lon), animateurs (nom + photo), infos pratiques, ordre d'affichage.
- Public : seules les activités **publiées** sont renvoyées (brouillon ou dépubliée = absente du site).
- Site : `activites.html` (liste) et `activite.html` (fiche) sont construits depuis le CMS ; repli = données HTML actuelles.
  Fiche d'une activité absente du CMS alors que l'API répond → message « Cette activité n'est plus proposée » + lien vers /activites.
- Seed : toutes les données de l'objet `activities` d'activite.html (logos et photos importés dans media, idempotent).

## 6. Rôles modifiables (sécurité : décisions d'Opus)

- Collection `roles` (« Rôles », groupe Administration, réservée aux administrateurs) : `nom`, `description`,
  `permissions` (array de { `section` : select des collections/globals éditables, `actions` : select multiple voir/creer/modifier/publier/supprimer }),
  `activitesAutorisees` (relation activites, multiple) : si renseigné, les droits sur `activites` (et sur les photos de galerie liées) sont limités à ces activités.
- Users : `estAdministrateur` (case ; modifiable seulement par un administrateur) + `roles` (relation `roles`, multiple ; modifiable seulement par un administrateur).
  Un administrateur a tous les droits, y compris Rôles, Bénévoles, Apparence, Paramètres. Impossible de supprimer ou rétrograder le **dernier** administrateur.
- `voir` = la section apparaît dans l'admin ; `publier` = droit de passer `_status` à `published` (sinon enregistrement en brouillon seulement, erreur claire en français si tentative).
- Lecture publique (visiteur) inchangée : contenus publiés seulement.
- Rôles de départ créés par le seed : Bureau, Équipe Sorties & Voyages, Équipe Galerie, et un exemple « Responsable Jeux de cartes » (limité à l'activité Jeux de Cartes).
  Les anciens rôles fixes (`roles` select) et le champ `referents` des activités sont remplacés.

## 7. Apparence du site (global `apparence`, versions + restauration)

- Réservé aux administrateurs (ou rôle ayant la section apparence). `versions: { max: 50 }` → onglet Versions natif de Payload avec « Restaurer ».
- Polices : `policeTitres` (H1), `policeSousTitres` (H2/H3), `policeTexte` (p) = select parmi une liste fixe testée (Inter, Manrope, Poppins, Lato, Open Sans, Nunito, Merriweather, Source Serif 4).
- Couleurs : `couleurPrincipale`, `couleurSecondaire`, `couleurAccent` (hex #RRGGBB, défauts = couleurs actuelles du site).
  Validation : contraste ≥ 4,5:1 avec le blanc (texte blanc sur boutons/bandeaux) sinon refus avec message français indiquant le ratio.
- `enTetes` : array { `page` (select SITE_PAGES, unique dans la liste), `titre`, `sousTitre`, `image` (upload) } : remplace le titre/sous-titre/image de l'en-tête de la page.
- `valeursOrigine` (case « Revenir à l'apparence d'origine au prochain enregistrement ») : hook qui remet toutes les valeurs par défaut et décoche la case.
- Site : couleurs Tailwind basées sur des variables CSS (`--cbrs-...`, défauts identiques à aujourd'hui) ; `cms-client.js` applique variables, polices (Google Fonts) et en-têtes ;
  un petit script en `<head>` réapplique le dernier thème mis en cache (localStorage, try/catch) pour éviter le clignotement.
