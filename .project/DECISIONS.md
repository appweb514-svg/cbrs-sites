# Décisions

## 2026-10-02 — reprise des améliorations CMS validées avec Claude

Contexte : la dernière conversation se termine sur « go » après la proposition de corriger Vercel, puis d’ajouter Voir la page et des pictogrammes libres.

- Domaine CMS : l’API Vercel confirme qu’il est déjà associé à `cbrs-cms`, racine `cms`, branche `main`, mais `autoAssignCustomDomains=false`. Option réactivée et relue à `true` ; aucune suppression de domaine nécessaire.
- Les cinq globals affichent Voir la page vers le site public dans un nouvel onglet. `NEXT_PUBLIC_CBRS_SITE_URL` permet de viser un site local ou une autre installation. Il faut enregistrer avant de voir les changements.
- Formation : champ facultatif `cartes[].image` vers Media, prioritaire sur `icone`. Le retrait rétablit le pictogramme ; sans image ni pictogramme, la carte garde son texte. Migration additive sur la collection et son historique ; droits inchangés.

Conséquences : les prochains déploiements de production peuvent reprendre automatiquement le domaine. Le code des deux fonctions d’édition est livré par PR ; la migration doit être appliquée avant l’utilisation de ce schéma en production.

## 2026-10-09 — Photos sur la fiche activité
- Contexte : seule Aquagym affichait un bloc « L'équipe qui vous accompagne » (portraits), en doublon avec « Nos animateurs » ; les champs CMS « Photo principale » et « Galerie de l'activité » n'étaient pas affichés.
- Décision : bloc équipe supprimé ; colonne photos à gauche de « Présentation » alimentée par `photo` + `photos` de l'activité, à défaut par 4 photos de la galerie dont « Activité » = nom de l'activité sans accents (les slugs d'activité sont numériques). Styles dans ui-shell.css (Tailwind précompilé).
- Conséquences : le client ajoute des photos depuis le CMS ; sans photo, la fiche reste en texte pleine largeur.

## 2026-10-09 — Encadré « Bon à savoir » et logo
- Contexte : le client veut des repères pratiques sur chaque fiche ; une image générée par IA a été écartée. Le logo apparaissait dans un carré bleu et flou ; une bande blanche apparaissait pendant les transitions de page.
- Décision : groupe facultatif `bonASavoir` (tenue, matériel, intensité douce/modérée/soutenue, durée, prix) dans l'onglet Présentation des activités, affiché en encadré à droite (sous le texte, pleine largeur, si la colonne photos est présente) et masqué si vide. Cadre CSS du logo supprimé ; pas d'upscale IA disponible, simple affinage — une source HD est demandée au client. Transitions : l'ancienne page reste opaque, la nouvelle apparaît en fondu sans translation.
- Conséquences : migration additive sur `activites` et `_activites_v`. Le déploiement du CMS passe par le workflow GitHub (AD_API_TOKEN absent en local).

## 2026-10-09 — Présentation des fiches et contenu « Bon à savoir »
- Contexte : polices hétérogènes et doublon description/« En détail » ; photo à gauche jugée mal dimensionnée ; encadré « Bon à savoir » rempli seulement sur deux fiches de test.
- Décision : un seul bloc de texte justifié, photo 16:9 sous le texte, encadré toujours à droite (≥ 1024 px). Contenu de l'encadré déduit des infos pratiques et créneaux, appliqué par un script SQL idempotent (`deploy/alwaysdata/bon-a-savoir.sql`) qui ne remplace pas les champs déjà saisis. Paramètre `?v=` sur ui-shell.css pour contourner le cache.
- Conséquences : à rejouer après la migration du contenu Neon → alwaysdata ; incrémenter `?v=` à chaque modification de ui-shell.css. Prix et durées « Voir planning » à valider par le client.

## 2026-10-09 — Activités dans le CMS et liens « Vie du club »
- Contexte : le client doit pouvoir modifier la présentation et masquer « Bon à savoir » ; les cartes Vie du club n'avaient aucun lien dans le CMS (pas de type de lien « événement », les pages d'événement sont statiques).
- Décision : case `bonASavoir.afficher` (défaut vrai) et bouton « Voir la page » sur les activités. Côté site, la carte reprend le lien de la carte statique de même titre (normalisé sans accents) quand le CMS n'en donne pas.
- Conséquences : migration additive ; renommer une actualité dans le CMS casse ce repli — ajouter plus tard un type de lien « événement » (migration d'enum).

## 2026-10-09 — Cartes OSM et titres de section
- Contexte : bandeau OSM « Signaler un problème » sous les cartes, lieu trop zoomé ; titres de section hétérogènes selon les pages.
- Décision : iframe OSM élargie (≥ 420 px) et rognée de 80 px en bas dans un conteneur `overflow:hidden`, bbox élargie de 60 % ; le petit crédit « © OpenStreetMap contributors » reste sous la carte (attribution ODbL obligatoire une fois le bandeau masqué). Titres : modèle unique surtitre `text-sm font-semibold uppercase text-cbrs-green` + h2 `text-3xl md:text-4xl` avec mot accent `text-cbrs-blue font-serif-italic` + intro `mt-3 text-gray-600`, centré (surtitre, titre et intro) au-dessus d’un contenu pleine largeur.
- Conséquences : toute nouvelle section reprend ce modèle ; si OSM change la hauteur de son bandeau, ajuster la marge de rognage dans ui-shell.css.
