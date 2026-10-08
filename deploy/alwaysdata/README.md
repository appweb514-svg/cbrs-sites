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

## Limites connues

- E-mails : le CMS n'active l'envoi que si `SMTP_HOST` (+ `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`,
  `SMTP_FROM`) figurent dans `~/cms/.env`. Sans domaine propre, pas de boîte alwaysdata : non configuré.
- L'API publique est figée (comme sur Vercel : données de `api/_data`) ; `api/contact.js` n'a pas d'équivalent.
- Les PDF de `docs/` absents du dépôt s'affichent « bientôt disponible » (comportement de `ui-shell.js`).
