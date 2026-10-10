# Site de test sur alwaysdata

Déploie le site (`site3/`), les réponses de l'API publique et le CMS Payload sur le compte
alwaysdata `cbrs-test`. La production (Vercel + Neon) n'est pas touchée.

| Partie | Où | Comment |
| --- | --- | --- |
| Site statique | `~/www` (site 1083470) | copie de `site3/`, adresses du CMS réécrites vers l'origine unique, `.htaccess` (URLs propres, `/admin`, `/cms-docs`) |
| API publique | `~/api-public` (adresse `/api/public`) | `gen-public-api.cjs` génère en JSON les fonctions Vercel `api/public/*` ; `.htaccess` retire l'extension |
| CMS | `~/cms` (site Node 1083477) | build et `node_modules` Linux construits en local (Docker) ou en CI (ni `next build` ni `npm ci` ne tiennent dans la mémoire du compte), envoi de `.next` (et de `node_modules` si `package-lock.json` change), `npm run migrate`, redémarrage par l'API |

Les secrets (`.env` du CMS, médias) restent sur le serveur et ne sont jamais écrasés.

## Déploiement à la main

```bash
export AD_API_TOKEN=...          # jeton API alwaysdata (compte cbrs-test)
SSH_OPTS="-i ~/.ssh/cbrs_deploy" deploy/alwaysdata/deploy.sh all   # ou static | api | cms
```

## Déploiement automatique (GitHub Actions)

`.github/workflows/deploy-alwaysdata.yml` s'exécute à chaque fusion sur `main` (et à la demande).
Si `cms/` n'a pas changé, seuls le site et l'API sont mis à jour (quelques secondes).

À créer une fois (Settings → Secrets and variables → Actions) :

1. `ALWAYSDATA_SSH_KEY` : clé privée dédiée. `ssh-keygen -t ed25519 -f cbrs_deploy -N ""`, puis ajouter
   `cbrs_deploy.pub` dans alwaysdata (Accès distant → Clés SSH) ou dans `~/.ssh/authorized_keys`.
2. `ALWAYSDATA_API_TOKEN` : jeton API alwaysdata (Compte → Jetons) pour redémarrer le CMS.

## Sauvegardes et e-mails

Tout se pilote dans le CMS : Paramètres (administrateur), onglets « E-mails (SMTP) » et « Sauvegardes ».
Non disponible sur Vercel (pas de disque persistant). Migration à appliquer au déploiement :
`20261011_090000_parametres_smtp_sauvegardes` (colonnes des groupes `smtp` et `sauvegarde`).

**E-mails.** Les secrets (mot de passe SMTP, clés S3, jetons) sont chiffrés en base (AES-256-GCM, clé dérivée de
`PAYLOAD_SECRET`) : changer `PAYLOAD_SECRET` oblige à les ressaisir. Champ laissé tel quel = valeur conservée.

**Sauvegardes (variables de `~/cms/.env`)**

- `CBRS_SAUVEGARDES=1` : active la sauvegarde hebdomadaire (contrôle toutes les 10 min ; jour et heure réglables,
  dimanche 3 h par défaut). Sans cette variable, seuls les boutons manuels fonctionnent.
- `CBRS_SAUVEGARDES_DIR` : dossier des instantanés (défaut `~/backups/auto`).
- `CBRS_WWW_DIR` (défaut `../www`) et `CBRS_API_PUBLIC_DIR` (défaut `../api-public`), relatifs à `~/cms`.

Contenu : base PostgreSQL (`pg_dump`, `base.sql.gz`), `media`, `documents`, `www`, `api-public`. Jamais `.env`
(à sauvegarder à part). Chaque passage crée `~/backups/auto/AAAA-MM-JJ_HHmm/` par `rsync --link-dest` : les fichiers
inchangés sont des liens physiques (peu d'espace). Les instantanés de plus de 90 jours (réglable) sont supprimés.
Le dernier passage (statut, taille, erreur, copie externe) s'affiche dans l'onglet ; `etat.json` est à côté des
instantanés. « Télécharger une sauvegarde complète » produit un zip `cbrs-sauvegarde-AAAA-MM-JJ.zip`.

**Copie hors du serveur** (rclone, configuré par variables d'environnement, sans fichier de configuration) :
`courant/` (miroir), `archives/<date>/` (versions remplacées ou supprimées), `bases/<date>.sql.gz`, purge au-delà de
la durée de conservation. rclone doit être dans le `PATH` du CMS.

- S3 : endpoint, région, bucket, clés d'accès (AWS, OVH, Scaleway, Backblaze…).
- Dropbox / Google Drive : sur un poste avec rclone, `rclone authorize "dropbox"` (ou `"drive"`), se connecter,
  puis coller dans le CMS le JSON affiché entre `Paste the following into your remote machine --->` et `<---End paste`.
  Google Drive : publier l'application OAuth, sinon le jeton expire au bout de 7 jours.
- Bouton « Tester la connexion » après enregistrement.

**Restauration manuelle**

1. Base : `gunzip -c base.sql.gz | psql "$DATABASE_URL"` (base vide ; couper le CMS avant).
2. Fichiers : `rsync -a ~/backups/auto/<instantané>/media/ ~/cms/media/` (idem `documents`, `www`, `api-public`).
3. Depuis la copie externe : `rclone copy cbrs:<dossier>/courant <destination>` (avec les variables
   `RCLONE_CONFIG_CBRS_*` ou `rclone config`), puis redémarrer le CMS.

## Limites connues

- E-mails : le serveur d'envoi se règle dans le CMS (Paramètres, onglet « E-mails (SMTP) », bouton de test
  inclus). À défaut, repli sur `SMTP_HOST` (+ `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) de `~/cms/.env`.
  Sans réglage ni variables, « mot de passe oublié » renvoie une erreur explicite. Voir « Sauvegardes et e-mails ».
- L'API publique est figée (comme sur Vercel : données de `api/_data`) ; `api/contact.js` n'a pas d'équivalent.
- Les PDF de `docs/` absents du dépôt s'affichent « bientôt disponible » (comportement de `ui-shell.js`).
