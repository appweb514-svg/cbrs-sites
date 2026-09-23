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
| `sorties@cbrs.local` | Équipe Sorties & Voyages | Photos (les collections Sorties/Voyages viendront à l'étape suivante) |

## Contenus

| Collection | Section du site | Qui modifie |
| --- | --- | --- |
| Vie du club | Accueil `#vie-du-club` | Bureau |
| Présentation du bureau | Accueil `#bureau` | Bureau |
| Flash info | Bandeau de l'accueil | Bureau |
| Activités (+ créneaux) | Activités, fiche, planning | Bureau, ou le **référent** de l'activité |
| Documents (PDF) | Statuts, Adhésion, Liens utiles | Bureau |
| Photos | Toutes les pages | Tous les bénévoles connectés (ajout) |
| Bénévoles | — | Administrateur |

Les règles d'accès sont dans `src/access.ts` ; elles sont testées dans `tests/int/acces.int.spec.ts`.

## API publique (lecture seule)

- `GET /api/vie-du-club` — actualités publiées (les brouillons ne sortent jamais)
- `GET /api/membres-bureau`, `GET /api/activites`, `GET /api/documents`
- `GET /api/globals/flash-info`

Les origines autorisées (CORS) se règlent avec `CBRS_SITE_ORIGINS` (liste séparée par des virgules).

## Tests

```sh
npm run test:int   # droits d'accès, base SQLite de test isolée
```

## Production (prévu)

Docker sur le serveur Proxmox (Dokploy), PostgreSQL au lieu de SQLite (`@payloadcms/db-postgres`),
sauvegarde quotidienne de la base et du dossier `media/`, TLS sur un sous-domaine dédié.
