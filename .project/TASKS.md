# TASKS — CBRS

## Daily scan — pistes non traitées (2026-09-16)

- [ ] `site3/connexion.html:59,72-73` — faux admin client **toujours publié** (identifiants en
      clair `cbrs2026`, auth `localStorage`) : la plus visible des dettes restantes. Retirer les
      pages `connexion.html`/`admin.html`/`auth.js` du déploiement ou les neutraliser.
- [ ] `backend/src/routes/gallery.js:23` — `multer` accepte 10 Mo (préconisé 2 Mo) : abaisser `fileSize`.
- [ ] `backend/server.js:16` — secret de session de repli `cbrs-dev-change-me` et
      `cookie.secure:false` : imposer `SESSION_SECRET` en prod.
- [ ] `backend/src/routes/activities.js:29` — `b.name` non validé (peut être `null`).
- [ ] `backend/db/seed.js:26,31` — mots de passe seed par défaut `admin1234`/`formateur1234`.
- [ ] `site3/activite.html` — `activity.category` lu (`:566`) mais jamais défini dans le
      dataset `activities` : le badge retombe toujours sur « Tous niveaux ». Ajouter le champ
      ou utiliser une catégorie dérivée (aligné sur `activites.html`).
- [ ] `site3/activite.html:414,431,440,…` — 7 référents pour l'activité 09 contre 1 dans
      `api/_data/activities.js:34` : trois sources de données divergentes, à réconcilier.
- [ ] `site3/galerie.html:1313` — `scrapedPhotos` référence `photo_133.jpg`, absent de
      `site3/photos/` (126 fichiers) ; le fallback statique affiche une vignette cassée.
- [x] ~~Fuite de fichiers : la racine est publiée par Vercel (`/ROADMAP.md`, PDF, `.hermes/plans/`).~~
      **Corrigé 2026-09-16** par `.vercelignore` (motifs ancrés racine, copies `site3/` préservées).

## Daily scan — pistes non traitées (2026-09-14)

- [ ] `backend/src/routes/gallery.js:23` — `multer` accepte 10 Mo (préconisé 2 Mo) : abaisser `fileSize`.
- [ ] `site3/connexion.html:59,72-73` — faux admin client déployé, identifiants en clair
      (`cbrs2026`), auth `localStorage` : sécuriser/retirer (déjà listé au plan de reprise §3).
- [ ] `backend/server.js:16` — secret de session de repli `cbrs-dev-change-me` et
      `cookie.secure:false` : imposer `SESSION_SECRET` en prod.
- [ ] `backend/src/routes/activities.js:29` — `b.name` non validé (peut être `null`).
- [ ] `backend/db/seed.js:26,31` — mots de passe seed par défaut `admin1234`/`formateur1234`.
- [x] ~~Fuite de fichiers : la racine est publiée par Vercel (`/ROADMAP.md`, PDF, `.hermes/plans/`).~~
      **Corrigé 2026-09-16** (voir ci-dessus).


## Actif : migration Cockpit — branche `backend` (2026-09-13)

Remplacer le CMS Express+SQLite par **Cockpit** self-hosted sur Proxmox `37.187.249.183`.
Réf. décision dans `DECISIONS.md` (2026-09-13).

### Contexte infra constaté (lecture seule)

- Hôte `ns338011` : Debian 13, PVE 9.2.11, 62 Go RAM (31 libres), 1,8 To libres.
- VM `200 dokploy` : PaaS Docker (Traefik probable) sur réseau interne `10.10.0.x`.
- CT `103 lxc-services` : Docker (ports 8080/8081) — candidat simple pour héberger Cockpit.
- CT `102 lxc-db` : PostgreSQL + MariaDB (Cockpit v2 veut SQLite ou MongoDB → non réutilisé).
- CT `104 netbird-gw` : mesh WireGuard `100.102.0.0/16` (accès privé Mac mini ↔ VPS).
- Pas de PHP/nginx/docker sur l'hôte Proxmox lui-même.

### Plan de migration proposé

1. **Trancher l'exposition réseau** : API Cockpit publique (HTTPS) **ou** proxy `api/` serverless → Cockpit privé (token caché). — S (décision)
2. **Choisir l'hôte** : Docker sur `lxc-services` (CT103) / deploy via Dokploy (VM200) / nouveau CT dédié. — S
3. **Installer Cockpit** (PHP 8.2+ + SQLite, image Docker) + TLS + sauvegarde du volume. — M
4. **Créer les collections** : `activities`, `flash_info`, `planning_items`, `gallery`, `settings`, `outings` (crédit photo). — M
5. **Migrer les données** depuis `site3/activite.html` (source du seed), `api/_data/*`, `site3/sorties-data.js`. — M
6. **Rôles Cockpit** : admin + formateur. Valider la contrainte « formateur limité à ses activités » (Cockpit = permissions par collection/champ, pas par item) → contournement à définir. — M/L
7. **Adapter le site** : client `site3/cockpit-client.js` (ou proxy `api/`) + aligner le contrat de données (`desc`/`info`/`photo`, lat/lon). — M/L
8. **Retirer/déprécier** `backend/` Express et `api/_data/*` (garder fallback statique). — S
9. **Recherche photo Commons** : porter `commons-search.js` (ROADMAP P1.2→P1.4) côté Cockpit/addon ou workflow admin. — M/L

### À clarifier

- [ ] Exposition : Cockpit public vs proxy privé (`api/` serverless).
- [ ] Hôte : Dokploy vs `lxc-services` vs CT dédié.
- [ ] Permissions formateur par activité : acceptable de revoir l'exigence ?
- [ ] Domaine/sous-domaine pour l'admin Cockpit.

## Historique : reprise du back-end Express — branche `backend`

Audit lecture seule du 2026-09-13. Réf. plan `.hermes/plans/2026-06-15_074842-backend-cms-cbrs.md` (14 tâches).

### État des 14 tâches du plan

| # | Tâche | Statut | Preuve |
| --- | --- | --- | --- |
| 1 | Init back-end Node/Express | Fait | `backend/server.js`, `backend/package.json` |
| 2 | Schéma SQLite + seed | Fait | `backend/db/schema.sql`, `backend/db/seed.js` |
| 3 | Migrer activités vers SQLite | Fait (réserves : `map_lat/lon=null`, seed par regex) | `backend/db/seed.js:17-66` |
| 4 | Auth login/logout/me | Fait | `backend/src/routes/auth.js:5,15,19` |
| 5 | Middleware rôles | Fait | `backend/src/middleware.js:4-22` |
| 6 | API publique activités | Fait | `backend/src/routes/public.js:19-28` |
| 7 | API admin activités CRUD | Partiel (GET/PUT, pas POST/DELETE) | `backend/src/routes/activities.js:14,18,24` |
| 8 | Admin login/dashboard | Fait | `backend/public-admin/login.html`, `dashboard.html` |
| 9 | Édition activité admin | Fait | `backend/public-admin/activity-edit.html` |
| 10 | Brancher `site3/activite.html` sur l'API | Manquant (shape incompatible) | `site3/activite.html:407`, `:564,586,618` |
| 11 | Flash info API + admin | Fait | `backend/src/routes/flash.js`, `site3/index.html:574-596` |
| 12 | Planning accueil API | Partiel (pas de `PUT planning-items`, pas d'écran admin) | `backend/src/routes/public.js:35`, `site3/index.html:641` |
| 13 | Paramètres visuels CMS | Partiel (pas de `site-settings.js`, pas d'upload logo) | `backend/src/routes/settings.js` |
| 14 | Gestion utilisateurs/formateurs | Manquant | pas de `routes/users.js` |

Hors plan déjà présent : galerie (route + admin), module Commons P1.1.
ROADMAP : P1.2→P1.4 manquants ; P2/P3/P4 non commencés.

### Plan de reprise recommandé (ordre)

1. **Trancher l'hébergement** (Express+SQLite sur VPS/Render **ou** Vercel serverless + stockage externe). — S
2. **Choisir la source de vérité** des données et réconcilier les 3 datasets. — M
3. **Sécuriser/retirer le faux admin** `site3/connexion.html` + `admin.html` + `auth.js`. — S/M
4. **Compléter les routes** : `users.js`, `PUT /planning-items/:id`, `POST/DELETE activities`, `POST assets/logo`, `GET /public/planning`. — M
5. **Aligner le contrat d'API** (`desc`/`info`/`photo`, lat/lon) et brancher `activite.html` / `activites.html` + `site-settings.js`. — M/L
6. **Durcir la sécurité** (secret, cookies, store persistant, rate-limit, validation). — M
7. **Fiabiliser le seed** (sans regex, idempotent) + README de lancement. — S/M
8. **ROADMAP P1** : `routes/commons.js`, table `outings`, admin sorties, crédits photo. — M/L

## À clarifier avec l'utilisateur

- [ ] Cible d'hébergement du back-end (Express+SQLite vs Vercel serverless).
- [ ] Pourquoi la prod Vercel ne correspond pas exactement au HEAD du repo
      (`site3/ui-shell.js`, pages `/connexion`, `/admin` différentes ; `git log -S` négatif).
- [ ] Dataset de référence : `api/_data/*` ou `site3/activite.html` ?
- [ ] Sort du faux admin client (`site3/admin.html`).
- [ ] Périmètre galerie (hors plan 14 tâches) : conserver/migrer ou geler ?
- [ ] Faut-il installer/committer **graphify** (knowledge graph) en plus de `.project/` + CodeGraph ?

## Terminé

- [x] 2026-09-13 — Audit back-end lecture seule → `.project/`.
- [x] 2026-09-13 — Init CodeGraph (33 fichiers, 195 nœuds).
- [x] 2026-09-13 — Branche `backend` créée depuis `main`.
