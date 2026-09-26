# CMS CBRS — maquette Payload

Administration du site du Club du Beauvaisis de la Retraite Sportive, **en français**, basée sur
[Payload](https://payloadcms.com) (licence MIT, gratuit, sans limite de comptes).

## Démarrer en local

```sh
cd cms
npm install
cp .env.example .env            # puis renseigner PAYLOAD_SECRET (chaîne aléatoire longue)
CBRS_SEED_PASSWORD='un-mot-de-passe-long' npm run seed   # jeu de démonstration, base vide uniquement
npm run dev                     # http://localhost:3000/admin
```

Comptes de démonstration (mot de passe = `CBRS_SEED_PASSWORD`) :

| Compte | Rôle | Ce qu'il voit |
| --- | --- | --- |
| `admin@cbrs.local` | Administrateur | Tout, dont la gestion des bénévoles |
| `bureau@cbrs.local` | Bureau | Vie du club, Présentation du bureau, Flash info, Activités, Documents, Photos |
| `randonnee@cbrs.local` | Responsable d'activité | **Uniquement l'activité Randonnée** + Photos |
| `sorties@cbrs.local` | Équipe Sorties & Voyages | Sorties & Voyages, Photos |

## Contenus

| Collection | Section du site | Qui modifie |
| --- | --- | --- |
| Vie du club | Accueil `#vie-du-club` | Bureau |
| Présentation du bureau | Accueil `#bureau` | Bureau |
| Flash info | Bandeau de l'accueil | Bureau |
| Activités (+ créneaux) | Activités, fiche, planning | Bureau, ou le **référent** de l'activité |
| Sorties & Voyages | Pages sorties et voyages | Bureau, équipe **Sorties & Voyages** |
| Documents (PDF) | Statuts, Adhésion, Liens utiles | Bureau |
| Photos | Toutes les pages | Tous les bénévoles connectés (ajout) |
| Galerie | Galerie photos du site | Bureau, équipe **Galerie** |
| Tarifs | Page Adhésion | Bureau |
| Paramètres du site | Chiffres clés, adresses de contact | Administrateur |
| Bénévoles | — | Administrateur |

Les règles d'accès sont dans `src/access.ts` ; elles sont testées dans `tests/int/acces.int.spec.ts`.

## API publique (lecture seule)

- `GET /api/vie-du-club` — actualités publiées (les brouillons ne sortent jamais)
- `GET /api/membres-bureau`, `GET /api/activites`, `GET /api/documents`
- `GET /api/sorties` — manifestations, sorties et voyages publiés (les brouillons ne sortent jamais)
- `GET /api/galerie`
- `GET /api/globals/flash-info`, `GET /api/globals/tarifs`, `GET /api/globals/parametres`

Les origines autorisées (CORS) se règlent avec `CBRS_SITE_ORIGINS` (liste séparée par des virgules).

## Tests

```sh
npm run test:int   # droits d'accès, base SQLite de test isolée
```

## Mise en production (Proxmox / Dokploy)

Le CMS tourne en Docker (Node 22 alpine, serveur Next standalone) avec PostgreSQL 16.
L'adaptateur de base est choisi selon `DATABASE_URL` : dès que l'URL commence par `postgres://`
ou `postgresql://`, Payload utilise `@payloadcms/db-postgres` ; sinon SQLite (local).
Le TLS est assuré par le reverse proxy de l'hôte sur le sous-domaine dédié (ex. `admin.cbrs60.fr`).

### Variables d'environnement

Copier `.env.example` vers `.env` sur le serveur et renseigner au minimum :

| Variable | Rôle |
| --- | --- |
| `PAYLOAD_SECRET` | secret de signature des sessions (obligatoire, `openssl rand -base64 48`) |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | base PostgreSQL du conteneur `postgres` |
| `CMS_PORT` | port du CMS publié sur l'hôte (le reverse proxy pointe dessus) |
| `CBRS_SITE_ORIGINS` | origines autorisées à lire l'API (CORS) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | e-mails « mot de passe oublié » — désactivés si `SMTP_HOST` est vide |

### Démarrage

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

Au démarrage du conteneur `cms`, les migrations PostgreSQL (fichiers `src/migrations/`,
appliquées par `payload migrate`) sont jouées automatiquement avant `node server.js`.
La base vit dans le volume `pgdata`, les photos envoyées dans le volume `media`.

Première installation : créer les comptes de démonstration (le seed s'ignore si la base
contient déjà des comptes) :

```sh
docker compose -f docker-compose.prod.yml exec cms \
  sh -c 'CBRS_SEED_PASSWORD="un-mot-de-passe-long" node_modules/.bin/payload run src/seed/index.ts'
```

### Sauvegarde (à planifier chaque nuit sur l'hôte)

Base PostgreSQL :

```sh
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U cbrs cbrs | gzip > sauvegarde-cbrs-$(date +%F).sql.gz
```

Dossier des médias (volume `media` du conteneur `cms`) :

```sh
docker run --rm --volumes-from $(docker compose -f docker-compose.prod.yml ps -q cms) \
  -v $(pwd):/sauvegarde alpine tar czf /sauvegarde/media-cbrs-$(date +%F).tar.gz /app/media
```

Conserver plusieurs jours d'historique (voir la rotation de sauvegardes de l'hôte Proxmox).

### Restauration

Arrêter le CMS le temps de l'opération : `docker compose -f docker-compose.prod.yml stop cms`,
restaurer dans une base vide, puis `docker compose -f docker-compose.prod.yml up -d` :

```sh
# base (remplacer cbrs par POSTGRES_USER si différent)
gunzip -c sauvegarde-cbrs-2026-09-25.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres psql -U cbrs cbrs

# médias
docker run --rm --volumes-from $(docker compose -f docker-compose.prod.yml ps -q cms) \
  -v $(pwd):/sauvegarde alpine sh -c 'cd / && tar xzf /sauvegarde/media-cbrs-2026-09-25.tar.gz'
```

## Déploiement sur Vercel

Le CMS se déploie aussi sur Vercel (le dossier `cms/` est alors **la racine du projet**).
Le fichier `cms/vercel.json` lance `npm run migrate && npm run build` : les migrations
PostgreSQL sont appliquées à chaque déploiement.

### Base de données (Neon)

Ajouter l'**intégration Neon** au projet Vercel : elle fournit `POSTGRES_URL`, utilisé
automatiquement si `DATABASE_URL` est absent (adaptateur PostgreSQL). Sinon, renseigner
`DATABASE_URL` (préfixe `postgres://` ou `postgresql://`).

### Stockage des fichiers (Vercel Blob)

Ajouter l'**intégration Vercel Blob** : elle fournit `BLOB_READ_WRITE_TOKEN`. Dès qu'il est
défini, les collections `media` et `documents` stockent leurs fichiers dans Blob. Sans ce
jeton, le stockage disque reste utilisé (Docker, local).

### Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `POSTGRES_URL` | fournie par l'intégration Neon (ou `DATABASE_URL` manuellement) |
| `BLOB_READ_WRITE_TOKEN` | fournie par l'intégration Vercel Blob (photos et PDF) |
| `PAYLOAD_SECRET` | secret de signature des sessions (obligatoire, `openssl rand -base64 48`) |
| `CBRS_SITE_ORIGINS` | origines autorisées à lire l'API (CORS) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | e-mails « mot de passe oublié » — désactivés si `SMTP_HOST` est vide |

### Jeu de démonstration

Récupérer les variables du projet puis lancer le seed depuis un poste local :

```sh
cd cms
vercel env pull .env.local   # POSTGRES_URL, PAYLOAD_SECRET, CBRS_SEED_PASSWORD, etc.
CBRS_SEED_PASSWORD='un-mot-de-passe-long' npm run seed
```

