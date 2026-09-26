# Cohérence UI/UX et parcours — septembre 2026

Branche : `appweb514-svg/uiux-coherence` (basée sur `appweb514-svg/retours-client-cbrs`).

## 1. Saut de mise en page au changement de page (corrigé)

**Symptôme** : à chaque changement de page, la page « se redimensionne » une fraction de seconde puis revient à la normale.

**Mesure** (Chrome, 1440 px, indicateur CLS ; Google juge « bon » en dessous de 0,1) :

| Page | Avant | Après |
| --- | --- | --- |
| Accueil | 0,60 | 0 |
| Activités | 1,00 | 0 |
| Fiche activité | 0,63 | 0 |
| Planning (mobile) | 0,15 | 0,07 |
| Autres pages | — | 0 à 0,05 |

**Causes et corrections** :

1. `site3/ui-shell.js` ajoutait les classes du gabarit (`cbrs-ui`, `cbrs-hero`, barre latérale, cadre du logo, onglet actif, libellés du menu) **après** le premier affichage. Elles sont désormais écrites dans le HTML par `scripts/bake-shell.py`, un script idempotent à relancer après chaque modification de page.
2. La barre latérale était remontée de la hauteur du bandeau, **mesurée en JavaScript**. Elle est maintenant fixe en CSS ; le rendu visuel est identique.
3. Le CDN Tailwind « Play » générait le CSS **dans le navigateur**, avec du retard pour les classes insérées par script (fiches activité, sorties). Il est remplacé par un CSS compilé : `site3/tailwind.css` (46 Ko, contre environ 400 Ko de JavaScript). Pour le reconstruire : `cd tooling/tailwind && npm install && npm run build`.
4. Les polices chargées par `@import` bloquaient l'affichage : elles passent par `<link rel="preconnect">` et une feuille de style.
5. Le fondu d'entrée de page (Firefox/Safari) était déclenché en retard par le script : il est passé en CSS pur.
6. Le planning affichait un squelette de chargement puis attendait l'API : il s'affiche maintenant tout de suite, puis se met à jour si l'API renvoie d'autres données.

Contrôles : `node scripts/check-cbrs-ui.mjs` (garde-fous statiques) et `tooling/qa` (`node check-cls.mjs <url>`, qui mesure le CLS page par page).

## 2. Améliorations réalisées (à valider)

| # | Amélioration | Pourquoi |
| --- | --- | --- |
| U1 | **Flash info redessiné** : une seule bannière (emblème animé discrètement toutes les 4 s, sans texte + message défilant + bouton pause) | Demande du client. Défilement lent et constant (45 px/s), pause au survol et au clavier, bouton pause (exigence d'accessibilité WCAG 2.2.2), message fixe si « Réduire les animations » est activé |
| U2 | **Vert accessible** : `#437c14` pour les boutons et les textes verts ; `#8fd158` pour les accents verts sur fond bleu | Le vert `#58a01a` ne donnait que 3,25:1 de contraste avec du texte blanc (minimum requis : 4,5:1). Public senior |
| U3 | **Parcours « Adhérer »** : bouton « Adhérer pour pratiquer » sur chaque fiche activité, qui ouvre la page Adhérer avec l'activité déjà cochée | Aucun chemin direct entre une activité et l'adhésion |
| U4 | Logo du bandeau masqué sur mobile | Il faisait doublon avec celui de l'en-tête et passait dessous |
| U5 | Fiche activité : le texte ne passe plus sous le logo agrandi | Chevauchement constaté à 1440 px et sur tablette |
| U6 | Boutons verts toujours en texte blanc ; pied de page identique sur toutes les pages (mention CODERS de l'Oise partout) | Cohérence |
| U7 | Chiffre clé « Activités » : **≈ 20** | Demande du client |

## 3. Propositions non réalisées (à trancher en réunion)

| # | Proposition | Constat |
| --- | --- | --- |
| P1 | Retirer le lien **« Connexion »** du menu public jusqu'à la mise en service du CMS | Il mène à une maquette d'administration avec identifiants en clair (`site3/connexion.html`) |
| P2 | Regrouper les boutons flottants **« Accessibilité »** et **« Cookies »** (par exemple dans le pied de page) | Sur mobile, ils recouvrent le texte en bas d'écran |
| P3 | Ajouter un bouton **« Adhérer »** dans le bandeau d'accueil | Adhérer est l'objectif principal du site, mais n'apparaît qu'au 3e niveau du menu |
| P4 | Passer le texte courant à **17-18 px** | Lisibilité pour les seniors ; aujourd'hui 15-16 px |
| P5 | Menu : regrouper Formation, Statuts et Liens utiles sous « Le club » | Le menu compte 11 entrées ; plus court, il serait plus facile à parcourir |
| P6 | Adhésion : envoi réel du formulaire (via le CMS) au lieu d'un e-mail pré-rempli | Le « mailto » dépend de la messagerie de l'ordinateur : souvent un échec chez les seniors |
