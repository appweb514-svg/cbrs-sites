# DECISIONS — CBRS

Entrées durables, datées. Le code prime en cas de divergence.
Entrées antérieures au 2026-09-13 **reconstituées depuis `git log`** (marquées ↺).

## 2026-06-15 ↺ — Site v1 statique + faux backend Vercel

- **Contexte** : premier commit du site CBRS.
- **Décision** : site statique `site3/`, endpoints `api/` mockés pour Vercel,
  admin client `localStorage` (`site3/connexion.html`, `site3/admin.html`, `site3/auth.js`).
- **Conséquences** : aucune persistance ni sécurité réelle ; dette à remplacer par un vrai back-end.

## 2026-06-16 ↺ — Conformité RGPD : suppression des téléphones

- **Décision** : retirer tous les numéros de téléphone du site (`a1b92af`).
- **Conséquence** : ne pas réintroduire de `phone` dans les données publiques.

## 2026-06-16 ↺ — Backend d'édition du planning + admin

- **Décision** : commit `8ec9503` « planning web editable + admin backend + RGPD compliance ».
- **Conséquence** : prémices du CMS, encore côté client à l'époque.

## 2026-07-15/21 ↺ — Direction UI/UX "shared shell"

- **Décision** : shell partagé, sidebar, pages légales, fiches sorties/événements détaillées,
  données sorties (`sorties-data.js`), plan documenté (`UI_UX_PLAN.md`, `docs/superpowers/`).
- **Conséquence** : `site3/ui-shell.js` devient le socle de cohérence des pages.

## 2026-07-31 ↺ — Publication du site validé à la racine

- **Décision** : `feat: publish validated site at root` (`c03c942`).
- **Conséquence** : Vercel déploie la racine, rewrite `/` → `/site3/index.html` (`vercel.json`).

## 2026-08-15 ↺ — Photos Wikimedia + module Commons

- **Décision** : photos de sorties Commons avec crédit, module `backend/src/services/commons-search.js`.
- **Conséquence** : base de la ROADMAP P1 (recherche photo dans l'admin).

## 2026-09-14 — Daily scan : protection de `GET /api/admin/gallery`

- **Contexte** : scan quotidien mémoire-first. Toutes les routes `/api/admin/*`
  passent par `requireLogin` sauf `GET /api/admin/gallery`, qui exposait la liste
  complète des photos (année, catégorie, légende) sans authentification.
- **Décision** : ajouter `requireLogin` sur le handler `GET` (`backend/src/routes/gallery.js:25`),
  alignant la route sur `POST`/`PUT`/`DELETE` et sur l'exigence `QUALITY.md`
  (« toute route `/api/admin/*` : 401 sans session »).
- **Conséquences** : le front `public-admin/gallery.html` appelle déjà `me()` (redirige
  vers le login si non connecté) avant `load()`, donc aucune régression attendue.
  Reste non traité : `multer` accepte 10 Mo (préconisé 2 Mo) ; faux admin client
  `site3/connexion.html` toujours déployé avec identifiants en clair.
- **Note git** : `.project/` est versionné et committé dans cette PR ; il ne l'était
  pas sur `backend` (untracked). `graphify-out/` et `.codegraph/` restent gitignorés.

## 2026-09-13 — Pivot CMS : Cockpit self-hosted (remplace l'Express)

- **Contexte** : le CMS Express+SQLite `backend/` a été généré par un agent
  (plan `.hermes/plans/2026-06-15_…backend-cms-cbrs.md`) et n'est pas déployé.
  L'intention réelle était de basculer sur **Cockpit** (https://getcockpit.com/),
  CMS headless self-hosted (PHP, REST/GraphQL, modèles de contenu, assets, rôles).
- **Décision** : pivoter vers Cockpit comme back-end cible. Hébergement sur le
  **Proxmox `37.187.249.183`** (self-hosted, données en UE, pas de Vercel pour l'admin).
- **Conséquences** :
  - `backend/` (Express+SQLite) et `api/_data/*` (mocks) deviennent **legacy** :
    archivés ou convertis en adaptateur/proxy vers Cockpit ; à ne plus développer.
  - Vercel ne sert plus que le site statique `site3/` ; l'admin Cockpit vit sur le Proxmox.
  - Modèles de contenu à recréer dans Cockpit : activities, flash_info, planning_items,
    gallery, settings, outings (+ crédit photo Commons).
  - **Limite à valider** : les permissions Cockpit sont par collection/champ, pas par
    item ; l'exigence « un formateur ne modifie que ses activités » nécessitera un
    contournement (collections séparées, addon, ou revoir l'exigence).
  - Le contrat de données public (`short_description`/`practical_info`/… vs
    `desc`/`info`/`photo`) reste à aligner, indépendamment du CMS.

## 2026-09-13 — Reprise du back-end sur branche `backend`

- **Contexte** : reprise du site (déployé sur Vercel) et démarrage du back-end.
  Audit lecture seule réalisé : le CMS existe (`backend/`, Express+SQLite) mais
  **n'est pas déployé** (voir `.project/TASKS.md` pour l'état des 14 tâches).
- **Décision** : travailler dans une branche dédiée `backend` (créée depuis `main`/`origin/main` `c5996d4`) ;
  créer la mémoire partagée `.project/` + index CodeGraph ; auditer avant de coder.
- **Conséquences** : deux dette majeures identifiées — (1) aucune persistance en prod,
  (2) trois sources de données divergentes. Choix d'hébergement Express+SQLite vs
  Vercel serverless **non tranché**.
