# Page Formation gérée par le CMS Implementation Plan

Created: 2026-09-30
Agent: opencode
Status: APPROVED
Approved: Yes
Iterations: 0
Worktree: Yes (Orca `formation-cms`, branche `appweb514-svg/formation-cms`, base `8fc1b3a`)
Type: Feature

## Summary

**Goal:** L'administration peut gérer depuis un écran CMS « Formation » les PDF des fiches de formation et les textes de la page `/formation` (parcours, étapes, cartes, appel au contact) ; la page publique affiche ces contenus et retombe sur le contenu actuel si le CMS est vide ou indisponible.

## Out of Scope

- Édition du bandeau (titre/sous-titre du héros) de `/formation` : reste dans Apparence › En-têtes de pages (décision utilisateur du 30/09).
- Mise en forme riche (gras, italique) des textes saisis : texte simple uniquement. À la première sauvegarde de l'écran, Payload enregistre les valeurs par défaut : la page rend alors les textes du CMS (le gras de l'étape 1 et les espaces insécables typographiques disparaissent, différence visuelle mineure acceptée).
- Ajout/suppression d'étapes ou de cartes : la structure (3 étapes, 6 fiches, 7 boutons — les fiches Aquagym et Gymnastique partagent M2-AGEF) reste figée dans `formation.html`.
- Statut `afficherSurSite` des PDF choisis : le global sert le PDF sélectionné même si ce statut est décoché (ce sont des fiches publiques, comportement accepté).
- Copie automatique des PDF actuels (`site3/docs/`) vers la médiathèque : l'admin dépose lui-même les PDF dans « Documents ».
- Application de la migration et déploiement en production : après fusion, hors PR (procédure en fin de plan).

## Approach

**Chosen:** Nouveau global Payload `Formation` (`cms/src/globals/Formation.ts`) + rendu client dans `site3/cms-client.js` via `register(...)`, sur les motifs existants `Tarifs` (global + `peut('section','modifier')`) et `renderDocuments`/`renderTarifs`.
**Why:** Même mécanique que les autres écrans (droits par section, versions + bouton retour, repli silencieux) ; coût : 34 champs (dont 6 uploads) et une migration Postgres, et les PDF passent par un proxy même-origine `/cms-docs` (nécessaire pour imprimer/télécharger depuis la visionneuse).

## Context for Implementer

Le site est statique (`site3/`, déployé tel quel) et lit le CMS côté navigateur : chaque page enregistre ses besoins avec `register(needed, path, apply)` dans `site3/cms-client.js` (l.522) ; en cas d'échec/timeout (3 s) le contenu HTML statique reste affiché — c'est le mécanisme de repli. Toute chaîne non vide renvoyée par le CMS écrase le texte statique ; un champ vide ⇒ ne rien écrire. Les uploads `documents` renvoient `url` (relatif `/api/documents/file/<fichier>`, servi en GET → 200 `application/pdf`, vérifié en prod le 30/09 ; `HEAD` renvoie 404) et `filename` ; la visionneuse PDF de `/formation` exige des PDF **même origine** pour `print()`/`download` (iframe cross-origin ⇒ `SecurityError` et téléchargement ignoré) d'où la réécriture Vercel `/cms-docs/*` vers le CMS.

## Runtime Environment

- CMS dev : `cd cms && npm install` (worktree neuf), puis `npm run dev` → http://localhost:3000 (SQLite via `cms/.env`), admin http://localhost:3000/admin.
- Tests d'intégration : `cd cms && npm run test:int` (vitest + SQLite, schéma poussé automatiquement).
- E2E admin : `cd cms && npm run test:e2e -- retourArriere` (Playwright ; helper `cms/tests/helpers/seedUser.ts`).
- Page locale : `node tooling/serve.mjs 8090` (serveur versionné qui applique `vercel.json`). **À étendre** (Task 3) : `CBRS_CMS_ORIGIN` (défaut `https://cbrs-cms.vercel.app`) — réécrit `<meta name="cbrs-cms-url">` en `/__cms` au moment de servir le HTML, proxifie `/__cms/*` vers `$CBRS_CMS_ORIGIN`, et proxifie les réécritures `vercel.json` de destination absolue (dont `/cms-docs/*`) vers la même origine — le CMS prod n'autorisant pas `127.0.0.1:8090` en CORS (`CBRS_SITE_ORIGINS`). Cible locale possible : `CBRS_CMS_ORIGIN=http://localhost:3000 node tooling/serve.mjs 8090`.
- Migration : conteneur Postgres 17 jetable (procédure Task 2).

## Assumptions

- La route CMS `/api/documents/file/<fichier>` sert bien les PDF en `GET` : vérifié le 30/09 sur la prod (`GET https://cbrs-cms.vercel.app/api/documents/file/FFRS_Formation_FIA_Aout-2025.pdf` → 200 `application/pdf`, 229 919 o ; idem `/api/media/file/*` → 200 `image/jpeg`). ⚠️ `HEAD` renvoie 404 : toutes les vérifications passent par `GET` (`curl -o /dev/null -w`). Le proxy `/cms-docs/*` reste à confirmer après fusion — Tasks 3, TS-003 et checklist de déploiement.
- `vercel.json` accepte une réécriture vers un domaine externe (proxy `/cms-docs/*`) — Task 3, TS-003.
- Le CMS prod autorise déjà le site pour les lectures publiques de globals (cas de `tarifs`) : aucune modification CORS — Tasks 3 et déploiement.
- La réécriture `/cms-docs/*` doit précéder la réécriture attrape-tout `/:path(…)` de `vercel.json` (l.124), sinon `/site3/cms-docs/…` 404 — Task 3.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration refusée par Postgres (nouvelle valeur d'enum `roles.permissions.section` dans une transaction) | Moyenne | Élevé | Appliquer la migration **deux fois** sur un Postgres 17 jetable (base neuve puis base déjà migrée) et vérifier `migrate:status`. Si l'`ALTER TYPE … ADD VALUE` échoue, scinder en deux migrations appliquées l'une après l'autre : (A) valeur d'enum seule, (B) tables/versions ; ne garder aucun aléa |
| Un champ CMS vide écrase un texte statique par accident | Faible | Moyen | Client : n'écrire que si `typeof valeur === 'string' && valeur.trim() !== ''` ; TS-002 couvre le cas |
| `print()`/`download` cassés car PDF cross-origin | Certaine sans proxy | Moyen | Réécriture `/cms-docs/*` + TS-003 vérifie `Content-Type: application/pdf` via l'URL proxifiée |

## E2E Test Scenarios

### TS-001: Contenu du CMS appliqué sur /formation
**Priority:** Critical
**Preconditions:** CMS dev (`:3000`) avec un PDF déposé dans Documents ; serveur local `:8090` (`CBRS_CMS_ORIGIN=http://localhost:3000 node tooling/serve.mjs 8090`, cf. Runtime Environment).
**Mapped Tasks:** Task 1, Task 3

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Écran admin `/admin/globals/formation` : saisir un `parcoursTitre` (« Parcours e2e »), choisir un PDF pour `ficheFia`, changer `carteAg.titre`, enregistrer | Message d'enregistrement, relecture OK |
| 2 | Ouvrir `http://127.0.0.1:8090/formation` | Le titre du parcours affiche « Parcours e2e », le titre de la carte Aquagym change, les autres textes restent ceux du site |
| 3 | Cliquer « Consulter la fiche FIA (PDF) » | Visionneuse ouverte ; `src` de l'iframe = `/cms-docs/<fichier>.pdf` (même origine) ; « Imprimer » ouvre la boîte d'impression sans erreur console |

### TS-002: Repli statique quand le CMS est vide ou injoignable
**Priority:** High
**Preconditions:** Global `formation` aux valeurs par défaut (ou CMS arrêté).
**Mapped Tasks:** Task 3

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Vider `parcoursTitre` puis enregistrer ; recharger `/formation` sur `:8090` | Le titre d'origine « Devenir animateur vous tente ? » reste affiché (pas de vide ni de « null ») |
| 2 | Arrêter le proxy/CMS puis recharger `/formation` | La page reste complète avec les textes et PDF statiques ; aucune erreur bloquante à l'écran |

### TS-003: PDF CMS servis en même origine via /cms-docs
**Priority:** High
**Preconditions:** Un PDF `ficheFia` est enregistré dans le global ; serveur local `:8090` étendu (Task 3).
**Mapped Tasks:** Task 3

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | `curl -s -o /dev/null -w '%{http_code} %{content_type}\n' http://127.0.0.1:8090/cms-docs/<fichier>.pdf` | `200 application/pdf` (GET — `HEAD` renvoie 404 côté CMS) |
| 2 | Dans la visionneuse (étape TS-001), cliquer « Télécharger » | Le fichier est téléchargé (pas une navigation vers le CMS) ; bouton « Zoom + » agrandit l'aperçu |

## Progress Tracking

- [x] Task 1: Global `Formation` + section de droits + types + tests d'intégration
- [x] Task 2: Migration Postgres générée, inspectée et validée sur base jetable
- [x] Task 3: `/formation` branchée au CMS (page, client, proxy `/cms-docs`)
- [x] Task 4: E2E « retour en arrière » étendu à Formation + mémoire projet

## Implementation Tasks

### Task 1: Global Formation, droits et types

**Objective:** Créer le global Payload `formation` (onglets Parcours / Fiches PDF / Cartes / Bas de page, 34 champs avec valeurs par défaut reprenant le contenu actuel du site), l'enregistrer auprès de `avecRetourArriere`, ajouter la section de droits « Page Formation » et couvrir le tout par un test d'intégration. C'est le socle de tout le reste : le CMS peut stocker et rendre le contenu avant même que la page le consomme.

**Files:**

- Create: `cms/src/globals/Formation.ts`
- Modify: `cms/src/payload.config.ts` (import + `globals: avecRetourArriere([…, Formation], 'globals')`, l.84)
- Modify: `cms/src/access.ts` (ajouter `{ label: 'Page Formation', value: 'formation' }` à `SECTIONS`, l.6-17)
- Create: `cms/tests/int/formation.int.spec.ts`
- Test: `cms/tests/int/formation.int.spec.ts`
- Généré: `cms/src/payload-types.ts` (`npm run generate:types`)

**Key Decisions / Notes:**

- Copier le motif de `cms/src/globals/Tarifs.ts:5-17` pour `admin.group: 'Vie du club'`, `hidden: cacheSansDroit('formation')`, `access` : `read: () => true`, `readVersions: peut('formation', 'voir')`, `update: peut('formation', 'modifier')`, et `description: 'Contenu de la page Formation : parcours, fiches PDF et textes. Laissez un champ vide pour garder le contenu d’origine du site.'`
- Champs (tous `text` sauf `textarea` notés ; `defaultValue` = texte actuel de `site3/formation.html`) :
  - Onglet « Parcours » : `parcoursSurtitre` (déf. « Parcours de formation »), `parcoursTitre` (déf. « Devenir animateur vous tente ? »), `parcoursTexte` (textarea, déf. « Voici le cheminement pour encadrer bénévolement une activité au sein du CBRS, étape après étape. »), puis 3 `group` (`etape1`, `etape2`, `etape3` — labels « Étape 1/2/3 ») avec `surtitre`, `titre`, `texte` (textarea) : « Première étape » / « Connaître la FFRS » / « La Fédération Française de la Retraite Sportive (FFRS) est l’organisme fédéral qui encadre et forme les animateurs. » ; « Le socle commun » / « Formation Initiale des Animateurs (FIA) » / « Première étape incontournable : la FIA vous forme aux bases de l’animation sportive bénévole (pédagogie, sécurité, connaissance de la fédération). » ; « La spécialisation » / « Formation par activité (M2) » / « Après la FIA, vous suivez la formation spécifique à l’activité que vous souhaitez encadrer (M2). »
  - Onglet « Fiches PDF » : 6 `upload` `relationTo: 'documents'` — `ficheFia`, `ficheM2Agef`, `ficheM2Ad`, `ficheM2Aa`, `ficheM2Ac`, `ficheM2Jb` ; description d'onglet : « Choisissez un PDF de la médiathèque Documents. Laissez vide pour garder le fichier livré avec le site. »
  - Onglet « Cartes » : 6 `group` (`carteAg`, `carteGym`, `carteDanse`, `carteRando`, `carteRaquettes`, `carteEchecs`) avec `titre`/`sousTitre` ; déf. respectives : Aquagym / « M2-AGEF — Gymnastique Aquatique » ; Gymnastique / « M2-AGEF — Gymnastique d’Entretien » ; Danse / « M2-AD — Danse de Salon » ; Randonnée / « M2-AA — Activités de Randonnée » ; Tennis de table / « M2-AC — Activités de raquettes » ; Échecs / Jeux de société / « M2-JB — Jeux de table et de société ».
  - Onglet « Bas de page » : `note` (textarea, déf. « Cliquez sur « Consulter le PDF » d’une fiche pour l’afficher en grand. Vous pourrez ensuite la télécharger, l’imprimer ou zoomer. »), `ctaTitre` (déf. « Vous souhaitez devenir animateur ? »), `ctaTexte` (textarea, déf. « Contactez-nous pour obtenir toutes les informations sur les formations disponibles. »), `ctaBouton` (déf. « Nous contacter »).
- Test d'intégration : motif `cms/tests/int/apparence.int.spec.ts:16-43` (`getPayload`, `updateGlobal`/`findGlobal`) ; PDF minimal de `cms/tests/int/documents.int.spec.ts:69-74` écrit dans un dossier temporaire puis déposé via `payload.create({ collection: 'documents', …, filePath: join(dossier, 'doc.pdf'), draft: false })` (motif `documents.int.spec.ts:100-119` — pas de `file:` inline en intégration). Vérifier : (1) après `updateGlobal({ slug: 'formation', data: { ficheFia: doc.id, parcoursTitre: 'Parcours e2e' } })`, `findGlobal({ slug: 'formation', depth: 1 })` renvoie `ficheFia.url` contenant le nom du fichier et `parcoursTitre === 'Parcours e2e'` ; (2) les champs non saisis ont leur `defaultValue` (ex. `etape1.titre`) ; (3) un utilisateur non administrateur sans droit `formation` ne peut pas `updateGlobal` — motif `withUser` de `cms/tests/int/acces.int.spec.ts:33` et refus attendu comme `acces.int.spec.ts:158-161`.

**Definition of Done:**

- [x] `npm run generate:types` met à jour `cms/src/payload-types.ts` avec le global `formation` (interface + entrée `globals`)
- [x] `GET /api/globals/formation` répond en JSON sans authentification (test d'intégration via local API `overrideAccess: false`)
- [x] L'écran `/admin/globals/formation` affiche 4 onglets et les valeurs par défaut ci-dessus
- [x] Un rôle avec la section « Page Formation » / action « Modifier » peut enregistrer ; sans droit, l'écran est masqué et l'API refuse
- [x] Verify: `cd cms && npm run test:int` (12 fichiers, 72 tests OK le 30/09)

### Task 2: Migration Postgres (formation, versions, section de rôle)

**Objective:** Générer la migration Postgres qui crée les tables `formation` / `_formation_v`, ajoute la valeur d'enum de la section `formation` aux rôles (et leurs tables de versions), puis la valider sur un Postgres 17 jetable — deux applications successives, aucune suppression de colonne.

**Files:**

- Create: `cms/src/migrations/<horodatage>_formation.ts`
- Modify: `cms/src/migrations/index.ts` (généré)
- Test: application à blanc sur base jetable (commandes ci-dessous)

**Key Decisions / Notes:**

- Ne jamais lancer `migrate:create` contre SQLite ou la prod : le schéma de référence est celui des migrations appliquées sur PostgreSQL.
- Commandes (adaptées de la migration `20260929_213723_fix_objectkey`) :
  1. `docker run --rm -d --name cbrs-pg-mig -e POSTGRES_PASSWORD=cbrs -e POSTGRES_USER=cbrs -e POSTGRES_DB=cbrs -p 5433:5432 postgres:17`
  2. `cd cms && DATABASE_URL='postgres://cbrs:cbrs@localhost:5433/cbrs' npm run payload migrate` (applique l'existant)
  3. `DATABASE_URL='postgres://cbrs:cbrs@localhost:5433/cbrs' npm run payload migrate:create formation`
- Relire le SQL généré : uniquement des `CREATE TABLE` (`formation`, `formation_etapes*` éventuels selon structure, `_formation_v`) et l'`ALTER TYPE` de la section des rôles ; **aucun `DROP`**. Si Payload émet un `DROP`/recréation de type, scinder en deux migrations appliquées l'une après l'autre — (A) valeur d'enum seule, puis (B) tables et versions (cf. Risques).
- Rejouer sur base vierge : `docker exec cbrs-pg-mig psql -U cbrs -d postgres -c 'DROP DATABASE cbrs WITH (FORCE); CREATE DATABASE cbrs;'` puis `npm run payload migrate` (toutes les migrations, dont la nouvelle) et vérifier `payload migrate:status`.
- Arrêter le conteneur à la fin : `docker stop cbrs-pg-mig`.

**Definition of Done:**

- [x] `cms/src/migrations/index.ts` référence la nouvelle migration et `npm run payload migrate` passe sur une base neuve puis sur une base déjà migrée
- [x] `\dT+` contient les nouveaux types et `permissions.section` accepte `formation` (vérifié le 30/09 : `enum_range` des deux enums contient `formation` avant `tarifs`)
- [x] Le SQL de la migration ne contient aucun `DROP TABLE`/`DROP COLUMN` (section `up` ; les `DROP` du `down()` sont le motif Payload standard)
- [x] Verify: `docker exec cbrs-pg-mig psql -U cbrs -d cbrs -c '\dt' | grep -E 'formation'` (tables `formation` et `_formation_v`) et `payload migrate:status` sans « pending » après application (base neuve et base déjà migrée le 30/09)

### Task 3: Page /formation rendue depuis le CMS

**Objective:** Marquer les textes et boutons PDF de `site3/formation.html` de points d'ancrage, les remplacer côté client par les valeurs du global `formation`, et ajouter la réécriture `/cms-docs/*` qui sert les PDF du CMS en même origine pour préserver impression/téléchargement de la visionneuse.

**Files:**

- Modify: `site3/formation.html`
- Modify: `site3/cms-client.js`
- Modify: `vercel.json`
- Modify: `tooling/serve.mjs`

**Key Decisions / Notes:**

- `formation.html` : ajouter `data-cbrs-formation="<chemin>"` sur chaque texte modifiable (chemins pointés : `parcoursSurtitre`, `parcoursTitre`, `parcoursTexte`, `etape1.surtitre`… `etape3.texte`, `carteAg.titre`/`carteAg.sousTitre`… `carteEchecs.*`, `note`, `ctaTitre`, `ctaTexte`, `ctaBouton`) — ancrages : l.263-265 (parcours), l.272-274 / 280-282 / 292-294 (étapes), l.307-308 / 320-321 / 333-334 / 346-347 / 359-360 / 372-373 (cartes), l.382 (note), l.387-389 (CTA). Sur les 7 boutons PDF (l.283, 309, 322, 335, 348, 361, 374) : `data-cbrs-fiche="ficheFia|ficheM2Agef|ficheM2Ad|ficheM2Aa|ficheM2Ac|ficheM2Jb"` + `data-cbrs-fiche-titre="<titre actuel de la visionneuse>"` ; **garder `onclick="openPdf('docs/…')"`** comme repli (les lignes 309 et 322 partagent `M2-AGEF`).
- `cms-client.js` : ajouter `renderFormation(data)` + helper `valeur(data, chemin)` (découpe `chemin.split('.')`), puis un `register(function(){ return Boolean(document.querySelector('[data-cbrs-formation]') || document.querySelector('[data-cbrs-fiche]')); }, '/api/globals/formation?depth=1', renderFormation)` avec le motif de `cms-client.js:562-567`. Rendu : pour chaque `[data-cbrs-formation]`, si la valeur est une chaîne non vide (`trim()`), écrire `textContent` (jamais de vide/`null`). Pour chaque `[data-cbrs-fiche]`, si `data[cle] && data[cle].filename`, remplacer `btn.onclick = function () { window.openPdf('/cms-docs/' + encodeURIComponent(data[cle].filename), btn.dataset.cbrsFicheTitre || data[cle].titre || ''); }` (le `titre` du document CMS sert de libellé de secours dans la visionneuse).
- `vercel.json` : insérer dans `rewrites` **avant** la réécriture attrape-tout (l.124) : `{ "source": "/cms-docs/:file*", "destination": "https://cbrs-cms.vercel.app/api/documents/file/:file*" }` (même origine produit ⇒ `print()`/`download` fonctionnels, cf. `pdfPrint`/`pdfDownload` de `formation.html:507-519`).
- Étendre `tooling/serve.mjs` (serveur versionné, port 8090) : réécriture de `<meta name="cbrs-cms-url">` vers `/__cms`, proxy `/__cms/*` vers `CBRS_CMS_ORIGIN` (défaut `https://cbrs-cms.vercel.app`, sinon `http://localhost:3000`), et proxy des réécritures absolues de `vercel.json` (`/cms-docs/*`) vers la même origine — indispensable pour exécuter TS-001/002/003.
- Vérification navigateur obligatoire (skill `test-navigateur`, Chrome MCP) : TS-001, TS-002, TS-003.

**Definition of Done:**

- [x] Sans CMS joignable, `/formation` affiche les textes et PDF d'origine, sans erreur console liée à `renderFormation` (vérifié le 30/09 : CMS arrêté → textes et PDF statiques, seuls logs réseau 502)
- [x] Un champ rempli remplace le texte correspondant ; un champ vidé conserve le texte statique (vérifié le 30/09 : « Parcours e2e » affiché, puis champ vidé → « Devenir animateur vous tente ? »)
- [x] Les PDF choisis s'ouvrent via `/cms-docs/<fichier>` (même origine) ; sans PDF choisi, le bouton garde le PDF livré avec le site (vérifié le 30/09 : iframe `/cms-docs/…`, `print()` accessible, zoom 120 %, repli `docs/…`)
- [x] Verify: TS-001, TS-002, TS-003 (Chrome MCP, `node tooling/serve.mjs 8090`, le 30/09)

### Task 4: E2E « retour en arrière » et mémoire projet

**Objective:** Étendre la suite E2E admin pour couvrir le bouton « Revenir en arrière » sur l'écran Formation (14 fiches), puis consigner la fonctionnalité dans `.project/JOURNAL.md` et `.project/DECISIONS.md`.

**Files:**

- Modify: `cms/tests/e2e/retourArriere.e2e.spec.ts` (tableau `fiches`, l.34-269)
- Modify: `/Users/gildas/orca/projects/cbrs-sites/.project/JOURNAL.md` et `.project/DECISIONS.md` — **mémoire locale du checkout principal (hors dépôt, hors PR : `.project/` n'est pas suivi par git et est absent du worktree)**

**Key Decisions / Notes:**

- Entrée à copier sur le motif des globals (l.211-268) : `nom: 'Page Formation'` ; `preparer` : deux `payload.updateGlobal({ slug: 'formation', data: { parcoursTitre: 'Formation e2e' } })` puis `'Formation e2e modifiée'` ; `api: '/api/globals/formation'`, `edition: '/admin/globals/formation'`, `lire: (donnees) => donnees.parcoursTitre`, `avant: 'Formation e2e'`.
- Aucune modification au compteur global : le `for` sur `fiches` génère les cas.

**Definition of Done:**

- [x] Le test E2E « « Page Formation » : le bouton restaure la version précédente » passe (30/09, 14/14)
- [x] `cms/tests/e2e/retourArriere.e2e.spec.ts` contient 14 fiches (13 + Formation)
- [x] `/Users/gildas/orca/projects/cbrs-sites/.project/JOURNAL.md` et `.project/DECISIONS.md` contiennent une entrée datée du 30/09 décrivant l'écran Formation et le choix du proxy `/cms-docs` (fichiers locaux, hors PR)
- [x] Verify: `cd cms && npm run test:e2e -- retourArriere` (14 passed)

## Déploiement après fusion (hors PR)

1. Fusionner la PR (validation humaine) et laisser le site se redéployer (`vercel.json` + `formation.html` + `cms-client.js`).
2. Déployer le CMS (projet `cbrs-cms`, racine `cms/`) : `cms/vercel.json` exécute déjà `npm run migrate && npm run build`, la migration s'applique donc automatiquement sur Neon au déploiement. Filet de sécurité si besoin : `cd cms && DATABASE_URL='<DATABASE_URL_UNPOOLED>' npm run payload migrate` (identifiants dans `cms-retour-arriere/cms/.env.local`).
3. Contrôles : `GET https://cbrs-cms.vercel.app/api/globals/formation` → 200 avec valeurs par défaut ; `/admin/globals/formation` accessible à l'admin ; `/formation` inchangée tant que rien n'est saisi ; `GET https://cbrs-sites.vercel.app/cms-docs/<fichier>.pdf` → 200 `application/pdf` après y avoir choisi un PDF.
