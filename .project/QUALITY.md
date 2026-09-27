# QUALITY — CBRS

## Tests

- **Aucun test automatisé** dans le repo.
- Validation minimale prévue par le plan (`.hermes/plans/…`, §10) : tests `curl` manuels.
- Site public vérifiable via `scripts/check-cbrs-ui.mjs`.

## Sécurité — état actuel

| Sujet | Constat | Référence |
| --- | --- | --- |
| Persistance prod | Aucune : `api/` est en lecture seule, pas d'auth ni d'écriture ; le CMS Express n'est pas déployé. | `vercel.json`, `api/**` |
| Faux admin client | Identifiants en clair affichés, auth `localStorage`. | `site3/connexion.html:56-74`, `site3/auth.js` |
| Secret de session | Valeur de repli `cbrs-dev-change-me`, cookies `secure:false`, MemoryStore. | `backend/server.js:16-20` |
| Mots de passe seed | `admin1234` / `formateur1234` par défaut. | `backend/db/seed.js:26,31` |
| Route non protégée | ~~`GET /api/admin/gallery` accessible sans login.~~ **Corrigé 2026-09-14** (`gallery.js:25`). | `backend/src/routes/gallery.js:25` |
| Upload | `multer` accepte 10 Mo (préconisé 2 Mo). | `backend/src/routes/gallery.js:23` |
| Fuite de fichiers | La racine est publiée : `ROADMAP.md`, PDF, sources accessibles. | `vercel.json:4` |
| RGPD | Numéros retirés (`a1b92af`) ; ne pas réintroduire de `phone` public. | `site3/**` |

## Exigences de livraison (cibles)

- Aucune écriture ne doit dépendre du navigateur pour du contenu réel.
- Toute route `/api/admin/*` : `401` sans session, `403` si rôle/permission insuffisant.
- Un formateur ne peut modifier que ses activités (`activity_permissions`).
- Crédit photo obligatoire si licence autre que CC0/domaine public.
- Le site public doit rester fonctionnel avec un fallback si l'API est indisponible.
- Pas de secret en dur ni commité ; variables d'environnement pour session/mots de passe.
