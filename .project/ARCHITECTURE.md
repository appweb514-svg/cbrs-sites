# ARCHITECTURE — CBRS

## Schéma général

```
                        ┌──────────────────────────────────────────┐
   Visiteur ──HTTPS──▶  │ Vercel — projet "cbrs-sites"              │
                        │ déploie la RACINE du repo (vercel.json)   │
                        └───────────────┬──────────────────────────┘
                                        │ rewrites (/ -> /site3/index.html)
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                               ▼
  site3/ (statique)              api/ (serverless Vercel)        assets/, assets-premium/,
  HTML + Tailwind CDN            lecture seule, JSON figé        logos_rectangulaires/,
  ui-shell.js / ui-shell.css     api/_data/*                     PDF FFRS, ROADMAP.md…
        │                               ▲
        │ fetch('/api/public/*')        │
        └───────────────────────────────┘
        (index: flash-info + planning-home; galerie: gallery; planning.html: planning)

  Admin / dev LOCAL — NON déployé :
  backend/ (Express)
    server.js
      ├─ /              -> ../site3/            (site public)
      ├─ /admin         -> public-admin/*.html  (login, dashboard, activities, flash, gallery, settings)
      └─ /api/auth|public|admin/...             (Express + sessions bcrypt)
    src/db.js ──▶ SQLite backend/db/cbrs.sqlite (gitignoré)
```

## Composants

| Composant | Chemin | Rôle | Déployé ? |
| --- | --- | --- | --- |
| Site public | `site3/` | Pages HTML statiques, Tailwind CDN, JS vanilla. Shell partagé `ui-shell.js`/`ui-shell.css`. | Oui (Vercel) |
| Données sorties | `site3/sorties-data.js`, `site3/sortie-detail.js` | Sorties/événements + crédits photo Commons, en dur côté client. | Oui |
| Faux admin client | `site3/connexion.html`, `site3/admin.html`, `site3/auth.js` | Démo login (identifiants en clair) + édition `localStorage`. | Oui (maquette) |
| API prod | `api/` | Fonctions serverless Vercel, lecture de `api/_data/*` (figé). Aucune écriture, aucune auth. | Oui |
| Datasets prod | `api/_data/` | `activities.js`, `flash.js`, `planning.js`, `planning-full.js`, `settings.js`, `photos.json`. | Oui |
| CMS local | `backend/` | Express + better-sqlite3 + express-session + bcrypt. Admin statique dans `public-admin/`. | Non |
| Base SQLite | `backend/db/cbrs.sqlite` (via `schema.sql` + `seed.js`) | 8 tables : users, activities, activity_animators, activity_schedules, activity_permissions, planning_items, flash_info, site_settings, gallery_photos. | Non |
| Recherche Commons | `backend/src/services/commons-search.js` | Recherche photo libre Wikimedia Commons (artiste + licence). ROADMAP P1.1 fait. | Non |

## Flux

- **Public** : Vercel sert `site3/` ; certaines pages `fetch('/api/public/*')` (serverless, données figées), avec fallback statique (ex. `site3/index.html`).
- **Admin local** : `backend/server.js` sert `/admin` + `/api/*` ; sessions HTTP-only (MemoryStore), rôles vérifiés par `src/middleware.js`.
- **Publication (cible plan)** : édition admin → SQLite → synchronisation vers `site3/sorties-data.js` ou `api/_data/`.

## Invariants / contraintes

- **Vercel n'a pas de SQLite persistant** : le back-end Express (`backend/`) ne peut pas être
  déployé tel quel pour écrire. Deux cibles possibles, non tranchée (voir `DECISIONS.md`).
- **Trois sources de données divergentes** : `site3/activite.html` (source du seed),
  `api/_data/*` (prod), `backend/db/cbrs.sqlite` (local). Ex. activité 09 : 7 référents
  dans `site3/activite.html:494` vs 1 dans `api/_data/activities.js:34`.
- **Shape API ≠ shape fiche publique** : API renvoie `short_description`/`practical_info`/`animators{name,phone,email}` ;
  `site3/activite.html` attend `desc`/`info`/`animators[].photo` (`site3/activite.html:564,586,618`).
- `site3/` est publié depuis la racine du repo : tout fichier de la racine peut devenir public
  (ex. `/ROADMAP.md` accessible). **`.vercelignore` (racine, 2026-09-16)** exclut la mémoire
  (`.project/`, `.hermes/`), le CMS legacy (`backend/`), `docs/`, `scripts/`, les docs internes
  et les doublons — les copies publiques sous `site3/` (`site3/docs/*.pdf`) restent servies.
- `.project/` = mémoire curatée (ce dossier) ; `.codegraph/` = index structurel (gitignoré).

## Cible — Cockpit (décision 2026-09-13)

```
  Visiteur ──▶ site3/ statique (Vercel)  ──fetch──▶  API Cockpit (HTTPS, token)
                                                        │
  Webmaster ──▶ Cockpit admin (/cockpit) ──────────────┤
                                                        ▼
                              Proxmox ns338011 (37.187.249.183)
                              └─ Docker / Dokploy / LXC  →  Cockpit (PHP + SQLite) + assets
```

- **CMS** : Cockpit self-hosted (PHP, REST/GraphQL, collections, assets, rôles).
- **Hébergement** : Proxmox `37.187.249.183` (`ns338011`, Debian 13, PVE 9.2.11, 62 Go RAM).
  Infrastructure existante : VM `200 dokploy` (PaaS Docker, `10.10.0.x`), CT `103 lxc-services`
  (Docker, 8080/8081), CT `102 lxc-db` (PostgreSQL + MariaDB), CT `104 netbird-gw`
  (mesh WireGuard `100.102.0.0/16`, Mac mini peer).
- **Accès public** : à trancher — (a) API Cockpit exposée en HTTPS publique, ou
  (b) proxy `api/` serverless → Cockpit privé (token caché).
- **Legacy** : `backend/` Express+SQLite et `api/_data/*` ne sont plus la cible.

## Référence de travail

- Plan de build du CMS : `.hermes/plans/2026-06-15_074842-backend-cms-cbrs.md` (14 tâches).
- Roadmap fonctionnelle : `ROADMAP.md` (P1 Commons/sorties → P4 idées non engagées).
