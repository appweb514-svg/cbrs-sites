# CONVENTIONS — CBRS

## Commandes

```sh
# Site public : servir la racine et ouvrir /site3/index.html
python3 -m http.server 8080

# Backend CMS (local)
cd backend
npm install          # dépendances (node_modules gitignoré)
npm run seed         # crée/remplit backend/db/cbrs.sqlite (idempotent partiel)
npm run dev          # http://127.0.0.1:3000  (site + /admin + /api)

# Recherche photo Commons en CLI
node backend/src/services/commons-search.js "Le Tréport" --limit 3
```

Comptes seed par défaut : `admin@cbrs.local / admin1234`, `formateur@cbrs.local / formateur1234`
(écrasables via `CBRS_ADMIN_PASSWORD`, `CBRS_FORMATEUR_PASSWORD`).

## Stack observée

- **Front public** : HTML statique, Tailwind via CDN, JS vanilla (aucun build). Shell partagé `site3/ui-shell.js`.
- **Admin** : HTML/CSS/JS simple, `backend/public-admin/`.
- **Backend** : Node CommonJS, Express 4, better-sqlite3, express-session, bcryptjs, multer.
- **Prod** : Vercel static + serverless functions CommonJS (`api/`).

## Style / patterns

- Pas de commentaires superflus dans le code.
- Identifiants d'activités sur 2 chiffres (`'01'`…`'15'`), `slug` dérivé du nom.
- Données publiques renvoyées sous `{ activities }`, `{ activity }`, `{ flash }`, `{ items }`,
  `{ settings }`, `{ photos }` (voir `backend/src/routes/public.js`).
- JSON stocké en colonne texte pour les listes (`practical_info`).
- Crédits photo Commons : `{ commons, artist, license }` (voir `site3/sorties-data.js`).
- Réponses admin : `{ error: '...' }` + code HTTP 401/403/404.

## Langue

- Contenu du site, messages d'erreur et documentation : **français**.
- Messages de commit : français, préfixes `feat:`, `fix:`, `uiux:`, `docs:`, `assets:`.
