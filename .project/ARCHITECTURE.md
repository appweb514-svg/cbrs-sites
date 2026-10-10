# Architecture

- `site3/` : site statique, routes publiques définies dans `vercel.json`, CSS compilé et JS vanilla. `cms-client.js` lit l’API Payload et conserve le repli HTML.
- `cms/` : Payload 3 sur Next.js, interface française. Globals : Formation, Flash info, Tarifs, Paramètres, Apparence, Titres des pages. Collections : activités, sorties, vie du club, galerie, médias, documents, bureau, bénévoles, rôles.
- Stockage : PostgreSQL + Vercel Blob en production ; SQLite et fichiers locaux en développement. Les migrations versionnées incluent les historiques.
- Formation : `/api/globals/formation?depth=1` peuple les PDF et images. `cartes[].image` utilise la photothèque, `icone` garde les pictogrammes livrés avec le site.
- Titres des pages : `/api/globals/titres` ; `cms-client.js` remplace les éléments `data-cbrs-titre`, `data-cbrs-titre-surtitre`, `data-cbrs-titre-intro` (clé = nom du groupe) et met le mot en valeur en italique bleu.
- Administration : `admin/VoirPage.tsx` est enregistré dans l’importMap et les slots `elements.beforeDocumentControls` des globals, à côté du retour en arrière.
- Local : `tooling/serve.mjs` réécrit l’URL CMS vers son proxy `/__cms`, cible choisie par `CBRS_CMS_ORIGIN`.
- Vercel : `cbrs-sites` sert la racine ; `cbrs-cms` construit `cms/` depuis `main` avec migrations puis build. Domaine `cbrs-cms.vercel.app` attaché au projet ; attribution automatique réactivée le 2026-10-02.
- Lecteur PDF : `ui-shell.js` (`setupPdfViewer`) ouvre tout lien PDF (`.pdf`, `/api/documents/file/`, `data-cbrs-doc`) dans une visionneuse commune (zoom, impression, téléchargement) ; `window.openPdf`.
- E-mails : `cms/src/email.ts` lit le groupe `smtp` du global Paramètres à chaque envoi (repli sur les variables `SMTP_*`) ; mot de passe chiffré (`src/secret.ts`, AES-256-GCM dérivé de `PAYLOAD_SECRET`). Test : `POST /api/parametres-smtp-test`.
- Sauvegardes (alwaysdata seulement, refusées sur Vercel) : `src/sauvegarde/` + endpoints `/api/sauvegardes/{telecharger,lancer,etat,test-externe}` réservés aux admins. Instantanés `rsync --link-dest` (www, api-public, media) + `pg_dump` gzip dans `CBRS_SAUVEGARDES_DIR` (défaut `~/backups/auto`), purge après N jours ; planification par `setInterval` (10 min) lancé dans `onInit` si `CBRS_SAUVEGARDES=1`. Copie externe par rclone (S3/Dropbox/Drive) configuré uniquement par variables d'environnement.
