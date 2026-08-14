# ROADMAP — CBRS

Fonctionnalités planifiées pour le site CBRS (site3/ + backend/).

Statuts : 🔵 À faire · 🟡 En cours · 🟢 Fait · ⚪ Non prioritaire

---

## ❓ Question upscale des photos de sorties

**Constat :** les 11 photos de sorties/événements (site3/assets-premium/sortie-*.jpg, event-*.jpg) sont
téléchargées depuis Wikimedia Commons en **1920 px de large, 5:4 ou 3:2** (résolution native « 1920px »
fournie par Commons ≈ 0,5 à 1,1 Mo chacune).

**Réponse :** un upscale (ex. 2x) n'apporterait **aucun gain visible** pour l'affichage web actuel :
le conteneur de photo dans `sortie.html`/`evenement.html` ne dépasse pas ~1200 px de large, et le
navigateur redimensionne déjà vers le bas. Upscaler ajouterait du poids (et une laideur « surlissée »)
sans amélioration perceptible.

**Décision recommandée :** ne pas upscaler. À la place, si besoin de qualité perçue :
- [ ] ⚪ Optimiser le poids (convertir en WebP/AVIF ~90 %, gain ~50-70 % sans perte visible)
- [ ] ⚪ Ajouter `loading="lazy"` + `fetchpriority` sur les images des fiches détail

---

## 🎯 P1 — Recherche de photos Wikimedia Commons côté back-end (webmaster)

**Objectif :** quand le webmaster met en ligne une sortie depuis le back-end, il peut chercher une
photo libre de droits (Wikimedia Commons) directement dans l'admin, prévisualiser, choisir et
enregistrer **image + crédit obligatoire** (artiste, licence, lien Commons).

### 🟢 1.1 — Module de recherche (fait)

Fichier : `backend/src/services/commons-search.js`

- Fonction `searchCommonsPhotos(query, { limit, width })` → liste de résultats :
  `{ title, commonsUrl, thumbUrl, fileUrl, width, height, license, artist, safeName }`
- API officielle Wikimedia Commons (`action=query`, `generator=search`, `prop=imageinfo`,
  `iiprop=url|size|extmetadata`) — aucun token, aucune clé, usage gratuit.
- Licence et artiste extraits automatiquement des métadonnées (obligation CC-BY).
- Utilisable en module (`require`) et en CLI :
  `node src/services/commons-search.js "Le Tréport" --limit 3`
- ✅ Testé : 3 requêtes réelles OK (« Le Tréport », « Dieppe port »), URLs nettoyées (`utm_*` retirés).

### 🔵 1.2 — Route API back-end

- [ ] Créer `backend/src/routes/commons.js` :
  - `GET /api/admin/photos/search?q=Dieppe&limit=12` (auth admin requise, rate-limit)
  - Réutilise `searchCommonsPhotos()` de 1.1
- [ ] Montage dans `backend/server.js` avec les routes admin existantes
- [ ] ✅ Test : curl authentifié → JSON de résultats

### 🔵 1.3 — Écran admin « Sorties » (le webmaster publie une sortie)

- [ ] Créer `backend/public-admin/outings.html` + `outings-edit.html` (CRUD sorties),
      calqué sur le pattern `activities.html` / `activity-edit.html` existant
- [ ] Table `outings` en base : `id, title, category, teaser, description, location,
      lat, lng, bbox, date, schedule, status, image, photo_credit, published`
- [ ] Routes admin : `GET/POST/PUT/DELETE /api/admin/outings`, route publique
      `GET /api/outings` (consommable par `sorties-voyages.html`)
- [ ] Dans le formulaire : bouton « 🔎 Chercher une photo » → panneau de recherche
      (champ texte + grille de miniatures Commons) → clic = sélection
- [ ] À l'enregistrement : télécharger `fileUrl` (webmaster proxied via serveur) dans
      `backend/uploads/outings/`, générer les crédits côté admin, et fusionner le
      JSON dans `site3/sorties-data.js` (sortie = publiée immédiatement sur le site)

### 🔵 1.4 — Crédits photo (obligatoire)

- [ ] Champ `photo_credit` non vide requis à la validation (blocage sinon)
- [ ] Format stocké : `{ commons, artist, license }` (même modèle que `sorties-data.js`)
- [ ] Affichage automatique dans `site3/sortie-detail.js` (déjà en place via `#detail-photo-credit`)

---

## 🎯 P2 — Recherche photo intégrée à un éditeur WYSIWYG

**Objectif :** dans tout éditeur de contenu riche du back-end, offrir un bouton « Insérer une image » qui
ouvre la recherche Commons, insère l'image **et son crédit** dans le HTML avec attributs normalisés.

### 🔵 2.1 — Choisir/intégrer l'éditeur WYSIWYG

- [ ] Actuellement : `activity-edit.html` utilise des `<textarea>` bruts → basculer les
      champs longs (`presentation`, `practical_info`, …) sur un éditeur léger
      (TinyMCE/Quill/CDN) — pas de build à conserver, compatible admin statique
- [ ] ⚪ Évaluer l'impact sur `api/admin/activities` (texte enrichi → HTML stocké en base)

### 🔵 2.2 — Plugin « image depuis Commons » dans l'éditeur

- [ ] Bouton toolbar « 🖼️ Commons » → dialogue modal :
      1. champ recherche (mêmes critères que 1.2)
      2. grille de miniatures (thumbUrl 640 px) avec licence visible
      3. clic « Insérer » → `editor.insertContent(...)`
- [ ] Insertion normalisée :
      `<figure><img src="<URL Commons proxifiée ou uploadée>" alt="…">
      <figcaption>Photo : <a href="{commonsUrl}">{artist}</a> — {license} — via Wikimedia Commons</figcaption></figure>`
      (crédit = exigence légale CC-BY, inséré automatiquement, non supprimable par défaut)
- [ ] Téléchargement local (plutôt que lien chaud) : le back-end proxifie/downloade
      l'image vers `backend/uploads/` (évite le hotlinking bloqué par Commons)
- [ ] ✅ Test manuel : insérer une photo dans une présentation d'activité → vérifier
      l'affichage côté public et la présence du crédit

### 🔵 2.3 — Attribution de licence en sécurité

- [ ] Règle : si `license` contient autre chose que CC0/Public domain → crédit **toujours**
      présent en `figcaption` ; si l'admin retire le texte, un avertissement s'affiche
- [ ] Journal : enregistrer `photo_credit` dans la base (traçabilité)

---

## 🔵 P3 — Publication des sorties par le webmaster (parcours complet)

- [ ] Table `outings` (cf. 1.3) + synchronisation vers `site3/sorties-data.js`
- [ ] L'écran admin affiche les sorties existantes : modifier/dupliquer/archiver
- [ ] La page publique `sorties-voyages.html` bascule sur l'API (`GET /api/outings`)
      avec fallback statique si l'API est indisponible (résilience)
- [ ] Validation automatique : titre non vide, image + crédit présents, coordonnées
      lat/lng valides si renseignées, statut parmi la liste connue
- [ ] Page détail `sortie.html?id=…` inchangée (déjà compatible avec le format de données)

---

## ⚪ P4 — Idées non engagées

- [ ] Conversion automatique des images uploadées → WebP/AVIF à l'upload (multer)
- [ ] Recadrage intelligent 16:9 à l'upload (sharp) pour uniformiser les fiches
- [ ] Galerie événementielle : relier une sortie à plusieurs photos (`galerie.html`)
- [ ] Traduction multi-langues des fiches sorties