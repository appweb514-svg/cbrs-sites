# Plan CMS — CBRS

Date : 2026-09-23 · Statut : **outil choisi (Payload), maquette en PR #4**

## 1. Objectif

- Un **administrateur** gère l'ensemble du site de l'association.
- Les **équipes de bénévoles** mettent à jour **leur propre section**, sans pouvoir toucher aux autres.
- Le site public reste statique sur Vercel (`site3/`) ; le CMS est hébergé sur le serveur Proxmox du projet
  (décision du 2026-09-13).

## 2. Rôles

| Rôle | Périmètre | Droits |
| --- | --- | --- |
| Administrateur | Tout le site, utilisateurs, rôles | Lecture/écriture/publication partout |
| Bureau | Vie du club, Présentation du bureau, Statuts & règlement, Tarifs, Flash info | Écriture + publication sur ces sections |
| Responsable d'activité | **Uniquement la ou les activités dont il est référent** (fiche + créneaux de planning) | Écriture ; publication directe ou validation par le bureau |
| Équipe Sorties & Voyages | Manifestations, Sorties, Voyages | Écriture + publication sur ces sections |
| Équipe Galerie | Albums et photos | Ajout de photos, légendes |

## 3. Modèle de contenu

Les zones concernées sont déjà repérées dans le HTML par `data-cms-collection="…"` (branche `appweb514-svg/retours-client-cbrs`).

| Collection | Champs principaux | Page(s) | Rôle éditeur |
| --- | --- | --- | --- |
| `vie_du_club` | titre, date, catégorie, image, résumé, lien | Accueil (`#vie-du-club`) | Bureau |
| `bureau` | nom, fonction, photo, ordre | Accueil (`#bureau`) | Bureau |
| `documents` | titre, description, fichier PDF, rubrique (statuts, adhésion, assurance, fédéral) | Statuts, Adhésion, Liens utiles | Bureau |
| `tarifs` | montant, libellé, ordre | Planning (« Envie de nous rejoindre ») | Bureau |
| `flash_info` (singleton) | message, actif | Accueil | Bureau |
| `activites` | nom, icône, description, présentation, lieu, infos pratiques, **référents (utilisateurs)** | Activités, fiche activité | Responsable d'activité |
| `creneaux` | activité, jour, horaire, lieu | Planning | Responsable d'activité |
| `manifestations`, `sorties`, `voyages` | titre, date, lieu, image + crédit Commons, texte, coordonnées | Sorties & Voyages, fiches | Équipe Sorties & Voyages |
| `galerie` | album, année, photo, légende | Galerie | Équipe Galerie |
| `parametres` (singleton) | chiffres clés (1993, 1 200, une vingtaine), contacts, réseaux | Tout le site | Administrateur |

## 4. Choix de l’outil : Payload (décision du 2026-09-23)

Critères retenus : **simple, en français, gratuit** ; à défaut, un développement maison.

**Payload** (licence MIT) coche les trois cases, et il couvre l’exigence décisive : « un responsable d’activité ne modifie que ses activités ».

- Gratuit, sans limite de comptes ni de contenus.
- Interface d’administration traduite en français ; tous les libellés des champs sont écrits en français.
- Droits par section **et** par élément, écrits en code et testés.
- Évite de redévelopper la connexion, les mots de passe, l’envoi de fichiers et l’administration (estimation « tout maison » : 3 à 4 semaines).

Options écartées : **Cockpit** (droits par section seulement), **Directus** (gratuité conditionnelle au-delà de 3 comptes, interface plus technique), **Decap CMS** (compte GitHub pour chaque bénévole, droits insuffisants).

Maquette : PR #4 (`cms/`), 12 tests d’accès.

## 5. Architecture cible

```
Visiteur ─▶ Vercel : site3/ statique
               └─ fetch /api/cms/<collection>  (fonction serverless, jeton caché,
                    cache s-maxage=300 + stale-while-revalidate, repli sur JSON statique)
                        │
Bénévoles / admin ─▶ https://cms.<domaine>  (Proxmox, Docker via Dokploy, TLS, sauvegardes)
                        └─ CMS headless + PostgreSQL existant + fichiers (volume sauvegardé)
```

- Jeton de lecture seule côté Vercel (variable d'environnement), jamais dans le navigateur.
- Cache Vercel : une modification apparaît en moins de 5 minutes, et le site reste disponible même si le CMS tombe (repli statique).
- Images : servies par le CMS avec redimensionnement (`?width=`), crédit photo obligatoire en champ.

## 6. Plan de mise en œuvre

| Phase | Contenu | Charge |
| --- | --- | --- |
| 0. Décision | Choix Directus/Cockpit, sous-domaine, hôte (Dokploy recommandé) | 0,5 j |
| 1. Infrastructure | Déploiement Docker, TLS, PostgreSQL, sauvegardes quotidiennes et test de restauration | 1–1,5 j |
| 2. Modèles et rôles | Collections du §3, rôles du §2, filtres par référent | 1 j |
| 3. Migration des données | Import depuis `site3/activite.html`, `site3/sorties-data.js`, `api/_data/*` (trois sources divergentes à réconcilier) | 1–1,5 j |
| 4. Branchement du site, **par ordre de priorité client** | ① Vie du club, Présentation du bureau, Statuts & règlement ; ② Flash info, tarifs, documents ; ③ Activités + planning ; ④ Sorties & Voyages ; ⑤ Galerie | 3–4 j |
| 5. Nettoyage | Supprimer le faux admin client (`site3/connexion.html`, `site3/admin.html`, `site3/auth.js` : identifiants en clair), archiver `backend/` Express et `api/_data/*` | 0,5 j |
| 6. Formation | Guide bénévole d'une page par rôle + séance de 1 h, compte de test | 1 j |

**Total estimé : 8,5 à 10 jours**, livrable par étapes (chaque phase 4 est publiable seule).

## 7. Risques et questions ouvertes

- **Sécurité** : l'admin actuel `site3/connexion.html` est une démo avec identifiants en clair, publiée en production. À retirer dès la phase 5, ou plus tôt.
- **Données personnelles** : les photos et noms du bureau nécessitent l'accord écrit des personnes ; pas de téléphone public (décision RGPD du 2026-06-16).
- Qui valide les publications des responsables d'activité : publication directe ou relecture par le bureau ?
- Nombre de comptes bénévoles attendus (impact sur la licence Directus Core au-delà de 3 comptes).
- Domaine définitif de l'association (pour `cms.<domaine>` et le site).
