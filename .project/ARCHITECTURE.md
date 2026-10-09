# Architecture

- `site3/` : site statique, routes publiques définies dans `vercel.json`, CSS compilé et JS vanilla. `cms-client.js` lit l’API Payload et conserve le repli HTML.
- `cms/` : Payload 3 sur Next.js, interface française. Globals : Formation, Flash info, Tarifs, Paramètres, Apparence, Titres des pages. Collections : activités, sorties, vie du club, galerie, médias, documents, bureau, bénévoles, rôles.
- Stockage : PostgreSQL + Vercel Blob en production ; SQLite et fichiers locaux en développement. Les migrations versionnées incluent les historiques.
- Formation : `/api/globals/formation?depth=1` peuple les PDF et images. `cartes[].image` utilise la photothèque, `icone` garde les pictogrammes livrés avec le site.
- Titres des pages : `/api/globals/titres` ; `cms-client.js` remplace les éléments `data-cbrs-titre`, `data-cbrs-titre-surtitre`, `data-cbrs-titre-intro` (clé = nom du groupe) et met le mot en valeur en italique bleu.
- Administration : `admin/VoirPage.tsx` est enregistré dans l’importMap et les slots `elements.beforeDocumentControls` des globals, à côté du retour en arrière.
- Local : `tooling/serve.mjs` réécrit l’URL CMS vers son proxy `/__cms`, cible choisie par `CBRS_CMS_ORIGIN`.
- Vercel : `cbrs-sites` sert la racine ; `cbrs-cms` construit `cms/` depuis `main` avec migrations puis build. Domaine `cbrs-cms.vercel.app` attaché au projet ; attribution automatique réactivée le 2026-10-02.
